from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.evidence import EvidencePackError, build_analysis_projection, validate_pack


PACK = Path(__file__).parents[1] / "data" / "reviewed" / "evidence-pack-001.json"


def load_pack() -> dict:
    return json.loads(PACK.read_text(encoding="utf-8"))


def test_pack_is_referentially_valid_and_not_published() -> None:
    pack = load_pack()
    validate_pack(pack)
    assert pack["publication_status"] == "RESEARCH_PREVIEW"
    assert "HUMAN_REVIEW_PENDING" in pack["review_status"]
    assert all(c["review_status"] == "HUMAN_REVIEW_PENDING" for c in pack["claims"])


def test_pack_uses_ledgers_not_fake_posteriors() -> None:
    pack = load_pack()
    assert all("posterior_probability" not in h for h in pack["hypotheses"])
    projection = build_analysis_projection(pack)
    h1 = next(h for h in projection["hypothesis_ledger"] if h["id"] == "H001")
    assert h1["support_count"] == 0
    assert h1["challenge_count"] == 3


def test_claim_scope_preserves_micro_macro_distinction() -> None:
    pack = load_pack()
    c3 = next(c for c in pack["claims"] if c["id"] == "C003")
    assert "does not by itself establish historical causation" in c3["scope"]


def test_unknown_cannot_be_silently_published_as_absent() -> None:
    pack = load_pack()
    assert "UNKNOWN is not ABSENT." in pack["epistemic_rules"]
    c4 = next(c for c in pack["claims"] if c["id"] == "C004")
    assert "missing" in c4["claim_text"].lower()
    assert "absences" in c4["claim_text"].lower()


def test_published_pending_pack_is_rejected() -> None:
    pack = load_pack()
    pack["publication_status"] = "PUBLISHED"
    with pytest.raises(EvidencePackError):
        validate_pack(pack)
