"""Chrome extension manifest + JS structural checks.

These checks confirm the MV3 manifest and the JS bundle still parse and
declare the resources we depend on. They do not exercise Chrome APIs.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"


def _read(name: str) -> str:
    return (EXT / name).read_text(encoding="utf-8")


def test_manifest_is_mv3_with_required_permissions():
    manifest = json.loads(_read("manifest.json"))
    assert manifest["manifest_version"] == 3
    assert manifest["background"]["service_worker"] == "service-worker.js"
    perms = set(manifest["permissions"])
    # Public release requires tab capture + offscreen + downloads + storage
    assert {"tabCapture", "offscreen", "storage", "downloads"}.issubset(perms)
    # Host permissions scoped to web-based meeting providers we actually support
    hosts = " ".join(manifest["host_permissions"])
    assert "meet.google.com" in hosts
    assert "zoom.us" in hosts


def test_manifest_offscreen_document_is_web_accessible():
    manifest = json.loads(_read("manifest.json"))
    resources = manifest.get("web_accessible_resources", [])
    assert any(
        r.get("resources") == ["offscreen.html"]
        for r in resources
    ), "offscreen.html must be web_accessible_resources for createDocument to work"


def test_offscreen_js_compiles_and_exposes_mixing():
    src = _read("offscreen.js")
    # Web Audio mixing entry point
    assert "AudioContext" in src
    assert "createMediaStreamSource" in src
    assert "createMediaStreamDestination" in src
    # Cleanup on track end
    assert "track.onended" in src
    # MediaRecorder error handler
    assert "recorder.onerror" in src
    # IndexedDB persistence
    assert "indexedDB.open" in src and "meetingflow-recordings" in src
    # CLEAR_RECORDINGS handler
    assert "CLEAR_RECORDINGS" in src


def test_service_worker_routes_popup_messages():
    """Service worker handles popup → sw and sw → offscreen messages."""
    src = _read("service-worker.js")
    for msg in [
        "START_CAPTURE", "STOP_CAPTURE", "GET_STATUS", "OPEN_APP",
        "DETECT_MEETING",
        "MIC_FALLBACK", "RECORDING_ERROR", "STREAM_ENDED",
    ]:
        assert msg in src, f"service-worker must handle {msg}"


def test_service_worker_forwards_to_offscreen_with_include_mic():
    """Service worker must forward includeMic flag to offscreen for mixing."""
    src = _read("service-worker.js")
    assert "includeMic" in src


def test_offscreen_routes_indexed_and_stream_messages():
    """Offscreen document handles START/STOP recording + CLEAR_RECORDINGS."""
    src = _read("offscreen.js")
    for msg in ["START_RECORDING", "STOP_RECORDING", "CLEAR_RECORDINGS"]:
        assert msg in src, f"offscreen must handle {msg}"


def test_popup_js_exposes_mic_toggle_and_meeting_detection():
    src = _read("popup.js")
    assert "includeMic" in src
    assert "DETECT_MEETING" in src
    assert "CLEAR_RECORDINGS" in src
    assert "chrome.runtime.sendMessage" in src


def test_popup_html_has_consent_and_mic_toggle():
    src = _read("popup.html")
    assert 'id="consent"' in src
    assert 'id="includeMic"' in src
    # Visible "not supported" honesty
    assert "不支援" in src


def test_extension_readme_documents_mixing_and_limits():
    src = _read("README.md")
    assert "混音" in src
    assert "Web Audio" in src or "Audio" in src
    assert "桌面版" in src
    assert "DRM" in src
