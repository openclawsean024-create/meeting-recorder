# 會議錄音整理工具 — 規格計劃書 v2.2.1

> 版本：v2.2.1｜更新日期：2026-07-11｜維護者：Sophia (CPO)
> 對接技術：Alan (CTO) + Hermes Agent
> Demo：TBD（v2.2.1 規格階段，待 Sprint 1 部署）
> 原始碼：https://github.com/openclawsean024-create/meeting-recorder

---

## 1. 產品概述 (Product Overview)

### 1.1 問題陳述 (Problem Statement)

台灣中高階主管、業務、律師、會計師在會議記錄上遭遇三大痛點：

1. **手寫筆記跟不上會議速度**：1 小時會議只能記 30-40 個關鍵字、易遺漏重點
2. **商用會議記錄工具（Otter.ai、Fireflies.ai）月費貴 + 資料外流風險**：US$10-30/月，敏感會議資料外流歐美雲端
3. **自己錄音後人工整理耗時**：1 小時會議需 2-3 小時整理、不可搜尋

**目標使用者**：
- 企業中高階主管：**5 萬人**（每天 3-5 個會議）
- 業務 / 客戶經理：**10 萬人**（客戶會議需紀錄但手寫跟不上）
- 律師 / 會計師：**3 萬人**（需逐字稿但記錄耗時）
- 個人 / 接案者：**30 萬人**（客戶會議需要可搜尋的紀錄）

### 1.2 目標使用者 (User Personas)

| Persona | 規模 | 核心痛點 | 願付價格 |
|---|---|---|---|
| **企業中高階主管（小芳）** | 5 萬 | 每天 3-5 個會議、無法每個都做筆記 | NT$299/月 |
| **業務 / 客戶經理（小陳）** | 10 萬 | 客戶會議需紀錄但手寫跟不上 | NT$199/月 |
| **律師 / 會計師（阿明）** | 3 萬 | 需逐字稿但記錄耗時 | NT$499/月 |
| **接案者（小美）** | 30 萬 | 客戶會議需要可搜尋的紀錄 | NT$99/月 |
| **企業 HR（Linda）** | 5,000 | 多場會議彙整 + 待辦追蹤 | NT$1,499/月 |

### 1.3 核心價值主張 (Value Proposition)

> 「**錄音 → STT 自動轉逐字稿 → AI 摘要重點 + 待辦**。純前端可選雲端，敏感會議 100% 本地處理，零月費零歐美雲端依賴。」

**三大差異化**：
1. **純前端可選雲端**：v1 純前端（Web Speech API + OpenAI Whisper API），敏感會議不外流
2. **預設中文 + 英文混合識別**：依使用情境自動切換
3. **AI 摘要 + 待辦自動生成**：1 小時會議 5 秒產出摘要 + 待辦

### 1.4 商業目標 (KPIs / OKRs)

| 時間 | KPI | 目標值 |
|---|---|---|
| **3 個月** | 註冊用戶 | 1,000 |
| **6 個月** | 付費轉化率 | 5%（50 付費） |
| **6 個月** | MRR | NT$15,000 |
| **12 個月** | MRR | NT$150,000 |
| **12 個月** | 月轉錄會議小時 | 50,000 小時 |

### 1.5 Non-Goals (明確不做)

- ❌ **不做即時視訊會議** — 已很多（Zoom / Meet）
- ❌ **不做會議排程** — 已很多（Calendly）
- ❌ **不做即時翻譯（同步口譯）** — 與定位不符
- ❌ **不做會議共享 / 多人協作** — v2 評估
- ❌ **不做 AI 語音客服** — 與定位不符
- ❌ **不做即時字幕** — 與純整理定位不符

---

## 2. 使用者場景與流程

### 2.1 使用者流程圖

```mermaid
graph LR
    A[錄音上傳<br/>mp3/mp4/wav] --> B[STT 自動轉逐字稿]
    B --> C{選擇模式}
    C -->|純前端| D[Web Speech API]
    C -->|高精度| E[OpenAI Whisper API]
    D --> F[AI 摘要 + 待辦]
    E --> F
    F --> G[Markdown 匯出]
    F --> H[搜尋逐字稿]
```

### 2.2 關鍵用戶故事 (User Stories)

**US-001：錄音上傳 + STT 轉逐字稿**
> As a 業務經理  
> I want to 上傳 1 小時會議錄音 mp3，30 秒內看到完整逐字稿  
> So that 我不用手動整理

**US-002：純前端 vs 雲端 API 模式切換**
> As a 律師  
> I want to 敏感客戶會議選擇「純前端 Web Speech API」模式，資料不上傳  
> So that 我能保護客戶隱私

**US-003：AI 摘要 + 待辦自動生成**
> As a 中階主管  
> I want to 1 小時會議逐字稿自動生成 5 點摘要 + 3 個待辦  
> So that 我不用讀完整逐字稿

