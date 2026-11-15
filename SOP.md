# 繁中會議錄音與行動項工作台 — 開發與驗證 SOP

## 規格對齊狀態（2026-11-16）

- ✅ `PRD/SPEC.md` v4.0 已依 `master` @ `9ff8cd8` 的程式重建；`GOAL.md` 定義 M1。
- ⚠️ **建議暫緩**：Sean 決定前不開始 M1 實作。
- ⚠️ 本次只重建文件；本機無法執行 Python／Node（環境限制），下表「結果」欄引用 GitHub Actions 紀錄，**未在本機執行**。

## 環境

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # 含 pytest；ruff 不在 requirements，需另裝：pip install ruff
```

- Python：CI 使用 3.11；repo 沒有 `.python-version`，本機版本**尚未配置**。
- Node：只用於 `node --check` 檢查擴充 JS 語法；repo 沒有 `package.json`，也沒有 Node 版本設定。
- 無 `.env` 也可執行；需要雲端轉寫時只在本機環境設定 `OPENAI_API_KEY`、`PUBLIC_TRANSCRIBE_ENABLED`（M1 不使用）。

## 驗證指令

repo 沒有 `package.json`、`Makefile` 或 `pyproject.toml` scripts；以下指令依 `README.md`、`.github/workflows/*.yml` 與 `.ruff.toml` 查證。

| 類型 | 指令 | 狀態 | 最近結果（GitHub Actions，未在本機執行） |
|---|---|---|---|
| Install | `pip install -r requirements.txt` | 可用 | 成功（run 34026425443） |
| Lint | `ruff check .` | 可用（需另裝 ruff，未鎖版本） | All checks passed（run 34026425451） |
| Format | `ruff format --check .` | 可用（同上） | **失敗**：7 個檔案需重新格式化（run 34026425451） |
| Typecheck | — | **尚未配置** | 無 mypy／pyright |
| Test | `python -m pytest -q` | 可用 | **失敗**：15 failed、50 passed（run 34026425443）；失敗集中在 `test_ui.py` 12 個、`test_app.py` 3 個，原因是 `index.html` 被換成 meta refresh 並新增 `dashboard.html` |
| Compile | `python -m compileall -q app.py api tests` | 可用 | 成功 |
| 擴充語法 | `node --check extension/popup.js && node --check extension/offscreen.js && node --check extension/service-worker.js` | 可用（需 Node） | 成功（run 34026425451） |
| JSON 驗證 | `python -c "import json; json.load(open('extension/manifest.json')); json.load(open('vercel.json'))"` | 可用 | 成功 |
| Secret 掃描 | `git grep -nE "(sk-[A-Za-z0-9]{20,}\|AKIA[0-9A-Z]{16}\|ghp_[A-Za-z0-9]{30,})"` | 可用（git） | 無結果 |
| Dev server | `uvicorn app:app --reload`（http://127.0.0.1:8000） | 可用 | 未執行；依程式判斷，首頁會導向不存在路由的 `/dashboard.html` |
| E2E（瀏覽器） | — | **尚未配置** | M1 AC-003～AC-005 新增 Playwright for Python |
| 擴充實機測試 | 手動：`chrome://extensions` 載入 `extension/` | 手動 | 未執行 |
| Build | — | 不適用 | 無打包步驟；CI 的「Build」job 只是 compileall＋上傳檔案 |

M1 完成時，下列指令須全部 exit 0，且 CI 不得有 `continue-on-error`：

```bash
ruff check .
ruff format --check .
python -m pytest -q
python -m compileall -q app.py api tests
node --check extension/popup.js
node --check extension/offscreen.js
node --check extension/service-worker.js
```

## CI 現況

- `test.yml`：push `master`／`main` 與 PR 觸發；pytest 失敗會讓 workflow 失敗（目前紅燈）。
- `ci.yml`：pytest 設 `continue-on-error: true`（註解寫明 15 個測試已壞），ruff format 失敗使 lint job 紅燈，build 與 deploy 因此被跳過。
- `deploy.yml` 與 `ci.yml` 的 deploy 只在 `main` 分支 push 觸發；`master` 不會部署。線上站目前不是 `master` 版本（SPEC §0.2）。
- 以上在 M1 AC-001 修正；本次文件 PR 不改 CI。

## M1 開發流程（Sean 同意解除暫緩後）

1. 讀 `AGENTS.md`、`GOAL.md`、`PRD/SPEC.md` 對應章節。
2. 先做 AC-001（品質閘門），之後每個 AC 一個分支與 PR，PR 標題含 AC 編號。
3. 先寫測試再實作；只用假資料與 mock。
4. 跑上表指令並把 exit code 記到 `STATUS.md`。
5. 不 push `master`、不部署 production、不動 Vercel 設定；合併由 Sean 決定。

## 故意不做（M1）

- ❌ 真實 OpenAI／STT／LLM 呼叫與真實金鑰。
- ❌ 真實會議錄音、真實當事人或客戶資料。
- ❌ 登入、會員、計費、金流、Notion／Slack OAuth。
- ❌ production 部署、線上站處置、Chrome Web Store 上架、刪除分支。
