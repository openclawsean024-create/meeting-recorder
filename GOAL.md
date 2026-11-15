# Goal — 繁中會議錄音與行動項工作台（MeetingFlow）M1

> ⚠️ **建議暫緩，需 Sean 決定後才開發。** 評估理由見 `PRD/SPEC.md` §0。本檔定義「若 Sean 決定解除暫緩」時的第一個里程碑；在 Sean 明確同意前，不得依本檔開始實作。

## Objective

在不呼叫任何真實付費 API、不處理真實錄音或真實個資的前提下，讓公開版「說到做到」：CI 真正擋住失敗；恢復可用的工作台並移除與產品無關的後台樣板；保密模式的分析完全在瀏覽器內執行；雲端轉寫以 mock 誠實降級；隱私說明與實際資料流一致；並建立繁中行動項準確率基準，作為 M2 律師利基 go/no-go 的依據。

規格依據：`PRD/SPEC.md` v4.0（§5 FR、§7 資料、§9 M1、§14 不符清單）。

## Acceptance criteria

每條 AC 的「驗證」指令必須 exit 0。檔名為建議名稱，可在實作 PR 調整，但須同步更新本檔與 `SOP.md`。

- **AC-001：品質閘門真正擋得住失敗**（FR-021；§14 第 2 點）
  - `.github/workflows/` 內移除所有 `continue-on-error`；合併 `test.yml` 與 `ci.yml` 為單一 CI（lint、format、test、compile、extension 語法、JSON 驗證、secret 掃描），deploy job 必須 `needs` 全部 job。
  - `ruff format` 套用到目前 7 個未格式化檔案；`ruff` 加入 `requirements-dev.txt`（固定版本），pytest 也移到 dev 依賴並固定版本。
  - 65 個既有測試全部通過；不得刪除、`skip`、放寬既有斷言來換取通過（若行為刻意改變，PR 需逐條說明並對應 FR）。
  - 驗證：`ruff check . && ruff format --check . && python -m pytest -q && python -m compileall -q app.py api tests && node --check extension/popup.js && node --check extension/offscreen.js && node --check extension/service-worker.js`；`grep -rn "continue-on-error" .github/workflows/` 無結果；PR 上 GitHub Actions 全綠。

- **AC-002：恢復工作台，移除後台樣板**（FR-001／FR-002／FR-003／FR-006／FR-008；§14 第 1、6、11 點）
  - `index.html` 恢復為工作台（以 commit `956e89e` 版本為基礎，或依 Sean 決定重做），刪除 `dashboard.html`。
  - 頁面不得出現寫死 KPI、「已登入」「登出」「客戶管理」等與產品無關的字樣；不得載入外部腳本 CDN（字型可沿用 Google Fonts，需符合 `vercel.json` CSP）。
  - 本機 `uvicorn app:app` 下 `GET /` 直接回傳工作台（不經 meta refresh）。
  - 驗證：`python -m pytest -q tests/test_ui.py tests/test_app.py`；新增 `tests/test_no_template.py`（斷言所有 `*.html` 不含 `cdn.tailwindcss.com`、`已登入`、`客戶管理`、`登出`，且 `index.html` 不含 `http-equiv="refresh"`）。

- **AC-003：保密模式分析在瀏覽器內執行，零網路請求**（FR-007／FR-013；§14 第 4 點）
  - 將 `analyze_transcript` 的規則移植為前端模組（例如 `static/analyzer.js`），保密模式只用前端模組；一般模式可繼續呼叫 `/api/analyze`。
  - 前後端共用同一組假資料 golden fixture（例如 `tests/fixtures/analyzer_cases.json`），兩邊輸出逐欄一致（日期以固定「今天」注入）。
  - 驗證：`python -m pytest -q tests/test_analyzer_parity.py`（Python 端對 fixture）；`node --test tests/js/analyzer.test.mjs`（JS 端對同一 fixture）；`python -m pytest -q tests/e2e/test_legal_mode.py`（Playwright for Python：切到保密模式貼上假逐字稿 → 分析，攔截網路並斷言 `/api/*` 請求數為 0）。

- **AC-004：錄音／上傳後的轉寫流程誠實降級（只用 mock）**（FR-010；§14 第 3、8 點）
  - 修正前後端能力鍵名不一致（前端改讀 `audio_transcription`），或在 API 同時回傳兩者並加測試。
  - 能力為 false 時：錄音或上傳後清楚顯示「本站未開啟雲端轉寫，請貼上逐字稿」，不顯示任何轉寫中狀態。
  - 能力為 true 且非保密模式時：前端呼叫 `/api/transcribe`，以回應填入逐字稿並顯示分析；保密模式下前端不顯示雲端轉寫按鈕。
  - 測試全程以 mock 取代 OpenAI（例如 `httpx.MockTransport` 或 monkeypatch），不得讀取真實 `OPENAI_API_KEY`。
  - 驗證：`python -m pytest -q tests/test_transcribe_mock.py`（斷言送出的 multipart 欄位、429 限流、502 降級訊息、對外呼叫次數）；`python -m pytest -q tests/e2e/test_transcribe_flow.py`（Playwright 攔截 `/api/capabilities` 與 `/api/transcribe` 回傳假資料，驗證兩種能力狀態的畫面）；`git grep -n "sk-" -- tests` 只出現明顯假值（`sk-fake-for-test`）。

