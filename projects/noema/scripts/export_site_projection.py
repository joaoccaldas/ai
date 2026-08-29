from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import tempfile
from pathlib import Path
from typing import Any

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install NOEMA with the 'api' extra first") from exc

PUBLIC_ACCESS = ("PUBLIC", "ACADEMIC_USE", "ATTRIBUTION_REQUIRED")
REVIEWED_HYPOTHESIS = ("APPROVED", "REVIEWED")


def _rows(conn: psycopg.Connection[Any], sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    return [dict(row) for row in conn.execute(sql, params).fetchall()]


def build_projection(conn: psycopg.Connection[Any]) -> dict[str, Any]:
    source_count = conn.execute(
        "SELECT count(*) FROM sources WHERE access_level = ANY(%s)", (list(PUBLIC_ACCESS),)
    ).fetchone()[0]
    claim_count = conn.execute(
        """
        SELECT count(*)
        FROM claims c JOIN sources s ON s.id=c.source_id
        WHERE c.reviewed=true AND s.access_level = ANY(%s)
        """,
        (list(PUBLIC_ACCESS),),
    ).fetchone()[0]
    relationship_count = conn.execute(
        "SELECT count(*) FROM relationships WHERE status IN ('CANDIDATE','SUPPORTED','REVIEWED')"
    ).fetchone()[0]
    hypothesis_count = conn.execute(
        "SELECT count(*) FROM hypotheses WHERE human_review_status = ANY(%s)",
        (list(REVIEWED_HYPOTHESIS),),
    ).fetchone()[0]

    nodes = _rows(
        conn,
        """
        SELECT DISTINCT ON (e.id)
          e.id::text AS id,
          e.entity_type AS kind,
          e.canonical_name AS title,
          COALESCE(e.description,'') AS summary,
          e.start_year_min, e.start_year_max, e.end_year_min, e.end_year_max,
          CASE WHEN e.geom IS NULL THEN NULL ELSE ST_Y(ST_PointOnSurface(e.geom)) END AS latitude,
          CASE WHEN e.geom IS NULL THEN NULL ELSE ST_X(ST_PointOnSurface(e.geom)) END AS longitude,
          'VERIFIED_RECORD'::text AS status
        FROM entities e
        JOIN claims c ON c.subject_entity_id=e.id AND c.reviewed=true
        JOIN sources s ON s.id=c.source_id
        WHERE s.access_level = ANY(%s)
        ORDER BY e.id, c.confidence DESC, c.created_at DESC
        LIMIT 500
        """,
        (list(PUBLIC_ACCESS),),
    )

    hypotheses = _rows(
        conn,
        """
        SELECT id::text AS id, title, statement,
               posterior_probability::float8 AS posterior_probability,
               status AS epistemic_status, human_review_status,
               falsification_criteria, alternative_hypotheses,
               updated_at
        FROM hypotheses
        WHERE human_review_status = ANY(%s)
        ORDER BY updated_at DESC
        LIMIT 100
        """,
        (list(REVIEWED_HYPOTHESIS),),
    )
    for item in hypotheses:
        item["updated_at"] = item["updated_at"].isoformat() if item.get("updated_at") else None
        item["note"] = item.pop("statement")

    source_catalog = _rows(
        conn,
        """
        SELECT title, source_type AS role, publisher, canonical_url
        FROM sources
        WHERE access_level = ANY(%s)
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT 30
        """,
        (list(PUBLIC_ACCESS),),
    )

    return {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "status": "live-reviewed-projection",
        "counts": {
            "sources": int(source_count),
            "claims": int(claim_count),
            "candidate_links": int(relationship_count),
            "open_hypotheses": int(hypothesis_count),
        },
        "layers": sorted({str(n["kind"]) for n in nodes}),
        "nodes": nodes,
        "hypotheses": hypotheses,
        "source_catalog": source_catalog,
        "publication_policy": {
            "reviewed_claims_only": True,
            "restricted_material_excluded": True,
            "model_generated_evidence_excluded": True,
        },
    }


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, default=str)
        handle.write("\n")
        temp_path = Path(handle.name)
    temp_path.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("site/data.json"))
    args = parser.parse_args()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        conn.execute("SET default_transaction_read_only = on")
        projection = build_projection(conn)
    atomic_write_json(args.output, projection)
    print(json.dumps({"output": str(args.output), "counts": projection["counts"]}))


if __name__ == "__main__":
    main()
