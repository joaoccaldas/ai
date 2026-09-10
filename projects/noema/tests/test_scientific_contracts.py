import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_scientific_reasoning_contract_v2_is_conservative():
    doc = json.loads((ROOT / "data/scientific-reasoning-contract-v2.json").read_text())
    assert doc["status"] == "ACTIVE_GUARDRAIL"
    assert doc["required_for_pattern_claims"]["automatic_causal_promotion"] is False
    assert doc["required_for_pattern_claims"]["alternative_mechanisms_minimum"] >= 2
    assert doc["required_for_negative_evidence"]["absence_may_be_called_informative_only_if_detection_probability_gte"] >= 0.8
    assert doc["required_for_chronology"]["retain_uncertainty"] is True
    assert doc["evidence_court"]["human_review_required"] is True
    assert doc["evidence_court"]["automatic_promotion"] is False
    assert {"DIFFUSION", "CONVERGENCE", "SHARED_ANCESTRY", "PRESERVATION_BIAS", "UNKNOWN"} <= set(doc["causal_alternatives"])


def test_civilization_context_is_multidimensional_and_nonhierarchical():
    doc = json.loads((ROOT / "ontology/civilization_context_v1.json").read_text())
    assert doc["status"] == "ANALYTIC_CONTEXT_ONLY"
    dims = doc["dimensions"]
    ids = [d["id"] for d in dims]
    assert len(dims) >= 25
    assert len(ids) == len(set(ids))
    assert {
        "DEMOGRAPHY", "KINSHIP", "SUBSISTENCE", "ECONOMY", "EXCHANGE",
        "GOVERNANCE", "CONFLICT", "TECHNOLOGY", "MOBILITY", "ANCESTRY",
        "LANGUAGE", "ENVIRONMENT", "HEALTH", "COGNITION", "RITUAL",
        "SUPERNATURAL_AGENTS", "MYTH_NARRATIVE", "DIVINATION_MAGIC",
        "ALTERED_STATES", "MORTUARY", "SYMBOLISM", "INSTITUTIONS"
    } <= set(ids)
    assert all(d.get("guards") for d in dims)
    rules = " ".join(doc["cross_dimension_rules"]).lower()
    assert "no single dimension is a civilization score" in rules
    assert "unknown" in rules and "causal" in rules and "phylogenetic" in rules and "spatial" in rules
