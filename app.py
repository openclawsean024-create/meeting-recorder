from __future__ import annotations

import asyncio
import json
import os
import shutil
import uuid
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

BASE_DIR = Path(__file__).resolve().parent

# Serverless-compatible: defer directory creation
def get_data_dir():
    d = BASE_DIR / '.data'
    d.mkdir(exist_ok=True)
    return d

UPLOAD_DIR = BASE_DIR / 'uploads'
OUTPUT_DIR = BASE_DIR / 'outputs'
DATA_DIR = BASE_DIR / '.data'
JOBS_FILE = DATA_DIR / 'jobs.json'

# Defer directory creation to avoid serverless initialization errors
try:
    UPLOAD_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)
except Exception:
    pass  # Will be created on-demand

app = FastAPI(title='meeting-recorder')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Static files handled via root endpoint for serverless compatibility

JOBS: dict[str, dict[str, Any]] = {}
ALLOWED_AUDIO_EXTENSIONS = {'.webm', '.wav', '.mp3', '.m4a', '.ogg'}


def load_jobs() -> dict[str, dict[str, Any]]:
    if not JOBS_FILE.exists():
        return {}
    try:
        return json.loads(JOBS_FILE.read_text(encoding='utf-8'))
    except Exception:
        return {}


def persist_jobs() -> None:
    JOBS_FILE.write_text(json.dumps(JOBS, ensure_ascii=False, indent=2), encoding='utf-8')


JOBS.update(load_jobs())


@app.get('/health')
def health():
    return {'ok': True, 'jobs': len(JOBS), 'stt_provider': get_stt_provider_name()}


@app.post('/api/transcribe')
async def create_transcribe_job(
    file: UploadFile = File(...),
    meeting_title: str = Form('未命名會議'),
    participants: str = Form('未填寫'),
):
    ext = Path(file.filename or '').suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail='僅支援 webm / wav / mp3 / m4a / ogg')

    job_id = uuid.uuid4().hex[:12]
    upload_path = UPLOAD_DIR / f'{job_id}{ext}'
    with upload_path.open('wb') as f:
        shutil.copyfileobj(file.file, f)

    JOBS[job_id] = {
        'job_id': job_id,
        'status': 'queued',
        'stage': 'queued',
        'progress': 5,
        'message': '任務已建立，等待處理',
        'meeting_title': meeting_title.strip() or '未命名會議',
        'participants': participants.strip() or '未填寫',
        'filename': file.filename or upload_path.name,
        'stt_provider': get_stt_provider_name(),
        'transcript': '',
        'summary': '',
        'download_url': f'/downloads/{job_id}/{upload_path.name}',
        'error': None,
    }
    persist_jobs()

    asyncio.create_task(run_transcription_job(job_id=job_id, upload_path=upload_path))
    return JSONResponse({'job_id': job_id, 'status': 'queued', 'stage': 'queued', 'progress': 5})


@app.get('/api/jobs/{job_id}')
def get_job(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='找不到任務')
    return JSONResponse(job)


@app.get('/downloads/{job_id}/{filename}')
def download_file(job_id: str, filename: str):
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail='無效檔名')

    file_path = UPLOAD_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail='找不到檔案')

    return FileResponse(file_path, media_type='application/octet-stream', filename=file_path.name)


async def run_transcription_job(job_id: str, upload_path: Path):
    try:
        update_job(job_id, status='processing', stage='upload_received', progress=15, message='已收到錄音，準備分析')
        await asyncio.sleep(0.1)

        update_job(job_id, stage='transcribing', progress=45, message=f'正在使用 {get_stt_provider_name()} 產生逐字稿')
        transcript = await transcribe_audio(job_id, upload_path)
        await asyncio.sleep(0.1)

        update_job(job_id, stage='summarizing', progress=78, message='正在整理正式紀要')
        summary = build_structured_summary(JOBS[job_id]['meeting_title'], JOBS[job_id]['participants'], transcript)
        await asyncio.sleep(0.1)

        update_job(
            job_id,
            status='completed',
            stage='completed',
            progress=100,
            message='逐字稿與 meeting minutes 已完成',
            transcript=transcript,
            summary=summary,
            error=None,
        )
    except Exception as exc:
        update_job(
            job_id,
            status='failed',
            stage='failed',
            progress=100,
            message='處理失敗',
            error=str(exc),
        )


