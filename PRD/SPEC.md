# 繁中會議錄音與行動項工作台（MeetingFlow）— 產品需求規格 v4.0

> 版本：v4.0（評估＋PRD 重建）｜更新日期：2026-11-16｜狀態：**文件重建，尚未依本版開發；建議暫緩，待 Sean 決定**
> 主 repo：`openclawsean024-create/meeting-recorder`（預設分支 `master`，重建基準 commit `9ff8cd8`）
> 候選併入 repo：無。同 repo 另有兩條無共同歷史的分支（`main`、`claude/review-meeting-notes-site-Y5hsb`），盤點見 §13。
> 取代：v3.0.0／v3.0.0-Public Patch／v3.0.2（2026-07-18 ～ 2026-09-06）。舊版「Sweet Spot 5/10」、MRR 目標、競品比較為內部假設，沒有出處，本版不再引用為依據；舊版全文可從 git 歷史 `9ff8cd8` 取回。
> **附錄 B 逐字保留舊版 Public Release Mode 章節**，因為 `tests/test_spec_patch.py` 會檢查那段文字；它是歷史紀錄，與本版衝突時以本版為準。

本文件所有「已實作／部分／未實作」皆以 2026-11-16 閱讀 `master` 原始碼與 GitHub Actions 最近執行紀錄為準。本機無法執行 Python／Node（環境限制），**所有測試結果引用自 GitHub Actions，未在本機執行**。README 與程式不一致之處列於 §14。

---

## 0. 評估結論

### 0.1 一頁結論

| 項目 | 結論 |
|---|---|
| 現況完成度 | **25 / 100**（依程式實況，見 0.2） |
| 獲利潛力 | **低**（一般會議記錄市場）；律師保密利基為「中，但未驗證」 |
| 目標客群 | 律師事務所與企業法務（主）、台灣中小企業業務團隊（次） |
| 獲利模式 | 免費增值 → SaaS 訂閱（律師版）；事務所地端部署可考慮「專案建置」 |
| 建議 | **暫緩** |
| 與既有產品重疊 | `ai-interview-assistant`（音訊擷取、語音轉文字）、`contract-tracker`（法務客群）、`text-to-speech-mvp`（語音技術，方向相反）；見 0.4.1 |

### 0.2 完成度 25 的理由

- **後端分析可用**：`api/public.py` 的規則式分析（摘要、決策、風險、行動項、負責人、截止日、案件標籤）、上傳大小與格式檢查、保密模式拒絕音檔外送，皆有 pytest 覆蓋（CI 上 50 個通過）。
- **Chrome 擴充可用**：`extension/` 為 MV3，tabCapture＋麥克風混音＋IndexedDB＋下載，程式完整；但沒有自動化瀏覽器測試，未在本機執行。
- **主畫面已壞**：commit `8fe1353`（2026-09-05「apply 家服 dashboard design」）把 43.8 KB 的工作台 `index.html` 換成一行 meta refresh，導向新增的 `dashboard.html`。`dashboard.html` 是通用後台樣板：寫死的 KPI（「本週完成 12 / 18」「活躍客戶 8」）、「客戶管理」「登出」選單、「已登入 · 一般使用者」，**沒有任何錄音、上傳、逐字稿或分析功能**。此外 FastAPI 沒有 `/dashboard.html` 路由，本機用 uvicorn 開首頁會被導到 404（依程式判斷，未在本機執行）。
- **核心價值沒做出來**：即使是被移除前的工作台，錄音或上傳的音檔也只放在記憶體，前端從未呼叫 `/api/transcribe`；使用者必須自己貼逐字稿。「錄音 → 繁中逐字稿」這條主流程在 UI 上從未存在。
- **品質閘門失效**：master 最近兩次 push，`Test` workflow 15 個測試失敗；`CI` workflow 的 pytest 設 `continue-on-error: true`，ruff format 有 7 個檔案未格式化而失敗。
- **線上站不是 master**：`meeting-recorder-ten.vercel.app` 首頁回傳 63 KB 舊版頁面（含 `/api/share`、`/api/live-transcribe` 字串），`/api/capabilities`、`/privacy` 為 404；master 只在 `main` 分支 push 時才部署，而 `main` 是另一條無共同歷史的 Next.js 分支。

### 0.3 獲利潛力：低（理由）

