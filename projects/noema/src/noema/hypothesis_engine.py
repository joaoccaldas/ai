from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class EvidenceSignal:
    likelihood_ratio: float
    independence: float
    quality: float
    direction: str = "SUPPORTS"

    def __post_init__(self) -> None:
        if self.likelihood_ratio <= 0:
            raise ValueError("likelihood_ratio must be positive")
        if not 0 <= self.independence <= 1:
            raise ValueError("independence must be between 0 and 1")
        if not 0 <= self.quality <= 1:
            raise ValueError("quality must be between 0 and 1")
        if self.direction not in {"SUPPORTS", "CONTRADICTS"}:
            raise ValueError("direction must be SUPPORTS or CONTRADICTS")


def _clamp_probability(p: float) -> float:
    return min(max(p, 1e-6), 1 - 1e-6)


def revise_probability(prior: float, signals: list[EvidenceSignal]) -> float:
    """Update a hypothesis while discounting dependent or weak evidence.

    Signals contribute in log-odds space. Independence and evidence quality
    attenuate each likelihood ratio, preventing ten copies of one source from
    acting like ten independent observations. This is an epistemic accounting
    primitive, not a substitute for domain-specific statistical models.
    """
    p = _clamp_probability(prior)
    log_odds = math.log(p / (1 - p))
    for signal in signals:
        weight = signal.independence * signal.quality
        signed_log_lr = math.log(signal.likelihood_ratio) * weight
        log_odds += signed_log_lr if signal.direction == "SUPPORTS" else -signed_log_lr
    posterior = 1 / (1 + math.exp(-log_odds))
    return round(_clamp_probability(posterior), 6)


def material_change(before: float, after: float, threshold: float = 0.05) -> bool:
    if threshold < 0:
        raise ValueError("threshold must be non-negative")
    return abs(after - before) >= threshold
