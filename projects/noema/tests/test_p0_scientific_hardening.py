from __future__ import annotations

import json
import re
from pathlib import Path

from noema.epistemic_stage import EpistemicStage, at_least, is_valid_stage


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
REGISTRY = PROJECT_ROOT / "data" / "automation-registry-v2.json"
EVAL = PROJECT_ROOT / "data" / "evals" / "noema-eval-001.json"
WORKFLOWS = REPO_ROOT / ".github" / "workflows"


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def test_epistemic_stage_ladder_is_explicit_and_ordered():
    values = [stage.value for stage in EpistemicStage]
    assert values == [
        "OBSERVED",
        "REVIEWED",
        "NOMINATION",
        "STRATIFIED",
        "ADJUSTED",
        "SPATIAL",
        "PHYLOGENETIC",
        "TEMPORAL",
        "CAUSAL_CANDIDATE",
    ]
    assert is_valid_stage("STRATIFIED")
    assert is_valid_stage(None)
    assert not is_valid_stage("CAUSAL_SUPPORTED")
    assert at_least("SPATIAL", "ADJUSTED")
    assert not at_least("NOMINATION", "SPATIAL")


def test_registry_covers_every_noema_github_workflow_exactly_once():
    registry = load(REGISTRY)
    registered = [item["path"] for item in registry["github_workflows"]]
    actual = sorted(
        str(path.relative_to(REPO_ROOT))
        for path in WORKFLOWS.glob("noema-*.yml")
    )
    assert len(registered) == len(set(registered)), "duplicate workflow registration"
    assert sorted(registered) == actual, (
        "NOEMA workflow inventory drift: update automation-registry-v2.json whenever "
        "a noema-*.yml workflow is added, renamed or removed"
    )


def test_registered_cron_matches_workflow_source():
    registry = load(REGISTRY)
    by_path = {item["path"]: item for item in registry["github_workflows"]}
    cron_re = re.compile(r"cron:\s*['\"]([^'\"]+)['\"]")
    for relative, spec in by_path.items():
        text = (REPO_ROOT / relative).read_text()
        discovered = cron_re.findall(text)
        expected = [] if spec.get("cron") is None else [spec["cron"]]
        assert discovered == expected, (relative, discovered, expected)


def test_recurring_tasks_have_bounded_authority_and_known_stages():
    registry = load(REGISTRY)
    github_paths = {item["path"] for item in registry["github_workflows"]}
    task_types = [task["task_type"] for task in registry["tasks"]]
    assert len(task_types) == len(set(task_types))
    assert "MUSEUM_MEDIA_DISCOVERY" in task_types
    for task in registry["tasks"]:
        assert task["authority"]
        assert task["writes"]
        assert task["next_stage"]
        assert task["expected_interval_hours"] > 0
        assert is_valid_stage(task.get("max_epistemic_stage"))
        workflow_path = task.get("workflow_path")
        if task["scheduler"] == "GITHUB_ACTIONS":
            assert workflow_path in github_paths
        else:
            assert workflow_path is None


def test_eval_001_is_adversarial_not_a_fake_gold_standard():
    suite = load(EVAL)
    assert suite["status"] == "FOUNDATION_SYNTHETIC_NOT_DOMAIN_GOLD"
    cases = suite["cases"]
    assert len(cases) >= 12
    ids = [case["case_id"] for case in cases]
    assert len(ids) == len(set(ids))
    categories = {case["category"] for case in cases}
    required = {
        "SOURCE_DEPENDENCE",
        "CHRONOLOGY",
        "MISSINGNESS",
        "SPATIAL_CONFOUNDING",
        "SHARED_ANCESTRY",
        "CONTACT",
        "LITERATURE_INTEGRITY",
        "EXTRACTION",
        "COGNITION_GUARDRAIL",
        "MEDIA_PROVENANCE",
        "DISAGREEMENT",
        "PRESERVATION_AND_MISSINGNESS",
    }
    assert required <= categories
    for case in cases:
        assert case["scenario"]
        assert case["expected_decision"]
        assert case["required_guard"]
        assert is_valid_stage(case.get("max_epistemic_stage"))
        assert case["expected_decision"] != "AUTO_PROMOTE_TO_CAUSAL_SUPPORTED"