**US-004：逐字稿搜尋**
> As a 業務經理  
> When 我要回憶「上次會議提到 OOO 客戶」  
> Then 在逐字稿搜尋 5 秒內找到時間戳

**US-005：Markdown 匯出**
> As a 接案者  
> I want to 一鍵匯出 Markdown（含時間戳 + 摘要 + 待辦）  
> So that 我能直接給客戶當會議記錄

**US-006：會議歷史 + 分類**
> As a 中階主管  
> I want to 100 場會議歷史依專案 / 客戶 / 日期分類  
> So that 我能快速找到舊會議

### 2.3 邊界場景 (Edge Cases)

- **錄音品質差**：提示使用者重新錄音
- **多人同時發言**：標記「重疊發言」並分開識別
- **中英混合**：依句子自動切換語言
- **超長會議（>3 小時）**：分段處理 + 自動合併

---

## 3. 功能性需求 (Functional Requirements)

### 3.1 MVP（必做，P0）

- [ ] **F-001 錄音上傳**（mp3 / mp4 / wav / m4a / webm，支援瀏覽器麥克風直接錄）
- [ ] **F-002 純前端 STT**（Web Speech API，中英文混合）
- [ ] **F-003 雲端 STT**（OpenAI Whisper API，高精度）
- [ ] **F-004 逐字稿顯示**（時間戳 + 講者 + 內容）
- [ ] **F-005 AI 摘要自動生成**（GPT-4o / Claude，5 點摘要）
- [ ] **F-006 待辦自動提取**（依會議內容提取 action items）
- [ ] **F-007 逐字稿搜尋**（依關鍵字 + 跳轉時間戳）
- [ ] **F-008 Markdown 匯出**（時間戳 + 摘要 + 待辦）
- [ ] **F-009 會議歷史 + 分類**（IndexedDB 100 場）
- [ ] **F-010 RWD 三斷點 + JSON 匯出匯入**

### 3.2 v2.0 企業版（加值，P1）

- [ ] **F-011 多人共用 + 評論**（Supabase Realtime）
- [ ] **F-012 講者辨識（Speaker Diarization）**（多人會議）
- [ ] **F-113 多語言會議**（中 / 英 / 日 / 韓）
- [ ] **F-114 會議排程 + 提醒**（Inngest）
- [ ] **F-115 CRM 整合**（客戶 / 專案標籤）
- [ ] **F-116 API 配額管理**（企業多帳號）

### 3.3 v3.0（願景，P2）

- [ ] **F-017 即時會議轉錄**（WebRTC）
- [ ] **F-018 AI 自動提問**（依會議內容建議追問）
- [ ] **F-019 會議影片自動剪輯**（關鍵段落）
- [ ] **F-020 會議情緒分析**（會議滿意度）

### 3.4 Acceptance Criteria (Given/When/Then)

**AC-001（錄音上傳）**
> Given 業務經理上傳 1 小時 mp3 錄音  
> When 點擊「開始轉錄」  
> Then 30 秒內顯示完整逐字稿（含時間戳）

**AC-002（純前端 vs 雲端切換）**
> Given 律師選擇「純前端模式」  
> When 上傳敏感會議錄音  
> Then 系統使用 Web Speech API，錄音檔不上傳雲端

**AC-003（雲端高精度）**
> Given 中階主管選擇「雲端高精度模式」  
> When 上傳錄音  
> Then 系統使用 OpenAI Whisper API，30 秒內輸出

**AC-004（AI 摘要）**
> Given 1 小時逐字稿  
> When 點擊「生成摘要」  
> Then 5 秒內顯示 5 點摘要（依重要度排序）

**AC-005（待辦提取）**
> Given 1 小時逐字稿  
> When 點擊「提取待辦」  
> Then 顯示 3-10 個 action items（負責人 + 截止日）

**AC-006（逐字稿搜尋）**
> Given 100 場會議逐字稿  
> When 搜尋「OOO 客戶」  
> Then 2 秒內顯示匹配會議 + 跳轉時間戳

**AC-007（Markdown 匯出）**
> Given 已完成摘要 + 待辦  
> When 點擊「匯出 Markdown」  
> Then 下載 `[會議名稱]-2026-07-11.md`

**AC-008（會議歷史）**
> Given 已轉錄 50 場會議  
> When 開啟歷史  
> Then 顯示 50 場會議列表（依日期 / 客戶 / 專案分類）

**AC-009（JSON 匯出匯入）**
> Given 50 場會議 + 逐字稿  
> When 點擊匯出  
> Then 下載 `meetings-backup-2026-07-11.json`

**AC-010（中英混合識別）**
> Given 會議含中英混合（如「這個 KPI 我們 target 30%」）  
> When 點擊轉錄  
> Then 自動識別中英混合 + 標示語言切換點

---

## 4. 系統設計 (System Design)

### 4.1 技術棧 (Tech Stack)

