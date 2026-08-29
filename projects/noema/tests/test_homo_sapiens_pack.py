from __future__ import annotations

import json
from pathlib import Path

from noema.evidence import build_analysis_projection, validate_pack


PACK = Path(__file__).parents[1] / "data" / "reviewed" / "evidence-pack-003-homo-sapiens.json"


def load_pack() -> dict:
    return json.loads(PACK.read_text(encoding="utf-8"))


def test_pack_validates_and_stays_review_gated() -> None:
    pack = load_pack()
    validate_pack(pack)
    assert pack["publication_status"] == "RESEARCH_PREVIEW"
    assert all(c["review_status"] == "HUMAN_REVIEW_PENDING" for c in pack["claims"])
    assert all(c.get("scope") and c.get("observation_inference") for c in pack["claims"])


def test_ochre_is_not_encoded_as_intrinsically_symbolic() -> None:
    pack = load_pack()
    h = next(h for h in pack["hypotheses"] if h["id"] == "HS-H002")
    assert h["supporting_claim_ids"] == []
    assert h["challenging_claim_ids"] == ["HS-C004"]
    c = next(c for c in pack["claims"] if c["id"] == "HS-C004")
    assert c["evidence_level"] == "E4"
    assert "practical" in c["scope"].lower()


def test_graphic_design_is_not_upgraded_to_writing() -> None:
    pack = load_pack()
    h = next(h for h in pack["hypotheses"] if h["id"] == "HS-H005")
    assert h["supporting_claim_ids"] == []
    assert set(h["challenging_claim_ids"]) == {"HS-C001", "HS-C007"}
    c = next(c for c in pack["claims"] if c["id"] == "HS-C003")
    assert "does not establish writing" in c["scope"]


def test_mortuary_claim_does_not_encode_theology() -> None:
    pack = load_pack()
    c = next(c for c in pack["claims"] if c["id"] == "HS-C005")
    assert "does not establish an afterlife doctrine" in c["scope"]


def test_analysis_projection_remains_descriptive() -> None:
    projection = build_analysis_projection(load_pack())
    assert projection["counts"] == {"sources": 6, "claims": 7, "hypotheses": 6}
    assert all("posterior_probability" not in h for h in projection["hypothesis_ledger"])
