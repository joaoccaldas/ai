from __future__ import annotations

from typing import Any

from .evidence import validate_pack


class AtlasError(ValueError):
    """Raised when a Human Meaning Atlas projection violates NOEMA invariants."""


CONSTRUCT_RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("MORTUARY", ("MORTUARY", "BURIAL")),
    ("GRAPHIC_OR_DISPLAY", ("GRAPHIC", "MARK", "ORNAMENT", "SHELL", "PIGMENT", "MATERIAL_CULTURE")),
    ("TECHNOLOGICAL_FUNCTION", ("FUNCTIONAL", "TECHNOLOG")),
    ("POPULATION_INTERACTION", ("CROSS_HOMO", "INTERACTION")),
)


def _temporal_bounds(temporal: dict[str, Any]) -> tuple[int | None, int | None, int | None]:
    if not temporal:
        return None, None, None
    if temporal.get("older_than_bp") is not None:
        v = int(temporal["older_than_bp"])
        return v, None, v
    if temporal.get("central_bp") is not None:
        v = int(temporal["central_bp"])
        return v, v, v
    older = temporal.get("older_bp")
    younger = temporal.get("younger_bp")
    if older is None or younger is None:
        return None, None, None
    older_i, younger_i = int(older), int(younger)
    return older_i, younger_i, round((older_i + younger_i) / 2)


def _construct(claim: dict[str, Any]) -> str:
    haystack = " ".join(
        str(claim.get(k) or "")
        for k in ("claim_type", "claim_text", "observation_inference")
    ).upper()
    for name, needles in CONSTRUCT_RULES:
        if any(n in haystack for n in needles):
            return name
    return "OTHER_EVIDENCE"


def _inference_band(claim: dict[str, Any]) -> str:
    marker = str(claim.get("observation_inference") or "").upper()
    if "SPECULATIVE" in marker:
        return "SPECULATIVE_INFERENCE"
    if "AUTHOR_INTERPRETATION" in marker or "AUTHOR_EVOLUTIONARY" in marker:
        return "AUTHOR_INTERPRETATION"
    if "INFERENCE" in marker or "INTERPRET" in marker or "MODEL" in marker:
        return "OBSERVATION_PLUS_INFERENCE"
    return "OBSERVATION_DOMINANT"


def build_human_meaning_atlas(
    packs: list[dict[str, Any]], societies: dict[str, Any]
) -> dict[str, Any]:
    if not packs:
        raise AtlasError("at least one evidence pack is required")
    for pack in packs:
        validate_pack(pack)

    if societies.get("actual_size") != 100:
        raise AtlasError("v0.9 atlas requires the verified 100-society benchmark")

    mapped_events: list[dict[str, Any]] = []
    unmapped_dated: list[dict[str, Any]] = []
    idea_field: list[dict[str, Any]] = []
    constructs: set[str] = set()
    source_count = 0
    claim_count = 0

    for pack in packs:
        source_count += len(pack.get("sources") or [])
        claim_count += len(pack.get("claims") or [])
        sites = {s["id"]: s for s in pack.get("sites") or []}
        sources = {s["id"]: s for s in pack.get("sources") or []}

        for h in pack.get("hypotheses") or []:
            idea_field.append(
                {
                    "pack_id": pack["pack_id"],
                    "id": h["id"],
                    "title": h["title"],
                    "status": h["status"],
                    "evidence_balance": h["evidence_balance"],
                    "support_count": len(h.get("supporting_claim_ids") or []),
                    "challenge_count": len(h.get("challenging_claim_ids") or []),
                    "related_count": len(h.get("related_claim_ids") or []),
                }
            )

        for claim in pack.get("claims") or []:
            temporal = claim.get("temporal")
            if not temporal:
                continue
            older_bp, younger_bp, center_bp = _temporal_bounds(temporal)
            if center_bp is None:
                continue
            construct = _construct(claim)
            constructs.add(construct)
            src = sources.get(claim.get("source_id"))
            if not src:
                raise AtlasError(f"claim {claim.get('id')} has no resolvable source")
            site = sites.get(claim.get("site_id")) if claim.get("site_id") else None
            event = {
                "pack_id": pack["pack_id"],
                "claim_id": claim["id"],
                "source_id": claim["source_id"],
                "source_title": src["title"],
                "source_url": src["canonical_url"],
                "claim_text": claim["claim_text"],
                "claim_type": claim["claim_type"],
                "construct": construct,
                "evidence_level": claim["evidence_level"],
                "epistemic_status": claim["epistemic_status"],
                "review_status": claim["review_status"],
                "inference_band": _inference_band(claim),
                "scope": claim["scope"],
                "time": {
                    "older_bp": older_bp,
                    "younger_bp": younger_bp,
                    "center_bp": center_bp,
                    "display": temporal.get("display"),
                    "dating_note": temporal.get("dating_note"),
                    "kind": temporal.get("kind"),
                },
            }
            if site and site.get("latitude") is not None and site.get("longitude") is not None:
                event["site"] = {
                    "id": site["id"],
                    "name": site["name"],
                    "country": site["country"],
                    "latitude": float(site["latitude"]),
                    "longitude": float(site["longitude"]),
                    "coordinate_source": site.get("coordinate_source"),
                    "coordinate_url": site.get("coordinate_url"),
                }
                mapped_events.append(event)
            else:
                event["site"] = None
                unmapped_dated.append(event)

    if any(e.get("site") is None for e in mapped_events):
        raise AtlasError("mapped events may not contain missing coordinates")

    coverage_points = []
    for society in societies.get("societies") or []:
        lat = society.get("latitude")
        lon = society.get("longitude")
        if lat is None or lon is None:
            continue
        coverage_points.append(
            {
                "id": society["id"],
                "name": society["name"],
                "region": society.get("region"),
                "latitude": float(lat),
                "longitude": float(lon),
                "glottocode": society.get("glottocode"),
                "focal_year": society.get("focal_year"),
            }
        )

    return {
        "atlas_id": "NOEMA-HUMAN-MEANING-ATLAS-001",
        "release": "v0.9",
        "title": "Human Meaning Atlas",
        "principle": "Map only source-bounded evidence with traceable time and place. Coverage is not evidence; similarity is not ancestry; material form is not meaning.",
        "time_domain_bp": {"max": 500000, "min": 0},
        "mapped_events": sorted(mapped_events, key=lambda x: x["time"]["center_bp"], reverse=True),
        "unmapped_dated_events": sorted(unmapped_dated, key=lambda x: x["time"]["center_bp"], reverse=True),
        "coverage": {
            "benchmark_id": societies.get("benchmark_id"),
            "points": coverage_points,
            "semantics": "Geographic/linguistic coverage benchmark only; it does not mean a society's religion or ritual system has been coded.",
        },
        "constructs": sorted(constructs),
        "idea_field": idea_field,
        "forbidden_inferences": [
            "current oldest observation equals evolutionary origin",
            "shared material form equals shared meaning",
            "burial equals afterlife doctrine",
            "ochre equals ritual",
            "species ranking from evidence counts",
            "coverage point equals coded belief evidence",
        ],
        "summary": {
            "evidence_packs": len(packs),
            "sources": source_count,
            "claims": claim_count,
            "mapped_dated_events": len(mapped_events),
            "unmapped_dated_events": len(unmapped_dated),
            "coverage_societies": len(coverage_points),
            "hypotheses": len(idea_field),
            "constructs": len(constructs),
        },
    }
