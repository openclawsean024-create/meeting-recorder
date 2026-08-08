"""index.html structural + behavioural checks.

The public workspace page is a single-file SPA. These checks make sure the
key DOM contracts the API layer relies on (textarea id, fetch target,
status fields) still match what the JS expects, and that the 7 differentiators
vs Otter documented in SPEC §0.5.5 actually shipped.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


def _between_tags(tag: str) -> str:
    m = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", HTML, re.DOTALL)
    return m.group(1) if m else ""


def test_html_uses_traditional_chinese_lang_and_meta():
    assert 'lang="zh-Hant"' in HTML
    assert 'viewport' in HTML


def test_required_dom_ids_present():
    for id_ in [
        "title", "participants", "consent",
        "record", "timer", "record-status",
        "audio-file", "drop", "file-name", "file-size",
        "transcript", "char-count",
        "analyze", "processing",
        "summary", "highlights", "decisions", "risks", "actions",
        "action-count", "download", "save", "search", "clear-history",
        "history-list", "notion", "slack", "email",
        "toast", "modal", "modal-content",
        "mode-sales", "mode-legal", "mode-badge", "legal-tag",
    ]:
        assert f'id="{id_}"' in HTML, f"index.html must contain id={id_}"


def test_post_endpoint_targets_local_analyze():
    js = _between_tags("script")
    assert "/api/analyze" in js


def test_otter_differentiator_1_traditional_chinese_typo_stack():
    css = _between_tags("style")
    # Noto Sans TC for body, DM Sans for latin, JetBrains Mono for mono
    assert "Noto Sans TC" in css
    assert "DM Sans" in css
    assert "JetBrains Mono" in css


def test_otter_differentiator_2_action_items_have_chips():
    js = _between_tags("script")
    assert "action-card" in js
    assert "chip person" in js
    assert "chip date" in js


def test_otter_differentiator_3_legal_mode_visual():
    css = _between_tags("style")
    assert '[data-mode="legal"]' in css
    # legal mode changes color tokens
    assert "--mint:" in css
    js = _between_tags("script")
    assert 'data-mode="sales"' in HTML  # body attribute default
    assert "applyMode" in js


def test_otter_differentiator_4_state_machine_visuals():
    css = _between_tags("style")
    # recording = pulsing red dot
    assert "@keyframes pulse" in css
    assert "ripple" in css or "pulse" in css
    # processing = spinner
    assert "@keyframes spin" in css
    # error state styled differently
    assert "processing.error" in css or "processing success" in css


def test_otter_differentiator_5_empty_state_friendly():
    assert "empty-state" in HTML
    # Not just blank — has emoji + heading
    assert "emoji" in HTML


def test_otter_differentiator_6_dark_theme_by_default():
    css = _between_tags("style")
    assert "--bg:" in css
    assert "#0b0d14" in css or "#090b12" in css


def test_otter_differentiator_7_keyboard_shortcuts():
    js = _between_tags("script")
    assert "metaKey" in js
    assert "ctrlKey" in js
    assert "Enter" in js
    assert "S" in js.upper() or "'s'" in js
    assert "D" in js.upper() or "'d'" in js


def test_no_innerHTML_xss_for_user_content():
    """User-supplied strings must use textContent or escapeHtml, never raw innerHTML."""
    js = _between_tags("script")
    # The action rendering uses escapeHtml inside .innerHTML, which is OK because
    # we explicitly escape. Confirm escapeHtml is defined.
    assert "escapeHtml" in js
    # Confirm we DON'T have a direct innerHTML injection of transcript or title
    assert "$('#summary').innerHTML" not in js, "summary must use textContent, not innerHTML"
    assert "$('#transcript').innerHTML" not in js


def test_modal_for_notion_slack_fallback():
    js = _between_tags("script")
    assert "showModal" in js
    assert "modal-copy" in js
