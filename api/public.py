"""Public meeting analysis and opt-in cloud transcription API.

The transcript-first workflow works without credentials. Public cloud transcription
is disabled by default, rate-limited when enabled, and never accepts legal-mode audio.
"""
from __future__ import annotations

import datetime as dt
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api")
MAX_AUDIO_BYTES = 100 * 1024 * 1024
MAX_TRANSCRIPT_CHARS = 200_000
PUBLIC_TRANSCRIBE_ENABLED = os.getenv("PUBLIC_TRANSCRIBE_ENABLED", "false").lower() == "true"
PUBLIC_TRANSCRIBE_LIMIT = max(1, int(os.getenv("PUBLIC_TRANSCRIBE_LIMIT", "3")))
PUBLIC_TRANSCRIBE_WINDOW_SECONDS = 3600
ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".mp4", ".mpeg"}
ACTION_WORDS = ("請", "需要", "負責", "跟進", "完成", "提供", "寄出", "整理", "確認", "準備", "聯絡", "提交", "補件", "提案", "待辦", "todo", "action")
DECISION_WORDS = ("決定", "結論", "確認採用", "同意", "通過", "拍板")
RISK_WORDS = ("風險", "問題", "阻塞", "卡住", "延誤", "擔心", "爭議", "不足")
_rate_limits: dict[str, deque[float]] = defaultdict(deque)


class AnalyzeRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=MAX_TRANSCRIPT_CHARS)
    title: str = Field(default="未命名會議", max_length=200)
    participants: list[str] = Field(default_factory=list, max_length=50)
    mode: str = Field(default="sales", pattern="^(sales|legal)$")


def reset_rate_limits() -> None:
    """Clear best-effort in-memory limits (used by tests/local development)."""
    _rate_limits.clear()


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    address = forwarded.split(",")[0].strip()
    if not address and request.client:
        address = request.client.host
    return (address or "unknown")[:64]


def _check_public_limit(request: Request) -> None:
    now = time.monotonic()
    bucket = _rate_limits[_client_key(request)]
    while bucket and now - bucket[0] >= PUBLIC_TRANSCRIBE_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= PUBLIC_TRANSCRIBE_LIMIT:
        raise HTTPException(status_code=429, detail="公開轉寫次數已達目前時段上限，請稍後再試。")
    bucket.append(now)


def _sentences(text: str) -> list[str]:
    text = re.sub(r"\r\n?", "\n", text).strip()
    chunks = re.split(r"(?<=[。！？!?])\s*|\n+", text)
    return [re.sub(r"^[-•\d.、\s]+", "", item).strip() for item in chunks if item.strip()]


def _unique(items: list[str], limit: int) -> list[str]:
    result: list[str] = []
    for item in items:
        clean = re.sub(r"\s+", " ", item).strip()
        if clean and clean not in result:
            result.append(clean[:300])
        if len(result) >= limit:
            break
    return result


def _infer_assignee(sentence: str, participants: list[str]) -> str:
    for name in participants:
        if name and name in sentence:
            return name
    match = re.search(r"(?:請|由|麻煩)\s*([\u4e00-\u9fffA-Za-z][\u4e00-\u9fffA-Za-z0-9._-]{0,15})", sentence)
    return match.group(1) if match else "待指派"


