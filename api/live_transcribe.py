"""Live transcription API — receives audio chunks, returns text."""
from __future__ import annotations

import base64
import io
import os

import httpx
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from supabase import create_client

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def get_service_client():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_api_key(user_id: str) -> str | None:
    client = get_service_client()
    resp = client.table("user_api_keys").select("api_key").eq("user_id", user_id).execute()
    if resp.data:
        return resp.data[0].get("api_key")
    return None


def get_user_from_request(request: Request) -> str:
    token = request.cookies.get("sb_access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(401, "Invalid token")
        return user.id
    except Exception:
        raise HTTPException(401, "Invalid or expired token")


@router.post("/api/live-transcribe")
async def live_transcribe(
    request: Request,
    audio_b64: str = Form(...),  # base64-encoded audio
    language: str = Form("zh-TW"),
):
    """Receive a base64 audio chunk, return transcription."""
    user_id = get_user_from_request(request)

    api_key = get_user_api_key(user_id)
    if not api_key:
        raise HTTPException(403, "請先在「設定」頁面填入你的 OpenAI API Key")

    # Decode base64 audio
    try:
        audio_bytes = base64.b64decode(audio_b64)
    except Exception:
        raise HTTPException(400, "Invalid base64 audio data")

    if len(audio_bytes) < 100:
        return JSONResponse({"text": "", "duration": 0})

    # Send to Whisper
    async with httpx.AsyncClient(timeout=60.0) as http:
        files = {
            "file": ("audio.webm", io.BytesIO(audio_bytes), "audio/webm"),
        }
        data = {
            "model": "whisper-1",
            "response_format": "text",
            "language": language if language != "auto" else None,
        }
        resp = await http.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            data=data,
            files=files,
        )

    if resp.status_code >= 400:
        raise HTTPException(502, f"Whisper API error: {resp.status_code}")

    text = resp.text.strip()
    return JSONResponse({"text": text})


ANALYZE_PROMPT = """你是一個會議分析助手。請分析以下會議記錄，萃取：
1. 決策（decision）：已確定的結論或決定
2. 行動項（action item）：需要執行的事項（包含負責人如果有的話）
3. 風險（risk）：提到的潛在問題或顧慮

只回覆以下 JSON 格式，不要有其他說明：
{"decisions": ["決策1", "決策2"], "action_items": ["行動項1（含負責人）", "行動項2"], "risks": ["風險1", "風險2"]}

如果某項為空，回傳空陣列 []。

會議記錄：
{transcript}"""


@router.post("/api/analyze-live")
async def analyze_live(request: Request, body: dict):
    """Analyze accumulated transcript text and return structured decisions/actions/risks."""
    user_id = get_user_from_request(request)
    api_key = get_user_api_key(user_id)
    if not api_key:
        raise HTTPException(403, "請先設定 OpenAI API Key")

    transcript = (body.get("transcript") or "").strip()
    if not transcript:
        return JSONResponse({"decisions": [], "action_items": [], "risks": []})

    prompt = ANALYZE_PROMPT.format(transcript=transcript[:8000])
    async with httpx.AsyncClient(timeout=60.0) as http:
        resp = await http.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
        )

    if resp.status_code >= 400:
        raise HTTPException(502, f"GPT API error: {resp.status_code}")

    import json
    try:
        content = resp.json()["choices"][0]["message"]["content"]
        # Extract JSON from response
        start = content.find("{")
        end = content.rfind("}") + 1
        data = json.loads(content[start:end])
        return JSONResponse({
            "decisions": data.get("decisions", []),
            "action_items": data.get("action_items", []),
            "risks": data.get("risks", []),
        })
    except Exception:
        return JSONResponse({"decisions": [], "action_items": [], "risks": []})
