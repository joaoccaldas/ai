import pytest

from noema.models import (
    CandidateRelationship,
    Claim,
    Hypothesis,
    RelationType,
)
from noema.scoring import score_candidate


def test_claim_requires_provenance():
    with pytest.raises(ValueError):
        Claim(text="ritual existed", source_id="")


def test_hypothesis_requires_alternative_and_falsifier():
    with pytest.raises(ValueError):
        Hypothesis(statement="X caused Y", alternatives=(), falsification_criteria=("test",))
    with pytest.raises(ValueError):
        Hypothesis(statement="X caused Y", alternatives=("Z caused Y",), falsification_criteria=())


def test_embedding_similarity_cannot_validate_descent_by_itself():
    candidate = CandidateRelationship(
        source_entity_id="a",
        target_entity_id="b",
        relation_type=RelationType.DESCENDS_FROM,
        semantic_similarity=0.99,
        evidence_quality=0.1,
        temporal_plausibility=1.0,
        geographic_plausibility=1.0,
        ancestry_independence=0.5,
        source_independence=0.5,
        coding_bias_risk=0.1,
    )
    result = score_candidate(candidate)
    assert result.blocked is True
    assert result.validation_score < result.interest_score


def test_temporal_impossibility_blocks_diffusion():
    candidate = CandidateRelationship(
        source_entity_id="later",
        target_entity_id="earlier",
        relation_type=RelationType.POSSIBLY_DIFFUSED_TO,
        semantic_similarity=0.95,
        temporal_plausibility=0.0,
        geographic_plausibility=1.0,
        ancestry_independence=0.9,
        source_independence=0.9,
        evidence_quality=0.9,
        coding_bias_risk=0.1,
    )
    result = score_candidate(candidate)
    assert result.blocked is True
    assert any("temporally impossible" in reason for reason in result.reasons)


def test_coding_bias_penalizes_validation():
    clean = CandidateRelationship(
        source_entity_id="a", target_entity_id="b",
        relation_type=RelationType.RESEMBLES,
        semantic_similarity=0.8, evidence_quality=0.8,
        ancestry_independence=0.8, source_independence=0.8,
        coding_bias_risk=0.1,
    )
    biased = CandidateRelationship(
        source_entity_id="a", target_entity_id="b",
        relation_type=RelationType.RESEMBLES,
        semantic_similarity=0.8, evidence_quality=0.8,
        ancestry_independence=0.8, source_independence=0.8,
        coding_bias_risk=0.9,
    )
    assert score_candidate(biased).validation_score < score_candidate(clean).validation_score
