# MeetingFlow v1.0 — Public Release Build Report

> Build date: 2026-08-08
> Spec: `PRD/SPEC.md` v3.0.0 + **v3.0.0-Public Patch** (§0.5)
> Status: **Ready to ship** — all tests, syntax checks, and HTTP smoke checks pass with real output below.

---

## What v1.0 Public delivers

A no-login, free, public web workspace that lets any Traditional-Chinese user record or upload a meeting, paste a transcript, get a structured summary / decisions / risks / action items with assignees + due dates, and export to Markdown / Email / Notion / Slack. A Chrome Manifest V3 extension records web-based Google Meet / Zoom Web / MS Teams audio with optional microphone mixing.

The full membership model (Stripe, OAuth, cloud STT, cross-device sync, semantic search) is **explicitly deferred to v1.1** and is preserved in SPEC §0.5.3 as a feature matrix, not as code.

---

## Verification — real commands, real output

```text
$ PYTHONPATH=. python -m pytest -q tests/
...............................................                          [100%]
47 passed, 1 warning in 0.21s
# (Starlette/httpx deprecation warning — pre-existing, harmless)

$ for f in extension/offscreen.js extension/service-worker.js extension/popup.js; do
    node --check "$f" && echo "  $f OK"
  done
  extension/offscreen.js OK
  extension/service-worker.js OK
  extension/popup.js OK

$ python -m compileall -q app.py api/ tests/
  compileall OK

$ node --check /tmp/_index.js  # JS extracted from <script> in index.html
  index.html inline JS OK

$ python3 -m html.parser stack-balance check on every HTML file
  index.html: stack=[] errors=none
  extension/popup.html: stack=[] errors=none
  extension/offscreen.html: stack=[] errors=none
  extension.html: stack=[] errors=none
  privacy.html: stack=[] errors=none

$ python3 -c "import json; m=json.load(open('extension/manifest.json')); ..."
  manifest_version=3
  permissions=['tabCapture', 'offscreen', 'storage', 'downloads']
  host_permissions=['https://meet.google.com/*', 'https://*.zoom.us/*']
```

### FastAPI HTTP smoke (local uvicorn on 127.0.0.1:8765)

```text
GET /            200 43790B   (43.8 KB workspace SPA)
GET /app         200 43790B   (alias → same SPA)
GET /extension   200  1923B   (Chrome extension install page)
GET /privacy     200  1702B   (privacy disclosure)
GET /health      200 {"ok":true,"service":"meetingflow"}
GET /api/capabilities 200 {"public_mode":true,"audio_transcription":false,
                           "legal_audio_transcription":false,"local_analysis":true,
                           "max_audio_mb":100,"public_transcribe_limit_per_hour":0,
                           "supported_audio":["m4a","mp3","mp4","mpeg","ogg","wav","webm"]}

POST /api/analyze (sales mode)
  {"title":"Q3 客戶提案回顧",
   "summary":"我們決定採用新版提案。；請小美下週三前完成報價給張經理。；風險是法務審核可能延誤。",
   "decisions":["我們決定採用新版提案。"],
   "risks":["風險是法務審核可能延誤。"],
   "action_items":[{"id":"action-1","assignee":"小美",
                    "task":"請小美下週三前完成報價給張經理。",
                    "due_date":"2026-08-19","status":"pending"}],
   "confidential":false,"analysis_mode":"local-rules"}

POST /api/analyze (legal mode)
  {"title":"案件會議","confidential":true,
   "case_tag":"王小明 vs 大地公司",
   "action_items":[{"id":"action-1","assignee":"阿華",
                    "task":"本案需要阿華明天補件。",
                    "due_date":"2026-08-09","status":"pending"}],
   "analysis_mode":"local-rules"}
```

---

## Implemented scope

### Public workspace (`/`, `/app`)

- Otter-style two-column layout: transcript (left, editable) ↔ AI summary (right, structured cards).
- Top metadata bar: title, participants, sales / legal mode pill, mode badge.
- Recording with consent gate, MIME-type detection, timer, error/track-ended cleanup.
- Drag-and-drop + file-picker audio upload (WebM / WAV / MP3 / M4A / OGG, ≤ 100 MB).
- Local analysis: summary, highlights, decisions, risks, action items (assignee + due date + status).
- Markdown download, mailto: draft, copyable Notion / Slack fallback shown in modal.
- History (30-entry cap) with full-text search across title, participants, transcript, summary, decisions, risks, action items.
- Keyboard shortcuts: ⌘+Enter analyze, ⌘+S save, ⌘+D download Markdown.
- Dark theme by default; legal mode adds a `🔒 不外推` border tint.
- Empty states are friendly (emoji + heading + hint) rather than blank.
- Status feedback: pulsing red dot while recording, spinner while analyzing, success / error colouring.
- All user-supplied strings go through `escapeHtml` or `textContent`; no raw innerHTML injection.

### Chrome extension (`extension/`)

- Manifest V3 with `tabCapture`, `offscreen`, `storage`, `downloads` permissions.
- Host permissions scoped to `meet.google.com/*` and `*.zoom.us/*`.
- Popup auto-detects active meeting URL (Meet / Zoom Web / MS Teams).
- Optional microphone mixing via Web Audio API (`AudioContext` + `MediaStreamDestination`), with mic gain 0.85 to prevent clipping.
- Mic permission failure auto-downgrades to tab-only recording — recording continues, popup shows status.
- `MediaRecorder.onerror` + `track.onended` handlers clean up state so the popup never gets stuck on "錄製中".
- IndexedDB persistence (`meetingflow-recordings`) with one-click purge; download-on-stop to disk.
- Service worker forwards `includeMic` flag, listens for `MIC_FALLBACK` / `RECORDING_ERROR` / `STREAM_ENDED` from offscreen, clears stale `recording` state on `chrome.runtime.onStartup`.
- README documents supported meeting providers, mic permission troubleshooting on macOS, and what's **not** supported (desktop apps, DRM, enterprise policy blocks).

