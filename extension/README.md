# MeetingFlow Chrome 擴充功能（v1.0）

Manifest V3 擴充，把目前分頁的音訊（可選混音麥克風）錄成 WebM，會後拖進 MeetingFlow 工作台。

## 安裝

1. 下載或 clone 本 repository。
2. Chrome 開啟 [`chrome://extensions`](chrome://extensions)。
3. 開啟右上角「開發人員模式」。
4. 點「載入未封裝項目」，選擇本 `extension/` 資料夾。
5. 將 MeetingFlow 固定到工具列。

## 使用

1. 進入 **Google Meet**（`meet.google.com`）、**Zoom Web**（`*.zoom.us/wc/`）或 **MS Teams Web**（`teams.microsoft.com`）。
2. 點擴充圖示。popup 會自動偵測目前分頁是不是視訊會議。
3. 告知所有與會者並取得同意，勾選同意框。
4. （可選）勾「同時錄我的麥克風」做 tab + mic 混音。**注意**：macOS 需要把 Chrome 加入「螢幕錄影權限」清單，否則 tabCapture 會失敗。
5. 點「開始錄製目前分頁」。Chrome 以 `tabCapture` 擷取目前分頁音訊；若啟用 mic，會用 Web Audio API 混音成單一 WebM。
6. 點「停止並下載」：錄音會寫進擴充 IndexedDB **並**下載到磁碟。
7. 回到 MeetingFlow 工作台，把下載的 WebM 拖進「上傳音檔」區；或直接貼逐字稿到工作台做本機整理。

## 支援範圍

**支援**：

- ✅ 網頁版 Google Meet（`https://meet.google.com/*`）
- ✅ 網頁版 Zoom（`https://*.zoom.us/wc/*`）
- ✅ 網頁版 MS Teams（`https://teams.microsoft.com/*`）
- ✅ 任意 Chrome 分頁的音訊（不限於會議）
- ✅ tab 音訊 + 麥克風混音（WebM/Opus，單聲道）
- ✅ > 2 小時錄音會自動分段（瀏覽器 IndexedDB quota 限制時提示下載）
- ✅ �克風權限失敗時自動降級為只錄分頁，不會中斷整個流程
- ✅ `MediaRecorder.onerror` + stream `track.onended` 主動清理（popup 不會卡「錄製中」）
- ✅ 一鍵清除外掛 IndexedDB（已下載的磁碟檔案不受影響）

**不支援（UI 寫明）**：

- ❌ 桌面版 Zoom / Teams / Meet app（Chrome 沒有跨 app 音訊擷取權限）
- ❌ DRM 受保護的內容（瀏覽器強制擋掉）
- ❌ 企業政策封鎖 tabCapture（請洽 IT 解鎖）
- ❌ 自動開始錄音（一定要使用者手動點，沒有偷偷錄）
- ❌ Notion / Slack OAuth（公開版不啟用；會員制 v1.1 解鎖）

## 麥克風權限疑難排解

- **第一次會跳麥克風權限請求** — 請允許。如果拒絕，下次勾「同時錄我的麥克風」會再次詢問。
- **macOS Chrome 看不到系統音訊** — 系統設定 → 隱私與安全性 → 螢幕錄影權限 → 把 Google Chrome 開啟。
- **錄製中斷** — 可能是分頁切走、被關閉、裝置拔掉。我們的 `track.onended` 會自動停掉並清掉狀態。

## 開發

```bash
# 修改後
1. 回到 chrome://extensions
2. 點擴充卡片上的 ⟳ 重載
3. 開新分頁測試

# 語法檢查
node --check extension/offscreen.js
node --check extension/service-worker.js
node --check extension/popup.js
```
