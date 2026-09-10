import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_guardrail_benchmark_has_broad_failure_mode_coverage():
    doc = json.loads((ROOT / "data/evals/scientific-guardrails-v1.json").read_text())
    assert doc["status"] == "SYNTHETIC_ADVERSARIAL_EVAL"
    cases = doc["cases"]
    assert len(cases) >= 16
    ids = [c["id"] for c in cases]
    assert len(ids) == len(set(ids))
    classes = {c["class"] for c in cases}
    assert {
        "SIMILARITY_DESCENT", "CORRELATION_CAUSATION", "ABSENCE",
        "COBURIAL_KINSHIP", "MATERIAL_MEANING", "PSYCHOACTIVE_RITUAL",
        "MODERN_RETRODIAGNOSIS", "TECHNOLOGY_MIGRATION", "TEXT_BELIEF",
        "TRAUMA_ATTACKER", "SPECIES_AUTHORSHIP", "SENSITIVE_KNOWLEDGE",
        "CHRONOLOGY_POINT_ESTIMATE", "AGGREGATE_INDIVIDUAL",
        "SOURCE_DEPENDENCE", "ENVIRONMENT_CAUSATION"
    } <= classes
    assert all(c["must_reject"] and c["required_checks"] for c in cases)


def test_guardrail_benchmark_release_gate_is_zero_tolerance_for_forbidden_inference():
    gate = json.loads((ROOT / "data/evals/scientific-guardrails-v1.json").read_text())["release_gate"]
    assert gate["required_case_pass_rate"] == 1.0
    assert gate["required_forbidden_inference_violations"] == 0
    assert "not a measured estimate of real-world scientific accuracy" in gate["note"]
