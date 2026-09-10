from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Iterable


class InferenceStrength(StrEnum):
    DESCRIPTIVE = "DESCRIPTIVE"
    ASSOCIATIONAL = "ASSOCIATIONAL"
    CAUSAL_CANDIDATE = "CAUSAL_CANDIDATE"
    CAUSAL_SUPPORTED = "CAUSAL_SUPPORTED"


class AlternativeMechanism(StrEnum):
    DIFFUSION = "DIFFUSION"
    SHARED_ANCESTRY = "SHARED_ANCESTRY"
    CONVERGENCE = "CONVERGENCE"
    ECOLOGICAL_PRESSURE = "ECOLOGICAL_PRESSURE"
    INDEPENDENT_INNOVATION = "INDEPENDENT_INNOVATION"
    CONTACT = "CONTACT"
    CODING_ARTEFACT = "CODING_ARTEFACT"
    RESEARCHER_BIAS = "RESEARCHER_BIAS"
    PRESERVATION_BIAS = "PRESERVATION_BIAS"
    UNKNOWN = "UNKNOWN"


def _clamp01(x: float) -> float:
    return min(1.0, max(0.0, float(x)))


@dataclass(frozen=True)
class DatingDistribution:
    """Approximate chronological uncertainty without pretending a point date is exact.

    `mean` and `standard_deviation` use the caller's chronology scale (for example
    calibrated years BP). This normal approximation is deliberately lightweight;
    calibrated radiocarbon posteriors should retain their full sampled distribution
    when available and can be summarized into this interface for generic reasoning.
    """

    mean: float
    standard_deviation: float
    method: str
    direct: bool
    source_id: str

    def __post_init__(self) -> None:
        if self.standard_deviation <= 0:
            raise ValueError("standard_deviation must be positive")
        if not self.method.strip() or not self.source_id.strip():
            raise ValueError("dating observations require method and source provenance")

    def probability_older_than(self, other: "DatingDistribution") -> float:
        """P(self is older than other), assuming larger values mean older ages."""
        delta_mean = self.mean - other.mean
        delta_sd = math.sqrt(self.standard_deviation**2 + other.standard_deviation**2)
        z = delta_mean / delta_sd
        return round(_clamp01(0.5 * (1 + math.erf(z / math.sqrt(2)))), 6)


@dataclass(frozen=True)
class DetectabilityModel:
    """Models how likely a phenomenon would be observed if it had existed.

    This prevents non-detection from being silently converted into historical absence.
    """

    preservation_probability: float
    sampling_probability: float
    identification_probability: float
    reporting_probability: float = 1.0
    notes: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        for name, value in (
            ("preservation_probability", self.preservation_probability),
            ("sampling_probability", self.sampling_probability),
            ("identification_probability", self.identification_probability),
            ("reporting_probability", self.reporting_probability),
        ):
            if not 0 <= value <= 1:
                raise ValueError(f"{name} must be between 0 and 1")

    @property
    def observation_probability_if_present(self) -> float:
        return round(
            self.preservation_probability
            * self.sampling_probability
            * self.identification_probability
            * self.reporting_probability,
            6,
        )

    @property
    def absence_is_informative(self) -> bool:
        return self.observation_probability_if_present >= 0.8


