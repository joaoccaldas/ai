from __future__ import annotations

from typing import Any

from .evidence import EvidencePackError, validate_pack


class ComparisonError(ValueError):
    """Raised when a cross-pack comparison violates NOEMA comparison invariants."""


def _index(pack: dict[str, Any], key: str) -> dict[str, dict[str, Any]]:
    return {item["id"]: item for item in pack.get(key) or []}


def _resolve(side: dict[str, str], pack: dict[str, Any]) -> dict[str, Any]:
    ref_type = side.get("type")
    ref_id = side.get("id")
    if ref_type == "hypothesis":
        item = _index(pack, "hypotheses").get(ref_id)
        if not item:
            raise ComparisonError(f"unknown hypothesis {ref_id}")
        return {
            "type": "hypothesis",
            "id": item["id"],
            "title": item["title"],
            "status": item["status"],
            "evidence_balance": item["evidence_balance"],
            "support_count": len(item.get("supporting_claim_ids") or []),
            "challenge_count": len(item.get("challenging_claim_ids") or []),
            "related_count": len(item.get("related_claim_ids") or []),
        }
    if ref_type == "claim":
        item = _index(pack, "claims").get(ref_id)
        if not item:
            raise ComparisonError(f"unknown claim {ref_id}")
        return {
            "type": "claim",
            "id": item["id"],
            "title": item["claim_type"].replace("_", " ").title(),
            "status": item["epistemic_status"],
            "evidence_balance": item["scope"],
            "support_count": 1 if item.get("supports") else 0,
            "challenge_count": 1 if item.get("challenges") else 0,
            "related_count": 0,
            "evidence_level": item["evidence_level"],
        }
    raise ComparisonError(f"unsupported comparison ref type {ref_type!r}")


def build_comparison(
    protocol: dict[str, Any], left_pack: dict[str, Any], right_pack: dict[str, Any]
) -> dict[str, Any]:
    validate_pack(left_pack)
    validate_pack(right_pack)

    forbidden = {str(x).lower() for x in protocol.get("forbidden_outputs") or []}
    if not forbidden:
        raise ComparisonError("comparison protocol must declare forbidden outputs")
    if "species intelligence score" not in forbidden or "cognitive superiority ranking" not in forbidden:
        raise ComparisonError("species-ranking outputs must be explicitly forbidden")

    rows: list[dict[str, Any]] = []
    ids: set[str] = set()
    for row in protocol.get("rows") or []:
        row_id = str(row.get("id") or "").strip()
        if not row_id or row_id in ids:
            raise ComparisonError("comparison rows require unique non-empty ids")
        ids.add(row_id)
        comparability = str(row.get("comparability") or "").strip()
        if not comparability:
            raise ComparisonError(f"comparison row {row_id} lacks comparability status")
        rows.append(
            {
                "id": row_id,
                "construct": row["construct"],
                "comparability": comparability,
                "interpretation": row["interpretation"],
                "left": _resolve(row["left"], left_pack),
                "right": _resolve(row["right"], right_pack),
            }
        )

    return {
        "comparison_id": protocol["comparison_id"],
        "title": protocol["title"],
        "principle": protocol["principle"],
        "left": {"pack_id": left_pack["pack_id"], "label": protocol["left_label"]},
        "right": {"pack_id": right_pack["pack_id"], "label": protocol["right_label"]},
        "rows": rows,
        "forbidden_outputs": protocol["forbidden_outputs"],
        "summary": {
            "matched_constructs": len(rows),
            "left_sources": len(left_pack.get("sources") or []),
            "right_sources": len(right_pack.get("sources") or []),
            "left_claims": len(left_pack.get("claims") or []),
            "right_claims": len(right_pack.get("claims") or []),
        },
    }
