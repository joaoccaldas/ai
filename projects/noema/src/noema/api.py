from __future__ import annotations

import os
from contextlib import contextmanager

try:
    from fastapi import FastAPI, HTTPException, Query
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install NOEMA with the 'api' extra") from exc

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("Install NOEMA with the 'api' extra") from exc

app = FastAPI(title="NOEMA Observatory API", version="0.1.0")


@contextmanager
def connection():
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        conn.execute("SET default_transaction_read_only = on")
        yield conn


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "noema-observatory"}


@app.get("/sources")
def sources(limit: int = Query(100, ge=1, le=500)):
    with connection() as conn:
        return conn.execute(
            """
            SELECT id, title, source_type, publisher, published_at, doi,
                   canonical_url, access_level, metadata, created_at
            FROM sources
            WHERE access_level IN ('PUBLIC','ACADEMIC_USE','ATTRIBUTION_REQUIRED')
            ORDER BY published_at DESC NULLS LAST, created_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()


@app.get("/claims")
def claims(limit: int = Query(100, ge=1, le=500)):
    with connection() as conn:
        return conn.execute(
            """
            SELECT c.id, c.claim_text, c.claim_type, c.epistemic_status,
                   c.evidence_level, c.confidence, c.predicate, c.object_literal,
                   c.valid_time_start_min, c.valid_time_start_max,
                   c.valid_time_end_min, c.valid_time_end_max,
                   c.metadata, s.title AS source_title, s.canonical_url
            FROM claims c
            JOIN sources s ON s.id = c.source_id
            WHERE c.reviewed = true
              AND s.access_level IN ('PUBLIC','ACADEMIC_USE','ATTRIBUTION_REQUIRED')
            ORDER BY c.created_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()


@app.get("/hypotheses")
def hypotheses(limit: int = Query(100, ge=1, le=500)):
    with connection() as conn:
        return conn.execute(
            """
            SELECT id, title, statement, status, prior_probability,
                   posterior_probability, falsification_criteria,
                   alternative_hypotheses, human_review_status, metadata,
                   created_at, updated_at
            FROM hypotheses
            WHERE human_review_status IN ('APPROVED','REVIEWED')
            ORDER BY updated_at DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