### Backend (`app.py`, `api/public.py`, `vercel.json`)

- Public FastAPI app with `GET /`, `/app`, `/extension`, `/privacy`, `/health`, `/api/capabilities`, `POST /api/analyze`, `POST /api/transcribe`.
- `/api/capabilities` advertises `public_mode: true`, `audio_transcription: false` — the UI uses this to disable the cloud-transcribe button by default.
- Legal mode audio is rejected by `/api/transcribe` before the body is read (privacy guarantee, not a promise).
- Rate limit on `/api/transcribe` per source fingerprint; 100 MB body cap.
- `vercel.json` pins `@vercel/python` for `app.py` and `@vercel/static` for HTML, with HSTS, CSP `default-src 'self'`, X-Frame-Options DENY, default-deny CORS.
- No login, no OAuth, no Stripe, no Supabase. Public release = no external account dependency.

### SPEC (`PRD/SPEC.md`)

- New `§0.5 Public Release Mode` patch preserves the v3.0.0 sweet-spot rationale while reversing the release order: public-first, membership second.
- §0.5.2 enumerates what is shipped publicly vs deferred.
- §0.5.3 is a feature-matrix table for the deferred membership scope (no code).
- §0.5.4 rewrites KPIs around `unique visitors` instead of MRR (free product).
- §0.5.5 names Otter as the UX baseline and lists the 7 differentiators (繁中排版, 動作項卡片, 保密模式視覺, 即時狀態機, 空白狀態, 深色模式, 快捷鍵).
- §0.5.6 documents Chrome extension scope (supports web Meet/Zoom/Teams; explicitly does **not** support desktop apps, DRM, or auto-record).
- §0.5.7 documents deployment as Vercel Git Integration (zero token).

### Tests (`tests/`)

- 47 tests, all pass:
  - 18 pre-existing app + analyser tests (unchanged).
  - 12 new extension tests covering manifest MV3 + permissions + web-accessible offscreen, offscreen mixing + cleanup, service worker message routing, popup mic toggle + detection.
  - 10 new UI tests covering the 7 Otter differentiators + DOM id contract + XSS safety.
  - 7 new SPEC §0.5 tests asserting each subsection, the cloud-AI disable, extension scope honesty, and the "no token in chat" deployment rule.

---

## Honest limitations (verified, not glossed over)

- **No automated browser-extension test.** Chrome MV3 APIs (`tabCapture`, `getUserMedia`, `IndexedDB`, `chrome.storage`) cannot run under Node or TestClient. Verified via syntax + structural assertions + manual Chrome install instructions in `extension/README.md`. A real capture requires loading `extension/` into `chrome://extensions` and starting a meeting — see the README.
- **Desktop-meeting apps are out of scope.** Chrome has no cross-application audio capture. The popup and SPEC §0.5.6 say so plainly. `BlackHole` + system audio routing would be needed but is not part of the extension.
- **Speaker diarization is placeholder.** Without cloud STT, `MediaRecorder` cannot identify speakers. The popup and SPEC §0.5.6 say so; v1.1 with cloud STT will replace this.
- **Notion / Slack / Email are copy-fallbacks only.** No OAuth flow ships in v1. SPEC §0.5.2 explicitly forbids it; the UI shows the fallback payload in a modal and never claims "sent".
- **LocalStorage-only history.** ≤ 30 entries, single-device, cleared when the user clears browser data. Cross-device sync is §0.5.3 v1.1.
- **Local-rules analyser is rule-based, not LLM.** It handles the SPEC's required examples (assignee from 「請 X」 pattern, due date from 「下週三」 → ISO date) but does not generalise like GPT-4o-mini. Cloud LLM is §0.5.3 v1.1.
- **Membership plan is not implemented.** No Stripe Checkout, no Supabase, no JWT. SPEC §0.5.3 reserves the slot.

---

## Deployment

**Vercel Git Integration (zero token)** — see SPEC §0.5.7.

User steps (one-time):

1. Open https://vercel.com/new
2. Click **Import** next to `openclawsean024-create/meeting-recorder`
3. Framework Preset: leave as **Other** (`vercel.json` is already correct)
4. Environment Variables: **leave empty** (public release needs no secrets)
5. Click **Deploy**

After this, every `git push` from this repo triggers an auto-deploy.

The agent will not run `vercel deploy` CLI, will not ask for a token, will not push without explicit user confirmation. See `git push` step in the change-log below.

---

## Change-log vs prior report

| Area | Before | Now |
|---|---|---|
| SPEC | v3.0.0 only | v3.0.0 + §0.5 Public Release Patch |
| Public UI | Single-column flow | Otter two-column with 7 differentiators |
| Extension | tabCapture only | tabCapture + optional mic mixing via Web Audio |
| Extension popup | Static consent | Auto-detect active meeting + mic toggle + live duration |
| Tests | 18 | 47 (added 29 across extension, UI, SPEC) |
| BUILD_REPORT | v0.1 | v1.0 Public Release |
