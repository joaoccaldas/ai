from __future__ import annotations

import json
from pathlib import Path

from noema.compare import build_comparison


ROOT = Path(__file__).parents[1]
PROTOCOL = ROOT / "data" / "comparisons" / "deep-time-constructs.json"
LEFT = ROOT / "data" / "reviewed" / "evidence-pack-002-deep-time.json"
RIGHT = ROOT / "data" / "reviewed" / "evidence-pack-003-homo-sapiens.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_construct_matched_comparison_builds_without_species_score() -> None:
    result = build_comparison(load(PROTOCOL), load(LEFT), load(RIGHT))
    assert result["summary"]["matched_constructs"] == 4
    assert "species intelligence score" in [x.lower() for x in result["forbidden_outputs"]]
    assert "cognitive superiority ranking" in [x.lower() for x in result["forbidden_outputs"]]
    assert "score" not in result["summary"]


def test_mortuary_comparison_is_construct_level_not_theology() -> None:
    result = build_comparison(load(PROTOCOL), load(LEFT), load(RIGHT))
    row = next(r for r in result["rows"] if r["id"] == "MORTUARY")
    assert row["comparability"] == "HIGH_AT_CONSTRUCT_LEVEL"
    assert row["left"]["status"] == "SUPPORTED_SITE_SPECIFIC"
    assert row["right"]["status"] == "SUPPORTED_SITE_SPECIFIC"
    assert "theology" in row["interpretation"].lower()


def test_burial_theology_guardrail_remains_asymmetric_but_explicit() -> None:
    result = build_comparison(load(PROTOCOL), load(LEFT), load(RIGHT))
    row = next(r for r in result["rows"] if r["id"] == "BURIAL_THEOLOGY")
    assert row["left"]["type"] == "hypothesis"
    assert row["left"]["support_count"] == 0
    assert row["right"]["type"] == "claim"
    assert "does not establish an afterlife doctrine" in row["right"]["evidence_balance"]


def test_material_comparison_declares_partial_comparability() -> None:
    result = build_comparison(load(PROTOCOL), load(LEFT), load(RIGHT))
    row = next(r for r in result["rows"] if r["id"] == "MATERIAL")
    assert row["comparability"].startswith("PARTIAL")
    assert "not interchangeable" in row["interpretation"]
