import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.public import _infer_due, analyze_transcript, reset_rate_limits
from app import app

ROOT = Path(__file__).resolve().parents[1]
client = TestClient(app)


def test_public_health_and_capabilities(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    assert client.get("/health").json()["ok"] is True
    caps = client.get("/api/capabilities").json()
    assert caps["public_mode"] is True
    assert caps["local_analysis"] is True
    assert caps["audio_transcription"] is False


def test_analyzer_extracts_structured_action_and_decision():
    result = analyze_transcript(
        "我們決定採用新版提案。請小美下週三前完成報價。現在的風險是法務審核延誤。",
        "客戶提案會議",
        ["小美", "Sean"],
    )
    assert result["title"] == "客戶提案會議"
    assert result["decisions"]
    assert result["risks"]
    assert result["action_items"][0]["assignee"] == "小美"
    assert result["action_items"][0]["due_date"] is not None


def test_legal_mode_marks_confidential_case():
    result = analyze_transcript("王小明 vs 大地公司。本案需要阿華明天補件。", participants=["阿華"], mode="legal")
    assert result["confidential"] is True
    assert result["case_tag"] == "王小明 vs 大地公司"


def test_analyze_endpoint_validates_empty_transcript():
    response = client.post("/api/analyze", json={"transcript": ""})
    assert response.status_code == 422


def test_transcribe_rejects_bad_extension():
    response = client.post("/api/transcribe", files={"file": ("attack.exe", b"hello", "application/octet-stream")})
    assert response.status_code == 415


def test_transcribe_is_honest_without_server_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.post("/api/transcribe", files={"file": ("sample.webm", b"valid-audio-placeholder", "audio/webm")})
    assert response.status_code == 503
    assert "公開雲端轉寫目前未開放" in response.json()["detail"]


def test_legal_transcription_is_blocked_before_reading_audio(monkeypatch):
    monkeypatch.setattr("api.public.PUBLIC_TRANSCRIBE_ENABLED", True)
    response = client.post(
        "/api/transcribe",
        data={"mode": "legal"},
        files={"file": ("case.webm", b"confidential-audio", "audio/webm")},
    )
    assert response.status_code == 403
    assert "不會將音檔送到外部" in response.json()["detail"]


def test_main_page_has_critical_public_features():
    html = client.get("/").text
    for phrase in ["開始錄音", "上傳音檔", "我已告知與會者", "行動項目", "Slack", "Notion", "保密"]:
        assert phrase in html
    assert "/auth" not in html


def test_manifest_v3_and_capture_architecture():
    manifest = json.loads((ROOT / "extension" / "manifest.json").read_text())
    assert manifest["manifest_version"] == 3
    assert {"tabCapture", "offscreen", "storage", "downloads"}.issubset(manifest["permissions"])
    assert manifest["background"]["service_worker"] == "service-worker.js"
    assert (ROOT / "extension" / "offscreen.js").exists()


def test_due_date_parser_handles_iso_date():
    assert _infer_due("請於 2026-08-20 完成") == "2026-08-20"
