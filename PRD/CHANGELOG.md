# Changelog

> 主要版本紀錄。細部 patch 請見 `BUILD_REPORT.md` 與 git history。

## v3.0.2 — SPEC entry-level 整理 + GHA workflow 升級（2026-09-06 by Sean 10-repo-fleet Worker）

對齊 SPEC v3.0 契約（§1–§19 全部套用），把 1328 行詳版收斂成「入口 + 附錄」結構：

### 加入
- **`PRD/SPEC.md` v3.0.2 入口層（§1–§9 + 附錄 A）**：約 200 行，9 章節結構對齊其他 8 個 repo
  - §1 產品概述（問題陳述 / persona / 價值主張 / Non-Goals）
  - §2 使用者場景與流程（6 個主要場景 + mermaid 流程圖）
  - §3 功能需求（16 個 FR，P0/P1/P2 三層）
  - §4 Non-Functional Requirements
  - §5 技術架構（含 module map + env vars + 降級策略）
  - §6 Definition of Done
  - §7 部署契約
  - §8 Out of Scope
  - §9 變更日誌（本檔連結）
  - 附錄 A：v3.0.0 詳版索引（行數對照表）
- **`PRD/CHANGELOG.md` v3.0.2 條目**（本檔）

### 保留不動
- **`PRD/SPEC.md` v3.0.0 + v3.0.0-Public Patch 1328 行** — 詳版內容以同檔延伸方式保留，附錄 A 給索引
- **既有 `app.py` / `api/public.py`** — FastAPI 入口，無需改 production code
- **既有 5 個測試檔**（`tests/test_app.py`, `test_edge_cases.py`, `test_extension.py`, `test_spec_patch.py`, `test_ui.py`）— pytest 涵蓋 app / API / edge / extension / spec / UI
- **既有 `vercel.json`** — Vercel Python + static 雙 build
- **既有 `.github/workflows/test.yml`** — 4 jobs CI（test / compileall / node check / manifest 驗證）
- **既有 `.github/workflows/deploy.yml`** — Vercel deploy（需 secrets）
- **既有 `extension/`** — Chrome MV3 擴充 5 檔
- **既有 `BUILD_REPORT.md`** — patch 細節

### 升級動作
- 補：v3.0.2 入口 SPEC.md（200 行）
- 補：v3.0.2 CHANGELOG.md
- 補：`.github/workflows/ci.yml`（4-job 全套 Python + Node 檢查）
- 維持：v3.0.0 + v3.0.0-Public Patch 1328 行詳版（同檔延伸保留）

---

## v3.0.0 — Sweet-Spot-Driven Rewrite + v3.0.0-Public Patch（2026-08-08 by Sean + Hermes Agent）

> 完整內容見 `PRD/SPEC.md` §0–§15（1328 行詳版）

**Sweet Spot Score：5/10**（業務 + 律師雙甜蜜點，本版重寫聚焦「會議後動作項自動化」）

### v3.0.0 變更

- 收斂 persona：5 個 → **2 個**（業務 + 律師）
- 收斂功能：8 個 → **3 個**（錄音 + 轉逐字稿 + 會議後動作項）
- 變現：3 種 → **業務版 + 律師版 + 企業版**
- 競品：vs 5 家 → **vs 雅婷 + Otter + Fireflies + Zoom**
- 技術：Web + mobile → **Chrome 擴充 + Web App**
- 里程碑：4 sprint → **5 個 milestone 含 Pilot 驗證**

### v3.0.0-Public Patch（2026-08-08）

倒轉 release 順序：**先做公開版驗證流量 → 再做會員制變現**：

- 任何人免登入即可使用完整工作台
- 雲端 STT 預設不啟用（`PUBLIC_TRANSCRIBE_ENABLED=false`）
- 保密模式永遠不外推
- Chrome MV3 擴充：tabCapture + service worker + offscreen document
- 30 筆 localStorage 歷史 + 全文搜尋

---

## v1.0.1 — Hardening patch（2026-08-29 by Sean + Hermes Agent）

不破壞性 patch，把公開版推向「production-ready」：

### 修正
- **`_infer_assignee` 規則越界**：原本的 `[\u4e00-\u9fffA-Za-z0-9-]{0,15}?` lazy 匹配會一路吃中文直到遇到句號，
  例如 `請小美下週三前完成報價` → 指派給 `小美下週三前完成報價`（整句被吃進去）。改用 `_ASSIGNEE_STOP_CHARS`
  stop-word list（常見動詞 + 標點）並把上限收緊到 8 chars，避免把任務描述誤判為負責人。

- **`_infer_due` 把過期 ISO / M/D 當成未來截止日**：
  - `2026-08-20` 在 2026-08-29 解析時會回傳 `2026-08-20`（昨天），使用者會誤以為截止日是未來。
  - `8/8` 同樣問題。
  - 修正後：解析出來的日期若早於 today，fallback 到 next-week 同星期。

- **`_infer_due` 對 1-2 位數年份容錯**：`26-08-20` / `2026/8/20` / `08-20` 都能正確解析。
- **保密模式可被繞過**：原本在「已派給外部 AI」分支會 return `True`，但 `ai_suggested` 仍可被前端讀取。改為保密模式一律 skip 所有 AI 路徑。

### 加強
- **測試覆蓋**：新增 `test_edge_cases.py` 涵蓋 12 個邊界（bad assignee / past due / leakage / format error / 100 MB 限制等）。
- **`/api/transcribe` 速率限制**：加 IP-based token bucket，每 IP 每小時最多 3 次。
- **Security headers**：補 `X-Content-Type-Options: nosniff` + `X-Frame-Options: DENY` + `Strict-Transport-Security`。

### 文件
- **README 加上「外部服務限制」** 一節，明列 Notion / Slack / Email / 法務邊界。
- **BUILD_REPORT.md** 詳列所有 patch 與理由。

---

## v1.0.0 — Public Release（2026-08-08 by Sean + Hermes Agent）

**第一個公開版本。** 任何人免登入即可使用完整工作台：

- ✅ 麥克風錄音（含 consent gate）
- ✅ 音檔拖放 / 上傳（WebM / WAV / MP3 / M4A / OGG，≤ 100 MB）
- ✅ 貼逐字稿 → 本機規則分析（摘要 / 決策 / 風險 / 行動項）
- ✅ Markdown 下載、Email 草稿、Notion / Slack 複製降級
- ✅ 保密模式（legal mode）：純本機，永遠不外推
- ✅ 30 筆 localStorage 歷史 + 全文搜尋
- ✅ Chrome MV3 擴充（網頁 Meet / Zoom Web tabCapture + mic 混音）

會員制（雲端 STT / 跨裝置同步 / Notion OAuth / Speaker diarization 等）明確延後到 v1.1。

---

## v0.x — Pre-Public（2026-05 ~ 2026-08）

內部驗證版，僅給業務 + 律師 Pilot 使用。詳見 git history。
