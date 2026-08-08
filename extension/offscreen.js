// MeetingFlow offscreen document — tabCapture + 可選 mic 混音
// MV3 service worker 不能直接做 getUserMedia 或 MediaRecorder,
// 所以我們在這裡做實際的媒體處理。

let recorder = null;
let mixedStream = null;       // 最終錄製的 stream (mixed 或 raw tab)
let tabStream = null;         // 來自 tabCapture 的原始 stream (要保留 reference 才能 stop tracks)
let micStream = null;         // 來自 getUserMedia 的 mic stream
let audioContext = null;      // Web Audio context,僅在混音時建立
let chunks = [];
let currentTitle = 'meeting';
let currentMode = 'tab-only'; // 'tab-only' | 'tab+mic'

// ============ IndexedDB ============
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('meetingflow-recordings', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRecording(blob, title) {
  const id = `recording-${Date.now()}`;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').put({ id, title, blob, mimeType: blob.type, createdAt: new Date().toISOString() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return id;
}

async function clearRecordings() {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', 'readwrite');
    tx.objectStore('recordings').clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  await chrome.storage.local.remove('lastRecording');
}

// ============ Stream lifecycle ============
function stopTrack(track) {
  try { track.onended = null; } catch {}
  try { track.stop(); } catch {}
}
function closeAllStreams() {
  if (tabStream) { tabStream.getTracks().forEach(stopTrack); tabStream = null; }
  if (micStream) { micStream.getTracks().forEach(stopTrack); micStream = null; }
  if (mixedStream && mixedStream !== tabStream && mixedStream !== micStream) {
    mixedStream.getTracks().forEach(stopTrack);
  }
  mixedStream = null;
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {});
  }
  audioContext = null;
}

async function resetCaptureState() {
  closeAllStreams();
  recorder = null;
  chunks = [];
  await chrome.storage.local.set({ recording: false, mode: null });
}

// ============ Build mixed stream ============
// 從 chrome.tabCapture.getMediaStreamId 取得的 streamId
// 必須用 getUserMedia + chromeMediaSource: 'tab' 才能 decode。
async function buildTabStream(streamId) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });
}

async function buildMicStream() {
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}

async function buildMixedStream(tabStreamIn, micStreamIn) {
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();

  const tabSrc = ctx.createMediaStreamSource(tabStreamIn);
  tabSrc.connect(dest);

  const micSrc = ctx.createMediaStreamSource(micStreamIn);
  // 用 GainNode 預防 mic 過大聲 clipping
  const micGain = ctx.createGain();
  micGain.gain.value = 0.85;
  micSrc.connect(micGain).connect(dest);

  audioContext = ctx;
  return dest.stream;
}

// ============ Message handler ============
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;
  (async () => {
    if (message.type === 'START_RECORDING') {
      if (recorder && recorder.state === 'recording') {
        throw new Error('錄製已在進行中');
      }
      const includeMic = Boolean(message.includeMic);
      currentMode = includeMic ? 'tab+mic' : 'tab-only';
      currentTitle = String(message.tabTitle || 'meeting')
        .replace(/[\\/:*?"<>|]+/g, '-')
        .slice(0, 80) || 'meeting';

      // 1. 取 tab 音訊
      tabStream = await buildTabStream(message.streamId);

      // 2. 可選:取 mic
      if (includeMic) {
        try {
          micStream = await buildMicStream();
        } catch (e) {
          // mic 失敗 → fallback 到只錄 tab,不中斷整個流程
          console.warn('[MeetingFlow] mic 取得失敗,fallback 到僅 tab:', e);
          micStream = null;
          currentMode = 'tab-only';
          await chrome.runtime.sendMessage({
            target: 'service-worker',
            type: 'MIC_FALLBACK',
            reason: e.message || '麥克風權限被拒或裝置不可用',
          });
        }
      }

      // 3. 決定最終 stream
      if (micStream) {
        mixedStream = await buildMixedStream(tabStream, micStream);
      } else {
        mixedStream = tabStream;
      }

      // 4. MediaRecorder
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';
      recorder = new MediaRecorder(mixedStream, mimeType ? { mimeType } : undefined);
      chunks = [];

      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };

      // 重要:MediaRecorder 錯誤時主動清理,popup 不會卡「錄製中」
      recorder.onerror = async (e) => {
        console.error('[MeetingFlow] MediaRecorder error:', e);
        await resetCaptureState().catch(() => {});
        await chrome.runtime.sendMessage({
          target: 'service-worker',
          type: 'RECORDING_ERROR',
          error: e?.error?.message || e?.message || 'MediaRecorder 發生錯誤',
        }).catch(() => {});
      };

      // 重要:任何 stream track 結束(分頁關掉/切走/裝置拔掉)→ 自動停
      mixedStream.getAudioTracks().forEach(track => {
        track.onended = () => {
          if (recorder && recorder.state === 'recording') {
            try { recorder.stop(); } catch {}
          }
          resetCaptureState().catch(() => {});
          chrome.runtime.sendMessage({
            target: 'service-worker',
            type: 'STREAM_ENDED',
          }).catch(() => {});
        };
      });

      recorder.start(1000);
      await chrome.storage.local.set({
        recording: true,
        startedAt: Date.now(),
        tabTitle: currentTitle,
        mode: currentMode,
      });
      sendResponse({ ok: true, mode: currentMode });
    } else if (message.type === 'STOP_RECORDING') {
      if (!recorder || recorder.state === 'inactive') {
        throw new Error('目前沒有錄製中的會議');
      }
      // 等 recorder.onstop 跑完
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        try { recorder.stop(); } catch { resolve(); }
      });

      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      const id = await saveRecording(blob, currentTitle);

      // 下載到磁碟(使用者可選位置)
      const url = URL.createObjectURL(blob);
      const downloadId = await chrome.downloads.download({
        url,
        filename: `MeetingFlow/${currentTitle}-${Date.now()}.webm`,
        saveAs: true,
        conflictAction: 'uniquify',
      }).catch(() => null);

      await chrome.storage.local.set({
        lastRecording: {
          id,
          title: currentTitle,
          size: blob.size,
          mimeType,
          mode: currentMode,
          createdAt: Date.now(),
          downloadId,
        },
        recording: false,
      });

      setTimeout(() => URL.revokeObjectURL(url), 60000);
      closeAllStreams();
      chunks = [];
      recorder = null;
      sendResponse({ ok: true, id, size: blob.size, mode: currentMode, downloadId });
    } else if (message.type === 'CLEAR_RECORDINGS') {
      await clearRecordings();
      sendResponse({ ok: true });
    }
  })().catch(async (error) => {
    // 失敗時務必清掉 stream + state,避免�留
    console.error('[MeetingFlow] offscreen error:', error);
    await resetCaptureState().catch(() => {});
    sendResponse({ ok: false, error: error.message || '錄製失敗' });
  });
  return true;
});

// Service worker 重新啟動時(例如 Chrome 重啟)主動清掉 stale state
chrome.runtime.onStartup?.addListener?.(() => {
  chrome.storage.local.get(['recording']).then(({ recording }) => {
    if (recording) resetCaptureState();
  });
});
