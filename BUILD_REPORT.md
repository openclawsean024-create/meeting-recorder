# MeetingFlow Build Report

## Scope delivered

- Public no-login responsive Traditional-Chinese MeetingFlow workspace.
- Browser microphone recording with consent gate, timer, MIME selection, local Blob retention, drag/drop and file-picker upload.
- Transcript-first local analysis API and UI: summary, highlights, decisions, risks, assignee/due-date/status action items.
- Legal/confidential mode with case tag detection and no automatic external push.
- Local history/search/reload, Markdown download, clipboard actions, Email draft, honest Notion/Slack copy fallbacks.
- Optional server-side OpenAI Whisper transcription using `OPENAI_API_KEY`; it is disabled unless `PUBLIC_TRANSCRIBE_ENABLED=true`, and is rate-limited.
- Confidential/legal mode rejects cloud audio transcription before reading or sending the file.
- Extension MV3 has recorder error/stream-ended cleanup and a visible IndexedDB purge action.
- Default-deny CORS, CSP `default-src 'self'`, HSTS, X-Frame-Options, Referrer-Policy in `vercel.json`.
- `OPEN_APP` allow-lists the override URL (https + approved host).
- Markdown filename falls back to `meeting-<date>.md`; history checkboxes persist as `actionDone[]`; search matches title/participants/transcript/summary/highlights/decisions/risks/actions.
- Action-item assignee/due-date parsers hardened to stop at sentence boundaries and treat "下週X" as next week consistently.
- Public FastAPI health/capabilities/analyze/transcribe endpoints with safe extension validation, 100 MB cap and sanitized error messages.
- Default-deny CORS, CSP `default-src 'self'`, HSTS, X-Frame-Options, Referrer-Policy in `vercel.json`.
- `OPEN_APP` allow-lists the override URL (https + approved host).
- Old Supabase routes, schemas and pages purged; `/api/jobs`, `/api/share`, `/api/live-transcribe`, `/api/analyze-live`, `/api/auth/me` return 404.
- Privacy, README and BUILD_REPORT reflect opt-in transcription, confidential-mode block, and IndexedDB purge.
- Chrome MV3 extension with `tabCapture`, offscreen document, service worker, IndexedDB persistence and download flow.
- `/extension` installation page, `/privacy` data-handling page, Vercel routing, env example, tests and docs.

## Verification performed

```text
PYTHONPATH=. /Users/sean/.hermes/hermes-agent/venv/bin/pytest -q
18 passed, 1 warning in 0.21s

/Users/sean/.hermes/hermes-agent/venv/bin/python -m compileall -q app.py api
PASS

node --check extension/service-worker.js
node --check extension/offscreen.js
node --check extension/popup.js
PASS

Ad-hoc smoke test via the FastAPI TestClient confirmed the legal-mode block, the disabled-by-default public cloud transcription, and the local analysis contract.
GET /health          200
GET /                200
GET /extension       200
GET /privacy         200
GET /api/capabilities 200
POST /api/analyze    200 with structured decisions, risks and action_items
POST /api/transcribe mode=legal → 403 (audio rejected before reading the body)
POST /api/transcribe without PUBLIC_TRANSCRIBE_ENABLED → 503
POST /api/transcribe oversized (mocked) → 413
POST /api/transcribe rate limited after default 3/hour/source
OPTIONS /api/* with attacker Origin and no ALLOWED_ORIGINS → no ACAO header
PASS
```

The test run emits one existing Starlette/httpx deprecation warning; it does not fail the suite.

## External-credential limitations

- No `OPENAI_API_KEY` is required for the public transcript-first workflow. Without opt-in cloud transcription, audio upload returns a clear 503 and the local recording is preserved; paste/edit transcript remains usable.
- With `OPENAI_API_KEY` and `PUBLIC_TRANSCRIBE_ENABLED=true`, `/api/transcribe` sends non-legal audio to OpenAI Whisper, with an in-memory per-source hourly limit (default 3 requests).
- Legal/confidential audio is never sent by this endpoint; the API rejects it before reading the upload.
- Notion and Slack OAuth are not fabricated in this public release. UI actions provide copyable fallback content. Email opens a local mail client draft.
- Chrome `tabCapture` cannot capture native Zoom desktop applications, DRM media, or tabs blocked by browser/administrator policy.
- PDPA/legal pages are product guidance only, not legal advice or a claim of third-party legal review.

## Chrome extension verification steps

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load the repository `extension/` directory.
4. Open a browser-based Meet or Zoom meeting.
5. Open MeetingFlow Recorder, read the consent text, check consent, start recording, then stop.
6. Confirm WebM download and the `lastRecording` metadata in extension storage; drag the file into the web workspace.
