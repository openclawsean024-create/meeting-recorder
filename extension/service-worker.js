// MeetingFlow service worker — MV3
// 路由 popup / offscreen 之間的訊息。

const OFFSCREEN_PATH = 'offscreen.html';

// 預設導入到 MeetingFlow 工作台。會員制 v1.1 可讓使用者覆寫。
const DEFAULT_APP_URL = 'http://127.0.0.1:8765/app?source=extension';
const ALLOWED_APP_HOSTS = new Set([
  'meeting-recorder-ten.vercel.app',
  'localhost',
  '127.0.0.1',
]);

// 視訊會議偵測規則
const MEETING_PATTERNS = [
  { match: /^https:\/\/meet\.google\.com\//, label: 'Google Meet', emoji: '📹' },
  { match: /^https:\/\/[a-z0-9-]+\.zoom\.us\/wc\//, label: 'Zoom Web', emoji: '�' },
  { match: /^https:\/\/teams\.microsoft\.com\//, label: 'MS Teams Web', emoji: '👥' },
];

function detectMeeting(tab) {
  if (!tab?.url) return null;
  return MEETING_PATTERNS.find(p => p.match.test(tab.url)) || null;
}

function safeAppUrl(raw) {
  if (!raw) return DEFAULT_APP_URL;
  try {
    const parsed = new URL(raw);
    const isHttps = parsed.protocol === 'https:';
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (!isHttps && !isLocal) return DEFAULT_APP_URL;
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

async function detectActiveMeeting() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const meeting = detectMeeting(tab);
    return {
      tabId: tab?.id,
      tabTitle: tab?.title || '',
      tabUrl: tab?.url || '',
      meeting,
    };
  } catch {
    return { tabId: null, tabTitle: '', tabUrl: '', meeting: null };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'offscreen') return false;
  (async () => {
    if (message.type === 'DETECT_MEETING') {
      sendResponse(await detectActiveMeeting());
    } else if (message.type === 'START_CAPTURE') {
      await ensureOffscreen();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('找不到目前分頁');
      const meeting = detectMeeting(tab);
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      await chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'START_RECORDING',
        streamId,
        tabTitle: tab.title || 'meeting',
        includeMic: Boolean(message.includeMic),
      });
      await chrome.storage.local.set({
        recording: true,
        startedAt: Date.now(),
        tabTitle: tab.title || 'meeting',
        tabUrl: tab.url || '',
        meeting: meeting?.label || null,
        includeMic: Boolean(message.includeMic),
      });
      sendResponse({ ok: true, meeting });
    } else if (message.type === 'STOP_CAPTURE') {
      await ensureOffscreen();
      const result = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'STOP_RECORDING' });
      await chrome.storage.local.set({ recording: false });
      sendResponse(result || { ok: true });
    } else if (message.type === 'GET_STATUS') {
      sendResponse(await chrome.storage.local.get([
        'recording', 'startedAt', 'tabTitle', 'tabUrl', 'meeting',
        'includeMic', 'lastRecording', 'mode',
      ]));
    } else if (message.type === 'OPEN_APP') {
      const { appUrl } = await chrome.storage.sync.get('appUrl');
      const url = safeAppUrl(appUrl);
      await chrome.tabs.create({ url });
      sendResponse({ ok: true, url });
    } else if (message.type === 'MIC_FALLBACK') {
      // 從 offscreen 來:mic 取得失敗,通知 popup
      // 這條不丟給 popup(passive),但記錄下來
      console.warn('[MeetingFlow] mic fallback:', message.reason);
      sendResponse({ ok: true });
    } else if (message.type === 'RECORDING_ERROR' || message.type === 'STREAM_ENDED') {
      // 從 offscreen 來:stream / recorder 出錯,清掉狀態
      await chrome.storage.local.set({ recording: false });
      console.warn('[MeetingFlow]', message.type, message.error || '');
      sendResponse({ ok: true });
    }
  })().catch(error => sendResponse({ ok: false, error: error.message || '操作失敗' }));
  return true;
});

// service worker 重新啟動時,確保 stale state 被清掉
chrome.runtime.onStartup?.addListener?.(async () => {
  const { recording } = await chrome.storage.local.get(['recording']);
  if (recording) {
    await chrome.storage.local.set({ recording: false });
  }
});

chrome.runtime.onInstalled?.addListener?.(() => {
  console.log('[MeetingFlow] extension installed/updated');
});