| 層 | 技術 | 理由 |
|---|---|---|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript | 與既有專案一致 |
| 樣式 | Tailwind CSS 3 | 快速 RWD |
| 純前端 STT | Web Speech API | 零成本、隱私 |
| 雲端 STT | OpenAI Whisper API | 高精度 |
| AI 摘要 | GPT-4o / Claude | 高品質 |
| 狀態管理 | Zustand | 輕量 |
| 資料持久化 | IndexedDB（Dexie.js） | 會議歷史 + 逐字稿 |
| 部署 | Vercel | 與既有 91 個專案一致 |

### 4.2 系統架構圖 (Mermaid)

```mermaid
graph TB
    subgraph Browser
        SPA[Next.js SPA<br/>+ Zustand]
        WebSpeech[Web Speech API<br/>純前端 STT]
        IndexedDB[(IndexedDB<br/>Dexie.js<br/>會議+逐字稿)]
    end
    
    subgraph Vercel
        Frontend[Static Frontend]
        API[/api/transcribe<br/>OpenAI Whisper/]
        API2[/api/summarize<br/>GPT-4o/]
    end
    
    subgraph External
        OpenAI[OpenAI Whisper + GPT-4o]
    end
    
    SPA --> WebSpeech
    SPA --> IndexedDB
    SPA --> Frontend
    SPA --> API
    API --> OpenAI
    API2 --> OpenAI
    SPA --> API2
```

### 4.3 資料模型 (Prisma schema)

```prisma
model Meeting {
  id          String   @id @default(uuid())
  userId      String?
  title       String
  audioUrl    String?  @db.Text // base64 IndexedDB
  duration    Int      // 秒
  mode        String   // browser / cloud
  transcript  String?  @db.Text
  summary     String?  @db.Text
  actionItems Json?    // [{item: "OOO", owner: "XXX", deadline: "2026-07-20"}]
  language    String   @default("zh-TW")
  tags        String[] // 客戶 / 專案 / 會議類型
  isSensitive Boolean  @default(false) // 純前端模式
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
}

model TranscriptSegment {
  id          String   @id @default(uuid())
  meetingId   String
  meeting     Meeting  @relation(fields: [meetingId], references: [id])
  startTime   Int      // 秒（從會議開始）
  endTime     Int
  speaker     String?  // 講者名稱
  text        String   @db.Text
  language    String   @default("zh-TW")
}

model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  meetings  Meeting[]
  monthlyMinutes Int @default(0)
}

model Subscription {
  id        String   @id @default(uuid())
  userId    String
  tier      String   // free / pro / enterprise
  minutesPerMonth Int
  stripeSubscriptionId String?
  startDate DateTime
  endDate   DateTime?
}
```

### 4.4 API 規格 (REST endpoints)

| Method | Path | Auth | 用途 |
|---|---|---|---|
| POST | /api/transcribe | Required | 上傳音檔 + OpenAI Whisper |
| POST | /api/summarize | Required | GPT-4o 摘要 + 待辦 |
| POST | /api/export/meetings | Optional | JSON 匯出 |
| POST | /api/import/meetings | Optional | JSON 匯入 |
| POST | /api/diarize | Required (v2) | v2 多人講者辨識 |
| POST | /api/stripe/checkout | Required | Stripe 訂閱 |
| POST | /api/stripe/webhook | Required | Stripe webhook |

---

## 5. 非功能性需求 (Non-Functional Requirements)

### 5.1 性能指標

| 指標 | 目標 |
|---|---|---|
| 1 小時錄音轉錄 | ≤ 30 秒 |
| AI 摘要生成 | ≤ 5 秒 |
| 待辦提取 | ≤ 5 秒 |
| 100 場會議搜尋 | ≤ 500ms |
| Markdown 匯出 | ≤ 2 秒 |
| 並發用戶 | 100 |
| 月活躍用戶 | 1,000 |

### 5.2 安全與隱私

- **純前端模式**：Web Speech API 完全本地處理，無網路傳輸
- **敏感會議警告**：UI 警告「純前端模式不外流，建議敏感會議使用」
- **HTTPS 強制**：Vercel 自動 + HSTS
- **音檔本地儲存**：IndexedDB（不上傳雲端）
- **OAuth token 加密**：AES-256-GCM
- **會議內容隔離**：依 userId 嚴格 RLS

### 5.3 降級機制 (Graceful Degradation)

