# MeetingFlow

繁中會議錄音、逐字稿與「會後行動項」工作台。這個版本優先完成**所有人可使用、不需登入**的公開產品流程，會員制與付款留待後續版本。

## 已完成

- 公開響應式網站：麥克風錄音、音檔拖放、錄音同意、繁中逐字稿編輯
- 逐字稿本機規則分析：300 字內摘要、決策、風險、行動項、負責人與日期推斷
- 律師保密模式與案件標籤；保密模式不自動外推
- Markdown、剪貼簿、Email 草稿、Notion / Slack 未授權降級
- 本機會議歷史、搜尋與重新載入
- `OPENAI_API_KEY`：選配。只有同時設定 `PUBLIC_TRANSCRIBE_ENABLED=true` 時，公開 `/api/transcribe` 才會送非保密音檔到 OpenAI；每個來源預設每小時最多 3 次。
- Chrome Manifest V3 外掛：`tabCapture` + service worker + offscreen document + IndexedDB
- FastAPI 自動測試與安全邊界（100 MB、格式檢查、無 raw exception）

## 本機執行

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

打開 <http://127.0.0.1:8000>。不設定任何 secret 也能貼上逐字稿並產出整理。

如需雲端音訊轉寫，複製 `.env.example` 的變數名稱到自己的本機環境設定，並在本機設定 `OPENAI_API_KEY`。請勿把 API key commit 到 repository 或貼到對話。

## Chrome 外掛

詳見 [`extension/README.md`](extension/README.md)。載入未封裝的 `extension/` 目錄後：

1. 在 Meet / Zoom Web 分頁開啟外掛。
2. 取得與會者同意並勾選確認。
3. 錄製目前分頁音訊。
4. 停止並下載 WebM。
5. 將檔案拖進 MeetingFlow 工作台。

原生 Zoom 桌面程式、DRM 內容或受管理政策封鎖的分頁，不在 Chrome `tabCapture` 支援範圍。

## 測試

```bash
pytest -q
python3 -m compileall app.py api
```

## 部署到 Vercel(零 token)

這個 repo 已經 git push 到 GitHub。Vercel「Git 整合」是**最簡單也最乾淨**的部署方式 — 不需要 `VERCEL_TOKEN`,環境變數在 Vercel dashboard 設定,token 不會進任何人的對話或本機設定檔。

1. 開 `https://vercel.com/new`
2. 點擊 Import 旁邊的 `openclawsean024-create/meeting-recorder`
3. Framework Preset 保留「Other」(Vercel 會用 repo 內 `vercel.json`)
4. **Environment Variables**(需要時才加,選配):
   - `OPENAI_API_KEY` — 只有想開雲端轉寫才加
   - `PUBLIC_TRANSCRIBE_ENABLED` — 預設 `false`,雲端轉寫不啟用
   - `PUBLIC_TRANSCRIBE_LIMIT` — 預設 `3`,每 IP 每小時上限
5. 點 **Deploy**

之後每次 `git push origin master` 就會自動部署。

## 外部服務限制

- Notion / Slack：本版未假裝完成 OAuth；未授權時提供可複製格式。
- Email：使用使用者的預設郵件程式建立草稿。
- 法務：產品提供錄音同意 gate 與保密模式，但不構成法律意見，也不宣稱已完成第三方法務審查。
- Speech-to-text 品質與速度由設定的外部模型和音訊品質決定。
