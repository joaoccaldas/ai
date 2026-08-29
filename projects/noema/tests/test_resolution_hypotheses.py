from noema.hypothesis_engine import EvidenceSignal, revise_probability
from noema.resolution import EntityCandidate, resolve_entity


def test_name_match_never_auto_merges():
    result = resolve_entity(
        "Aymara",
        "CULTURE",
        [EntityCandidate("e1", "Aymara", "CULTURE", temporal_overlap=1, geographic_overlap=1)],
    )
    assert result.action == "HUMAN_REVIEW"


def test_external_id_can_auto_merge_same_type():
    result = resolve_entity(
        "Aymara people",
        "CULTURE",
        [EntityCandidate("e1", "Aymara", "CULTURE", frozenset({"glottolog:cent2142"}))],
        frozenset({"glottolog:cent2142"}),
    )
    assert result.action == "AUTO_MERGE"
    assert result.entity_id == "e1"


def test_external_id_does_not_merge_different_entity_type():
    result = resolve_entity(
        "Aymara",
        "LANGUAGE",
        [EntityCandidate("e1", "Aymara", "CULTURE", frozenset({"x:1"}))],
        frozenset({"x:1"}),
    )
    assert result.action == "CREATE_NEW"


def test_high_quality_independent_support_moves_probability_more():
    independent = revise_probability(0.5, [EvidenceSignal(4.0, independence=1.0, quality=1.0)])
    dependent = revise_probability(0.5, [EvidenceSignal(4.0, independence=0.1, quality=1.0)])
    assert independent > dependent > 0.5


def test_contradictory_evidence_can_lower_probability():
    result = revise_probability(0.7, [EvidenceSignal(5.0, independence=1.0, quality=1.0, direction="CONTRADICTS")])
    assert result < 0.7


def test_duplicate_low_independence_is_discounted():
    one = revise_probability(0.5, [EvidenceSignal(3.0, independence=0.1, quality=0.8)])
    ten = revise_probability(0.5, [EvidenceSignal(3.0, independence=0.01, quality=0.8) for _ in range(10)])
    assert abs(one - ten) < 0.02