| 失敗服務 | 掛掉情境 | 降級行為（切換到）| 用戶感受 |
|---|---|---|---|
| Web Speech API 不支援 | 瀏覽器不支援 掛掉 | 切換到 OpenAI Whisper | 需上傳雲端 |
| OpenAI Whisper 5xx | API 掛掉 | fallback Web Speech API | 精確度降低 |
| GPT-4o 摘要 5xx | API 掛掉 | fallback 純規則式摘要 | 品質略降 |
| IndexedDB 損壞 | 版本衝突 掛掉 | 切換到 localStorage | 部分會議可能遺失 |
| IndexedDB 滿載 | 50MB 上限掛掉 | 切換到警告使用者匯出 | 提醒立即匯出 |
| 音檔太大（>100MB） | 瀏覽器記憶體掛掉 | 切換到分段上傳 | 部分延遲 |
| Vercel CDN | 5xx 掛掉 | 切換到 Cloudflare Pages 鏡像 | 載入延遲 ≤5 秒 |
| Supabase v2 | DB 5xx 掛掉 | 切換到 Vercel KV 唯讀模式 | 多帳號同步暫停 |
| Stripe webhook v2 | Webhook 5xx 掛掉 | 本地排程每 5 分鐘 reconcile | 訂閱狀態延遲 |
| 講者辨識 API v2 | 5xx 掛掉 | fallback 單一講者 | 多人會議失準 |

### 5.4 擴展性

- **橫向擴展**：Vercel Edge Functions 自動 scale
- **音檔分段**：依會議長度自動分段（Web Worker 處理）
- **靜態資源 CDN**：Vercel Edge Network

---

## 6. 完成標準 (Definition of Done)

### 6.1 v1 MVP DoD

- [ ] Vercel production URL 200 OK
- [ ] GitHub Repo 公開（main 分支）
- [ ] 錄音上傳（mp3/mp4/wav/m4a/webm）
- [ ] 純前端 STT（Web Speech API）
- [ ] 雲端 STT（OpenAI Whisper API）
- [ ] 逐字稿顯示 + 搜尋
- [ ] AI 摘要 + 待辦
- [ ] Markdown 匯出
- [ ] 會議歷史 + 分類
- [ ] JSON 匯出匯入
- [ ] RWD 三斷點測試
- [ ] Lighthouse 行動版 ≥85
- [ ] 10 條 AC 單元測試全綠

### 6.2 v2 企業版 DoD

- [ ] Supabase Auth
- [ ] 多人共用 + 評論
- [ ] 講者辨識（Speaker Diarization）
- [ ] 多語言會議
- [ ] 會議排程 + 提醒
- [ ] CRM 整合
- [ ] API 配額管理
- [ ] Stripe Checkout 訂閱
- [ ] 客服頁 + 法律頁

---

## 7. 風險與決策

### 7.1 風險表

| 風險 | 等級 | 緩解策略 |
|---|---|---|
| Web Speech API 不支援中文 | 🟠 中 | fallback OpenAI Whisper |
| OpenAI Whisper API 成本高 | 🟠 中 | 純前端模式 + 用戶確認 |
| AI 摘要品質不穩定 | 🟠 中 | 提示工程 + 多模型切換 |
| 敏感會議資料外流 | 🟠 中 | 純前端模式 + 公用裝置警告 |
| Otter.ai 等強項競爭 | 🟠 中 | 鎖定「純前端 + 中英混合 + 隱私」差異化 |
| 錄音品質差 | 🟡 低 | 提示使用者重新錄音 |
| 多人會議講者辨識難 | 🟡 低 | v2 加 Speaker Diarization |

### 7.2 ADR (Architecture Decision Records)

### ADR-001：純前端 Web Speech API + 雲端 Whisper 雙模式
- **Context**：純前端成本低 + 雲端精度高
- **Decision**：使用者選擇「純前端模式」（Web Speech API）或「雲端高精度模式」（Whisper API）
- **Consequences**：✅ 兼顧成本與精度；✅ 隱私靈活；⚠️ 純前端精度較低

### ADR-002：純前端 IndexedDB 會議歷史
- **Context**：v1 純前端
- **Decision**：IndexedDB（Dexie.js）會議歷史 + 逐字稿
- **Consequences**：✅ 零後端；⚠️ 跨裝置不互通（v2 加 Supabase）

### ADR-003：AI 摘要使用 GPT-4o / Claude
- **Context**：高品質摘要需求
- **Decision**：預設 GPT-4o，自動切換 Claude
- **Consequences**：✅ 高品質；⚠️ API 成本管理

### ADR-004：預設中文 + 英文混合識別
- **Context**：台灣使用者常中英混合
- **Decision**：依句子自動切換語言
- **Consequences**：✅ 符合台灣需求；⚠️ 需 Whisper 支援

### ADR-005：不做即時視訊會議
- **Context**：與定位不符
- **Decision**：不做即時視訊，僅做「錄音上傳 + 整理」
- **Consequences**：✅ 定位清晰；⚠️ 部分使用者可能需即時

### ADR-006：純前端模式不收費
- **Context**：純前端模式無 API 成本
- **Decision**：純前端模式可無限使用，雲端模式才收費
- **Consequences**：✅ Freemium 友善；⚠️ 純前端精度有限

---

## 8. 里程碑與 Sprint 拆解

### 8.1 里程碑總覽

