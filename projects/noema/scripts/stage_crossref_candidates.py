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


def external_key(candidate: dict[str, Any]) -> str:
    return str(candidate.get("doi") or candidate["canonical_url"]).lower().strip()


def stage(conn: psycopg.Connection[Any], artifact: Path) -> dict[str, int]:
    payload = json.loads(artifact.read_text(encoding="utf-8"))
    candidates = payload.get("candidates") or []
    priority = set(payload.get("priority_keys") or [])
    staged = queued = 0

    for item in candidates:
        key = external_key(item)
        row = conn.execute(
            """
            INSERT INTO source_candidates(
              provider,external_key,title,canonical_url,doi,publisher_or_container,
              work_type,discovery_reason,relevance_score,published_date,indexed_date,payload
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb)
            ON CONFLICT(provider,external_key) DO UPDATE SET
              title=EXCLUDED.title,
              canonical_url=EXCLUDED.canonical_url,
              doi=EXCLUDED.doi,
              publisher_or_container=EXCLUDED.publisher_or_container,
              work_type=EXCLUDED.work_type,
              discovery_reason=EXCLUDED.discovery_reason,
              relevance_score=EXCLUDED.relevance_score,
              published_date=EXCLUDED.published_date,
              indexed_date=EXCLUDED.indexed_date,
              payload=EXCLUDED.payload,
              last_seen_at=now()
            RETURNING id,status
            """,
            (
                item.get("provider", "Crossref"), key, item["title"], item["canonical_url"],
                item.get("doi"), item.get("publisher_or_container"), item.get("type"),
                item["discovery_reason"], item.get("relevance_score", 0),
                item.get("published_date"), item.get("indexed_date"), json.dumps(item),
            ),
        ).fetchone()
        staged += 1
        candidate_id = str(row["id"])
        if row["status"] != "PENDING_REVIEW":
            continue
        is_priority = key in priority
        conn.execute(
            """
            INSERT INTO review_queue(item_type,object_id,priority,reason,proposed_action,metadata)
            VALUES ('SOURCE_CANDIDATE',%s,%s,%s,'REVIEW_SOURCE_CANDIDATE',%s::jsonb)
            ON CONFLICT DO NOTHING
            """,
            (
                candidate_id,
                80 if is_priority else 30,
                "Priority scholarly discovery candidate" if is_priority else "Background scholarly discovery candidate",
                json.dumps({"provider": item.get("provider", "Crossref"), "external_key": key}),
            ),
        )
        queued += 1

    conn.execute(
        "INSERT INTO audit_log(event_type,actor,details) VALUES ('CROSSREF_CANDIDATES_STAGED','scripts/stage_crossref_candidates.py',%s::jsonb)",
        (json.dumps({"artifact": artifact.name, "staged": staged, "queued": queued}),),
    )
    return {"staged": staged, "queued": queued}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--apply", action="store_true", help="Commit staging changes; default is a rollback dry run.")
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