1. **市場擁擠且有平台內建**：視訊平台本身已提供 AI 會議摘要（Zoom、Google Meet、Microsoft Teams 的內建功能，涵蓋範圍與繁中品質**待確認**），台灣本地有雅婷逐字稿，國際有 Otter、Fireflies、Notta、tl;dv 等（價格與繁中支援**待確認**）。第五家「錄音 → 摘要」工具很難收費。
2. **本產品沒有 STT**：繁中音訊轉文字是付費理由的核心，目前完全仰賴外部 OpenAI（預設關閉）或使用者自行貼稿。規則式分析的差異化（決策／行動項句型比對）容易被 LLM 取代。
3. **律師保密模式是唯一可辯護的差異**，但要成立需要：(a) 裝置端或事務所地端語音轉文字，音檔與逐字稿都不離開裝置；(b) 可被稽核的資料流說明；(c) 律師倫理與個資法的專業意見。三項目前皆無，且投入不小。
4. **一人公司的信任門檻**：律師事務所採購通常要求資安說明、合約與責任歸屬（具體要求**待訪談確認**），對新品牌是高門檻。

### 0.4 建議：暫緩

理由：目前程式主畫面已壞、核心的繁中轉寫不存在、一般市場由平台內建功能與既有工具占據；唯一可能收費的「律師保密」利基需要裝置端 STT 與法務背書，在沒有任何律師訪談或付費意願證據前，不值得投入完整開發。

暫緩期間建議只保留兩項低成本動作（需 Sean 同意才開始，見 `GOAL.md`）：
- 修好品質閘門與主畫面，讓公開版至少「說到做到」（M1）。
- 用假資料建立繁中行動項準確率基準，並訪談 5–10 位律師／法務，作為 M2 是否投入裝置端 STT 的 go/no-go 依據。

若 Sean 判斷律師利基不值得驗證，建議改為**封存**（保留 `api/public.py` 規則分析與 `extension/` 供其他產品複用）。

### 0.4.1 與第一批產品的重疊

| 產品（repo） | 重疊點 | 建議 |
|---|---|---|
| `ai-interview-assistant` | 都需要瀏覽器音訊擷取與語音轉文字；都要避免「錄音未告知」爭議 | 若兩者都開發，STT／錄音同意元件應共用一套 |
| `contract-tracker` | 目標客群同為法務；都以「規則比對＋人工判斷、不提供法律意見」為原則 | 律師版若推進，可考慮與合約提醒做同一客群的組合銷售（待確認） |
| `text-to-speech-mvp` | 同屬語音領域，但方向相反（TTS vs STT），無功能重疊 | 無 |

本 brief 未提供 sean0407 帳號的專案清單，未比對。

---

## 1. 問題

1. 開完會後要從錄音或筆記整理出「誰、在什麼時候前、要做什麼」，人工整理耗時且容易漏。
2. 通用 AI 會議工具對繁中（含中英夾雜、台灣用語）的品質參差（程度**待確認**，舊版 SPEC 的說法無出處）。
3. 律師、法務等有保密義務的使用者，不能或不敢把當事人會談錄音交給境外雲端服務；現有工具多以雲端處理為預設（各家是否提供地端或不外送選項**待確認**）。

## 2. 目標客群

| 類型 | 描述 | 備註 |
|---|---|---|
| Primary | 台灣律師事務所（1–20 人）的律師與助理、企業法務 | 需求強度、付費意願、採購流程皆待訪談 |
| Secondary | 中小企業業務團隊：每天多場客戶會議，需要會後行動項 | 此客群最容易被平台內建 AI 摘要滿足 |
| 不服務 | 醫療機構病歷錄音、心理諮商錄音 | 涉及醫療法與特種個資，舊版 persona 移除 |

## 3. 獲利模式

- **免費增值**：公開版免登入，純文字分析與 Chrome 擴充免費。
- **SaaS 訂閱（律師版）**：裝置端 STT、案件標籤、跨裝置同步（端對端加密）等。價格未定；舊版 SPEC 的 NT$599／NT$999／NT$2,999 每月為內部假設，**沒有市場驗證，待確認**。
- **專案建置（選項）**：事務所地端部署與導入。是否可行待訪談。
- 不做：顧問／內訓、模板販售（與產品主線無關）。

## 4. 競品與差異

競品名單取自舊版 SPEC 與一般認知；功能範圍、繁中品質、價格、是否支援地端處理**均未在本次查證，全部標「待確認」**，不得當作事實引用。

| 競品 | 類型（待確認） | 本產品差異假設 |
|---|---|---|
| 雅婷逐字稿 | 台灣繁中語音轉文字 | 會後行動項卡片；保密模式不外送 |
| Otter.ai、Fireflies.ai、Notta、tl;dv | 國際 AI 會議記錄 | 繁中排版與台灣日期／指派句型；保密模式 |
| Zoom、Google Meet、Microsoft Teams 內建 AI 摘要 | 平台內建 | 跨平台（網頁會議分頁）；不依賴平台授權方案 |
| 錄音筆類硬體（例如 Plaud 等） | 硬體＋雲端 | 無硬體成本；保密模式 |

