from __future__ import annotations

from collections import defaultdict
from typing import Any


def derive_atlas_insights(atlas: dict[str, Any]) -> dict[str, Any]:
    """Derive descriptive atlas diagnostics without causal or semantic inference."""
    events = atlas.get("mapped_events") or []
    by_construct: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in events:
        by_construct[event["construct"]].append(event)

    matrix = []
    for construct, items in sorted(by_construct.items()):
        centers = [int(x["time"]["center_bp"]) for x in items]
        packs = sorted({x["pack_id"] for x in items})
        sites = sorted({x["site"]["id"] for x in items})
        matrix.append(
            {
                "construct": construct,
                "mapped_event_count": len(items),
                "site_count": len(sites),
                "pack_count": len(packs),
                "pack_ids": packs,
                "oldest_encoded_center_bp": max(centers),
                "newest_encoded_center_bp": min(centers),
                "interpretation_guard": "Cross-pack recurrence is a prompt for comparison, not evidence of shared meaning, ancestry or transmission.",
            }
        )

    oldest = max((int(e["time"]["center_bp"]) for e in events), default=None)
    newest = min((int(e["time"]["center_bp"]) for e in events), default=None)
    review_states = sorted({e.get("review_status") for e in events if e.get("review_status")})

    signals = []
    for row in matrix:
        if row["pack_count"] > 1:
            signals.append(
                {
                    "kind": "CROSS_PACK_RECURRENCE",
                    "construct": row["construct"],
                    "statement": f"{row['construct'].replace('_', ' ').title()} has mapped dated observations in {row['pack_count']} evidence packs.",
                    "guard": row["interpretation_guard"],
                }
            )
    if atlas.get("summary", {}).get("unmapped_dated_events", 0):
        signals.append(
            {
                "kind": "MAPPING_BLIND_SPOT",
                "statement": f"{atlas['summary']['unmapped_dated_events']} dated event is deliberately absent from the globe because its coordinate record is unresolved.",
                "guard": "Missing geography remains missing; NOEMA does not invent a point for visual completeness.",
            }
        )

    return {
        "construct_matrix": matrix,
        "signals": signals,
        "diagnostics": {
            "oldest_mapped_center_bp": oldest,
            "newest_mapped_center_bp": newest,
            "unmapped_dated_events": atlas.get("summary", {}).get("unmapped_dated_events", 0),
            "mapped_review_states": review_states,
            "pre_oldest_time_domain_is_evidence_gap": oldest is not None and atlas.get("time_domain_bp", {}).get("max", 0) > oldest,
            "note": "These are descriptive diagnostics of the current encoded corpus, not estimates of behavioral origins or population prevalence.",
        },
    }