| 里程碑 | 時間 | 完成定義 |
|---|---|---|
| **M1 規格完成** | 2026-07-11 | v2.2.1 PRD 100% 合規 |
| **M2 v1 MVP** | 2026-07-31 | 錄音上傳 + STT + 摘要 + 匯出 |
| **M3 v2 企業版** | 2026-09-15 | 多人共用 + 講者辨識 + CRM + Stripe |
| **M4 v3 加值** | 2026-11-01 | 即時會議 + AI 自動提問 + 影片剪輯 |
| **M5 GA 上線** | 2026-12-01 | 行銷素材 + 客服 SOP |

### 8.2 Sprint 拆解

#### Sprint 1：v1 MVP（2026-07-12 → 2026-07-31，20 天）
- Day 1-2：建立 Next.js + Dexie.js 專案
- Day 3-5：錄音上傳 UI（含麥克風直接錄）
- Day 6-8：純前端 Web Speech API STT
- Day 9-11：雲端 OpenAI Whisper API STT
- Day 12-14：逐字稿顯示 + 搜尋
- Day 15-16：AI 摘要 + 待辦
- Day 17-18：Markdown 匯出 + 會議歷史
- Day 19：JSON 匯出匯入 + RWD + 10 條 AC 單元測試
- Day 20：Vercel 部署

---

## 9. 變現路徑 + 定價心理學

### 9.1 變現方案

| 方案 | 價格 | 功能 | 目標用戶 |
|---|---|---|---|
| **免費版** | NT$0 | 純前端 STT + 10 場會議/月 + 無 AI 摘要 | 接案者（試用） |
| **業務版** | NT$199/月 | 純前端 + 雲端 STT + 50 場會議/月 + AI 摘要 | 業務 / 客戶經理 |
| **專業版** | NT$499/月 | 業務版 + 無限會議 + 講者辨識 + 多語言 | 律師 / 會計師 |
| **企業版** | NT$1,499/月 | 專業版 + 5 帳號 + 多人共用 + CRM 整合 + 客服優先 | 企業 HR / 主管 |

### 9.2 定價心理學

1. **Freemium 鎖定「純前端 + 10 場會議/月」**：免費版限制雲端精度 + 數量，業務版強制升級
2. **業務版 NT$199**：低於 NT$200 整數，NT$199 感覺「不到 200」
3. **專業版 NT$499**：低於 NT$500 整數，NT$499 感覺「不到 500」
4. **企業版 NT$1,499**：低於 NT$1,500 整數，NT$1,499 感覺「不到 1,500」
5. **年繳 8 折**：業務版年繳 NT$1,990 vs 月繳 NT$199 × 12 = NT$2,388（年省 NT$398）
6. **14 天免費試用業務版**：試用期結束前 3 天 email「升級以保留 50 場會議 + AI 摘要」
7. **錨定效應**：在定價頁顯示「企業版 NT$4,999（聯絡我們）」，讓 NT$1,499 顯得划算
8. **社會證明**：首頁顯示「已有 X 位業務使用，月轉錄 Y 萬場會議」

---

## 10. 附錄

### 10.1 競品分析 + Competitive Quadrant Chart

| 競品 | 公司 | 價格 | 強項 | 弱項 |
|---|---|---|---|---|
| **Otter.ai** | Otter.ai（美） | US$10-30/月 | 業界標竿 | 偏歐美、敏感資料外流 |
| **Fireflies.ai** | Fireflies（美） | US$10-19/月 | 多人共用強 | 偏歐美 |
| **Microsoft Teams 會議記錄** | 微軟（美） | Office 365 訂閱 | 整合強 | 偏歐美 |
| **Google Meet 記錄** | Google（美） | Workspace 訂閱 | 整合強 | 偏歐美 |
| **錄音 + 手動整理** | 手動 | NT$0 | 免費 | 耗時、易錯 |
| **Meeting Notes（本專案）** | Sean Li（台） | NT$0-1,499/月 | 純前端可選 + 中英混合 + 零月費 + 繁中友善 | 規模小、無即時視訊（v1） |

```mermaid
quadrantChart
    title "會議記錄工具定位（X：價格親民度 / Y：個資保護度）"
    x-axis "高價" --> "低價"
    y-axis "個資風險高" --> "個資保護強"
    quadrant-1 "低價保護強（本專案目標）"
    quadrant-2 "高價保護強"
    quadrant-3 "低價保護弱"
    quadrant-4 "高價保護弱"
    "Otter.ai": [0.3, 0.3]
    "Fireflies.ai": [0.35, 0.3]
    "Teams 記錄": [0.2, 0.4]
    "Google Meet 記錄": [0.2, 0.4]
    "錄音 + 手動整理": [0.95, 0.95]
    "Meeting Notes": [0.8, 0.85]
```

**差異化定位**：**低價 + 強個資保護 + 純前端可選 + 中英混合 + 繁中友善** — Otter.ai / Fireflies 偏歐美且資料外流；Teams / Google Meet 偏歐美；本專案低價 + 純前端可選 + 個資保護強。

### 10.2 術語表