差異是否足以收費：**一般會議情境不足**；律師保密情境「可能足夠，但前提是做出裝置端 STT」，需 M2 驗證。

## 5. 功能需求

狀態以 `master` @ `9ff8cd8` 為準。「歷史版」指 commit `956e89e` 的 `index.html`（被 `8fe1353` 移除前的工作台）。所在 repo 皆為 `meeting-recorder`。

| FR | 需求 | 優先 | 狀態 | 程式位置／說明 |
|---|---|---|---|---|
| FR-001 | 網頁麥克風錄音＋錄音同意 gate | P0 | 部分 | 只存在於歷史版；HEAD 已移除 |
| FR-002 | 音檔拖放／上傳（≤ 100 MB，格式檢查） | P0 | 部分 | 前端只在歷史版；後端 `api/public.py` `_validate_upload_size`、`ALLOWED_EXTENSIONS` 已實作 |
| FR-003 | 貼上逐字稿 → 規則式分析 | P0 | 部分 | `POST /api/analyze` 已實作；前端只在歷史版 |
| FR-004 | 摘要（≤ 300 字）、重點、決策、風險、行動項 | P0 | 已實作 | `analyze_transcript()`；規則式關鍵字比對，非 LLM |
| FR-005 | 負責人與截止日推斷（請／由／麻煩、今天／明天／下週X、M/D、ISO） | P0 | 已實作 | `_infer_assignee`、`_infer_due`；過去日期會滾到隔年 |
| FR-006 | 匯出：Markdown、剪貼簿、Email 草稿、Notion／Slack 可複製格式 | P0 | 部分 | 只在歷史版；無 OAuth（刻意） |
| FR-007 | 律師保密模式＋案件標籤 | P0 | 部分 | 後端拒絕保密模式音檔外送（403）、`case_tag` 以「A vs B／A 訴 B」比對；**但逐字稿仍送到本站伺服器分析，不是裝置端** |
| FR-008 | 本機歷史（localStorage 30 筆）、搜尋、重新載入、清除 | P0 | 部分 | 只在歷史版 |
| FR-009 | Chrome MV3 擴充：分頁音訊＋可選麥克風混音、IndexedDB、下載 WebM、清除 | P0 | 已實作 | `extension/`；未在本機執行，無自動化瀏覽器測試；「開啟工作台」預設網址為 `http://127.0.0.1:8765`，且無設定介面 |
| FR-010 | 雲端轉寫（OpenAI，預設關閉，限流） | P1 | 部分 | 後端 `POST /api/transcribe` 已實作；**前端從未呼叫**；歷史版讀 `cap.transcribe_enabled`，但 API 回傳鍵名是 `audio_transcription` |
| FR-011 | 繁中行動項準確率基準（假資料 fixture＋指標報告） | P0 | 未實作 | M1 |
| FR-012 | 隱私說明與資料保存／刪除說明與實作一致 | P0 | 部分 | `privacy.html` 存在；「本機分析」用語與實際送伺服器不符 |
| FR-013 | 保密模式的分析在瀏覽器端執行（零網路請求） | P0 | 未實作 | M1 |
| FR-014 | 裝置端繁中 STT（瀏覽器或事務所地端） | P1 | 未實作 | M2 PoC，決定律師版 go/no-go |
| FR-015 | LLM 摘要與行動項（非保密模式、測試模式） | P1 | 未實作 | `main` 分支與 review 分支有 OpenAI 呼叫可參考（§13） |
| FR-016 | 講者分離（diarization） | P2 | 未實作 | — |
| FR-017 | 會員／登入 | P2 | 未實作 | master 刻意不做；`dashboard.html` 的「登出／已登入」是樣板假字 |
| FR-018 | 計費（測試模式） | P2 | 未實作 | M3，需 Sean 決定 |
| FR-019 | Notion／Slack OAuth | P2 | 未實作 | — |
| FR-020 | 跨裝置同步（端對端加密） | P2 | 未實作 | — |
| FR-021 | 安全邊界：上傳上限、格式、速率限制、安全標頭、CORS 預設同源 | P0 | 已實作（有限制） | 速率限制存在行程記憶體，在 Vercel serverless 多實例下無法可靠生效 |

小計：已實作 4、已實作（有限制）1、部分 9、未實作 7（其中 P0 未實作 2）。

