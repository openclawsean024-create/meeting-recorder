# MeetingFlow（meeting-recorder）

## 目標

提供**繁中會議錄音、逐字稿與「會後行動項」工作台**，無需登入即可使用。
最終交付：

- 公開響應式網站：麥克風錄音 / 音檔拖放 / 錄音同意 / 繁中逐字稿編輯。
- 本機規則分析：300 字內摘要、決輯、風險、行動項、負責人與日期推斷。
- 律師保密模式與案件標籤；保密模式不自動外推。
- 匯出 Markdown、剪貼簿、Email 草稿；Notion / Slack 未授權時降級為可複製格式。
- 本機會議歷史、搜尋與重新載入。
- 選配雲端轉寫（`OPENAI_API_KEY` + `PUBLIC_TRANSCRIBE_ENABLED=true`，每來源每小時上限 3 次）。
- Chrome Manifest V3 外掛：`tabCapture` + service worker + offscreen document + IndexedDB。
- FastAPI 後端，pytest 測試，安全邊界（100 MB 上限、格式檢查、無 raw exception）。
- Vercel 零 token 部署流程（Git 整合）。

## 避免

- **不要把任何 API key / token commit 到 repo 或貼到對話**。`.env.example` 只列變數名稱，沒有值。
- **不要在無授權的情況下假裝完成 OAuth**：Notion / Slack 必須誠實降級為可複製格式，不可偽造成功回應。
- **不要把保密模式（律師 / 案件）的音檔或逐字稿送到雲端轉寫**：保密模式下應主動拒絕外部 STT。
- **不要對外暴露 `OPENAI_API_KEY`**：永遠只在 server 端讀取，不可放進前端 bundle 或 `index.html` / `extension/*`。
- **不要關閉 CORS 限制**：未設定 `ALLOWED_ORIGINS` 時預設同源；不要為了方便改成 `*`。
- **不要繞過錄音同意 gate** 或在 UI 隱藏 consent 流程，這是產品對使用者的法律承諾。
- **不要原生 Zoom 桌面程式 / DRM 內容 / 受管理政策封鎖的分頁上嘗試 `tabCapture`**：超出 Chrome 支援範圍，不應嘗試 hack。
- **不要混用分支命名**：Conventional Commits 寫 commit message；不要在同一個 commit 混雜文件 + 程式碼 + 重構。
- **不要跳過測試**：`pytest -q` 必須全綠、`python3 -m compileall app.py api` 必須通過才能交付。
- **不要擅自新增資料庫 / 登入系統**：本版刻意保持無登入、無 DB；會員制 / 付款留待後續版本。

## 技術棧與指令

### 技術棧

- **後端**：Python 3.x、FastAPI、Uvicorn、pydantic v2、python-multipart、httpx（OpenAI 轉寫）。
- **前端**：`index.html`（單頁工作台，內含 vanilla JS）、`extension.html`（外掛安裝說明頁）、`privacy.html`。
- **Chrome 外掛**：Manifest V3，`tabCapture` + service worker + offscreen document + IndexedDB，位於 `extension/`。
- **測試**：pytest（含 `test_app.py`、`test_edge_cases.py`、`test_extension.py`、`test_spec_patch.py`、`test_ui.py`）。
- **部署**：Vercel（`vercel.json` 已存在，無 token 走 Git 整合）。

### 主要目錄

```
app.py                 # FastAPI 入口（CORS、路由、/health）
api/                   # 後端模組（目前 public router）
extension/             # Chrome MV3 外掛原始碼
tests/                 # pytest 測試
PRD/SPEC.md            # 產品規格（sweet-spot 改寫後的 v1）
index.html             # 公開工作台
extension.html         # 外掛安裝說明頁
privacy.html           # 隱私權聲明
vercel.json            # Vercel 部署設定
.env.example           # 環境變數樣板（無敏感值）
```

### 本機開發指令

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload   # http://127.0.0.1:8000
```

### 測試與驗證

```bash
pytest -q
python3 -m compileall app.py api
```

### 部署到 Vercel

1. `https://vercel.com/new` → Import `openclawsean024-create/meeting-recorder`。
2. Framework Preset 保留「Other」（讀 `vercel.json`）。
3. 選配環境變數：`OPENAI_API_KEY`、`PUBLIC_TRANSCRIBE_ENABLED=false`、`PUBLIC_TRANSCRIBE_LIMIT=3`。
4. Deploy，之後 `git push origin master` 自動部署。

### Git 紀律

- Conventional Commits：`feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:`。
- 一個邏輯改動 = 一個 commit；不要混雜。
- 改動必帶測試；交付前測試與 `compileall` 必須全綠。
- 重大改動前可開 branch；合併後保留追蹤線索。