- **AC-005：資料保存、刪除與隱私說明一致**（FR-008／FR-012；§7、§14 第 4 點）
  - 工作台「清除本機歷史」同時清除 localStorage 歷史與記憶體中的音檔、逐字稿、分析結果。
  - `privacy.html` 依實際資料流改寫：一般模式逐字稿會送本站伺服器分析（不保存）、保密模式完全在瀏覽器、雲端轉寫的觸發條件與第三方、擴充 IndexedDB 的清除方式；不宣稱已通過法律審查。
  - `api/public.py` 不記錄（log）逐字稿或音檔內容。
  - 驗證：`python -m pytest -q tests/e2e/test_clear_history.py`（存兩筆假會議 → 清除 → 斷言 `localStorage.getItem('meetingflow-history')` 為 null 且畫面清空）；`python -m pytest -q tests/test_privacy_copy.py`（斷言 `privacy.html` 含「伺服器」「保密模式」「瀏覽器」與 OpenAI 觸發條件）；`grep -nE "log(ger)?\.(info|debug|warning)\(.*transcript" api/*.py` 無結果。

- **AC-006：繁中行動項準確率基準（假資料）**（FR-011；§10）
  - 建立至少 30 段明顯假資料的繁中會議逐字稿 fixture（姓名加「示範」或「測試」前綴、電話 `0900-000-xxx`、Email `@example.com`），每段標註預期的決策、風險、行動項、負責人、截止日。
  - 新增基準腳本輸出 precision、recall、負責人正確率、截止日正確率（固定「今天」日期）；M1 只要求可重跑並把結果記錄到 `STATUS.md`，不設通過門檻。
  - 既有測試中的示意人名改為加前綴的假名。
  - 驗證：`python scripts/benchmark_analyzer.py --fixtures tests/fixtures/benchmark --today 2026-01-05` exit 0 並輸出 JSON 指標；`python -m pytest -q tests/test_fixtures_safety.py`（掃描 fixture 與測試，遇到不在 `0900-000-xxx` 範圍的 `09` 開頭手機號或非 `example.com` Email 即失敗）。

- **AC-007：擴充設定與文件和程式一致**（FR-009；§14 第 5、7、9、10 點）
  - 擴充新增選項頁，可設定工作台網址（仍受 `safeAppUrl` 白名單限制）；預設網址與 README 的本機埠號一致。
  - popup 顯示 IndexedDB 內錄音數量與總大小，並提示使用者定期清除。
  - README、`AGENTS.md`、`CHANGELOG.md`、`PRD/CHANGELOG.md` 與程式一致：測試數量、部署觸發分支、保密模式用語（「不送第三方」與「不離開瀏覽器」分清楚）；刪除或更正舊 SPEC 中未實作的「自動分段」「Speaker 音量偵測」敘述（附錄 B 為測試綁定的歷史原文，只加註不改）。
  - 驗證：`python -m pytest -q tests/test_extension.py`（新增斷言：`manifest.json` 有 `options_page` 或 `options_ui`、預設網址埠號與 README 相同）；`python -m pytest -q tests/test_docs_consistency.py`（斷言 README 的部署分支與 `.github/workflows/*.yml` 的 deploy 觸發分支相同、README 不含「已完成」但程式沒有的功能關鍵字清單）。

## Out of scope

- 真實 OpenAI 或任何付費 STT／LLM API 的正式呼叫；設定或讀取真實金鑰（測試只用 mock 與 `sk-fake-for-test` 類假值）。
- 裝置端 STT PoC、LLM 摘要、講者分離（M2）。
- 會員、登入、計費、金流（M3 之後，且需 Sean 決定）。
- Notion／Slack OAuth、Email 實際寄送（維持 `mailto:` 草稿與可複製格式）。
- 真實會議錄音、真實當事人或客戶資料、真實律師案件內容。
- production 部署、Vercel 專案設定變更、線上站 `meeting-recorder-ten.vercel.app` 的處置；Chrome Web Store 上架。
- 刪除或改名 `main`、`claude/review-meeting-notes-site-Y5hsb`、`gh-pages` 分支（由 Sean 決定）。

## Exit gate

- Sean 已明確同意解除「暫緩」並確認 `PRD/SPEC.md` §15 待決事項 1、2、4。
- AC-001～AC-007 的驗證指令全部 exit 0，指令與結果記錄於 `STATUS.md`。
- 實作 PR 的 GitHub Actions 全綠，且 workflow 中沒有 `continue-on-error`。
- AC-006 基準結果已記錄，並據此由 Sean 決定是否進入 M2（律師訪談＋裝置端 STT PoC）或改為封存。