## 6. 非功能需求

| 維度 | 需求 |
|---|---|
| 隱私 | 保密模式下音檔、逐字稿、分析結果都不離開瀏覽器（FR-013）；非保密模式送本站伺服器分析時，伺服器不記錄、不保存逐字稿 |
| 安全 | 維持現有 CSP（`script-src 'self'`）、HSTS、X-Frame-Options；前端不得載入外部腳本 CDN（現行 `dashboard.html` 的 Tailwind CDN 會被 CSP 擋下） |
| 效能 | 3 萬字以內逐字稿分析 ≤ 2 秒（目標值待實測） |
| 可用性 | 繁中介面（`lang="zh-Hant"`）、鍵盤可操作、行動版可用 |
| 誠實 | 未完成的整合（Notion／Slack／雲端轉寫）一律明確降級，不顯示假成功、假 KPI、假登入狀態 |
| 可驗證 | lint、format、test、compile、extension 語法檢查全部在 CI 擋失敗 |

## 7. 資料與個資處理

| 資料 | 存放位置（現況） | 處理原則 |
|---|---|---|
| 網頁錄音／上傳音檔 | 瀏覽器記憶體（歷史版）；不保存 | 不上傳，除非使用者在非保密模式明確選「雲端轉寫」且站方已啟用 |
| 擴充錄音 | 擴充 IndexedDB `meetingflow-recordings`＋使用者下載的 WebM | 無自動保存期限；需提供保存期限提示（M1） |
| 逐字稿、分析結果 | 送到本站 `/api/analyze`（記憶體處理、不落地）；歷史存 localStorage `meetingflow-history` | 保密模式改為瀏覽器端（FR-013）；歷史可一鍵清除 |
| 與會者姓名、案件當事人名稱 | 同上（逐字稿內） | 屬個人資料；案件標籤可能含當事人姓名，畫面與匯出需提示 |
| 送 OpenAI 的音檔 | 只在 `PUBLIC_TRANSCRIBE_ENABLED=true` 且有金鑰、非保密模式時 | 屬跨境傳輸；M1 全部用 mock，不呼叫真實 API |

測試與範例資料規則：只用明顯假資料（姓名加「示範」或「測試」前綴、電話 `0900-000-xxx`、Email `@example.com`）。現有測試中的「王小明」「小美」「大地公司」為常見示意名稱，M1 改為加前綴的假名。

## 8. 法規與風險

> 以下為產品風險盤點，**不是法律意見**；條文適用需由律師確認。

| 風險 | 說明 | 對策 |
|---|---|---|
| 個人資料保護法 | 錄音與逐字稿含與會者聲音、姓名、談話內容；送 OpenAI 屬國際傳輸 | 預設不外送；保密模式裝置端；隱私說明與實作一致（FR-012） |
| 錄音合法性 | 未經同意錄製他人非公開談話可能涉及刑法妨害秘密相關規定（適用範圍**待法律意見**） | 保留錄音同意 gate；不做自動開始錄音 |
| 律師保密義務 | 律師使用雲端工具處理當事人資訊的界線（**待確認**律師倫理規範與公會意見） | 律師版前提是裝置端處理；取得專業意見前不宣稱「符合律師倫理」 |
| Chrome Web Store 政策 | `tabCapture`、使用者資料政策、隱私權政策要求（細節**待確認**） | 上架前逐項檢查；目前只提供未封裝安裝 |
| 視訊平台條款 | Meet／Zoom 對第三方錄製的規定（**待確認**） | 只錄使用者自己的分頁；UI 提醒告知與會者 |
| 外部 STT／LLM 條款與成本 | OpenAI 的資料使用政策與費用（**待確認**） | 預設關閉；M1 只用 mock |
| 競品 | 平台內建 AI 摘要持續擴張 | 只在律師利基驗證成功才投入 |
| 部署漂移 | 線上站跑舊版程式（含 share／live-transcribe 字串），與 master 不符 | M1 不動 production；由 Sean 決定線上站處置（§15） |

## 9. 里程碑

| 里程碑 | 內容 | 進入條件 |
|---|---|---|
| **M1：誠實可用的公開版＋驗證工具**（本次 `GOAL.md`） | 品質閘門、恢復工作台、保密模式瀏覽器端分析、雲端轉寫誠實降級（mock）、資料刪除與隱私說明一致、準確率基準、擴充設定與文件一致 | Sean 同意解除暫緩 |
| M2：律師利基驗證 | 5–10 位律師／法務訪談；裝置端繁中 STT PoC（只用假資料或取得同意的錄音）；LLM 摘要測試模式（非保密）；go/no-go 報告 | M1 Exit gate 通過 |
| M3：律師版試用 | 會員與計費測試模式、端對端加密同步、Chrome Web Store 上架、2–3 家事務所試用 | M2 結論為 go，且取得法律意見 |

