let recorder = null;
let stream = null;
let chunks = [];
let currentTitle = 'meeting';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('meetingflow-recordings', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('recordings', { keyPath: 'id' });
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

function closeStream() {
  stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
  stream = null;
}

async function resetCaptureState() {
  closeStream();
  recorder = null;
  chunks = [];
  await chrome.storage.local.set({ recording: false });
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;
  (async () => {
    if (message.type === 'START_RECORDING') {
      if (recorder?.state === 'recording') throw new Error('錄製已在進行中');
      stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: message.streamId } }, video: false });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      recorder = new MediaRecorder(stream, { mimeType });
      chunks = [];
      currentTitle = String(message.tabTitle || 'meeting').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80);
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { resetCaptureState().catch(() => {}); };
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          if (recorder?.state === 'recording') {
            try { recorder.stop(); } catch (_) { /* cleanup below */ }
          }
          resetCaptureState().catch(() => {});
        };
      });
      recorder.start(1000);
      sendResponse({ ok: true });
    } else if (message.type === 'STOP_RECORDING') {
      if (!recorder || recorder.state === 'inactive') throw new Error('目前沒有錄製中的會議');
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.stop();
      await stopped;
      stream?.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const id = await saveRecording(blob, currentTitle);
      const url = URL.createObjectURL(blob);
      const downloadId = await chrome.downloads.download({ url, filename: `MeetingFlow/${currentTitle}-${Date.now()}.webm`, saveAs: true });
      await chrome.storage.local.set({ lastRecording: { id, title: currentTitle, size: blob.size, createdAt: Date.now(), downloadId }, recording: false });
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      chunks = [];
      recorder = null;
      stream = null;
      sendResponse({ ok: true, id, size: blob.size, downloadId });
    } else if (message.type === 'CLEAR_RECORDINGS') {
      await clearRecordings();
      sendResponse({ ok: true });
    }
  })().catch(error => sendResponse({ ok: false, error: error.message || '錄製失敗' }));
  return true;
});
