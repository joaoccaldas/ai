from __future__ import annotations

from dataclasses import dataclass

from .models import CandidateRelationship, RelationType


@dataclass(frozen=True)
class RelationshipScore:
    interest_score: float
    validation_score: float
    blocked: bool
    reasons: tuple[str, ...]


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def score_candidate(candidate: CandidateRelationship) -> RelationshipScore:
    """Score research interest separately from evidential validation.

    High semantic similarity can make a relationship interesting, but cannot
    validate descent, diffusion, or causation. Confounders reduce validation.
    """
    reasons: list[str] = []

    factors = (
        _clamp(candidate.semantic_similarity),
        _clamp(candidate.temporal_plausibility),
        _clamp(candidate.geographic_plausibility),
        _clamp(candidate.ancestry_independence),
        _clamp(candidate.source_independence),
        _clamp(candidate.evidence_quality),
    )
    interest = sum(factors) / len(factors)

    confounder_penalty = (
        _clamp(candidate.coding_bias_risk) * 0.45
        + _clamp(candidate.contact_explanation_strength) * 0.35
        + (1 - _clamp(candidate.source_independence)) * 0.20
    )
    validation = _clamp(
        0.30 * candidate.evidence_quality
        + 0.20 * candidate.temporal_plausibility
        + 0.15 * candidate.geographic_plausibility
        + 0.20 * candidate.ancestry_independence
        + 0.15 * candidate.source_independence
        - confounder_penalty
    )

    blocked = False
    directional = {
        RelationType.DESCENDS_FROM,
        RelationType.POSSIBLY_DIFFUSED_TO,
        RelationType.PREDICTS,
        RelationType.PRECEDES,
    }
    if candidate.relation_type in directional and candidate.temporal_plausibility <= 0:
        blocked = True
        reasons.append("directional relationship is temporally impossible")

    if candidate.relation_type in {
        RelationType.DESCENDS_FROM,
        RelationType.POSSIBLY_DIFFUSED_TO,
    } and candidate.evidence_quality < 0.5:
        blocked = True
        reasons.append("historical transmission claim lacks sufficient evidence quality")

    if candidate.semantic_similarity >= 0.9 and candidate.evidence_quality < 0.3:
        reasons.append("high semantic similarity is hypothesis-generation only")

    if candidate.coding_bias_risk >= 0.7:
        reasons.append("coding/category artifact is a major alternative explanation")

    return RelationshipScore(
        interest_score=round(_clamp(interest), 4),
        validation_score=round(validation, 4),
        blocked=blocked,
        reasons=tuple(reasons),
    )
