from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install NOEMA with the 'api' extra first") from exc

DPLACE_URL = "https://d-place.org/"


def digest_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ensure_dplace_source(conn: psycopg.Connection[Any]) -> str:
    row = conn.execute("SELECT id FROM sources WHERE canonical_url=%s LIMIT 1", (DPLACE_URL,)).fetchone()
    if row:
        return str(row["id"])
    row = conn.execute(
        """
        INSERT INTO sources(title,source_type,canonical_url,publisher,access_level,metadata)
        VALUES (%s,%s,%s,%s,%s,%s::jsonb)
        RETURNING id
        """,
        (
            "D-PLACE: Database of Places, Language, Culture and Environment",
            "CROSS_CULTURAL_DATASET",
            DPLACE_URL,
            "D-PLACE",
            "ATTRIBUTION_REQUIRED",
            json.dumps({"role": "society sampling, geography, language ancestry and environmental context"}),
        ),
    ).fetchone()
    return str(row["id"])


def import_benchmark(conn: psycopg.Connection[Any], path: Path) -> dict[str, int]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    societies = payload.get("societies") or []
    if payload.get("actual_size") != len(societies):
        raise ValueError("benchmark size metadata does not match society rows")

    source_id = ensure_dplace_source(conn)
    run = conn.execute(
        """
        INSERT INTO ingestion_runs(provider,source_kind,source_version,source_digest,discovered_count,metadata)
        VALUES ('D-PLACE','BENCHMARK',%s,%s,%s,%s::jsonb)
        RETURNING id
        """,
        (
            payload.get("benchmark_id"),
            digest_file(path),
            len(societies),
            json.dumps({"selection_method": payload.get("selection_method"), "source": payload.get("source")}),
        ),
    ).fetchone()
    run_id = str(run["id"])
    inserted = updated = queued = 0

    for society in societies:
        external_id = society["dplace_id"]
        linked = conn.execute(
            """
            SELECT es.entity_id
            FROM entity_sources es
            WHERE es.source_id=%s AND es.external_id=%s
            LIMIT 1
            """,
            (source_id, external_id),
        ).fetchone()
        metadata = {
            "dplace_id": external_id,
            "glottocode": society.get("glottocode"),
            "language_level_glottocodes": society.get("language_level_glottocodes"),
            "region": society.get("region"),
            "contribution_id": society.get("contribution_id"),
            "benchmark_id": payload.get("benchmark_id"),
        }
        latitude = society.get("latitude")
        longitude = society.get("longitude")

        if linked:
            entity_id = str(linked["entity_id"])
            conn.execute(
                """
                UPDATE entity_sources
                   SET observation_year=%s,
                       metadata=%s::jsonb
                 WHERE entity_id=%s AND source_id=%s
                """,
                (society.get("focal_year"), json.dumps(metadata), entity_id, source_id),
            )
            updated += 1
            continue

        entity = conn.execute(
            """
            INSERT INTO entities(entity_type,canonical_name,geom,metadata)
            VALUES (
              'CULTURE', %s,
              CASE WHEN %s IS NULL OR %s IS NULL THEN NULL
                   ELSE ST_SetSRID(ST_MakePoint(%s,%s),4326) END,
              %s::jsonb
            )
            RETURNING id
            """,
            (society["name"], longitude, latitude, longitude, latitude, json.dumps(metadata)),
        ).fetchone()
        entity_id = str(entity["id"])
        conn.execute(
            """
            INSERT INTO entity_sources(entity_id,source_id,external_id,source_role,observation_year,metadata)
            VALUES (%s,%s,%s,'DESCRIBES',%s,%s::jsonb)
            """,
            (entity_id, source_id, external_id, society.get("focal_year"), json.dumps(metadata)),
        )
        conn.execute(
            """
            INSERT INTO review_queue(item_type,object_id,priority,reason,proposed_action,metadata)
            VALUES ('ENTITY',%s,40,%s,'REVIEW_SOURCE_ENTITY',%s::jsonb)
            ON CONFLICT DO NOTHING
            """,
            (
                entity_id,
                "New D-PLACE society entity imported from authoritative external ID; review before any semantic merging.",
                json.dumps({"source_id": source_id, "external_id": external_id, "ingestion_run_id": run_id}),
            ),
        )
        inserted += 1
        queued += 1

    conn.execute(
        """
        UPDATE ingestion_runs
           SET completed_at=now(), status='COMPLETED', accepted_count=%s, metadata=metadata || %s::jsonb
         WHERE id=%s
        """,
        (inserted + updated, json.dumps({"inserted": inserted, "updated": updated, "queued_for_review": queued}), run_id),
    )
    conn.execute(
        "INSERT INTO audit_log(event_type,actor,object_type,object_id,details) VALUES ('DPLACE_IMPORT','scripts/import_dplace_benchmark.py','INGESTION_RUN',%s,%s::jsonb)",
        (run_id, json.dumps({"inserted": inserted, "updated": updated, "queued": queued})),
    )
    return {"inserted": inserted, "updated": updated, "queued": queued}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("benchmark", type=Path)
    parser.add_argument("--apply", action="store_true", help="Commit database changes. Without this flag the transaction is rolled back.")
    args = parser.parse_args()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        result = import_benchmark(conn, args.benchmark)
        if args.apply:
            conn.commit()
        else:
            conn.rollback()
    print(json.dumps({**result, "applied": bool(args.apply)}))


if __name__ == "__main__":
    main()
