from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Mapping


@dataclass(frozen=True)
class SourceState:
    source_id: str
    coverage_gap: float
    source_independence: float
    hypothesis_information_gain: float
    freshness: float
    data_richness: float
    review_cost_inverse: float
    active: bool = True


DEFAULT_WEIGHTS = {
    "coverage_gap": 0.30,
    "source_independence": 0.22,
    "hypothesis_information_gain": 0.20,
    "freshness": 0.12,
    "data_richness": 0.10,
    "review_cost_inverse": 0.06,
}


def _bounded(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def priority_score(source: SourceState, weights: Mapping[str, float] = DEFAULT_WEIGHTS) -> float:
    """Rank ingestion work by expected research value, not item volume.

    The score is operational prioritization only. It is not evidential confidence,
    source quality, truth probability, or permission to promote claims.
    """
    components = {
        "coverage_gap": source.coverage_gap,
        "source_independence": source.source_independence,
        "hypothesis_information_gain": source.hypothesis_information_gain,
        "freshness": source.freshness,
        "data_richness": source.data_richness,
        "review_cost_inverse": source.review_cost_inverse,
    }
    return round(sum(_bounded(components[k]) * float(weights[k]) for k in DEFAULT_WEIGHTS), 6)


def build_ingestion_plan(sources: Iterable[SourceState], *, limit: int | None = None) -> dict:
    ranked = [
        {
            "source_id": source.source_id,
            "priority": priority_score(source),
            "candidate_only": True,
            "automatic_promotion": False,
        }
        for source in sources
        if source.active
    ]
    ranked.sort(key=lambda x: (-x["priority"], x["source_id"]))
    if limit is not None:
        ranked = ranked[: max(0, limit)]
    return {
        "plan_id": "NOEMA-INGESTION-PLAN-V3",
        "objective": "MAXIMIZE_INFORMATION_GAIN_COVERAGE_AND_INDEPENDENCE",
        "ranked_sources": ranked,
        "candidate_only": True,
        "automatic_promotion": False,
        "warning": "Operational priority is not evidential strength or truth probability.",
    }


def durable_candidate_key(*, doi: str | None = None, authoritative_id: str | None = None, canonical_url: str | None = None) -> str:
    """Require a durable non-title identity for candidate deduplication."""
    for prefix, value in (("doi", doi), ("id", authoritative_id), ("url", canonical_url)):
        normalized = (value or "").strip().lower()
        if normalized:
            return f"{prefix}:{normalized}"
    raise ValueError("candidate requires DOI, authoritative ID, or canonical URL; title-only deduplication is forbidden")


def ledger_record(*, source_id: str, candidate_key: str, snapshot_id: str, payload_digest: str) -> dict:
    if not all((source_id.strip(), candidate_key.strip(), snapshot_id.strip(), payload_digest.strip())):
        raise ValueError("ledger records require source, identity, snapshot, and payload digest")
    return {
        "source_id": source_id,
        "candidate_key": candidate_key,
        "snapshot_id": snapshot_id,
        "payload_digest": payload_digest,
        "status": "CANDIDATE_UNREVIEWED",
        "candidate_only": True,
        "human_review_required": True,
        "automatic_promotion": False,
    }