## 10. 成功指標

| 階段 | 指標 | 目標（待 Sean 確認） |
|---|---|---|
| M1 | GOAL AC 全部通過、CI 全綠且無 `continue-on-error` 遮蔽 | 100% |
| M1 | 準確率基準：行動項句子 precision／recall、負責人正確率、截止日正確率 | 先量測不設門檻；舊版 SPEC 的「80%」僅供參考 |
| M2 | 律師／法務訪談中表示願意付費試用的人數 | ≥ 3 位（門檻待確認） |
| M2 | 裝置端 STT 在假資料繁中語料上的字錯率 | 門檻待 PoC 後設定 |
| M3 | 付費試用事務所數 | 待確認 |

## 11. 合併清單

候選併入 repo：**無**。以下是同 repo 內其他分支的盤點（只讀，不在本次修改）：

| 來源 | 功能 | 決定 | 原因 |
|---|---|---|---|
| `claude/review-meeting-notes-site-Y5hsb`（Python＋Supabase，2026-05） | GPT 會議記錄 prompt、講者分段 prompt、prompt injection 防護 | 參考（M2） | LLM 摘要（FR-015）可借用 prompt 結構；需重寫為測試模式 |
| 同上 | Supabase 帳號、使用量限制、`/api/jobs` | 不搬 | 公開版不做登入；M3 再評估 |
| 同上 | `/api/share` 公開分享連結 | 不搬 | 公開分享逐字稿是個資外洩風險 |
| 同上 | `/api/live-transcribe` 即時轉寫 | 不搬 | 成本與個資風險；保密模式不可用 |
| `main`（Next.js 14，2026-04） | JSON／TXT／PDF 匯出 | 參考（P2） | 匯出格式可參考；不搬 Next.js 架構 |
| `main` | `/pricing`、`/auth` 頁 | 不搬 | 價格未驗證；不做登入 |
| `gh-pages`（2026-03 靜態頁） | Solana 風格舊頁面 | 不搬 | 已過時 |

主 repo 基礎評估：`master`（FastAPI＋pytest＋MV3 擴充）是三條分支中測試最完整、隱私邊界最清楚的，**維持 `master` 為基礎，不建議改選**。`main` 與 review 分支的去留由 Sean 決定（§15）。

## 12. 系統現況（`master`）

- 後端：Python 3.11、FastAPI、Uvicorn、pydantic v2、httpx（`requirements.txt`，版本為範圍未鎖定）。
- 路由：`GET /`、`/app` → `index.html`；`/recording` → 轉址 `/app`；`/extension`、`/privacy`、`/health`；`GET /api/capabilities`、`POST /api/analyze`、`POST /api/transcribe`。
- 前端：`index.html`（一行 meta refresh 到 `dashboard.html`）、`dashboard.html`（通用樣板）、`extension.html`、`privacy.html`。
- 擴充：`extension/manifest.json`（MV3；權限 `tabCapture`、`offscreen`、`storage`、`downloads`）、`service-worker.js`、`offscreen.js`、`popup.*`。
- 測試：`tests/` 5 檔、65 個測試；`test_spec_patch.py` 檢查本檔附錄 B 的文字；`test_ui.py` 檢查 `index.html` 的 DOM 與差異點。
- CI：`.github/workflows/test.yml`（pytest 失敗會擋）、`ci.yml`（ruff check／format、pytest 但 `continue-on-error`、compileall、deploy 只在 `main`）、`deploy.yml`（只在 `main` push）。
- 部署：`vercel.json`（`@vercel/python`＋`@vercel/static`，含 CSP）。

## 13. 分支盤點

| 分支 | 最後 commit | 與 master 關係 | 內容 |
|---|---|---|---|
| `master`（預設） | `9ff8cd8`（2026-09-06） | — | 本文件依據 |
| `main` | `63e1229`（2026-04-18） | 無共同歷史 | Next.js 14＋OpenAI（`gpt-4o-transcribe`、`gpt-4o-mini`）、pricing、auth 頁 |
| `claude/review-meeting-notes-site-Y5hsb` | `3fc1d5a`（2026-05-11） | 未比對 | Python＋Supabase＋OpenAI、share、live-transcribe、jobs |
| `gh-pages` | `fe2e04f`（2026-03-29） | — | 舊靜態頁 |

