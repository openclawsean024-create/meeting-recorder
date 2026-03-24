# Meeting Recorder — 產品化版本

## 定位
**Meeting Recorder = 一個先把錄音、逐字稿與摘要工作流做對的 honest MVP，而不是假裝全套 AI 已完成的 demo。**

---

## 產品化功能（v2.0）

### 定價頁面
- Free / Pro（NT$199/月）/ Business（NT$599/月）三方案
- 每月用量限制：Free 60分鐘 / Pro 600分鐘 / Business 3000分鐘
- 所有方案均需自備 OpenAI API Key

### 用戶系統
- Supabase Auth（Email/Password 註冊與登入）
- JWT Session 透過 httpOnly Cookie 管理
- 使用者資料表（users）儲存名稱、方案

### API Key 管理
- 使用者可在「API Key 設定」頁面填入自己的 OpenAI API Key
- API Key 以加密形式儲存在 Supabase（服務端）
- 無 Key 時無法使用轉寫功能，並有明確提示

### 使用量儀表板
- 即時顯示當月用量（分鐘數、任務數）
- 視覺化配額進度環
- 最近任務歷史列表
- 超過 50%/80% 用量時有視覺警示

### 錄音工作台（App Page）
- 瀏覽器麥克風錄音（MediaRecorder API）
- 支援拖放上傳音訊檔（WebM/WAV/MP3/M4A/OGG）
- 即時波形動畫 + 計時器
- 即时轮询任务状态
- 本地 localStorage 保存歷史記錄（瀏覽器端）
- 逐字稿可複製

### 部署
- Vercel（vercel.json 路由配置）
- Python FastAPI API Routes
- 靜態 HTML 前端

---

## 架構

```
前端（Static HTML）
├── /              → landing.html（公開）
├── /pricing       → pricing.html（公開）
├── /auth          → auth.html（登入/註冊）
├── /app           → app-page.html（需登入）
├── /dashboard     → dashboard.html（需登入）
└── /app/api-keys  → api-keys.html（需登入）

後端（FastAPI / Vercel Python）
├── /api/auth/*        → api/auth.py（認證）
├── /api/user/*       → api/user.py（用戶資料、API Key、用量）
└── /api/transcribe   → api/transcribe.py（轉寫 job）
└── /api/jobs/*       → api/transcribe.py（任務查詢）

數據層（Supabase）
├── users              → 用戶資料、方案
├── user_api_keys      → OpenAI API Key（加密）
├── transcription_jobs → 任務記錄
└── usage_records     → 用量記錄
```

---

## 環境變量

在 Vercel 設定以下環境變量：

| 變量 | 說明 |
|---|---|
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_SERVICE_KEY` | Supabase Service Role Key（機密，Server-side only） |
| `SUPABASE_ANON_KEY` | Supabase Anon Key（可公開） |

---

## 首次部署步驟

1. 在 [Supabase](https://supabase.com) 建立新專案
2. 在 SQL Editor 執行 `supabase-schema.sql`
3. 在 Vercel 設定環境變量
4. `vercel deploy` 或推送到 GitHub 觸發部署

---

## 開發本地運行

```bash
pip install -r requirements.txt
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"
export SUPABASE_ANON_KEY="your-anon-key"
python app.py
```

---

## 限制與待改進

1. **無即時 WebSocket** — 任務狀態以輪詢（2秒）更新
2. **用量追蹤** — 目前用字元數估算分鐘數，可改用 Whisper actual usage
3. **方案切換** — 目前方案切換為客戶端無實現（需手動 DB 更新）
4. **多人說話者分離** — 尚未支援 speaker diarization
5. **匯出** — 尚未支援 Notion/Obsidian/Google Drive 匯出
