"""Transcription API endpoint — Phase 3: GPT Summary + Speaker Diarization."""
from __future__ import annotations

import asyncio
import datetime
import os
import shutil
import uuid
from pathlib import Path

import httpx
from supabase import create_client
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, Request, UploadFile
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


# ─────────────────────────────────────────────
# Phase 3: GPT-powered meeting minutes + speaker diarization
# ─────────────────────────────────────────────

async def call_openai_gpt(prompt: str, api_key: str, model: str = "gpt-4o-mini", temperature: float = 0.3) -> str:
    """Call GPT-4o-mini for structured output."""
    async with httpx.AsyncClient(timeout=60.0) as http:
        resp = await http.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
            },
        )
    if resp.status_code >= 400:
        raise RuntimeError(f"GPT API error: {resp.status_code} {resp.text}")
    payload = resp.json()
    return payload["choices"][0]["message"]["content"]


def build_speaker_segmentation_prompt(transcript: str, speaker_count: int) -> str:
    """Prompt to identify and label speakers in a transcript."""
    speakers = ", ".join([f"發言者 {chr(65+i)}" for i in range(speaker_count)])
    return f"""你是一個會議錄音發言者分離助理。請根據以下逐字稿，自動識別並標記不同的發言者。

已知發言者人數：{speaker_count} 人
發言者名稱：{speakers}

請用以下格式回覆（只回覆標記後的逐字稿，不要有其他說明）：

【發言者 A】：...發言內容...
【發言者 B】：...發言內容...
（依此類推）

規則：
1. 嚴格只使用上述發言者名稱
2. 盡量保持發言內容完整，不要自行詮釋或濃縮
3. 如果無法確認發言者，根據發言順序輪流分配
4. 每個發言區塊以發言者標籤開頭

逐字稿：
{transcript}"""


def build_meeting_minutes_prompt(transcript: str, meeting_title: str, participants: str, language: str = "zh-TW") -> str:
    """Prompt to generate a structured meeting minutes from transcript."""
    lang_instruction = "請用繁體中文回覆" if language.startswith("zh") else "Reply in the same language as the transcript."
    return f"""{lang_instruction}

你是一個專業的會議記錄助理。請根據以下會議逐字稿，產生一份結構化的 Meeting Minutes。

會議標題：{meeting_title}
與會人員：{participants}

請嚴格按照以下格式輸出：

# Meeting Minutes｜{meeting_title}

## 📋 會議概覽
- **會議主題：** [主題]
- **與會人員：** [人員名單]
- **記錄時間：** [今天日期]

## 📝 逐字稿（發言者標記）
[按發言者分段顯示的逐字稿]

## 💡 會議摘要
[2-3 段的會議重點摘要，用自己的話說]

## ✅ 決策記錄
[列出會議中達成的具體決策]

## 📌 行動項目（待辦）
[列出每個待辦事項，包含：動作、負責人、期限（如果有的話）]
格式範例：
- [ ] [動作描述] — 負責人：[誰]
- [ ] [動作描述] — 負責人：[誰]

## ⚠️ 風險與待解決問題
[列出提到的風險、阻塞點、或尚未解決的問題]

## 🔑 關鍵字
[列出 5-8 個本會議的關鍵字]

---

逐字稿內容：
{transcript}

請開始產生 Meeting Minutes："""


async def segment_speakers(transcript: str, speaker_count: int, api_key: str) -> str:
    """Use GPT to segment transcript by speaker."""
    if speaker_count <= 1:
        return transcript
    try:
        prompt = build_speaker_segmentation_prompt(transcript, speaker_count)
        result = await call_openai_gpt(prompt, api_key)
        # If GPT returned something reasonable, use it; otherwise return original
        if result and len(result) > len(transcript) * 0.5:
            return result
        return transcript
    except Exception:
        return transcript


async def generate_gpt_minutes(
    transcript: str,
    meeting_title: str,
    participants: str,
    api_key: str,
    language: str = "zh-TW",
) -> str:
    """Use GPT-4o-mini to generate structured meeting minutes."""
    try:
        prompt = build_meeting_minutes_prompt(transcript, meeting_title, participants, language)
        result = await call_openai_gpt(prompt, api_key, model="gpt-4o-mini")
        return result
    except Exception as e:
        # Fallback to simple summary
        return build_simple_summary(transcript, meeting_title, participants)


