from __future__ import annotations

import json
from pathlib import Path

from noema.evidence import build_analysis_projection, validate_pack


PACK = Path(__file__).parents[1] / "data" / "reviewed" / "evidence-pack-002-deep-time.json"


def load_pack() -> dict:
    return json.loads(PACK.read_text(encoding="utf-8"))


def test_deep_time_pack_validates_with_claim_scopes() -> None:
    pack = load_pack()
    validate_pack(pack)
    assert all(c.get("scope") for c in pack["claims"])
    assert all(c.get("observation_inference") for c in pack["claims"])
    assert all(c["review_status"] == "HUMAN_REVIEW_PENDING" for c in pack["claims"])


def test_burial_to_religion_inference_has_no_supporting_claim() -> None:
    pack = load_pack()
    h = next(h for h in pack["hypotheses"] if h["id"] == "DT-H004")
    assert h["status"] == "NOT_ESTABLISHED_BY_CURRENT_EVIDENCE"
    assert h["supporting_claim_ids"] == []
    assert h["challenging_claim_ids"] == []
    assert set(h["related_claim_ids"]) == {"DT-C001", "DT-C002", "DT-C003"}
    assert all("DT-H004" not in c.get("supports", []) for c in pack["claims"])


def test_speculative_common_ancestor_claim_is_kept_low_evidence() -> None:
    pack = load_pack()
    c = next(c for c in pack["claims"] if c["id"] == "DT-C005")
    assert c["observation_inference"] == "AUTHOR_SPECULATIVE_INFERENCE"
    assert c["evidence_level"] == "E1"
    assert c["epistemic_status"] == "SPECULATIVE_EXTRAPOLATION"


def test_analysis_projection_does_not_invent_posteriors() -> None:
    projection = build_analysis_projection(load_pack())
    h = next(h for h in projection["hypothesis_ledger"] if h["id"] == "DT-H003")
    assert "posterior_probability" not in h
    assert h["support_count"] == 1