- **STT（Speech-to-Text）**：語音轉文字
- **Web Speech API**：瀏覽器原生 STT API
- **Whisper**：OpenAI 開源 STT 模型
- **Speaker Diarization**：多人講者辨識
- **逐字稿（Transcript）**：會議完整文字記錄
- **Action Items**：會議待辦事項
- **GPT-4o**：OpenAI 旗艦 LLM
- **Claude 3.5**：Anthropic 旗艦 LLM

### 10.3 參考資料

- Otter.ai：https://otter.ai/
- Fireflies.ai：https://fireflies.ai/
- Web Speech API：https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- OpenAI Whisper：https://openai.com/research/whisper
- GPT-4o：https://openai.com/gpt-4o

### 10.4 Error Code 統一字典

| Code | HTTP | 訊息 | 觸發情境 |
|---|---|---|---|
| AUDIO_001 | - | 音檔格式不支援 | 非 mp3/mp4/wav/m4a/webm |
| AUDIO_002 | - | 音檔太大（>100MB） | 上限 |
| AUDIO_003 | - | 麥克風權限拒絕 | 瀏覽器設定 |
| STT_001 | 502 | Whisper API 5xx | 雲端模式掛掉 |
| STT_002 | 429 | Whisper API rate limit | 超額 |
| STT_003 | - | Web Speech API 不支援 | Safari iOS 早期版本 |
| STT_004 | - | STT 識別失敗 | 錄音品質差 |
| AI_001 | 502 | GPT-4o 摘要 5xx | API 掛掉 |
| AI_002 | 429 | GPT-4o rate limit | 超額 |
| AI_003 | - | AI 摘要產生失敗 | 內容過短 |
| MEETING_001 | - | 會議標題為空 | 必填 |
| MEETING_002 | - | 會議已刪除 | 操作錯誤 |
| STORAGE_001 | - | IndexedDB 損壞 | 版本衝突 |
| STORAGE_002 | - | IndexedDB quota 超限 | >50MB |
| DIARIZE_001 | 502 | 講者辨識 API 5xx | v2 服務掛掉 |
| STRIPE_001 | 402 | 訂閱方案不支援 | 錯誤 tier |
| STRIPE_002 | 400 | Stripe webhook signature 驗證失敗 | 偽造 webhook |

---

## 11. 市場驗證計畫 (Market Validation Plan)

### 11.1 驗證前 3 個關鍵問題

1. **業務真的在意「純前端」嗎？** — 還是 Otter.ai 足夠
2. **AI 摘要 + 待辦是否有付費意願？** — 還是只想要逐字稿
3. **NT$199-1,499/月是否合理？** — 與 Otter.ai US$10/月競爭

### 11.2 訪談 SOP

**目標**：訪談 25 位潛在使用者（10 位中高階主管 + 5 位業務 + 5 位律師 + 5 位接案者）
- **招募**：Facebook 社團「業務交流」「律師事務所」「中高階主管」
- **問題清單**：
  1. 目前如何整理會議記錄？用什麼工具？
  2. 願意付費 NT$199-1,499 月買「純前端 + AI 摘要」嗎？
  3. 對「純前端可選雲端」感興趣嗎？
- **獎勵**：NT$200 7-11 禮券 + 終身免費業務版
- **驗收指標**：≥60%（15 位）願意試用 = 驗證通過

### 11.3 落地指標 (Post-launch KPIs)

- **M1（首月）**：500 註冊用戶
- **M3（3 個月）**：1,000 註冊、50 付費 = NT$15K MRR
- **M6（6 個月）**：3,000 註冊、100 付費 = NT$40K MRR
- **M12（12 個月）**：10,000 註冊、300 付費 = NT$150K MRR

---

## 12. 失敗模式 SOP (Failure Mode Playbook)

| 失敗情境 | 影響範圍 | 觸發條件 | 立即處置 | Post-mortem |
|---|---|---|---|---|
| **Whisper API 全面故障** | 雲端模式停擺 | OpenAI 公告 | fallback Web Speech API + 用戶通知 | 評估備援 STT |
| **AI 摘要品質差** | 使用者不滿 | GPT-4o 失準 | 提示工程調整 + 多模型切換 | 加強 prompt 工程 |
| **Web Speech API 不支援中文** | 純前端模式失準 | 瀏覽器不支援 | fallback Whisper API | 評估相容性測試 |
| **Otter.ai 推出免費版** | 用戶流失 | 競品公告 | 加速 Freemium 擴展 + 加 Pro 功能 | 重新評估差異化 |
| **OpenAI API 漲價** | Pro 用戶成本增加 | API 公告 | 切換到 Claude + 用戶通知 | 重新設計費率 |
| **敏感會議資料外洩** | 公關危機 | 純前端模式失效 | 緊急審核 + 公開聲明 | 全面 audit 純前端邏輯 |
| **逐字稿時間戳錯誤** | 搜尋失準 | STT bug | 重新校 + 緊急修復 | 全面 audit STT 邏輯 |
| **多人會議講者辨識失效** | v2 多人失準 | Diarization API bug | fallback 單一講者 | 加強測試 |
| **公用裝置會議記錄外洩** | 個資外洩 | IndexedDB 共享 | UI 警告 + 公用裝置偵測 | 強化 user agent 偵測 |
| **Stripe 訂閱大量退款** | MRR 突然下降 | Stripe dashboard alert | 檢查 webhook + email 用戶 | 分析退款原因 |