def build_simple_summary(transcript: str, meeting_title: str, participants: str) -> str:
    """Fallback simple summary when GPT is unavailable."""
    lines = [l.strip() for l in transcript.splitlines() if l.strip()]
    decision_lines = [l for l in lines if any(k in l for k in ["決定", "結論", "確認", "通過", "同意"])]
    action_lines = [l for l in lines if any(k in l for k in ["待辦", "跟進", "action", "負責", "將會", "會去"])]
    risk_lines = [l for l in lines if any(k in l for k in ["風險", "阻塞", "問題", "擔心", "需要", "缺口"])]
    return f"""# Meeting Minutes｜{meeting_title}

## 📋 會議概覽
- **會議主題：** {meeting_title}
- **與會人員：** {participants}
- **記錄時間：** {datetime.date.today().isoformat()}

## 💡 會議摘要
本會議已完成錄音與逐字稿處理。以下為結構化摘要。

## ✅ 決策記錄
{chr(10).join(f'- {l}' for l in (decision_lines or ['* 尚無明確決策記錄。']))}

## 📌 行動項目（待辦）
{chr(10).join(f'- [ ] {l}' for l in (action_lines or ['* 尚無明確行動項。']))}

## ⚠️ 風險與待解決問題
{chr(10).join(f'- {l}' for l in (risk_lines or ['* 尚無風險或未決問題。']))}
"""


@router.post("/api/transcribe")
async def transcribe(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    meeting_title: str = Form("未命名會議"),
    participants: str = Form("未填寫"),
    speaker_count: int = Form(2),
    language: str = Form("zh-TW"),
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

    # Estimate minutes from file size (rough: 1MB ≈ 1 min)
    estimated_minutes = max(0.5, upload_path.stat().st_size / (1024 * 1024))

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
        "speaker_count": speaker_count,
        "language": language,
        "error": None,
    }).execute()

    # Process in background (FastAPI BackgroundTasks — runs after response is sent)
    # Note: Vercel serverless may still cut long-running tasks; for production,
    # consider Supabase Edge Functions or a dedicated worker queue.
    background_tasks.add_task(
        run_transcription_job, job_id, upload_path, user_id, api_key,
        speaker_count, language
    )

    return JSONResponse({
        "job_id": job_id,
        "status": "processing",
        "progress": 5,
    })


async def run_transcription_job(
    job_id: str,
    upload_path: Path,
    user_id: str,
    api_key: str,
    speaker_count: int,
    language: str,
):
    client = get_service_client()
    try:
        # Update to transcribing
        client.table("transcription_jobs").update({
            "status": "processing",
            "progress": 20,
        }).eq("job_id", job_id).execute()

        # ── Step 1: Whisper transcription ──
        async with httpx.AsyncClient(timeout=300.0) as http:
            with upload_path.open("rb") as f:
                files = {"file": (upload_path.name, f, "application/octet-stream")}
                data = {
                    "model": "whisper-1",
                    "response_format": "verbose_json",
                    "timestamp_granularities[]": "word",
                }
                resp = await http.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=data,
                    files=files,
                )

        if resp.status_code >= 400:
            raise RuntimeError(f"Whisper API error: {resp.status_code} {resp.text}")

        payload = resp.json()
        transcript_raw = str(payload.get("text") or "").strip()
        if not transcript_raw:
            transcript_raw = "（Whisper API 回傳空文字，請確認音訊品質）"

        client.table("transcription_jobs").update({
            "progress": 50,
        }).eq("job_id", job_id).execute()

        # ── Step 2: Speaker Diarization via GPT ──
        transcript_segmented = await segment_speakers(transcript_raw, speaker_count, api_key)

        client.table("transcription_jobs").update({
            "progress": 65,
        }).eq("job_id", job_id).execute()

        # ── Step 3: Estimate actual minutes ──
        estimated_minutes = max(0.5, len(transcript_raw) / 300)

        # ── Step 4: GPT Meeting Minutes ──
        job = client.table("transcription_jobs").select(
            "meeting_title, participants"
        ).eq("job_id", job_id).execute().data[0]

        summary = await generate_gpt_minutes(
            transcript_segmented,
            job.get("meeting_title", ""),
            job.get("participants", ""),
            api_key,
            language,
        )

        client.table("transcription_jobs").update({
            "progress": 90,
        }).eq("job_id", job_id).execute()

        # ── Step 5: Save results ──
        client.table("transcription_jobs").update({
            "status": "completed",
            "progress": 100,
            "transcript": transcript_segmented,
            "summary": summary,
            "minutes": round(estimated_minutes, 2),
        }).eq("job_id", job_id).execute()

        # Record usage
        client.table("usage_records").insert({
            "user_id": user_id,
            "job_id": job_id,
            "characters": len(transcript_raw),
            "minutes": round(estimated_minutes, 2),
        }).execute()

    except Exception as exc:
        client.table("transcription_jobs").update({
            "status": "failed",
            "progress": 100,
            "error": str(exc),
        }).eq("job_id", job_id).execute()

    finally:
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