已掃描 `main` 與 review 分支的明文憑證樣式（`sk-`、JWT、Supabase 網址、service key），只找到佔位文字（`your-service-key` 等），未發現真實憑證。

## 14. README 與程式不符清單

| # | 文件說法 | 程式實況 |
|---|---|---|
| 1 | README「已完成：公開響應式網站：麥克風錄音、音檔拖放、錄音同意、繁中逐字稿編輯」 | HEAD 的 `index.html` 只導向 `dashboard.html` 樣板，以上功能全部不在；只存在於 git 歷史 `956e89e` |
| 2 | README／AGENTS「`pytest -q` 必須全綠」；`rpb-1-verify.log`「65 passed」 | 最近 CI：15 failed、50 passed；`ci.yml` 的 pytest 設 `continue-on-error`，註解自承「既有 15 個 test 在 index→dashboard 改版後斷裂」 |
| 3 | README「`OPENAI_API_KEY`…公開 `/api/transcribe` 才會送非保密音檔到 OpenAI」 | 後端存在，但前端（含歷史版）從未呼叫 `/api/transcribe`；音檔錄完不會被轉寫 |
| 4 | README／privacy「保密模式不自動外推」、舊 SPEC「純本機」 | 不送第三方，但逐字稿仍以 `POST /api/analyze` 送到本站伺服器；不是裝置端 |
| 5 | README「之後每次 `git push origin master` 就會自動部署」 | `deploy.yml` 與 `ci.yml` 的 deploy 只在 `main` 觸發；線上站首頁是舊版（`/api/capabilities` 404） |
| 6 | `dashboard.html`「已登入 · 一般使用者」、「登出」、「客戶管理」、KPI 數字 | 無登入系統；數字寫死；與產品無關 |
| 7 | 舊 SPEC §0.5.6「> 2 小時錄音…擴充會自動分段」「Speaker 標記用音量偵測切 Speaker A/B/C」 | `extension/offscreen.js` 沒有分段或講者標記 |
| 8 | 歷史版前端讀 `cap.transcribe_enabled` | `/api/capabilities` 回傳 `audio_transcription` |
| 9 | `PRD/CHANGELOG.md` v1.0.1「過期日期 fallback 到 next-week 同星期」「IP-based token bucket」「保密模式 `ai_suggested`」 | 程式是滾到隔年；限流是滑動視窗 deque；程式中沒有 `ai_suggested` |
| 10 | `extension/README.md`／README「打開 http://127.0.0.1:8000」 | 擴充「開啟工作台」預設 `http://127.0.0.1:8765/app`，且沒有設定 `appUrl` 的介面 |
| 11 | `dashboard.html` 載入 `https://cdn.tailwindcss.com` | `vercel.json` CSP 為 `script-src 'self' 'unsafe-inline'`，外部腳本會被擋（依設定判斷，未在瀏覽器驗證） |

## 15. 待 Sean 決定

1. 接受「暫緩」？或改為封存、或直接進 M1。
2. 線上站 `meeting-recorder-ten.vercel.app` 跑舊版程式：要下架、改指向 `master`，還是維持？（本次不動 production）
3. `main`、`claude/review-meeting-notes-site-Y5hsb`、`gh-pages` 三條分支的去留（本次不刪）。
4. M1 恢復工作台時，是還原 `956e89e` 的版本，還是保留 `dashboard.html` 的視覺再重新接線？（本文件預設還原，並刪除樣板）
5. 律師利基 M2 訪談對象來源與準確率門檻。
6. 完成度數字以本文件 25 為準，或沿用健檢 6.5／10 的說法。

---

# 附錄

## 附錄 A：版本沿革

- v2.2.1（2026-07-11）→ v3.0.0 sweet-spot 重寫（2026-07-18）→ v3.0.0-Public Patch（2026-08-08）→ v3.0.2 入口整理（2026-09-06）→ **v4.0 本版（2026-11-16）**。
- 舊版詳細內容（Prisma schema、ADR、Sprint、訪談 SOP、失敗模式、市調）請看 git 歷史 `9ff8cd8` 的 `PRD/SPEC.md`。

## 附錄 B：舊版 Public Release Mode 原文（逐字保留，供 `tests/test_spec_patch.py` 檢查）

> 以下為 2026-08-08 的歷史內容，其中「Chrome 擴充自動分段」「Speaker 音量偵測」等敘述與程式不符（見 §14 第 7 點），KPI 與價格亦為未驗證假設。與本版衝突時以本版為準。為維持既有測試，本附錄之後不再有其他章節。

## 0.5 ⭐ Public Release Mode (2026-08-08 patch by Sean + Hermes Agent)

