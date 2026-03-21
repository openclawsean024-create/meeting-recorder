# Meeting Recorder — 專案規格 / 目前進度

## 專案目標
把會議錄音、逐字稿、摘要與歷史記錄整合成一個簡潔、可 demo、可延續開發的會議工作台。

---

## 目前版本
目前是 **browser-only MVP**：
- 單頁靜態前端
- 使用者可在瀏覽器中錄音
- 視瀏覽器能力提供即時語音辨識
- 逐字稿、摘要與歷史紀錄可保存在本機

---

## 已完成功能

### 1. 會議工作台 UI
- 高質感首頁 + 錄音工作台
- 會議主題 / 參與人員欄位
- 錄音區、逐字稿區、摘要區、歷史記錄區

### 2. 錄音能力
- 使用 `MediaRecorder` 進行瀏覽器錄音
- 錄音中顯示波形與計時器
- 開始 / 停止錄音流程

### 3. 逐字稿能力（依瀏覽器能力）
- 若瀏覽器支援 `SpeechRecognition / webkitSpeechRecognition`，可做基礎即時辨識
- 若瀏覽器不支援，系統會誠實提示限制，而不是假裝後端 AI 已存在

### 4. 摘要能力
- 本地結構化摘要
- 根據逐字稿擷取會議主題、參與人員、時長與重點摘錄

### 5. 歷史記錄
- 使用 `localStorage` 保存會議資料
- 可重新載入歷史記錄
- 可清除所有本機資料
- 可用關鍵字搜尋歷史紀錄（主題 / 與會人員 / 逐字稿 / 摘要）

### 6. 逐字稿整理
- 逐字稿可在前端直接手動編輯與修正
- 可在沒有 Web Speech API 的情況下，改用手動貼上或整理逐字稿

### 7. 正式會議紀要升級
- 依逐字稿關鍵字嘗試抽取 `Decisions` / `Risks` / `Action Items`
- Action Item 會優先從文字中推測 owner 與 due hint

---

## 目前限制
1. 已補上後端 API 骨架，但仍未接真正的 Whisper / STT 引擎
2. 摘要目前是 placeholder / 規則化後端摘要，不是真正 AI 摘要
3. 歷史資料主體仍保存於本機瀏覽器，尚未導入 durable backend storage
4. 尚未串接 Notion / Obsidian / Drive / Email
5. 尚未處理多人說話者分離（speaker diarization）

---

## 下一階段
### Backend Phase
1. FastAPI 上傳音訊 API ✅（基礎骨架已補）
2. Whisper 轉文字 ✅（已補 OpenAI Whisper API 接入口，無 key 時 fallback placeholder）
3. LLM / structured 摘要（決策 / action items / follow-up）✅（已補三段式 structured summary）
4. 雲端儲存與分享
5. Notion / Obsidian / Google Drive 匯出

### Product Phase
1. 更完整的會議列表與搜尋
2. 標籤 / 分類 / 專案歸檔
3. 多語言辨識
4. 真正的協作與帳號系統

---

## 一句話定位
**Meeting Recorder = 一個先把錄音、逐字稿與摘要工作流做對的 honest MVP，而不是假裝全套 AI 已完成的 demo。**
