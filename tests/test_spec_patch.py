"""SPEC §0.5 Public Release Mode patch sanity checks.

Confirms the v3.0.0-Public Patch from 2026-08-08 is present, structured, and
self-consistent. Catches accidental deletion of patch sections.
"""
from __future__ import annotations

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SPEC = (ROOT / "PRD" / "SPEC.md").read_text(encoding="utf-8")


def test_section_0_5_present():
    assert "## 0.5" in SPEC
    assert "Public Release Mode" in SPEC


def test_section_0_5_subsections_present():
    for sub in [
        "0.5.1 為什麼加這個 patch",
        "0.5.2 公開版目標",
        "0.5.3 會員制 v1.1 預留",
        "0.5.4 公開版 KPI",
        "0.5.5 UI/UX 基準",
        "0.5.6 Chrome 擴充範圍",
        "0.5.7 部署",
    ]:
        assert sub in SPEC, f"missing subsection {sub}"


def test_public_release_explicitly_disables_cloud_ai():
    # Critical: v1 public mode MUST NOT enable cloud STT/LLM by default
    # (otherwise we re-introduce the cost/privacy risk the patch avoided)
    section = SPEC.split("## 0.5", 1)[1].split("## 1.", 1)[0]
    assert "雲端 STT / LLM" in section
    assert "❌" in section  # explicit non-goal marker
    assert "OPT_IN" not in section.upper() or "不啟用" in section


def test_extension_scope_admits_desktop_app_as_unsupported():
    section = SPEC.split("## 0.5", 1)[1].split("## 1.", 1)[0]
    # SPEC §0.5.6 must say desktop apps are NOT supported (Chrome permission limit)
    assert "桌面版 Zoom" in section or "桌面版" in section
    assert "Chrome 權限" in section


def test_membership_v1_1_boundary_explicit():
    section = SPEC.split("## 0.5", 1)[1].split("## 1.", 1)[0]
    # v1.1 must enumerate what membership adds vs public
    assert "會員制 v1.1" in section
    for capability in ["雲端 STT", "Notion OAuth", "Slack OAuth", "跨裝置"]:
        assert capability in section, f"v1.1 must enumerate {capability}"


def test_deployment_does_not_request_token_in_chat():
    section = SPEC.split("## 0.5", 1)[1].split("## 1.", 1)[0]
    assert "Vercel Git Integration" in section
    assert "token" in section.lower()
    # Explicitly forbid pasting tokens in chat
    assert "對話" in section
    assert "❌" in section


def test_kpis_use_visitors_not_mrr():
    """Public release KPI must be unique visitors, not MRR (free product)."""
    section = SPEC.split("## 0.5", 1)[1].split("## 1.", 1)[0]
    assert "unique visitors" in section or "active users" in section


def test_otter_ux_baseline_documented():
    section = SPEC.split("## 0.5", 1)[1].split("## 1.", 1)[0]
    assert "Otter" in section
    assert "雙欄" in section
    # 7 differentiators
    assert "繁中排版" in section
    assert "動作項卡片" in section
    assert "保密模式視覺" in section
    assert "即時狀態機" in section
    assert "空白狀態" in section
    assert "深色模式" in section
    assert "快捷鍵" in section