### 0.5.1 為什麼加這個 patch

原 v3.0.0 的甜蜜點論證（業務 + 律師付費版）仍然成立，但 release 順序需要倒過來：

- **雅婷逐字稿、Otter、Fireflies 已經佔據會議記錄市場**。新進入者直接打付費版，需要花大量預算教育市場「為什麼要付費給第五家會議記錄工具」。
- **公開版（freemium funnel top）能驗證一件事：繁中使用者是否真的會主動把音檔交給 AI 整理**。這個假設成立，會員制（funnel bottom）就是順水推舟；不成立，至少我們沒浪費預算。
- **公開版不啟用雲端 AI**，成本可控（純本機整理 + Vercel serverless）；個資 / 法務爭議最小。
- **Chrome 擴充的 tabCapture + mic 混音**是公開版的關鍵差異點——雅婷逐字稿沒有擴充，Otter 的擴充只支援 Google Meet（2024 才加）。

這個 patch **不推翻** §1.5 的甜蜜點論證，只把 release 順序倒過來：先驗證流量 → 再做會員制變現。

### 0.5.2 公開版目標（取代原 §1.4 的「試用 → 付費」邏輯）

**任何人免登入即可使用**：
- ✅ 錄音（瀏覽器麥克風，含 consent gate）
- ✅ 上傳音檔（WebM / WAV / MP3 / M4A / OGG，≤ 100 MB）
- ✅ 貼逐字稿（textarea，本機分析）
- ✅ 本機整理（規則式：摘要 / 決策 / 風險 / 行動項含負責人 + 截止日）
- ✅ Markdown 下載
- ✅ Email draft（mailto: 開原生郵件 app）
- ✅ Notion / Slack 按鈕：未授權時提供可複製 Markdown / 訊息
- ✅ 保密模式（legal mode）：純本機，**永遠不外推**
- ✅ 30 筆 localStorage 歷史 + 搜尋 + 編輯
- ✅ Chrome 擴充（網頁版 Google Meet + Zoom Web 的 tabCapture + mic 混音 → WebM）

**公開版不做**（明確 non-goals for v1）：
- ❌ **雲端 STT / LLM**（不啟用 `OPENAI_API_KEY` 路徑，避免成本與個資爭議）
- ❌ **使用者帳號 / 跨裝置同步**（localStorage only）
- ❌ **30 筆以上的歷史**（localStorage 30 筆上限保留）
- ❌ **Notion / Slack / Stripe / Supabase OAuth**（全部延後到 v1.1）
- ❌ **桌面版 Zoom / Teams / Meet app 錄音**（Chrome 權限限制；UI 會寫明「不支援」）
- ❌ **Speaker diarization**（tabCapture 沒有；v1.1 雲端 STT 才做）
- ❌ **自動開始錄音**（一定要 user gesture）

### 0.5.3 會員制 v1.1 預留（不寫 code，僅定義邊界）

當公開版跑出足夠流量（≥ 100 個 active users/月 或 ≥ 10 個「願意付費」訪客），開啟 v1.1：

| 功能 | 公開版 | 會員制 v1.1 |
|---|---|---|
| 本機整理（錄音 / 上傳 / 逐字稿 / 分析 / Markdown）| ✅ | ✅ |
| Email draft / Notion 複製 / Slack 複製 | ✅ | ✅ |
| 保密模式（純本機）| ✅ | ✅ |
| Chrome 擴充（網頁 Meet/Zoom）| ✅ | ✅ |
| **雲端 STT**（OpenAI Whisper 或本地 Whisper.cpp）| ❌ | ✅ 業務/律師版 |
| **LLM 動作項提取**（GPT-4o-mini / Claude Haiku）| ❌ | ✅ 業務/律師版 |
| **跨裝置歷史同步**（Supabase + pgvector）| ❌ | ✅ |
| **Notion OAuth**（一鍵推 action items）| ❌ | ✅ |
| **Slack OAuth**（一鍵 @負責人）| ❌ | ✅ |
| **30 天以上歷史 + 語意搜尋** | ❌ | ✅ |
| **Speaker diarization** | ❌ | ✅ |
| **桌面版 app 錄音**（需 OS 虛擬音訊）| ❌ | 探索 |

### 0.5.4 公開版 KPI（取代原 §1.4 商業 OKR）

**3 個月目標（M0-M2 公開版驗證）**：
- **O1：驗證「繁中使用者願意把音檔交給 MeetingFlow 整理」**
  - KR1：100 個 unique visitors 進入 `/app` 工作台（Vercel Analytics / Plausible）
  - KR2：20 個用戶跑完一次完整分析（從錄音或上傳 → Markdown 下載）
  - KR3：5 個用戶安裝 Chrome 擴充並完成至少 1 次錄音