def update_job(job_id: str, **kwargs):
    JOBS[job_id].update(kwargs)
    persist_jobs()


def get_stt_provider_name() -> str:
    if os.getenv('MEETING_RECORDER_WHISPER_API_KEY'):
        return 'openai-whisper-api'
    return 'placeholder-local'


async def transcribe_audio(job_id: str, upload_path: Path) -> str:
    api_key = os.getenv('MEETING_RECORDER_WHISPER_API_KEY')
    if api_key:
        return await transcribe_with_openai_whisper(upload_path, api_key)
    return build_placeholder_transcript(job_id)


async def transcribe_with_openai_whisper(upload_path: Path, api_key: str) -> str:
    try:
        import httpx
    except ImportError as exc:
        raise RuntimeError('Missing dependency: httpx is required for Whisper API mode') from exc

    async with httpx.AsyncClient(timeout=180) as client:
        with upload_path.open('rb') as f:
            files = {'file': (upload_path.name, f, 'application/octet-stream')}
            data = {'model': 'whisper-1'}
            response = await client.post(
                'https://api.openai.com/v1/audio/transcriptions',
                headers={'Authorization': f'Bearer {api_key}'},
                data=data,
                files=files,
            )

    if response.status_code >= 400:
        raise RuntimeError(f'Whisper API failed with status {response.status_code}: {response.text}')

    payload = response.json()
    transcript = str(payload.get('text') or '').strip()
    if not transcript:
        raise RuntimeError('Whisper API returned empty transcript')
    return transcript


def build_placeholder_transcript(job_id: str) -> str:
    meeting_title = JOBS[job_id].get('meeting_title', '未命名會議')
    participants = JOBS[job_id].get('participants', '未填寫')
    return '\n'.join([
        f'會議主題：{meeting_title}',
        f'與會人員：{participants}',
        '這是一份 server-side placeholder transcript，用來打通後端流程。',
        '下一階段可直接替換成 Whisper / Whisper API / inference STT。',
        '本次會議先聚焦在需求整理、風險盤點與後續行動。',
        '決定：先完成 MVP，之後再補強 AI 摘要品質。',
        '待辦：整理 action items、確認 owner、安排下次追蹤。',
    ])


def build_structured_summary(title: str, participants: str, transcript: str) -> str:
    lines = [line.strip() for line in transcript.splitlines() if line.strip()]
    decision_lines = [line for line in lines if any(k in line for k in ['決定', '結論', '確認'])]
    action_lines = [line for line in lines if any(k in line for k in ['待辦', '跟進', 'action'])]
    risk_lines = [line for line in lines if any(k in line for k in ['風險', '阻塞', '問題'])]

    return '\n'.join([
        '# Meeting Minutes',
        '',
        f'- Meeting Topic: {title}',
        f'- Participants: {participants}',
        f'- Transcript Length: {len(transcript)} chars',
        '',
        '## Executive Summary',
        '1. 系統已完成 server-side transcription job flow，可接 placeholder 或 OpenAI Whisper API。',
        '2. 摘要輸出已整理成 decisions / action items / risks 三段式結構，便於後續接 Notion / Obsidian。',
        '',
        '## Decisions',
        *(decision_lines or ['1. 尚未抽取到明確決策。']),
        '',
        '## Action Items',
        *(action_lines or ['1. 尚未抽取到明確行動項。']),
        '',
        '## Risks / Open Questions',
        *(risk_lines or ['1. 尚未抽取到明確風險或未決問題。']),
    ])


@app.get('/')
def root():
    index_file = BASE_DIR / 'index.html'
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({'ok': True, 'message': 'meeting-recorder api'})


if __name__ == '__main__':
    import uvicorn

    port = int(os.getenv('PORT', '8000'))
    uvicorn.run('app:app', host='0.0.0.0', port=port)
