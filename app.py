"""Meeting Recorder — FastAPI app (Vercel serverless)."""
from __future__ import annotations

import os
from pathlib import Path
import base64
import json

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="meeting-recorder")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and mount API routers
from api.auth import router as auth_router
from api.user import router as user_router
from api.transcribe import router as transcribe_router
from api.share import router as share_router

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(transcribe_router)
app.include_router(share_router)


@app.get("/")
def root():
    """Serve landing page for unauthenticated users, or redirect to app."""
    landing = BASE_DIR / "landing.html"
    if landing.exists():
        return FileResponse(landing)
    return {"ok": True, "message": "meeting-recorder"}


@app.get("/app")
def app_page():
    """Main app page (requires JS auth on client side)."""
    app_file = BASE_DIR / "app-page.html"
    if app_file.exists():
        return FileResponse(app_file)
    return RedirectResponse("/landing.html")


@app.get("/pricing")
def pricing_page():
    p = BASE_DIR / "pricing.html"
    if p.exists():
        return FileResponse(p)
    return RedirectResponse("/landing.html")


@app.get("/auth")
def auth_page():
    a = BASE_DIR / "auth.html"
    if a.exists():
        return FileResponse(a)
    return RedirectResponse("/landing.html")


@app.get("/dashboard")
def dashboard_page():
    d = BASE_DIR / "dashboard.html"
    if d.exists():
        return FileResponse(d)
    return RedirectResponse("/app")


@app.get("/app/api-keys")
def api_keys_page():
    k = BASE_DIR / "api-keys.html"
    if k.exists():
        return FileResponse(k)
    return RedirectResponse("/app")


@app.get("/api/share/{share_id}")
def get_share(share_id: str, data: str | None = None):
    if data:
        try:
            padded = data + "=" * (-len(data) % 4)
            raw = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
            payload = json.loads(raw)
            if payload.get("shareId") and payload.get("shareId") != share_id:
                raise HTTPException(status_code=400, detail="shareId mismatch")
            return payload
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid share payload")
    raise HTTPException(status_code=404, detail="Share not found")


@app.post("/api/share")
async def create_share(request: Request):
    payload = await request.json()
    share_id = payload.get("shareId")
    if not share_id:
        raise HTTPException(status_code=400, detail="shareId is required")
    raw = json.dumps(payload, ensure_ascii=False)
    encoded = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8").rstrip("=")
    return {"ok": True, "shareId": share_id, "shareUrl": f"/api/share/{share_id}?data={encoded}"}


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