**6 個月目標（M3-M5 過渡到會員制）**：
- **O2：把公開版流量導到會員制**
  - KR1：500 個 unique visitors / 月
  - KR2：20 個「願意付費」訊號（email 訂閱 / 預約 demo / 加入 waitlist）
  - KR3：NT$15,000 MRR（20×NT$599 + 5×NT$999）

**為什麼用 unique visitors 而不是 MRR 當公開版的 KPI**：公開版不收費，MRR 是 0。KPI 必須反映「有沒有人真的用」，不是「有沒有人付錢」。

### 0.5.5 UI/UX 基準（Otter 雙欄 + 7 個差異點）

**基準**：Otter.ai 的雙欄式（transcript ↔ AI summary）

**為什麼選 Otter**：
- MeetingFlow 的核心結構（左：逐字稿 / 右：AI 摘要 + 行動項）跟 Otter 天然對齊
- Linear / Vercel 風格（深色高密度）適合 power-user 文字工具，跟「錄音 → 整理」的主軸不合
- tl;dv / Fireflies 風格（大色塊 + meeting timeline）適合 SaaS 大企業，跟 MeetingFlow 的「個人工作台」定位不合

**「比 Otter 好且更可看」的 7 個差異點**：

1. **繁中排版**：Noto Sans TC + DM Sans、字距、行高、標點擺放，Otter 對繁中支援差
2. **動作項卡片**：✓ checkbox、負責人 avatar placeholder、截止日 chip、Notion / Slack / Email 各自一個按鈕
3. **保密模式視覺**：legal mode 整頁加淡紅邊框 + 「不外推」徽章
4. **即時狀態機**：錄音中 = 紅點脈動、上傳中 = 進度條、分析中 = skeleton loader、錯誤 = 重試按鈕
5. **空白狀態友善**：沒有歷史時顯示 onboarding（emoji + 文字），不是空白
6. **深色模式**：長時間整理會議護眼
7. **快捷鍵**：`⌘+Enter` 分析、`⌘+S` 存歷史、`⌘+D` 下載 Markdown

### 0.5.6 Chrome 擴充範圍（v1 Public）

**做**：
- ✅ 網頁版 Google Meet（meet.google.com）tabCapture
- ✅ 網頁版 Zoom Web（app.zoom.us/wc）tabCapture
- ✅ 麥克風混音：`getUserMedia` + `tabCapture` → Web Audio API mix → 單一 WebM
- ✅ 會議 URL 偵測 → popup 顯示「偵測到會議，按這裡開始錄」
- ✅ 手動開始 / 停止 + 計時器
- ✅ WebM 下載 + IndexedDB metadata + 「拖進 MeetingFlow 工作台」提示
- ✅ `MediaRecorder.onerror` + stream `track.onended` 清理（popup 不會卡「錄製中」）
- ✅ IndexedDB purge 按鈕（popup 上清楚標示「下載到磁碟的不受影響」）

**不做（UI 寫明「不支援」）**：
- ❌ 桌面版 Zoom / Teams / Meet app（Chrome 權限限制）
- ❌ DRM 內容
- ❌ 企業政策封鎖（寫進 README，讓使用者找 IT 解鎖）
- � 會議「自動開始」錄音（一定要 user gesture）
- ❌ 從擴充端串接 Notion / Slack OAuth（公開版不啟用）

**灰色地帶（做 + 寫限制）**：
- ⚠️ macOS 系統音訊需要「�幕錄影權限」給 Chrome（擴充會引導）
- ⚠️ > 2 小時錄音可能爆 IndexedDB quota（擴充會自動分段 + 提示下載）
- ⚠️ Speaker 標記僅用音量偵測切 Speaker A/B/C（placeholder，diarization 需要雲端 STT）

### 0.5.7 部署

**Vercel Git Integration（零 token）**：
1. 使用者去 https://vercel.com/new Import `openclawsean024-create/meeting-recorder`
2. Framework Preset 留 "Other"（vercel.json 已寫好）
3. 環境變數留空（公開版不需要 `OPENAI_API_KEY` 等）
4. Deploy → 拿到 *.vercel.app URL
5. 之後 Hermes commit + push，Vercel 自動部署

**不做的事**：
- ❌ 不請使用者把 token 貼到對話
- ❌ 不裝 vercel CLI 或設 VERCEL_TOKEN
- ❌ 不在沒有使用者明確同意下 `git push`

---