def _infer_due(sentence: str, today: dt.date | None = None) -> str | None:
    today = today or dt.date.today()
    iso = re.search(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", sentence)
    if iso:
        try:
            return dt.date(int(iso.group(1)), int(iso.group(2)), int(iso.group(3))).isoformat()
        except ValueError:
            pass
    md = re.search(r"(?<!\d)(\d{1,2})[月/]\s*(\d{1,2})日?", sentence)
    if md:
        try:
            candidate = dt.date(today.year, int(md.group(1)), int(md.group(2)))
            if candidate < today - dt.timedelta(days=30):
                candidate = candidate.replace(year=today.year + 1)
            return candidate.isoformat()
        except ValueError:
            pass
    if "今天" in sentence:
        return today.isoformat()
    if "明天" in sentence:
        return (today + dt.timedelta(days=1)).isoformat()
    if "後天" in sentence:
        return (today + dt.timedelta(days=2)).isoformat()
    weekdays = {"一": 0, "二": 1, "三": 2, "四": 3, "五": 4, "六": 5, "日": 6, "天": 6}
    weekday = re.search(r"(下週|下周|本週|本周|週|周)([一二三四五六日天])", sentence)
    if weekday:
        target = weekdays[weekday.group(2)]
        delta = (target - today.weekday()) % 7
        if weekday.group(1) in {"下週", "下周"}:
            delta += 7
        return (today + dt.timedelta(days=delta)).isoformat()
    return None


def analyze_transcript(transcript: str, title: str = "未命名會議", participants: list[str] | None = None, mode: str = "sales") -> dict[str, Any]:
    """Deterministically extract a useful meeting brief from Traditional Chinese text."""
    participants = [p.strip() for p in (participants or []) if p.strip()]
    sentences = _sentences(transcript)
    if not sentences:
        raise ValueError("逐字稿不可為空")
    decisions = _unique([s for s in sentences if any(word in s for word in DECISION_WORDS)], 8)
    risks = _unique([s for s in sentences if any(word in s for word in RISK_WORDS)], 8)
    action_sentences = _unique([
        s for s in sentences
        if any(word.lower() in s.lower() for word in ACTION_WORDS)
        and not any(word in s for word in DECISION_WORDS)
    ], 12)
    actions = [
        {
            "id": f"action-{idx + 1}",
            "assignee": _infer_assignee(sentence, participants),
            "task": sentence,
            "due_date": _infer_due(sentence),
            "status": "pending",
        }
        for idx, sentence in enumerate(action_sentences)
    ]
    highlights = _unique(sentences, 6)
    summary = "；".join(highlights[:3])
    if len(summary) > 300:
        summary = summary[:297] + "…"
    case_tag = None
    if mode == "legal":
        match = re.search(r"([\u4e00-\u9fffA-Za-z0-9]{1,24})\s*(?:vs\.?|v\.?|訴|與)\s*([\u4e00-\u9fffA-Za-z0-9]{1,24})", transcript, re.I)
        case_tag = f"{match.group(1)} vs {match.group(2)}" if match else "保密案件（待命名）"
    return {
        "title": title.strip() or "未命名會議",
        "summary": summary or "尚無足夠內容可產生摘要。",
        "highlights": highlights,
        "decisions": decisions,
        "risks": risks,
        "action_items": actions,
        "case_tag": case_tag,
        "confidential": mode == "legal",
        "analysis_mode": "local-rules",
    }


@router.get("/capabilities")
def capabilities() -> dict[str, Any]:
    return {
        "public_mode": True,
        "audio_transcription": bool(os.getenv("OPENAI_API_KEY")) and PUBLIC_TRANSCRIBE_ENABLED,
        "legal_audio_transcription": False,
        "local_analysis": True,
        "max_audio_mb": 100,
        "public_transcribe_limit_per_hour": PUBLIC_TRANSCRIBE_LIMIT if PUBLIC_TRANSCRIBE_ENABLED else 0,
        "supported_audio": sorted(ext.lstrip(".") for ext in ALLOWED_EXTENSIONS),
    }


@router.post("/analyze")
def analyze(payload: AnalyzeRequest) -> dict[str, Any]:
    try:
        return analyze_transcript(payload.transcript, payload.title, payload.participants, payload.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _validate_upload_size(file: UploadFile) -> int:
    """Measure the spooled upload without copying up to 100 MB into another buffer."""
    try:
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
    except (OSError, AttributeError) as exc:
        raise HTTPException(status_code=400, detail="無法讀取音檔") from exc
    if size > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="音檔不可超過 100 MB")
    if size <= 0:
        raise HTTPException(status_code=400, detail="音檔內容為空")
    return size


@router.post("/transcribe")
async def transcribe(
    request: Request,
    file: UploadFile = File(...),
    meeting_title: str = Form("未命名會議"),
    participants: str = Form(""),
    mode: str = Form("sales"),
) -> dict[str, Any]:
    filename = Path(file.filename or "recording.webm").name
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="僅支援 WebM、WAV、MP3、M4A、OGG、MP4 或 MPEG 音訊")
    mode = mode if mode in {"sales", "legal"} else "sales"
    if mode == "legal":
        raise HTTPException(status_code=403, detail="保密模式不會將音檔送到外部雲端服務。請貼上逐字稿使用本機分析。")
    if not PUBLIC_TRANSCRIBE_ENABLED:
        raise HTTPException(status_code=503, detail="公開雲端轉寫目前未開放。錄音仍保留在你的裝置，請貼上逐字稿使用本機分析。")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="本站尚未設定雲端語音轉寫。錄音仍保留在你的裝置，請貼上逐字稿使用本機分析。")
    _check_public_limit(request)
    _validate_upload_size(file)
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                data={"model": os.getenv("OPENAI_TRANSCRIBE_MODEL", "whisper-1"), "language": "zh"},
                files={"file": (filename, file.file, file.content_type or "application/octet-stream")},
            )
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="語音轉寫服務暫時無法使用，音檔仍保留在你的裝置，請稍後重試。")
        transcript = str(response.json().get("text") or "").strip()
        if not transcript:
            raise HTTPException(status_code=502, detail="語音轉寫未產生文字，請確認音訊品質後重試。")
        names = [item.strip() for item in re.split(r"[,，、]", participants) if item.strip()]
        result = analyze_transcript(transcript, meeting_title[:200], names, "sales")
        return {"transcript": transcript, "analysis": result}
    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=502, detail="語音轉寫服務暫時無法使用，請稍後重試。") from exc
