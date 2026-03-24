# Meeting Recorder｜AI 會議錄音、逐字稿、Meeting Minutes

上傳會議錄音，AI 自動產生逐字稿與結構化 Meeting Minutes。支援 Whisper AI，無需訂閱昂貴的會議錄音服務。

**👉 立即使用**：https://meeting-recorder.vercel.app（需取消密碼保護，見下方說明）

**⚠️ 目前 Vercel 部署受密碼保護**：請在 [Vercel Dashboard](https://vercel.com/dashboard) → `meeting-recorder` 專案 → Settings → Deployment Protection 移除密碼保護。

**📄 GitHub Pages 備用部署**：https://openclawsean024-create.github.io/meeting-recorder/

---

## 功能特色

- 🎙️ **瀏覽器錄音** — 直接用麥克風錄製，支援拖放上傳音訊檔（WebM/WAV/MP3/M4A/OGG）
- 📝 **AI 逐字稿** — Whisper AI 自動轉寫，準確率高
- 📋 **Meeting Minutes** — AI 自動結構化摘要（決策、行動項、風險）
- 👤 **用戶系統** — Supabase Auth（Email/Password）
- 🔑 **API Key 自備** — 用戶自行填入 OpenAI API Key，無需擔心費用爭議
- 📊 **用量儀表板** — 每月配額追蹤，配額用盡即時警示
- 💰 **三方案定價** — Free（60分鐘）/ Pro（NT$199，600分鐘）/ Business（NT$599，3000分鐘）

---

## 技術架構

```
前端        → 靜態 HTML（無需建構）
後端        → FastAPI on Vercel Python Runtime
數據庫       → Supabase（PostgreSQL + Auth）
語音轉文字   → OpenAI Whisper API（用戶自備 Key）
```

### 主要檔案

| 檔案 | 用途 |
|------|------|
| `app.py` | FastAPI 路由與頁面服務 |
| `api/auth.py` | 註冊/登入/登出 |
| `api/user.py` | 用戶資料、API Key、用量查詢 |
| `api/transcribe.py` | 轉寫任務建立與執行 |
| `landing.html` | 公開 landing page |
| `pricing.html` | 定價頁面 |
| `auth.html` | 登入/註冊頁面 |
| `app-page.html` | 主要錄音工作台 |
| `dashboard.html` | 用量儀表板 |
| `api-keys.html` | API Key 管理頁面 |
| `supabase-schema.sql` | Supabase 資料庫初始化 |

---

## 部署設定

### 1. Supabase 設定

1. 建立 [Supabase](https://supabase.com) 專案
2. 在 SQL Editor 執行 `supabase-schema.sql`
3. 複製 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`SUPABASE_ANON_KEY`

### 2. Vercel 環境變數

在 Vercel Dashboard → meeting-recorder → Settings → Environment Variables 設定：

| 變數名 | 說明 |
|--------|------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service Role Key（機密） |
| `SUPABASE_ANON_KEY` | Anon Key（可公開） |

### 3. 部署

推送 GitHub 即自動觸發 Vercel 部署，或手動：

```bash
cd meeting-recorder
vercel --prod
```

---

## 本地開發

```bash
git clone https://github.com/openclawsean024-create/meeting-recorder.git
cd meeting-recorder
pip install -r requirements.txt

export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"
export SUPABASE_ANON_KEY="your-anon-key"

python app.py
# 開啟 http://localhost:8000
```

---

## 待改進

- [ ] Vercel 密碼保護需手動移除（需用戶操作）
- [ ] 方案切換功能（目前需手動 DB 更新）
- [ ] 即時 WebSocket（目前為輪詢）
- [ ] Speaker Diarization（多人說話者分離）
- [ ] 匯出至 Notion / Obsidian / Google Drive
- [ ] 用量估算改為 Whisper actual usage 而非字元數估算
