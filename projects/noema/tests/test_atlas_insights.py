import json
from pathlib import Path

from noema.atlas import build_human_meaning_atlas
from noema.atlas_insights import derive_atlas_insights


ROOT = Path(__file__).resolve().parents[1]


def load(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def test_atlas_insights_are_descriptive_and_guard_cross_pack_recurrence():
    atlas = build_human_meaning_atlas(
        [
            load("data/reviewed/evidence-pack-001.json"),
            load("data/reviewed/evidence-pack-002-deep-time.json"),
            load("data/reviewed/evidence-pack-003-homo-sapiens.json"),
        ],
        load("site/societies.json"),
    )
    insights = derive_atlas_insights(atlas)

    assert insights["diagnostics"]["oldest_mapped_center_bp"] is not None
    assert insights["diagnostics"]["pre_oldest_time_domain_is_evidence_gap"] is True
    assert insights["diagnostics"]["unmapped_dated_events"] == 1
    assert any(s["kind"] == "MAPPING_BLIND_SPOT" for s in insights["signals"])

    recurrence = [s for s in insights["signals"] if s["kind"] == "CROSS_PACK_RECURRENCE"]
    assert recurrence
    for signal in recurrence:
        guard = signal["guard"].lower()
        assert "not evidence of shared meaning" in guard
        assert "transmission" in guard

    serialized = json.dumps(insights).lower()
    assert "origin estimate" not in serialized
    assert "species score" not in serialized
