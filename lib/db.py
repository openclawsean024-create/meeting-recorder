"""Supabase client for meeting-recorder backend."""
from __future__ import annotations

import os
from supabase import create_client, Client
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

_client: Optional[Client] = None

def get_client() -> Client:
    global _client
    if not _client:
        if not SUPABASE_URL:
            raise RuntimeError("SUPABASE_URL environment variable is not set")
        if not SUPABASE_SERVICE_KEY:
            raise RuntimeError("SUPABASE_SERVICE_KEY environment variable is not set")
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


def get_user_api_key(supabase: Client, user_id: str) -> str | None:
    """Retrieve user's OpenAI API key (decrypted)."""
    resp = supabase.table("user_api_keys").select("api_key").eq("user_id", user_id).execute()
    if resp.data:
        return resp.data[0].get("api_key")
    return None


def upsert_user_api_key(supabase: Client, user_id: str, api_key: str) -> None:
    """Insert or replace user's OpenAI API key."""
    supabase.table("user_api_keys").upsert(
        {"user_id": user_id, "api_key": api_key},
        on_conflict="user_id",
    ).execute()


def delete_user_api_key(supabase: Client, user_id: str) -> None:
    """Delete user's OpenAI API key."""
    supabase.table("user_api_keys").delete().eq("user_id", user_id).execute()


def record_usage(supabase: Client, user_id: str, job_id: str, chars: int, minutes: float) -> None:
    """Record a transcription usage event."""
    supabase.table("usage_records").insert({
        "user_id": user_id,
        "job_id": job_id,
        "characters": chars,
        "minutes": minutes,
    }).execute()


def get_user_usage(supabase: Client, user_id: str) -> dict:
    """Get total usage for a user."""
    resp = supabase.table("usage_records").select(
        "characters, minutes, created_at"
    ).eq("user_id", user_id).execute()
    records = resp.data or []
    total_chars = sum(r.get("characters", 0) for r in records)
    total_minutes = sum(r.get("minutes", 0) for r in records)
    total_jobs = len(records)
    return {
        "total_jobs": total_jobs,
        "total_characters": total_chars,
        "total_minutes": round(total_minutes, 2),
        "records": records[-20:],  # last 20
    }


def check_usage_limit(supabase: Client, user_id: str, plan: str) -> tuple[bool, int]:
    """
    Check if user is within their plan's usage limit.
    Returns (allowed, limit).
    Free: 60min/month, Pro: 600min/month, Business: 6000min/month.
    """
    limits = {"free": 60, "pro": 600, "business": 6000}
    limit = limits.get(plan, 60)

    # Get current month usage
    import datetime
    start_of_month = datetime.date.today().replace(day=1).isoformat()
    resp = supabase.table("usage_records").select("minutes").eq(
        "user_id", user_id
    ).gte("created_at", start_of_month).execute()
    used = sum(r.get("minutes", 0) for r in resp.data or [])
    return used < limit, limit
