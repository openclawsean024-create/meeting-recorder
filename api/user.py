"""User API: API key management, usage dashboard."""
from __future__ import annotations

import os
import supabase
from supabase import create_client
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


def get_service_client():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_from_request(request: Request) -> str:
    token = request.cookies.get("sb_access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    anon_key = SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY
    client = create_client(SUPABASE_URL, anon_key)
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(401, "Invalid token")
        return user.id
    except Exception:
        raise HTTPException(401, "Invalid or expired token")


class ApiKeyRequest(BaseModel):
    api_key: str


@router.get("/api/user/api-key")
def get_api_key(request: Request):
    user_id = get_user_from_request(request)
    client = get_service_client()
    resp = client.table("user_api_keys").select("api_key").eq("user_id", user_id).execute()
    has_key = bool(resp.data and resp.data[0].get("api_key"))
    # Mask the key for display
    masked = None
    if has_key:
        raw = resp.data[0]["api_key"]
        masked = raw[:8] + "..." + raw[-4:] if len(raw) > 16 else "****"
    return JSONResponse({"has_api_key": has_key, "masked": masked})


@router.post("/api/user/api-key")
def set_api_key(body: ApiKeyRequest, request: Request):
    user_id = get_user_from_request(request)
    key = body.api_key.strip()
    if not key:
        raise HTTPException(400, "API key cannot be empty")
    if not key.startswith("sk-"):
        raise HTTPException(400, "Invalid API key format — must start with sk-")
    client = get_service_client()
    client.table("user_api_keys").upsert(
        {"user_id": user_id, "api_key": key},
        on_conflict="user_id",
    ).execute()
    return JSONResponse({"ok": True})


@router.delete("/api/user/api-key")
def delete_api_key(request: Request):
    user_id = get_user_from_request(request)
    client = get_service_client()
    client.table("user_api_keys").delete().eq("user_id", user_id).execute()
    return JSONResponse({"ok": True})


@router.get("/api/user/profile")
def get_profile(request: Request):
    user_id = get_user_from_request(request)
    client = get_service_client()
    resp = client.table("users").select("*").eq("id", user_id).execute()
    if not resp.data:
        raise HTTPException(404, "Profile not found")
    user = resp.data[0]
    return JSONResponse({
        "id": user["id"],
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "plan": user.get("plan", "free"),
    })


class ProfileUpdate(BaseModel):
    name: str | None = None
    plan: str | None = None


@router.patch("/api/user/profile")
def update_profile(body: ProfileUpdate, request: Request):
    user_id = get_user_from_request(request)
    client = get_service_client()
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.plan is not None:
        updates["plan"] = body.plan
    if updates:
        client.table("users").update(updates).eq("id", user_id).execute()
    return JSONResponse({"ok": True})


@router.get("/api/user/usage")
def get_usage(request: Request):
    user_id = get_user_from_request(request)
    client = get_service_client()

    # Get total usage this month
    import datetime
    start_of_month = datetime.date.today().replace(day=1).isoformat()
    resp = client.table("usage_records").select("minutes, characters, created_at").eq(
        "user_id", user_id
    ).gte("created_at", start_of_month).execute()
    records = resp.data or []
    total_minutes = round(sum(r.get("minutes", 0) for r in records), 2)
    total_chars = sum(r.get("characters", 0) for r in records)
    total_jobs = len(records)

    # Get plan
    profile_resp = client.table("users").select("plan").eq("id", user_id).execute()
    plan = profile_resp.data[0].get("plan", "free") if profile_resp.data else "free"
    limits = {"free": 60, "pro": 600, "business": 6000}
    limit = limits.get(plan, 60)

    # Recent jobs
    recent_resp = client.table("transcription_jobs").select(
        "job_id, meeting_title, status, minutes, created_at"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()

    return JSONResponse({
        "plan": plan,
        "limit_minutes": limit,
        "used_minutes": total_minutes,
        "remaining_minutes": max(0, limit - total_minutes),
        "total_jobs": total_jobs,
        "recent_jobs": recent_resp.data or [],
    })