@dataclass(frozen=True)
class CorrelationAssessment:
    """A correlation record that is structurally prohibited from implying causation."""

    variable_x: str
    variable_y: str
    effect_size: float
    sample_size: int
    source_count: int
    temporal_order_established: bool = False
    confounders_addressed: tuple[str, ...] = ()
    source_independence: float = 0.5
    replication_count: int = 0

    def __post_init__(self) -> None:
        if not self.variable_x.strip() or not self.variable_y.strip():
            raise ValueError("correlation variables are required")
        if not -1 <= self.effect_size <= 1:
            raise ValueError("effect_size must be between -1 and 1")
        if self.sample_size < 2 or self.source_count < 1 or self.replication_count < 0:
            raise ValueError("invalid sample/source/replication counts")
        if not 0 <= self.source_independence <= 1:
            raise ValueError("source_independence must be between 0 and 1")

    @property
    def inference_strength(self) -> InferenceStrength:
        if not self.temporal_order_established:
            return InferenceStrength.ASSOCIATIONAL
        if not self.confounders_addressed or self.source_independence < 0.7:
            return InferenceStrength.ASSOCIATIONAL
        if self.replication_count < 2:
            return InferenceStrength.CAUSAL_CANDIDATE
        # Even repeated observational association is only a causal candidate here.
        # CAUSAL_SUPPORTED is reserved for domain-specific designs/identification.
        return InferenceStrength.CAUSAL_CANDIDATE

    @property
    def prohibited_inferences(self) -> tuple[str, ...]:
        return (
            "correlation implies causation",
            "cross-sectional association establishes temporal direction",
            "modern association licenses retrospective diagnosis",
            "aggregate association applies to every individual or society",
        )


@dataclass(frozen=True)
class MechanismCandidate:
    mechanism: AlternativeMechanism
    support: float
    independent_evidence: float
    chronology_fit: float
    geography_fit: float
    unresolved_confounders: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        for value in (self.support, self.independent_evidence, self.chronology_fit, self.geography_fit):
            if not 0 <= value <= 1:
                raise ValueError("mechanism factors must be between 0 and 1")

    @property
    def score(self) -> float:
        raw = (
            0.35 * self.support
            + 0.30 * self.independent_evidence
            + 0.20 * self.chronology_fit
            + 0.15 * self.geography_fit
        )
        penalty = min(0.45, 0.08 * len(self.unresolved_confounders))
        return round(_clamp01(raw - penalty), 4)


@dataclass(frozen=True)
class CausalAlternativesAssessment:
    observed_pattern: str
    candidates: tuple[MechanismCandidate, ...]

    def __post_init__(self) -> None:
        if not self.observed_pattern.strip():
            raise ValueError("observed_pattern is required")
        if len(self.candidates) < 2:
            raise ValueError("causal assessment requires at least two competing mechanisms")
        kinds = [c.mechanism for c in self.candidates]
        if len(kinds) != len(set(kinds)):
            raise ValueError("each mechanism may appear only once")

    def ranked(self) -> tuple[MechanismCandidate, ...]:
        return tuple(sorted(self.candidates, key=lambda c: c.score, reverse=True))

    @property
    def winner_is_decisive(self) -> bool:
        ranked = self.ranked()
        return ranked[0].score >= 0.75 and ranked[0].score - ranked[1].score >= 0.20


@dataclass(frozen=True)
class EvidenceCourtCase:
    """Structured adjudication envelope for a claim before promotion."""

    case_id: str
    claim: str
    direct_observations: tuple[str, ...]
    supporting_sources: tuple[str, ...]
    contradictions: tuple[str, ...] = ()
    alternative_explanations: tuple[str, ...] = ()
    prohibited_inferences: tuple[str, ...] = ()
    falsification_criteria: tuple[str, ...] = ()
    culturally_sensitive: bool = False
    restricted_material: bool = False
    human_review_required: bool = True
    metadata: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.case_id.strip() or not self.claim.strip():
            raise ValueError("case_id and claim are required")
        if not self.direct_observations:
            raise ValueError("at least one direct observation is required")
        if not self.supporting_sources or any(not s.strip() for s in self.supporting_sources):
            raise ValueError("evidence court cases require source provenance")
        if not self.alternative_explanations:
            raise ValueError("at least one alternative explanation is required")
        if not self.falsification_criteria:
            raise ValueError("falsification criteria are required")
        if not self.human_review_required:
            raise ValueError("Evidence Court cannot auto-promote claims")

    @property
    def public_release_blocked(self) -> bool:
        return self.restricted_material


def effective_independent_evidence(weights: Iterable[float]) -> float:
    """Return bounded effective evidence mass after source-dependence discounting."""
    vals = [_clamp01(v) for v in weights]
    if not vals:
        return 0.0
    # Probability that at least one independent evidential channel contributes.
    return round(1 - math.prod(1 - v for v in vals), 6)
