# Status — meeting-recorder（繁中會議錄音與行動項工作台）

- 產品：繁中會議錄音與行動項工作台（暫定名稱；程式內品牌 MeetingFlow）
- 主 repo：`openclawsean024-create/meeting-recorder`（`master` @ `9ff8cd8`）
- 候選併入 repo：無
- 規格：`PRD/SPEC.md` v4.0；目標：`GOAL.md`（M1）
- 狀態：🟠 **文件重建完成，尚未開發；建議暫緩，待 Sean 決定**（2026-11-16）

## 評估摘要（詳見 SPEC §0）

| 項目 | 結論 |
|---|---|
| 現況完成度 | 25 / 100 |
| 獲利潛力 | 低（律師保密利基：中，未驗證） |
| 獲利模式 | 免費增值 → SaaS 訂閱（律師版）；事務所地端可考慮專案建置 |
| 建議 | 暫緩 |

## 目前狀態摘要

- 後端 `api/public.py`：規則式繁中分析（摘要、決策、風險、行動項、負責人、截止日、案件標籤）、上傳檢查、保密模式拒絕音檔外送，可用且有測試。
- Chrome MV3 擴充：分頁音訊＋麥克風混音錄製、IndexedDB、下載，程式完整，未在本機執行。
- 主畫面壞掉：`index.html` 只導向 `dashboard.html`，後者是通用後台樣板（假 KPI、假登入），沒有任何產品功能；工作台只存在於 git 歷史 `956e89e`。
- 「錄音 → 逐字稿」從未在 UI 串起來：前端不呼叫 `/api/transcribe`。
- CI 紅燈：pytest 15 failed（`test.yml`）；`ci.yml` 以 `continue-on-error` 遮蔽 pytest，ruff format 失敗。
- 線上站 `meeting-recorder-ten.vercel.app` 跑的是舊版程式，不是 `master`。

## FR 對照（以 `master` 程式為準，所在 repo 皆為 meeting-recorder）

| FR | 需求 | 優先 | 狀態 |
|---|---|---|---|
| FR-001 | 網頁錄音＋同意 gate | P0 | 部分（只在歷史版） |
| FR-002 | 音檔拖放／上傳 | P0 | 部分（後端檢查在；前端只在歷史版） |
| FR-003 | 貼逐字稿 → 規則分析 | P0 | 部分（API 在；前端只在歷史版） |
| FR-004 | 摘要／決策／風險／行動項 | P0 | 已實作 |
| FR-005 | 負責人與截止日推斷 | P0 | 已實作 |
| FR-006 | Markdown／Email／Notion／Slack 複製 | P0 | 部分（只在歷史版） |
| FR-007 | 律師保密模式＋案件標籤 | P0 | 部分（逐字稿仍送本站伺服器） |
| FR-008 | 本機歷史 30 筆＋搜尋＋清除 | P0 | 部分（只在歷史版） |
| FR-009 | Chrome MV3 擴充 | P0 | 已實作（未實機驗證） |
| FR-010 | 雲端轉寫（預設關閉） | P1 | 部分（前端未串接、鍵名不一致） |
| FR-011 | 繁中行動項準確率基準 | P0 | 未實作 |
| FR-012 | 隱私說明與實作一致 | P0 | 部分 |
| FR-013 | 保密模式瀏覽器端分析 | P0 | 未實作 |
| FR-014 | 裝置端繁中 STT | P1 | 未實作 |
| FR-015 | LLM 摘要（測試模式） | P1 | 未實作 |
| FR-016 | 講者分離 | P2 | 未實作 |
| FR-017 | 會員／登入 | P2 | 未實作 |
| FR-018 | 計費 | P2 | 未實作 |
| FR-019 | Notion／Slack OAuth | P2 | 未實作 |
| FR-020 | 跨裝置同步（端對端加密） | P2 | 未實作 |
| FR-021 | 安全邊界 | P0 | 已實作（限流在 serverless 下不可靠） |

小計：已實作 4、已實作（有限制）1、部分 9、未實作 7。

## Deterministic checks

本機無法執行 Python／Node（環境限制），以下皆引用 GitHub Actions，**未在本機執行**。

| 檢查 | 來源 | 結果 |
|---|---|---|
| `python -m pytest -q` | `Test` run 34026425443（2026-09-06，`9ff8cd8`） | ❌ 15 failed、50 passed |
| `ruff check .` | `CI` run 34026425451 | ✅ |
| `ruff format --check .` | `CI` run 34026425451 | ❌ 7 個檔案需格式化 |
| `python -m compileall -q app.py api tests` | `Test` run 34026425443 | ✅ |
| `node --check extension/*.js`、manifest／vercel JSON 驗證、secret 掃描 | `CI` run 34026425451 的 Pytest job（pytest 被 `continue-on-error` 放行後續步驟） | ✅ |
| 線上站探測（`curl`，唯讀） | 2026-11-16 | `/` 200（舊版頁面）、`/health` 200、`/api/capabilities` 404、`/privacy` 404 |
| 明文憑證掃描（`master`、`main`、review 分支） | 2026-11-16 grep | 只有佔位文字與 `sk-fake-for-test`，未發現真實憑證 |

## 已知風險與問題

- 主畫面為無關樣板（假 KPI、「已登入」「登出」「客戶管理」），對外展示會誤導使用者。
- 保密模式對外說「不外推」，但逐字稿仍送到本站伺服器分析。
- 線上站跑舊版程式（頁面含 `/api/share`、`/api/live-transcribe` 字串），其後端是否仍可接收音檔或建立公開分享連結**未驗證**（未主動探測這些端點）。
- 速率限制存在記憶體，serverless 多實例下無效；若開啟雲端轉寫可能產生非預期費用。
- 擴充 IndexedDB 錄音無保存期限；「開啟工作台」預設指向 `127.0.0.1:8765`。
- `requirements.txt` 依賴為版本範圍、ruff 未鎖版本。
- README 與程式不一致之處見 SPEC §14（11 項）。

## 本次變更

- 重寫 `PRD/SPEC.md`（v4.0，保留附錄 B 原文以維持 `tests/test_spec_patch.py`）、`AGENTS.md`；新增 `GOAL.md`、`SOP.md`、`STATUS.md`。未修改任何程式碼、設定或測試。
- 本次文件 PR 的 CI 預期仍為紅燈（既有 15 個測試失敗與 format 問題與本 PR 無關）。

## 待決事項（同 SPEC §15）

1. 接受「暫緩」？或改封存、或直接進 M1。
2. 線上站處置（下架／改指向 master／維持）。
3. `main`、`claude/review-meeting-notes-site-Y5hsb`、`gh-pages` 分支去留。
4. 恢復工作台的方式（還原 `956e89e` 或重做）。
5. M2 律師訪談對象來源與準確率門檻。
6. 完成度數字採用 25 或沿用健檢 6.5／10。

## 下一步

1. Sean 決定上列待決事項。
2. 若解除暫緩：先做 `GOAL.md` AC-001（品質閘門），再依序 AC-002～AC-007。
