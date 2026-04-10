"""Share API: create and retrieve share records via Supabase."""
from __future__ import annotations

import os
import base64
import json
from supabase import create_client
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def get_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(500, "Supabase not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class ShareCreate(BaseModel):
    share_id: str
    title: str = ""
    participants: str = ""
    transcript: str = ""
    summary: str = ""
    created_at: str = ""


@router.get("/api/share/{share_id}")
def get_share(share_id: str):
    """Retrieve a share record by its ID. Returns 404 if not found."""
    client = get_client()
    try:
        resp = client.table("shared_notes").select("*").eq("share_id", share_id).maybe_single().execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Share not found")
        return JSONResponse(resp.data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/share")
async def create_share(request: Request):
    """Create or update a share record. Returns the share URL."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    share_id = body.get("share_id")
    if not share_id:
        raise HTTPException(status_code=400, detail="share_id is required")

    client = get_client()
    record = {
        "share_id": share_id,
        "title": body.get("title", ""),
        "participants": body.get("participants", ""),
        "transcript": body.get("transcript", ""),
        "summary": body.get("summary", ""),
        "created_at": body.get("created_at", ""),
    }

    try:
        client.table("shared_notes").upsert(record, on_conflict="share_id").execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save share: {e}")

    # Build share URL with embedded payload (base64) for client-side decoding without API call
    encoded = base64.urlsafe_b64encode(
        json.dumps(record, ensure_ascii=False).encode("utf-8")
    ).decode("utf-8").rstrip("=").replace("+", "-").replace("/", "_")

    share_url = f"/share.html#{share_id}?d={encoded}"
    return JSONResponse({"ok": True, "shareId": share_id, "shareUrl": share_url})
