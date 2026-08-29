from __future__ import annotations

import argparse
import json
import os
from typing import Any

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install NOEMA with the 'api' extra first") from exc

from noema.review import APPROVED, PENDING, REJECTED, REOPENED, transition

ALLOWED_EVIDENCE = {"E1", "E2", "E3", "E4"}
ALLOWED_EPISTEMIC = {"KNOWN", "SUPPORTED", "PLAUSIBLE", "DISPUTED", "UNKNOWN", "UNTESTABLE"}


def review(
    conn: psycopg.Connection[Any],
    candidate_id: str,
    reviewer: str,
    action: str,
    evidence_level: str | None = None,
    epistemic_status: str | None = None,
    confidence: float | None = None,
    notes: str | None = None,
) -> dict[str, str]:
    candidate = conn.execute(
        "SELECT * FROM claim_candidates WHERE id=%s FOR UPDATE", (candidate_id,)
    ).fetchone()
    if not candidate:
        raise ValueError("claim candidate not found")

    current = str(candidate["status"])
    target = {"approve": APPROVED, "reject": REJECTED, "reopen": REOPENED}[action]
    transition(current, target)

    if action == "reopen":
        conn.execute(
            "UPDATE claim_candidates SET status='REOPENED', reviewed_at=NULL, reviewer=NULL WHERE id=%s",
            (candidate_id,),
        )
        conn.execute(
            """
            INSERT INTO review_queue(item_type,object_id,priority,reason,proposed_action,metadata)
            VALUES ('CLAIM_CANDIDATE',%s,60,'Previously rejected claim candidate reopened for review','REVIEW_CLAIM_CANDIDATE',%s::jsonb)
            ON CONFLICT DO NOTHING
            """,
            (candidate_id, json.dumps({"reopened_by": reviewer, "notes": notes})),
        )
        result = "REOPENED"
        object_id = candidate_id

    elif action == "reject":
        conn.execute(
            "UPDATE claim_candidates SET status='REJECTED', reviewed_at=now(), reviewer=%s, metadata=metadata || %s::jsonb WHERE id=%s",
            (reviewer, json.dumps({"review_notes": notes}), candidate_id),
        )
        conn.execute(
            "UPDATE review_queue SET status='REJECTED', reviewed_at=now(), reviewer=%s WHERE item_type='CLAIM_CANDIDATE' AND object_id=%s AND status='PENDING'",
            (reviewer, candidate_id),
        )
        result = "REJECTED"
        object_id = candidate_id

    else:
        evidence_level = (evidence_level or "").upper()
        epistemic_status = (epistemic_status or "").upper()
        if evidence_level not in ALLOWED_EVIDENCE:
            raise ValueError(f"approval evidence_level must be one of {sorted(ALLOWED_EVIDENCE)}")
        if epistemic_status not in ALLOWED_EPISTEMIC:
            raise ValueError(f"approval epistemic_status must be one of {sorted(ALLOWED_EPISTEMIC)}")
        if confidence is None or not 0 <= confidence <= 1:
            raise ValueError("approval confidence must be between 0 and 1")

        if candidate["approved_claim_id"]:
            claim_id = str(candidate["approved_claim_id"])
            result = "ALREADY_APPROVED"
        else:
            claim = conn.execute(
                """
                INSERT INTO claims(
                  claim_text,claim_type,epistemic_status,evidence_level,confidence,
                  source_id,subject_entity_id,predicate,object_entity_id,object_literal,
                  valid_time_start_min,valid_time_start_max,valid_time_end_min,valid_time_end_max,
                  location,extraction_method,reviewed,metadata
                ) VALUES (
                  %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                  %s,%s,%s,%s,%s,%s,true,%s::jsonb
                ) RETURNING id
                """,
                (
                    candidate["claim_text"], candidate["claim_type"], epistemic_status,
                    evidence_level, confidence, candidate["source_id"], candidate["subject_entity_id"],
                    candidate["predicate"], candidate["object_entity_id"], candidate["object_literal"],
                    candidate["valid_time_start_min"], candidate["valid_time_start_max"],
                    candidate["valid_time_end_min"], candidate["valid_time_end_max"], candidate["location"],
                    candidate["extraction_method"],
                    json.dumps({
                        "candidate_id": candidate_id,
                        "candidate_fingerprint": candidate["candidate_fingerprint"],
                        "source_locator": candidate["source_locator"],
                        "extractor_version": candidate["extractor_version"],
                        "extraction_confidence": float(candidate["extraction_confidence"]),
                        "reviewed_by": reviewer,
                        "review_notes": notes,
                    }, default=str),
                ),
            ).fetchone()
            claim_id = str(claim["id"])
            result = "APPROVED_TO_EVIDENCE"

        conn.execute(
            "UPDATE claim_candidates SET status='APPROVED', reviewed_at=now(), reviewer=%s, approved_claim_id=%s WHERE id=%s",
            (reviewer, claim_id, candidate_id),
        )
        conn.execute(
            "UPDATE review_queue SET status='APPROVED', reviewed_at=now(), reviewer=%s WHERE item_type='CLAIM_CANDIDATE' AND object_id=%s AND status='PENDING'",
            (reviewer, candidate_id),
        )
        object_id = claim_id

    conn.execute(
        "INSERT INTO audit_log(event_type,actor,object_type,object_id,details) VALUES (%s,%s,%s,%s,%s::jsonb)",
        (
            f"CLAIM_CANDIDATE_{target}", reviewer,
            "CLAIM" if action == "approve" else "CLAIM_CANDIDATE", object_id,
            json.dumps({"candidate_id": candidate_id, "action": action, "notes": notes}),
        ),
    )
    return {"candidate_id": candidate_id, "result": result, "object_id": object_id}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("candidate_id")
    parser.add_argument("action", choices=["approve", "reject", "reopen"])
    parser.add_argument("--reviewer", required=True)
    parser.add_argument("--evidence-level")
    parser.add_argument("--epistemic-status")
    parser.add_argument("--confidence", type=float)
    parser.add_argument("--notes")
    parser.add_argument("--apply", action="store_true", help="Commit the review. Default is rollback dry run.")
    args = parser.parse_args()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        result = review(
            conn, args.candidate_id, args.reviewer, args.action,
            args.evidence_level, args.epistemic_status, args.confidence, args.notes,
        )
        conn.commit() if args.apply else conn.rollback()
    print(json.dumps({**result, "applied": bool(args.apply)}))


if __name__ == "__main__":
    main()
