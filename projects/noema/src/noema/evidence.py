from __future__ import annotations

from collections import Counter
from typing import Any


class EvidencePackError(ValueError):
    """Raised when a NOEMA evidence pack violates referential or epistemic invariants."""


def _unique_ids(items: list[dict[str, Any]], label: str) -> set[str]:
    ids = [str(item.get("id") or "").strip() for item in items]
    if any(not item_id for item_id in ids):
        raise EvidencePackError(f"{label} contains an empty id")
    if len(ids) != len(set(ids)):
        raise EvidencePackError(f"{label} contains duplicate ids")
    return set(ids)


def validate_pack(pack: dict[str, Any]) -> None:
    sources = list(pack.get("sources") or [])
    claims = list(pack.get("claims") or [])
    hypotheses = list(pack.get("hypotheses") or [])
    source_ids = _unique_ids(sources, "sources")
    claim_ids = _unique_ids(claims, "claims")
    hypothesis_ids = _unique_ids(hypotheses, "hypotheses")

    if pack.get("publication_status") == "PUBLISHED" and "HUMAN_REVIEW_PENDING" in str(pack.get("review_status")):
        raise EvidencePackError("a human-review-pending pack cannot be marked PUBLISHED")

    for source in sources:
        if not source.get("title") or not source.get("canonical_url"):
            raise EvidencePackError(f"source {source.get('id')} lacks title or canonical_url")

    for claim in claims:
        claim_id = claim["id"]
        if claim.get("source_id") not in source_ids:
            raise EvidencePackError(f"claim {claim_id} references unknown source")
        if not claim.get("claim_text") or not claim.get("scope"):
            raise EvidencePackError(f"claim {claim_id} lacks text or scope")
        if claim.get("review_status") == "APPROVED" and not claim.get("evidence_level"):
            raise EvidencePackError(f"approved claim {claim_id} lacks evidence level")
        for hypothesis_id in [*(claim.get("supports") or []), *(claim.get("challenges") or [])]:
            if hypothesis_id not in hypothesis_ids:
                raise EvidencePackError(f"claim {claim_id} references unknown hypothesis {hypothesis_id}")

    for hypothesis in hypotheses:
        hypothesis_id = hypothesis["id"]
        if "posterior_probability" in hypothesis:
            raise EvidencePackError(
                f"hypothesis {hypothesis_id} contains a pseudo-precision posterior; "
                "evidence packs must use an evidence ledger unless a statistical model produced the posterior"
            )
        for field in ("supporting_claim_ids", "challenging_claim_ids", "related_claim_ids"):
            for claim_id in hypothesis.get(field) or []:
                if claim_id not in claim_ids:
                    raise EvidencePackError(f"hypothesis {hypothesis_id} references unknown claim {claim_id}")

        reciprocal_support = {c["id"] for c in claims if hypothesis_id in (c.get("supports") or [])}
        reciprocal_challenge = {c["id"] for c in claims if hypothesis_id in (c.get("challenges") or [])}
        if reciprocal_support != set(hypothesis.get("supporting_claim_ids") or []):
            raise EvidencePackError(f"hypothesis {hypothesis_id} support ledger is not reciprocal")
        if reciprocal_challenge != set(hypothesis.get("challenging_claim_ids") or []):
            raise EvidencePackError(f"hypothesis {hypothesis_id} challenge ledger is not reciprocal")


def hypothesis_ledger(pack: dict[str, Any]) -> list[dict[str, Any]]:
    """Return a descriptive ledger. It deliberately does not fabricate probabilities."""
    validate_pack(pack)
    claims_by_id = {claim["id"]: claim for claim in pack["claims"]}
    ledger: list[dict[str, Any]] = []
    for hypothesis in pack["hypotheses"]:
        support = [claims_by_id[cid] for cid in hypothesis.get("supporting_claim_ids") or []]
        challenge = [claims_by_id[cid] for cid in hypothesis.get("challenging_claim_ids") or []]
        related = [claims_by_id[cid] for cid in hypothesis.get("related_claim_ids") or []]
        ledger.append(
            {
                "id": hypothesis["id"],
                "title": hypothesis["title"],
                "status": hypothesis["status"],
                "support_count": len(support),
                "challenge_count": len(challenge),
                "related_count": len(related),
                "support_evidence_levels": dict(Counter(c["evidence_level"] for c in support)),
                "challenge_evidence_levels": dict(Counter(c["evidence_level"] for c in challenge)),
                "evidence_balance": hypothesis["evidence_balance"],
                "scope_guard": any("scope" in str(c.get("epistemic_status", "")).lower() for c in [*support, *challenge, *related]),
            }
        )
    return ledger


def build_analysis_projection(pack: dict[str, Any]) -> dict[str, Any]:
    validate_pack(pack)
    return {
        "pack_id": pack["pack_id"],
        "review_status": pack["review_status"],
        "publication_status": pack["publication_status"],
        "counts": {
            "sources": len(pack["sources"]),
            "claims": len(pack["claims"]),
            "hypotheses": len(pack["hypotheses"]),
        },
        "claim_types": dict(Counter(c["claim_type"] for c in pack["claims"])),
        "epistemic_statuses": dict(Counter(c["epistemic_status"] for c in pack["claims"])),
        "hypothesis_ledger": hypothesis_ledger(pack),
        "synthesis": pack.get("synthesis") or {},
        "epistemic_rules": pack.get("epistemic_rules") or [],
    }
