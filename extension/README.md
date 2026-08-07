# MeetingFlow Chrome 擴充功能

## 安裝

1. 下載或 clone 本 repository。
2. Chrome 開啟 `chrome://extensions`。
3. 開啟右上角「開發人員模式」。
4. 點「載入未封裝項目」，選擇本 `extension/` 資料夾。
5. 將 MeetingFlow 固定到工具列。

## 使用

1. 在 Google Meet、Zoom Web 或其他瀏覽器會議分頁中，點擊擴充功能。
2. 告知與會者並取得同意，勾選同意框。
3. 點「開始錄製目前分頁」。Chrome 會以 `tabCapture` 擷取目前分頁音訊。
4. 完成後點「停止並下載」。錄音會同時保存於擴充功能的 IndexedDB，並下載為 WebM。
5. 點「開啟 MeetingFlow 工作台」，把下載的 WebM 拖進「上傳音檔」區即可轉寫。

> Chrome 擴充功能無法繞過會議平台、瀏覽器或作業系統的權限限制。受 DRM 保護的內容、原生 Zoom 桌面程式，以及被管理員禁止的分頁擷取不在支援範圍。
