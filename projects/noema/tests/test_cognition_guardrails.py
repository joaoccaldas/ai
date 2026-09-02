import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def test_cognition_ontology_forbids_retrodiagnosis():
    doc = load("data/reference/cognition-mechanism-ontology-v1.json")
    forbidden = " ".join(doc["forbidden_inferences"]).lower()
    assert "historical person" in forbidden
    assert "witch" in forbidden and "shaman" in forbidden
    assert "modern diagnostic prevalence" in forbidden
    assert doc["candidate_hypothesis_template"]["historical_diagnosis_allowed"] is False
    assert len(doc["candidate_hypothesis_template"]["required_rivals"]) >= 8


def test_pubmed_seed_is_candidate_only_and_guarded():
    doc = load("data/candidates/pubmed-cognition-seed-v1.json")
    assert doc["status"] == "CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED"
    assert len(doc["records"]) >= 8
    assert any(r["pmid"] == "34343961" for r in doc["records"])
    assert any("witch" in r["title"].lower() for r in doc["records"])
    assert all(r.get("guardrail") for r in doc["records"])
    forbidden = " ".join(doc["forbidden_outputs"]).lower()
    assert "witchcraft accusation equals psychopathology" in forbidden
    assert "shamanism equals neurodivergence" in forbidden
    assert "mysticism equals epilepsy" in forbidden


def test_publication_gate_keeps_cognition_inferences_separate():
    doc = load("site/data.json")
    gate = doc["publication_gate"]
    assert gate["historical_diagnosis_from_resemblance"] is False
    assert gate["witchcraft_accusation_is_clinical_record"] is False
    assert gate["biomedical_mechanism_equals_cultural_meaning"] is False
    assert gate["modern_prevalence_projects_backwards"] is False


def test_pubmed_registry_is_discovery_not_evidence():
    doc = load("site/source-registry-v17.json")
    source = next(s for s in doc["sources"] if s["id"] == "PUBMED")
    assert source["tier"] == "C"
    assert source["status"] == "INTEGRATED_DISCOVERY"
    assert "underlying paper must be reviewed" in source["claim_policy"].lower()
    assert doc["cognition_policy"]["historical_diagnosis_from_resemblance"] is False


def test_automation_contract_contains_pubmed_candidate_only_job():
    doc = load("data/automation-contract-v1.json")
    task = next(t for t in doc["tasks"] if t["task_type"] == "PUBMED_DISCOVERY")
    assert task["authority"] == "BIOMEDICAL_CANDIDATE_DISCOVERY_ONLY"
    assert task["next_stage"] == "HUMAN_REVIEW"
