# AGENTS.md — 繁中會議錄音與行動項工作台（meeting-recorder／MeetingFlow）

> ⚠️ 產品狀態：**建議暫緩**（`PRD/SPEC.md` §0）。在 Sean 明確同意前，不依 `GOAL.md` 開始功能開發；文件修正與品質閘門修復以外的變更先問 Sean。

## 1. 權威文件與範圍

- 規格：[`PRD/SPEC.md`](./PRD/SPEC.md) v4.0（§0 評估、§5 FR 狀態、§14 README 與程式不符清單、§15 待決事項）。
- 目前目標：[`GOAL.md`](./GOAL.md)（只含 M1）。
- 驗證指令：[`SOP.md`](./SOP.md)；目前狀態：[`STATUS.md`](./STATUS.md)。
- `PRD/SPEC.md` 附錄 B 是 2026-08-08 的歷史原文，被 `tests/test_spec_patch.py` 逐字檢查；改寫 SPEC 時必須保留該段，且附錄 B 之後不可再有 `## 1.` 開頭的標題。
- `BUILD_REPORT.md`、`CHANGELOG.md`、`PRD/CHANGELOG.md`、`rpb-1-verify.log` 是舊紀錄，與程式不一致處見 SPEC §14，不作為現況依據。

## 2. 專案結構（`master`）

```
app.py                 # FastAPI 入口：CORS、頁面路由、/health
api/public.py          # /api/capabilities、/api/analyze（規則式分析）、/api/transcribe（OpenAI，預設關閉）
index.html             # 目前只是一行 meta refresh → dashboard.html（M1 AC-002 恢復工作台）
dashboard.html         # 2026-09-05 套入的通用後台樣板，寫死 KPI、假登入狀態（M1 刪除）
extension.html         # 擴充安裝說明
privacy.html           # 隱私說明（用語待 M1 AC-005 修正）
extension/             # Chrome MV3：manifest、service-worker、offscreen（tabCapture＋mic 混音、IndexedDB）、popup
tests/                 # pytest 5 檔、65 個測試（test_app、test_edge_cases、test_extension、test_spec_patch、test_ui）
.github/workflows/     # test.yml、ci.yml、deploy.yml（deploy 只在 main 分支觸發）
vercel.json            # @vercel/python + @vercel/static，含 CSP／HSTS 等標頭
PRD/                   # SPEC.md（v4.0）、CHANGELOG.md
```

同 repo 另有 `main`（Next.js，無共同歷史）、`claude/review-meeting-notes-site-Y5hsb`（Python＋Supabase）、`gh-pages` 分支；**只讀，不要合併進 master**，去留由 Sean 決定。

## 3. 技術棧

| 項目 | 說明 |
|---|---|
| 語言 | Python 3.11（CI 版本）；`.ruff.toml` target `py311` |
| 後端 | FastAPI、Uvicorn、pydantic v2、python-multipart、httpx（`requirements.txt`，版本為範圍） |
| 前端 | 單檔 HTML＋vanilla JS（工作台待恢復）；無打包工具、無 `package.json` |
| 擴充 | Chrome Manifest V3，`tabCapture`、`offscreen`、`storage`、`downloads` |
| 測試 | pytest 8；FastAPI `TestClient` |
| Lint／Format | ruff（只在 CI 以 `pip install ruff` 安裝，未鎖版本） |
| 部署 | Vercel（`vercel.json`）；線上站目前不是 master 版本 |

## 4. 開發規則

1. **個資與保密**：錄音、逐字稿、與會者姓名、案件當事人都是個人資料。保密模式下音檔與逐字稿不得送出瀏覽器（M1 目標）；任何情況下都不得送第三方。伺服器不得 log 逐字稿或音檔內容。
2. **只用假資料**：測試、fixture、文件範例只用明顯假資料（姓名加「示範」／「測試」前綴、電話 `0900-000-xxx`、Email `@example.com`）。不得放入真實會議錄音、真實當事人或客戶資料。發現疑似真實個資時不要複製，回報檔案路徑。
3. **不得提交憑證**：不得提交 `OPENAI_API_KEY`、Vercel token、Supabase key 或 `.env*`；測試只用 `sk-fake-for-test` 類假值與 mock。不得請使用者把 token 貼到對話。
4. **不呼叫付費 API**：M1 不正式呼叫 OpenAI 或任何 STT／LLM；用 `httpx.MockTransport` 或 monkeypatch。
5. **錄音同意不可繞過**：不得移除或預設勾選「我已告知與會者」；不做自動開始錄音。
6. **誠實降級**：未完成的整合（Notion／Slack／雲端轉寫）不得顯示假成功；畫面不得出現假 KPI、假登入狀態。
7. **測試不可為了通過而刪改斷言**：不得刪除、`skip`、放寬既有斷言；行為刻意改變時在 PR 逐條說明並對應 FR／AC。
8. **CORS 與 CSP**：不得把 CORS 改成 `*`；不得在頁面載入外部腳本 CDN。
9. **Git**：從 `master` 開分支、以 PR 合併；不直接 push `master`、不 force push、不改 repo 設定；不得在未經 Sean 同意下部署 production、刪除分支或封存 repo。
10. **Commit 格式**：Conventional Commits，附 FR／AC 編號，例如 `fix(ci): AC-001 remove continue-on-error`；一個 commit 只做一件事。

## 5. 驗證

指令與目前可用狀態見 [`SOP.md`](./SOP.md)。尚未配置或目前失敗的檢查不得宣稱已通過。
