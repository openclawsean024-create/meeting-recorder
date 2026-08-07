const OFFSCREEN_PATH = 'offscreen.html';
const DEFAULT_APP_URL = 'https://meeting-recorder-ten.vercel.app/app?source=extension';
const ALLOWED_APP_HOSTS = new Set(['meeting-recorder-ten.vercel.app', 'localhost', '127.0.0.1']);

function safeAppUrl(raw) {
  if (!raw) return DEFAULT_APP_URL;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return DEFAULT_APP_URL;
    }
    if (!ALLOWED_APP_HOSTS.has(parsed.hostname)) return DEFAULT_APP_URL;
    return parsed.toString();
  } catch (_) {
    return DEFAULT_APP_URL;
  }
}

async function ensureOffscreen() {
  const url = chrome.runtime.getURL(OFFSCREEN_PATH);
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [url] });
  if (contexts.length) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ['USER_MEDIA'],
    justification: '使用者主動錄製目前會議分頁的音訊',
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'offscreen') return false;
  (async () => {
    if (message.type === 'START_CAPTURE') {
      await ensureOffscreen();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('找不到目前分頁');
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      await chrome.runtime.sendMessage({ target: 'offscreen', type: 'START_RECORDING', streamId, tabTitle: tab.title || 'meeting' });
      await chrome.storage.local.set({ recording: true, startedAt: Date.now(), tabTitle: tab.title || 'meeting' });
      sendResponse({ ok: true });
    } else if (message.type === 'STOP_CAPTURE') {
      await ensureOffscreen();
      const result = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'STOP_RECORDING' });
      await chrome.storage.local.set({ recording: false });
      sendResponse(result || { ok: true });
    } else if (message.type === 'GET_STATUS') {
      sendResponse(await chrome.storage.local.get(['recording', 'startedAt', 'tabTitle', 'lastRecording']));
    } else if (message.type === 'OPEN_APP') {
      const { appUrl } = await chrome.storage.sync.get('appUrl');
      const url = safeAppUrl(appUrl);
      await chrome.tabs.create({ url });
      sendResponse({ ok: true, url });
    }
  })().catch(error => sendResponse({ ok: false, error: error.message || '操作失敗' }));
  return true;
});
