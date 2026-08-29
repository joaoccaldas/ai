import json
from pathlib import Path

import pytest

from noema.atlas import AtlasError, build_human_meaning_atlas


ROOT = Path(__file__).resolve().parents[1]


def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def test_human_meaning_atlas_preserves_mapping_and_inference_guards():
    societies = load("site/societies.json")
    packs = [
        load("data/reviewed/evidence-pack-001.json"),
        load("data/reviewed/evidence-pack-002-deep-time.json"),
        load("data/reviewed/evidence-pack-003-homo-sapiens.json"),
    ]
    atlas = build_human_meaning_atlas(packs, societies)

    assert atlas["atlas_id"] == "NOEMA-HUMAN-MEANING-ATLAS-001"
    assert atlas["release"] == "v0.9"
    assert atlas["summary"]["coverage_societies"] == 100
    assert atlas["summary"]["evidence_packs"] == 3
    assert atlas["summary"]["mapped_dated_events"] > 0
    assert atlas["time_domain_bp"]["max"] == 500000

    for event in atlas["mapped_events"]:
        assert event["site"] is not None
        assert event["site"]["latitude"] is not None
        assert event["site"]["longitude"] is not None
        assert event["source_url"].startswith("https://")
        assert event["review_status"] == "HUMAN_REVIEW_PENDING"
        assert event["time"]["center_bp"] >= 0

    forbidden = {x.lower() for x in atlas["forbidden_inferences"]}
    assert "burial equals afterlife doctrine" in forbidden
    assert "ochre equals ritual" in forbidden
    assert "species ranking from evidence counts" in forbidden
    assert "coverage point equals coded belief evidence" in forbidden


def test_coverage_requires_verified_benchmark_size():
    societies = load("site/societies.json")
    societies["actual_size"] = 99
    pack = load("data/reviewed/evidence-pack-002-deep-time.json")
    with pytest.raises(AtlasError, match="100-society"):
        build_human_meaning_atlas([pack], societies)


def test_current_oldest_observation_is_not_labeled_origin():
    societies = load("site/societies.json")
    packs = [
        load("data/reviewed/evidence-pack-002-deep-time.json"),
        load("data/reviewed/evidence-pack-003-homo-sapiens.json"),
    ]
    atlas = build_human_meaning_atlas(packs, societies)
    serialized = json.dumps(atlas).lower()
    assert "evolutionary origin" in serialized
    assert "origin_date" not in serialized
    assert "species_score" not in serialized
