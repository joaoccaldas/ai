from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install NOEMA with the 'api' extra first") from exc

from noema.claim_candidates import ClaimCandidateInput


def stage(conn: psycopg.Connection[Any], artifact: Path) -> dict[str, int]:
    payload = json.loads(artifact.read_text(encoding="utf-8"))
    items = payload.get("claim_candidates") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        raise ValueError("artifact must be a list or contain claim_candidates[]")

    staged = queued = 0
    for raw in items:
        candidate = ClaimCandidateInput(
            source_id=str(raw["source_id"]),
            claim_text=str(raw["claim_text"]),
            claim_type=str(raw["claim_type"]),
            source_locator=dict(raw["source_locator"]),
            extraction_method=str(raw["extraction_method"]),
            extraction_confidence=float(raw.get("extraction_confidence", 0.5)),
            subject_entity_id=raw.get("subject_entity_id"),
            object_entity_id=raw.get("object_entity_id"),
            predicate=raw.get("predicate"),
            object_literal=raw.get("object_literal"),
        )
        row = conn.execute(
            """
            INSERT INTO claim_candidates(
              candidate_fingerprint,source_id,subject_entity_id,object_entity_id,
              claim_text,claim_type,predicate,object_literal,
              valid_time_start_min,valid_time_start_max,valid_time_end_min,valid_time_end_max,
              location,extraction_method,extractor_version,extraction_confidence,
              evidence_level_proposed,epistemic_status_proposed,source_locator,metadata
            ) VALUES (
              %s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,
              CASE WHEN %s IS NULL OR %s IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint(%s,%s),4326) END,
              %s,%s,%s,%s,%s,%s::jsonb,%s::jsonb
            )
            ON CONFLICT(candidate_fingerprint) DO UPDATE SET
              last_seen_at=now(),
              metadata=claim_candidates.metadata || EXCLUDED.metadata
            RETURNING id,status
            """,
            (
                candidate.fingerprint,
                candidate.source_id,
                candidate.subject_entity_id,
                candidate.object_entity_id,
                candidate.claim_text,
                candidate.claim_type,
                candidate.predicate,
                json.dumps(candidate.object_literal),
                raw.get("valid_time_start_min"),
                raw.get("valid_time_start_max"),
                raw.get("valid_time_end_min"),
                raw.get("valid_time_end_max"),
                raw.get("longitude"),
                raw.get("latitude"),
                raw.get("longitude"),
                raw.get("latitude"),
                candidate.extraction_method,
                raw.get("extractor_version"),
                candidate.extraction_confidence,
                raw.get("evidence_level_proposed", "E0"),
                raw.get("epistemic_status_proposed", "SPECULATIVE"),
                json.dumps(dict(candidate.source_locator)),
                json.dumps(raw.get("metadata", {})),
            ),
        ).fetchone()
        staged += 1
        if row["status"] not in {"PENDING_REVIEW", "REOPENED"}:
            continue
        candidate_id = str(row["id"])
        priority = int(round(30 + candidate.extraction_confidence * 50))
        conn.execute(
            """
            INSERT INTO review_queue(item_type,object_id,priority,reason,proposed_action,metadata)
            VALUES ('CLAIM_CANDIDATE',%s,%s,%s,'REVIEW_CLAIM_CANDIDATE',%s::jsonb)
            ON CONFLICT DO NOTHING
            """,
            (
                candidate_id,
                priority,
                "Extracted claim candidate requires evidence review and source-locator verification.",
                json.dumps({"fingerprint": candidate.fingerprint, "source_id": candidate.source_id}),
            ),
        )
        queued += 1

    conn.execute(
        "INSERT INTO audit_log(event_type,actor,details) VALUES ('CLAIM_CANDIDATES_STAGED','scripts/stage_claim_candidates.py',%s::jsonb)",
        (json.dumps({"artifact": artifact.name, "staged": staged, "queued": queued}),),
    )
    return {"staged": staged, "queued": queued}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--apply", action="store_true", help="Commit staged candidates. Default is rollback dry run.")
    args = parser.parse_args()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        result = stage(conn, args.artifact)
        conn.commit() if args.apply else conn.rollback()
    print(json.dumps({**result, "applied": bool(args.apply)}))


if __name__ == "__main__":
    main()
