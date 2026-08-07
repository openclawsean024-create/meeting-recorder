const consent = document.querySelector('#consent');
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const open = document.querySelector('#open');
const clear = document.querySelector('#clear');
const status = document.querySelector('#status');
const errorBox = document.querySelector('#error');

consent.addEventListener('change', () => { start.disabled = !consent.checked; });
start.addEventListener('click', () => run({ type: 'START_CAPTURE' }));
stop.addEventListener('click', () => run({ type: 'STOP_CAPTURE' }));
open.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'OPEN_APP' }));
clear.addEventListener('click', async () => {
  if (!confirm('清除外掛 IndexedDB 內的所有錄音？已下載的檔案不會被刪除。')) return;
  await run({ type: 'CLEAR_RECORDINGS' });
});

async function run(message) {
  errorBox.textContent = '';
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) errorBox.textContent = result?.error || '操作失敗，請重試';
  await refresh();
}

async function refresh() {
  const data = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  const recording = Boolean(data?.recording);
  start.hidden = recording;
  stop.hidden = !recording;
  status.classList.toggle('live', recording);
  status.textContent = recording ? `錄製中：${data.tabTitle || '目前分頁'}` : data?.lastRecording ? `上一段錄音已下載：${data.lastRecording.title}` : '尚未開始錄製';
}
refresh();
