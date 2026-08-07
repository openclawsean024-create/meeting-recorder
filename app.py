"""MeetingFlow public FastAPI application."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse

from api.public import router as public_router

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="MeetingFlow", version="1.0.0")
allowed_origins = [item.strip() for item in os.getenv("ALLOWED_ORIGINS", "").split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=bool(allowed_origins),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.include_router(public_router)


def page(name: str) -> FileResponse:
    return FileResponse(BASE_DIR / name)


@app.get("/")
def root():
    return page("index.html")


@app.get("/app")
def workspace():
    return page("index.html")


@app.get("/recording")
def recording():
    return RedirectResponse("/app")


@app.get("/extension")
def extension_page():
    return page("extension.html")


@app.get("/privacy")
def privacy():
    return page("privacy.html")


@app.get("/health")
def health():
    return {"ok": True, "service": "meetingflow"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=int(os.getenv("PORT", "8000")), reload=False)