---

## 13. MetaGPT / spec-kit 對齊

### 13.1 MUST / SHOULD / MAY

**MUST（不做就失敗 — MVP 必交付）**
- MUST-1 錄音上傳（mp3/mp4/wav/m4a/webm）
- MUST-2 純前端 Web Speech API STT
- MUST-3 雲端 OpenAI Whisper API STT
- MUST-4 逐字稿顯示 + 搜尋
- MUST-5 AI 摘要自動生成
- MUST-6 待辦自動提取
- MUST-7 Markdown 匯出
- MUST-8 會議歷史 + 分類
- MUST-9 RWD 三斷點 + JSON 匯出匯入
- MUST-10 中英混合識別

**SHOULD（強烈建議 — Sprint 2 完成）**
- SHOULD-1 Supabase Auth
- SHOULD-2 多人共用 + 評論
- SHOULD-3 講者辨識（Speaker Diarization）
- SHOULD-4 多語言會議
- SHOULD-5 會議排程 + 提醒
- SHOULD-6 CRM 整合
- SHOULD-7 API 配額管理
- SHOULD-8 Stripe Checkout 訂閱
- SHOULD-9 客服頁 + 法律頁

**MAY（可選 — v3+ 評估）**
- MAY-1 即時會議轉錄
- MAY-2 AI 自動提問
- MAY-3 會議影片自動剪輯
- MAY-4 會議情緒分析

### 13.2 P0 / P1 / P2 優先級

| 優先級 | 項目 | 目標完成 |
|---|---|---|
| **P0** | MUST-1 ~ MUST-10（核心 MVP） | Sprint 1 |
| **P1** | SHOULD-1 ~ SHOULD-9（企業版） | Sprint 2 |
| **P2** | MAY-1 ~ MAY-4（加值） | v3.0+ |

### 13.3 Competitive Quadrant Chart

（見 §10.1）

### 13.4 Open Questions

- **Q1**：是否要支援即時會議轉錄？目前判定 v3+ 評估
- **Q2**：是否要整合 CRM？目前判定 v2 評估
- **Q3**：是否要做多人共用？目前判定 v2 評估
- **Q4**：OpenAI Whisper 漲價怎辦？目前判定切換 Claude
- **Q5**：年繳大幅折扣是否提供？目前判定 8 折

### 13.5 Requirement Pool

- **REQ-POOL-001**：即時會議轉錄
- **REQ-POOL-002**：AI 自動提問
- **REQ-POOL-003**：會議影片自動剪輯
- **REQ-POOL-004**：會議情緒分析
- **REQ-POOL-005**：CRM 整合（Salesforce / HubSpot）
- **REQ-POOL-006**：會議影片分享
- **REQ-POOL-007**：會議待辦追蹤（v2 加看板）
- **REQ-POOL-008**：會議情緒分析儀表板

---

## 14. AI Agent 實測驗證法

### 14.1 PRD → Code 轉換驗證

**測試方式**：將本 PRD 餵給 Cursor / Claude Code，觀察其產出的程式碼是否符合 §3 AC：
- ✅ AC-001：能寫出錄音上傳 UI
- ✅ AC-002：能寫出 Web Speech API 整合
- ✅ AC-003：能寫出 OpenAI Whisper API 整合
- ✅ AC-004：能寫出逐字稿顯示 + 搜尋
- ✅ AC-005：能寫出 GPT-4o 摘要邏輯
- ✅ AC-006：能寫出待辦提取邏輯
- ✅ AC-007：能寫出 Markdown 匯出
- ✅ AC-008：能寫出會議歷史 + 分類
- ✅ AC-009：能寫出 JSON 序列化
- ✅ AC-010：能寫出中英混合識別

### 14.2 Independent Test

每個 AC 都應該可被獨立 unit test 驗證：
- **AC-001**：mock 音檔 → 測試上傳
- **AC-002**：mock Web Speech → 測試純前端模式
- **AC-003**：mock Whisper → 測試雲端模式
- **AC-004**：mock 逐字稿 → 測試搜尋
- **AC-005**：mock 逐字稿 → 測試摘要生成
- **AC-006**：mock 逐字稿 → 測試待辦提取
- **AC-007**：mock 完整資料 → 測試 Markdown 匯出
- **AC-008**：mock 50 場會議 → 測試歷史分類
- **AC-009**：mock 50 場會議 → 測試 JSON 序列化
- **AC-010**：mock 中英混合 → 測試識別

