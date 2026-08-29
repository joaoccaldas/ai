from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


def normalized_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()
    return re.sub(r"\s+", " ", value)


@dataclass(frozen=True)
class EntityCandidate:
    entity_id: str
    canonical_name: str
    entity_type: str
    external_ids: frozenset[str] = frozenset()
    temporal_overlap: float = 0.5
    geographic_overlap: float = 0.5


@dataclass(frozen=True)
class ResolutionDecision:
    action: str
    entity_id: str | None
    confidence: float
    reason: str


def resolve_entity(
    incoming_name: str,
    incoming_type: str,
    candidates: list[EntityCandidate],
    incoming_external_ids: frozenset[str] = frozenset(),
) -> ResolutionDecision:
    """Conservative entity resolution.

    Automatic merge is allowed only on a shared authoritative external ID plus
    matching entity type. Name similarity alone can nominate a review candidate
    but can never collapse historical entities automatically.
    """
    same_type = [c for c in candidates if c.entity_type == incoming_type]
    for candidate in same_type:
        shared_ids = incoming_external_ids & candidate.external_ids
        if shared_ids:
            return ResolutionDecision("AUTO_MERGE", candidate.entity_id, 0.99, f"shared external id: {sorted(shared_ids)[0]}")

    incoming = normalized_name(incoming_name)
    exact_name = [c for c in same_type if normalized_name(c.canonical_name) == incoming]
    if exact_name:
        candidate = max(exact_name, key=lambda c: c.temporal_overlap * c.geographic_overlap)
        confidence = 0.55 + 0.2 * candidate.temporal_overlap + 0.2 * candidate.geographic_overlap
        return ResolutionDecision("HUMAN_REVIEW", candidate.entity_id, min(confidence, 0.94), "name match without shared authoritative id")

    return ResolutionDecision("CREATE_NEW", None, 0.5, "no sufficiently grounded identity match")
