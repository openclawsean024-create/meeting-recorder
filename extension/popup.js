// MeetingFlow popup — UI + service worker 訊息路由

const $ = s => document.querySelector(s);
const consent = $('#consent');
const includeMic = $('#includeMic');
const startBtn = $('#start');
const stopBtn = $('#stop');
const openBtn = $('#open');
const clearBtn = $('#clear');
const statusEl = $('#status');
const detectedEl = $('#detected');
const errorBox = $('#error');

function setError(msg) {
  errorBox.textContent = msg || '';
}
function fmtSize(bytes) {
  if (!bytes) return '';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function fmtDuration(ms) {
  if (!ms) return '';
  const s = Math.floor((Date.now() - ms) / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

consent.addEventListener('change', () => { startBtn.disabled = !consent.checked; setError(''); });

startBtn.addEventListener('click', async () => {
  setError('');
  startBtn.disabled = true;
  const result = await chrome.runtime.sendMessage({
    type: 'START_CAPTURE',
    includeMic: includeMic.checked,
  });
  if (!result?.ok) setError(result?.error || '啟動錄製失敗');
  await refresh();
});

stopBtn.addEventListener('click', async () => {
  setError('');
  stopBtn.disabled = true;
  const result = await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
  if (!result?.ok) setError(result?.error || '停止失敗');
  await refresh();
});

openBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_APP' });
});

clearBtn.addEventListener('click', async () => {
  if (!confirm('清除外掛 IndexedDB 內的所有錄音？\n\n已下載到磁碟的 WebM 檔案不會被刪除。')) return;
  setError('');
  const result = await chrome.runtime.sendMessage({ type: 'CLEAR_RECORDINGS' });
  if (!result?.ok) setError(result?.error || '清除失敗');
  await refresh();
});

async function refresh() {
  const data = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  const recording = Boolean(data?.recording);
  startBtn.disabled = !consent.checked || recording;
  stopBtn.disabled = false;
  startBtn.hidden = recording;
  stopBtn.hidden = !recording;

  // Status block
  if (recording) {
    statusEl.classList.add('live');
    const modeLabel = data.includeMic ? 'tab + mic 混音' : '僅分頁音訊';
    statusEl.innerHTML = `
      <div class="top"><span class="dot"></span><span>錄製中：${escapeHtml(data.tabTitle || '目前分頁')}</span></div>
      <div class="meta">${data.meeting ? data.meeting + ' · ' : ''}${modeLabel} · ${fmtDuration(data.startedAt)}</div>
    `;
  } else if (data?.lastRecording) {
    statusEl.classList.remove('live');
    const r = data.lastRecording;
    statusEl.innerHTML = `
      <div class="top"><span class="dot"></span><span>上一段：${escapeHtml(r.title || 'recording')}</span></div>
      <div class="meta">${fmtSize(r.size)} · ${r.mode || 'tab-only'} · ${new Date(r.createdAt).toLocaleString('zh-TW')}</div>
    `;
  } else {
    statusEl.classList.remove('live');
    statusEl.innerHTML = `
      <div class="top"><span class="dot"></span><span>尚未開始錄製</span></div>
      <div class="meta">點下方按鈕開始</div>
    `;
  }

  // Detect current meeting tab
  const detect = await chrome.runtime.sendMessage({ type: 'DETECT_MEETING' });
  if (detect?.meeting) {
    detectedEl.className = 'detected';
    detectedEl.innerHTML = `
      <span class="icon">${detect.meeting.emoji}</span>
      <div style="flex:1;min-width:0">
        <div class="label">${escapeHtml(detect.meeting.label)}</div>
        <div class="url" title="${escapeHtml(detect.tabUrl)}">${escapeHtml(detect.tabUrl)}</div>
      </div>
    `;
  } else {
    detectedEl.className = 'detected none';
    detectedEl.innerHTML = `
      <span class="icon">🔍</span>
      <div style="flex:1;min-width:0">
        <div class="label">未偵測到視訊會議</div>
        <div class="url">目前分頁不是 Meet / Zoom Web / Teams</div>
      </div>
    `;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Refresh every second while popup open (live duration)
setInterval(refresh, 1000);
refresh();
