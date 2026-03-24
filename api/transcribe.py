"""Transcription API endpoint."""
from __future__ import annotations

import asyncio
import datetime
import os
import shutil
import uuid
from pathlib import Path

import httpx
import supabase
from supabase import create_client
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

UPLOAD_DIR = Path("/tmp/meeting-recorder-uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".ogg"}


def get_service_client():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_anon_client():
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY)


def get_user_from_request(request: Request) -> tuple[str, str]:
    """Returns (user_id, plan)."""
    token = request.cookies.get("sb_access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    client = get_anon_client()
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(401, "Invalid token")
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

    # Get plan
    svc = get_service_client()
    profile_resp = svc.table("users").select("plan").eq("id", user.id).execute()
    plan = profile_resp.data[0].get("plan", "free") if profile_resp.data else "free"
    return user.id, plan


def get_user_api_key(user_id: str) -> str | None:
    client = get_service_client()
    resp = client.table("user_api_keys").select("api_key").eq("user_id", user_id).execute()
    if resp.data:
        return resp.data[0].get("api_key")
    return None


def check_usage_limit(user_id: str, plan: str) -> tuple[bool, int, float]:
    """Returns (allowed, limit_minutes, used_minutes)."""
    limits = {"free": 60, "pro": 600, "business": 6000}
    limit = limits.get(plan, 60)
    start_of_month = datetime.date.today().replace(day=1).isoformat()
    client = get_service_client()
    resp = client.table("usage_records").select("minutes").eq(
        "user_id", user_id
    ).gte("created_at", start_of_month).execute()
    used = sum(r.get("minutes", 0) for r in resp.data or [])
    return used < limit, limit, used


def build_structured_summary(title: str, participants: str, transcript: str) -> str:
    lines = [l.strip() for l in transcript.splitlines() if l.strip()]
    decision_lines = [l for l in lines if any(k in l for k in ["決定", "結論", "確認"])]
    action_lines = [l for l in lines if any(k in l for k in ["待辦", "跟進", "action"])]
    risk_lines = [l for l in lines if any(k in l for k in ["風險", "阻塞", "問題"])]
    return "\n".join([
        "# Meeting Minutes",
        "",
        f"- **Meeting Topic:** {title}",
        f"- **Participants:** {participants}",
        "",
        "## Executive Summary",
        "1. 本會議已完成錄音與逐字稿處理。",
        "2. 以下為結構化摘要，涵蓋決策、行動項與風險。",
        "",
        "## Decisions",
        *(decision_lines or ["* 尚無明確決策記錄。"]),
        "",
        "## Action Items",
        *(action_lines or ["* 尚無明確行動項。"]),
        "",
        "## Risks / Open Questions",
        *(risk_lines or ["* 尚無風險或未決問題。"]),
    ])


@router.post("/api/transcribe")
async def transcribe(
    request: Request,
    file: UploadFile = File(...),
    meeting_title: str = Form("未命名會議"),
    participants: str = Form("未填寫"),
):
    user_id, plan = get_user_from_request(request)

    # Check API key
    api_key = get_user_api_key(user_id)
    if not api_key:
        raise HTTPException(403, "請先在「設定」頁面填入你的 OpenAI API Key")

    # Check usage limit
    allowed, limit, used = check_usage_limit(user_id, plan)
    if not allowed:
        raise HTTPException(
            429,
            f"已超過 {plan} 方案的每月用量上限（{limit} 分鐘）。請等到下個月或升級方案。"
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "僅支援 webm / wav / mp3 / m4a / ogg")

    job_id = uuid.uuid4().hex[:12]
    upload_path = UPLOAD_DIR / f"{job_id}{ext}"
    with upload_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # Estimate minutes from file size (rough: 1MB ≈ 1 min for webm)
    estimated_minutes = upload_path.stat().st_size / (1024 * 1024)

    # Create job record
    client = get_service_client()
    client.table("transcription_jobs").insert({
        "job_id": job_id,
        "user_id": user_id,
        "meeting_title": meeting_title.strip() or "未命名會議",
        "participants": participants.strip() or "未填寫",
        "status": "processing",
        "progress": 5,
        "transcript": "",
        "summary": "",
        "minutes": round(estimated_minutes, 2),
        "error": None,
    }).execute()

    # Process async
    asyncio.create_task(
        run_transcription_job(job_id, upload_path, user_id, api_key)
    )

    return JSONResponse({
        "job_id": job_id,
        "status": "processing",
        "progress": 5,
    })


async def run_transcription_job(job_id: str, upload_path: Path, user_id: str, api_key: str):
    client = get_service_client()
    try:
        # Update to transcribing
        client.table("transcription_jobs").update({
            "status": "processing",
            "progress": 20,
        }).eq("job_id", job_id).execute()

        # Transcribe with Whisper
        async with httpx.AsyncClient(timeout=180) as http:
            with upload_path.open("rb") as f:
                files = {"file": (upload_path.name, f, "application/octet-stream")}
                data = {"model": "whisper-1"}
                resp = await http.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=data,
                    files=files,
                )

        if resp.status_code >= 400:
            raise RuntimeError(f"Whisper API error: {resp.status_code} {resp.text}")

        payload = resp.json()
        transcript = str(payload.get("text") or "").strip()
        if not transcript:
            transcript = "（Whisper API 回傳空文字，請確認音訊品質）"

        # Estimate actual minutes from transcript length (rough heuristic)
        estimated_minutes = max(0.5, len(transcript) / 300)

        # Build summary
        job = client.table("transcription_jobs").select(
            "meeting_title, participants"
        ).eq("job_id", job_id).execute().data[0]
        summary = build_structured_summary(
            job.get("meeting_title", ""),
            job.get("participants", ""),
            transcript,
        )

        # Update job
        client.table("transcription_jobs").update({
            "status": "completed",
            "progress": 100,
            "transcript": transcript,
            "summary": summary,
            "minutes": round(estimated_minutes, 2),
        }).eq("job_id", job_id).execute()

        # Record usage
        client.table("usage_records").insert({
            "user_id": user_id,
            "job_id": job_id,
            "characters": len(transcript),
            "minutes": round(estimated_minutes, 2),
        }).execute()

    except Exception as exc:
        client.table("transcription_jobs").update({
            "status": "failed",
            "progress": 100,
            "error": str(exc),
        }).eq("job_id", job_id).execute()

    finally:
        # Cleanup
        try:
            upload_path.unlink(missing_ok=True)
        except Exception:
            pass


@router.get("/api/jobs/{job_id}")
def get_job(job_id: str, request: Request):
    user_id, _ = get_user_from_request(request)
    client = get_service_client()
    resp = client.table("transcription_jobs").select("*").eq("job_id", job_id).execute()
    if not resp.data:
        raise HTTPException(404, "找不到任務")
    job = resp.data[0]
    if job.get("user_id") != user_id:
        raise HTTPException(403, "無權訪問此任務")
    return JSONResponse(job)


@router.get("/api/jobs")
def list_jobs(request: Request):
    user_id, _ = get_user_from_request(request)
    client = get_service_client()
    resp = client.table("transcription_jobs").select(
        "job_id, meeting_title, status, progress, minutes, created_at"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
    return JSONResponse({"jobs": resp.data or []})
