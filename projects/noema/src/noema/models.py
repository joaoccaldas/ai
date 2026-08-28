from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class EpistemicStatus(StrEnum):
    KNOWN = "KNOWN"
    SUPPORTED = "SUPPORTED"
    PLAUSIBLE = "PLAUSIBLE"
    DISPUTED = "DISPUTED"
    SPECULATIVE = "SPECULATIVE"
    UNKNOWN = "UNKNOWN"
    UNTESTABLE = "UNTESTABLE"


class EvidenceLevel(StrEnum):
    E0 = "E0"
    E1 = "E1"
    E2 = "E2"
    E3 = "E3"
    E4 = "E4"


class RelationType(StrEnum):
    PRECEDES = "PRECEDES"
    CO_OCCURS_WITH = "CO_OCCURS_WITH"
    RESEMBLES = "RESEMBLES"
    DESCENDS_FROM = "DESCENDS_FROM"
    POSSIBLY_DIFFUSED_TO = "POSSIBLY_DIFFUSED_TO"
    CONTRADICTS = "CONTRADICTS"
    SUPPORTED_BY = "SUPPORTED_BY"
    DISPUTED_BY = "DISPUTED_BY"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    PREDICTS = "PREDICTS"
    LOCATED_AT = "LOCATED_AT"
    PART_OF = "PART_OF"
    LINGUISTICALLY_RELATED_TO = "LINGUISTICALLY_RELATED_TO"
    GENETICALLY_RELATED_TO = "GENETICALLY_RELATED_TO"
    TRADE_CONNECTED_TO = "TRADE_CONNECTED_TO"
    ECOLOGICALLY_SIMILAR_TO = "ECOLOGICALLY_SIMILAR_TO"


@dataclass(frozen=True)
class TemporalRange:
    start_min: int | None = None
    start_max: int | None = None
    end_min: int | None = None
    end_max: int | None = None

    def can_precede(self, other: "TemporalRange") -> bool:
        """Conservative directional plausibility check.

        If either side is unknown we do not reject the relationship. If the
        latest plausible beginning of self occurs after the earliest plausible
        end/beginning of other, directional precedence is impossible.
        """
        if self.start_min is None or other.start_max is None:
            return True
        return self.start_min <= other.start_max


@dataclass(frozen=True)
class Claim:
    text: str
    source_id: str
    epistemic_status: EpistemicStatus = EpistemicStatus.SUPPORTED
    evidence_level: EvidenceLevel = EvidenceLevel.E1
    confidence: float = 0.5
    temporal_range: TemporalRange = field(default_factory=TemporalRange)
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.source_id.strip():
            raise ValueError("Every claim requires source provenance")
        if not 0 <= self.confidence <= 1:
            raise ValueError("confidence must be between 0 and 1")


@dataclass(frozen=True)
class CandidateRelationship:
    source_entity_id: str
    target_entity_id: str
    relation_type: RelationType
    semantic_similarity: float
    temporal_plausibility: float = 1.0
    geographic_plausibility: float = 1.0
    ancestry_independence: float = 0.5
    source_independence: float = 0.5
    evidence_quality: float = 0.5
    coding_bias_risk: float = 0.5
    contact_explanation_strength: float = 0.0


@dataclass(frozen=True)
class Hypothesis:
    statement: str
    alternatives: tuple[str, ...]
    falsification_criteria: tuple[str, ...]
    prior_probability: float = 0.5

    def __post_init__(self) -> None:
        if not self.alternatives:
            raise ValueError("Hypotheses require at least one alternative")
        if not self.falsification_criteria:
            raise ValueError("Hypotheses require falsification criteria")
        if not 0 <= self.prior_probability <= 1:
            raise ValueError("prior_probability must be between 0 and 1")
