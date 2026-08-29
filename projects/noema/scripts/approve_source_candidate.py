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


def approve(conn: psycopg.Connection[Any], candidate_id: str, reviewer: str) -> dict[str, str]:
    candidate = conn.execute(
        "SELECT * FROM source_candidates WHERE id=%s FOR UPDATE", (candidate_id,)
    ).fetchone()
    if not candidate:
        raise ValueError("source candidate not found")
    if candidate["status"] == "REJECTED":
        raise ValueError("rejected candidate cannot be approved without reopening review")
    if candidate["approved_source_id"]:
        return {"candidate_id": candidate_id, "source_id": str(candidate["approved_source_id"]), "result": "ALREADY_APPROVED"}

    existing = None
    if candidate["doi"]:
        existing = conn.execute(
            "SELECT id FROM sources WHERE doi IS NOT NULL AND lower(doi)=lower(%s) LIMIT 1",
            (candidate["doi"],),
        ).fetchone()
    if existing is None:
        existing = conn.execute(
            "SELECT id FROM sources WHERE canonical_url=%s LIMIT 1", (candidate["canonical_url"],)
        ).fetchone()

    if existing:
        source_id = str(existing["id"])
        result = "LINKED_EXISTING_SOURCE"
    else:
        source = conn.execute(
            """
            INSERT INTO sources(
              canonical_url,title,source_type,publisher,published_at,doi,access_level,metadata
            ) VALUES (
              %s,%s,'SCHOLARLY_SOURCE',%s,
              CASE WHEN %s IS NULL THEN NULL ELSE (%s::date)::timestamptz END,
              %s,'PUBLIC',%s::jsonb
            ) RETURNING id
            """,
            (
                candidate["canonical_url"], candidate["title"], candidate["publisher_or_container"],
                candidate["published_date"], candidate["published_date"], candidate["doi"],
                json.dumps({
                    "provider": candidate["provider"],
                    "external_key": candidate["external_key"],
                    "reviewed_by": reviewer,
                    "candidate_payload": candidate["payload"],
                }, default=str),
            ),
        ).fetchone()
        source_id = str(source["id"])
        result = "CREATED_APPROVED_SOURCE"

    conn.execute(
        """
        UPDATE source_candidates
           SET status='APPROVED', reviewed_at=now(), reviewer=%s, approved_source_id=%s
         WHERE id=%s
        """,
        (reviewer, source_id, candidate_id),
    )
    conn.execute(
        """
        UPDATE review_queue
           SET status='APPROVED', reviewed_at=now(), reviewer=%s
         WHERE item_type='SOURCE_CANDIDATE' AND object_id=%s AND status='PENDING'
        """,
        (reviewer, candidate_id),
    )
    conn.execute(
        "INSERT INTO audit_log(event_type,actor,object_type,object_id,details) VALUES ('SOURCE_CANDIDATE_APPROVED',%s,'SOURCE',%s,%s::jsonb)",
        (reviewer, source_id, json.dumps({"candidate_id": candidate_id, "result": result})),
    )
    return {"candidate_id": candidate_id, "source_id": source_id, "result": result}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("candidate_id")
    parser.add_argument("--reviewer", required=True)
    parser.add_argument("--apply", action="store_true", help="Commit approval; default is a rollback dry run.")
    args = parser.parse_args()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        result = approve(conn, args.candidate_id, args.reviewer)
        conn.commit() if args.apply else conn.rollback()
    print(json.dumps({**result, "applied": bool(args.apply)}))


if __name__ == "__main__":
    main()