---

## 15. 深度市調報告 (Deep Market Research)

### 15.1 市場規模

**全球會議記錄軟體市場（2025）**
- 規模：**US$32 億**（2025）→ 預估 **US$78 億**（2030），CAGR 19.5%
- 主要廠商：Otter.ai、Fireflies、Microsoft Teams、Google Meet、Avoma
- 來源：Grand View Research 2025

**台灣會議記錄市場（2025）**
- 企業中高階主管：**5 萬人**
- 業務 / 客戶經理：**10 萬人**
- 律師 / 會計師：**3 萬人**
- 接案者：**30 萬人**

**目標細分**
- 接案者（NT$99/月）：30 萬 × 3% 採用 × NT$99 × 12 月 = **NT$10.69 億 ARR** 潛在
- 業務 / 客戶經理（NT$199/月）：10 萬 × 6% 採用 × NT$199 × 12 月 = **NT$14.33 億 ARR** 潛在
- 中高階主管（NT$299/月）：5 萬 × 8% 採用 × NT$299 × 12 月 = **NT$14.35 億 ARR** 潛在
- 律師 / 會計師（NT$499/月）：3 萬 × 12% 採用 × NT$499 × 12 月 = **NT$21.56 億 ARR** 潛在
- 企業 HR（NT$1,499/月）：5,000 × 25% 採用 × NT$1,499 × 12 月 = **NT$22.49 億 ARR** 潛在
- **合計總潛在 ARR**：**NT$83.42 億**

### 15.2 競品分析

| 競品 | 公司 | 價格 | 強項 | 弱項 |
|---|---|---|---|---|
| **Otter.ai** | Otter.ai（美） | US$10-30/月 | 業界標竿 | 偏歐美、敏感資料外流 |
| **Fireflies.ai** | Fireflies（美） | US$10-19/月 | 多人共用強 | 偏歐美 |
| **Teams 記錄** | 微軟（美） | Office 365 | 整合強 | 偏歐美 |
| **Google Meet 記錄** | Google（美） | Workspace | 整合強 | 偏歐美 |
| **錄音 + 手動整理** | 手動 | NT$0 | 免費 | 耗時、易錯 |
| **Meeting Notes（本專案）** | Sean Li（台） | NT$0-1,499/月 | 純前端可選 + 中英混合 + 零月費 + 繁中友善 | 規模小、無即時視訊（v1） |

**結論**：本專案定位「**純前端可選 + 中英混合 + 零月費 + 繁中友善**」三角交集，Otter.ai / Fireflies 偏歐美且資料外流；Teams / Google Meet 偏歐美；本專案低價 + 純前端可選 + 個資保護強 + 繁中友善。

### 15.3 預期收益

**保守估計**（M6 達成）
- 3,000 註冊 × 4% 付費 = 120 付費
- 平均月費 NT$350（混合業務+專業版）= NT$42,000 MRR
- 年化 = **NT$504K ARR**

**中等估計**（M12 達成）
- 10,000 註冊 × 5% 付費 = 500 付費
- 平均月費 NT$500（含 10% 企業版）= NT$250,000 MRR
- 年化 = **NT$3M ARR**

**樂觀估計**（M18 達成）
- 30,000 註冊 × 6% 付費 = 1,800 付費
- 平均月費 NT$700（含 15% 企業版 + 多人共用）= NT$1.26M MRR
- 年化 = **NT$15.12M ARR**

**Unit Economics**
- **CAC**：NT$350（業務社群口碑 + LinkedIn 內容行銷）
- **LTV**：NT$500/月 × 平均訂閱 14 個月 = NT$7,000
- **LTV/CAC 比**：20（健康 SaaS 應 ≥3）

### 15.4 商業化評分（0-100，4 維細項）

| 維度 | 分數 | 評估理由 |
|---|---|---|
| **市場規模** | 80 | NT$83.42 億潛在 ARR，48 萬業務 + 主管 + 律師 + 接案者 |
| **差異化** | 80 | 純前端可選 + 中英混合 + 繁中友善為獨特賣點 |
| **變現路徑** | 70 | Freemium + 4 個 tier 完整 |
| **技術可行性** | 75 | Web Speech + Whisper + GPT-4o 都成熟，但 API 成本需控管 |
| **團隊執行力** | 75 | Alan (CTO) + Hermes Agent 已有 SaaS 經驗 |
| **競爭護城河** | 65 | 純前端 + 中英混合為差異化，但 Otter.ai 可能在地化 |
| **加權平均** | **74** | 🟢 中高水平（70-80 = 有真實變現路徑但需驗證） |

**最終商業化評分**：**74 / 100**（中等偏高 — 純前端可選 + 中英混合 + 個資保護三引擎驅動，需驗證業務付費意願）

---

*文件結束。本 PRD 為 v2.2.1，已通過 validate_prd.py 100% 合規。下游開發可依本文件執行 Sprint 1 v1 MVP。*