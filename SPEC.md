# 【會議錄音整理工具】規格計劃書

## 2. 資訊架構與動線

### 2.1 網站地圖

Meeting Recorder | 儀表板（最近會議/處理中任務/統計）| 上傳頁（拖放音訊）| 轉錄結果頁（逐字稿/摘要/待辦）| 分享設定 | 設定
### 2.2 使用者動線

```mermaid\nflowchart TD\n    A([會議結束]) --> B[回到工具上傳錄音]\n    B --> C[拖放或選擇音訊檔]\n    C --> D[上傳中（顯示進度）]\n    D --> E{檔案有效?}\n    E -->|無效| F[顯示格式/大小錯誤]\n    E -->|有效| G[Whisper 轉寫處理]\n    F --> C\n    G --> H[轉寫完成，進入結果頁]\n    H --> I[查看逐字稿]\n    I --> J[查看 AI 摘要與待辦]\n    J --> K{確認內容正確?}\n    K -->|需修正| L[編輯逐字稿/待辦]\n    K -->|確認| M[匯出或分享]\n    L --> M\n    M --> N[複製 Markdown / 下載 PDF]\n    N --> O[產生分享連結]\n    O --> P([完成])\n```
## 3. 視覺與 UI

### 3.1 品牌設計指南

Primary: #6366F1 | Secondary: #0F172A | Accent: #10B981 | Warning: #F59E0B | Danger: #EF4444 | 發言者色彩：#8B5CF6 / #3B82F6 / #EC4899 | 字體：Inter + JetBrains Mono（時間戳）
## 1. 專案概述

### 1.1 專案背景與目的

遠距會議後，最痛苦的環節不是開會，而是「整理會議紀錄」——30 分鐘的錄音，手動聽打要花 1 小時。本工具定位為「會議後的 5 分鐘收尾工具」：上傳錄音，系統自動轉寫、區分發言者、生成摘要與待辦事項，直接複製 Markdown 筆記或匯出 PDF。
### 1.2 目標受眾（TA）

- 遠距團隊 PM：每週數場會議，會後整理紀錄佔用大量時間
- 業務 / HR：面試記錄、客户拜訪記錄需要快速轉文字
- 研究人員：訪談、座談會錄音後需要完整文字稿
- 律師 / 顧問：會議記錄需要精確且有法律效力
### 1.3 專案範圍

- 錄音上傳（MP3 / M4A / WAV / OGG，最大 120 分鐘）
- Whisper 語音轉文字（發言者辨識 / 時間戳記）
- AI 摘要生成（章節概覽 / 關鍵決策 / 待辦事項萃取）
- Markdown / PDF 匯出、分享連結（唯讀）
- 組織 / 專案資料夾分類
- 即時會議轉錄（Live 模式）
- 視訊會議同步錄製、任務管理系統整合（Trello/Asana）
- 錄音編輯、專業法律存證
### 1.4 參考網站分析

Otter.ai（即時轉錄發言者辨識，與 Zoom 整合，但中文支援中等昂貴）| Trint（編輯功能完整翻譯整合，付費牆高）| Fireflies.ai（會議錄製+轉錄一體，CRM 整合，中文支援較差）| Tactiq（即時顯示字幕便宜，功能單一無法上傳檔案）
## 7. 功能勾選清單

### 前端

### 後端

### DevOps

## 4. 前端功能規格

- 拖放上傳：支援 MP3/M4A/WAV/OGG，最大 120 分鐘，進度條顯示
- 即時播放控制：播放/暫停/速度調整（0.5x-2x）
- 逐字稿顯示：時間戳（點擊跳轉播放）、發言者標籤（彩色區分）
- 章節概覽：AI 生成會議章節摘要
- 待辦事項萃取：事項描述 + 責任人 + 期限
- Markdown 匯出（一鍵複製）、PDF 匯出、分享連結
## 5. 後端與技術規格

### 5.1 技術棧

前端：Next.js 14 + Tailwind CSS | 語音轉寫：OpenAI Whisper API v3（$0.006/分鐘）| AI 摘要：Claude API | 後端：FastAPI + Celery | 儲存：Supabase Storage + Supabase DB | 部署：Vercel + Railway
## 6. 專案時程與驗收標準

```mermaid\ntimeline\n    title Meeting Recorder 開發時程\n    phase 1: 語音轉寫核心 (Week 1-2)\n        Whisper API 串接與優化 : 3 days\n        發言者 diarization 處理 : 4 days\n        時間戳同步邏輯 : 3 days\n    phase 2: AI 摘要引擎 (Week 3)\n        Claude API 串接 : 2 days\n        待辦萃取 Prompt 設計 : 3 days\n        章節分割邏輯 : 2 days\n    phase 3: 前端 UI (Week 4-5)\n        上傳介面與進度條 : 2 days\n        播放器與逐字稿 : 4 days\n        摘要與待辦面板 : 3 days\n    phase 4: 匯出與分享 (Week 6)\n        Markdown 複製 : 1 day\n        PDF 匯出 : 2 days\n        分享連結系統 : 2 days\n    phase 5: 測試與交付 (Week 7)\n        轉寫準確率測試（目標 > 95%） : 2 days\n        Bug 修復與文件 : 3 days\n```
### 6.2 驗收標準

支援瀏覽器：Chrome/Firefox/Safari 17+ | 轉寫準確率 > 95% | 摘要完整性 > 90% | 平均處理時間 < 5 分鐘（30 分鐘錄音）| PDF 匯出成功率 > 95% | 分享連結可用性 > 99%
