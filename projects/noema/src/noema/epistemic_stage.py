from __future__ import annotations

from enum import StrEnum


class EpistemicStage(StrEnum):
    """How far a scientific output has earned the right to go.

    Workflow state and epistemic stage are intentionally separate. A successful
    automation run can still have no epistemic stage at all when it only
    discovers or triages candidates.
    """

    OBSERVED = "OBSERVED"
    REVIEWED = "REVIEWED"
    NOMINATION = "NOMINATION"
    STRATIFIED = "STRATIFIED"
    ADJUSTED = "ADJUSTED"
    SPATIAL = "SPATIAL"
    PHYLOGENETIC = "PHYLOGENETIC"
    TEMPORAL = "TEMPORAL"
    CAUSAL_CANDIDATE = "CAUSAL_CANDIDATE"


ORDER = tuple(EpistemicStage)
RANK = {stage: index for index, stage in enumerate(ORDER)}


def is_valid_stage(value: str | None) -> bool:
    if value is None:
        return True
    try:
        EpistemicStage(value)
    except ValueError:
        return False
    return True


def at_least(value: str, threshold: str) -> bool:
    """Return whether *value* is at or beyond *threshold* in the ladder.

    This is a workflow/guardrail ordering helper, not a claim that later stages
    are automatically better evidence. Each stage still requires its own
    domain-appropriate assumptions and review.
    """

    return RANK[EpistemicStage(value)] >= RANK[EpistemicStage(threshold)]
