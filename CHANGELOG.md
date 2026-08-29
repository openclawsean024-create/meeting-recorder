# Changelog

> 主要版本紀錄。細部 patch 請見 `BUILD_REPORT.md` 與 git history。

## v1.0.0 — Public Release（2026-08-08）

**第一個公開版本。** 任何人免登入即可使用完整工作台：

- ✅ 麥克風錄音（含 consent gate）
- ✅ 音檔拖放 / 上傳（WebM / WAV / MP3 / M4A / OGG，≤ 100 MB）
- ✅ 貼逐字稿 → 本機規則分析（摘要 / 決策 / 風險 / 行動項）
- ✅ Markdown 下載、Email 草稿、Notion / Slack 複製降級
- ✅ 保密模式（legal mode）：純本機，永遠不外推
- ✅ 30 筆 localStorage 歷史 + 全文搜尋
- ✅ Chrome MV3 擴充（網頁 Meet / Zoom Web tabCapture + mic 混音）

會員制（雲端 STT / 跨裝置同步 / Notion OAuth / Speaker diarization 等）明確延後到 v1.1。

## v1.0.1 — Hardening patch（2026-08-29）

不破壞性 patch，把公開版推向「production-ready」：

### 修正
- **`_infer_assignee` 規則越界**：原本的 `[\u4e00-\u9fffA-Za-z0-9-]{0,15}?` lazy 匹配會一路吃中文直到遇到句號，
  例如 `請小美下週三前完成報價` → 指派給 `小美下週三前完成報價`（整句被吃進去）。改用 `_ASSIGNEE_STOP_CHARS`
  stop-word list（常見動詞 + 標點）並把上限收緊到 8 chars，避免把任務描述誤判為負責人。

- **`_infer_due` 把過期 ISO / M/D 當成未來截止日**：
  - `2026-08-20` 在 2026-08-29 解析時會回傳 `2026-08-20`（昨天），使用者會誤以為截止日是未來。
  - `8/8` 同樣問題。
  - 改為：若 candidate < today → roll forward to next year。`Feb 29` 落到非閏年則回傳 `None`。

- **`_unique` 對長字串 dedup 失效**：原本用 `clean[:300]` 比較 `result` 的元素，導致 1000-char 與 1000-char
  視為相異而重複入列。改為先 truncate 再 dedup，兩個長度相同的字串才會被視為重複。

- **`_rate_limits` dict 無界成長**：長時間運行的 process 在 client IP 高熵（e.g. 多 NAT / 行動網路）下會無限累積。
  `PUBLIC_TRANSCRIBE_WINDOW_SECONDS` 雖然會 evict bucket，但過期的 key 不會從 dict 移除。改用 deque + 自動 GC
  （測試覆蓋 `test_rate_limit_dict_does_not_grow_unbounded_under_churn`）。

### 新增
- **`tests/test_edge_cases.py`**：18 條 edge case tests（sentence split、dedup、assignee heuristic、due date、
  analyze integration、rate limit cleanup、HTTP smoke）。
- **`.github/workflows/test.yml`**：PR / push 自動跑 `pytest` + `compileall` + `node --check extension/*.js`
  + 檢查 manifest.json / vercel.json 是合法 JSON + 掃 leaked secrets + 警告 TODO/FIXME。
- **`CHANGELOG.md`**（本檔）。

### 不變
- 沒有 push / PR / deploy（Vercel deploy workflow 仍由 `master` push 觸發）
- 沒有改 `PRD/SPEC.md` 的 scope 章節（§0.5 Public Release Patch 維持原樣）
- 沒有引入新 dependency
- 既有 47 條測試 + 新 18 條 = **65 條全部 pass**