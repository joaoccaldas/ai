from __future__ import annotations

import json
import os
from pathlib import Path

try:
    import psycopg
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install NOEMA with the 'api' extra first") from exc

ROOT = Path(__file__).resolve().parents[1]
SEED_FILE = ROOT / "data" / "seeds" / "initial_sources.json"


def main() -> None:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is required")

    sources = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    inserted = 0
    skipped = 0

    with psycopg.connect(dsn) as conn:
        for item in sources:
            match = None
            if item.get("doi"):
                match = conn.execute("SELECT id FROM sources WHERE lower(doi)=lower(%s) LIMIT 1", (item["doi"],)).fetchone()
            if match is None:
                match = conn.execute("SELECT id FROM sources WHERE canonical_url=%s LIMIT 1", (item["canonical_url"],)).fetchone()
            if match:
                skipped += 1
                continue

            conn.execute(
                """
                INSERT INTO sources
                    (canonical_url, title, source_type, publisher, published_at,
                     doi, access_level, metadata)
                VALUES
                    (%s, %s, %s, %s,
                     CASE WHEN %s IS NULL THEN NULL ELSE make_timestamptz(%s,1,1,0,0,0,'UTC') END,
                     %s, %s, %s::jsonb)
                """,
                (
                    item["canonical_url"],
                    item["title"],
                    item["source_type"],
                    item.get("publisher"),
                    item.get("published_year"),
                    item.get("published_year"),
                    item.get("doi"),
                    item.get("access_level", "PUBLIC"),
                    json.dumps(item.get("metadata", {})),
                ),
            )
            inserted += 1

        conn.execute(
            "INSERT INTO audit_log(event_type,actor,details) VALUES (%s,%s,%s::jsonb)",
            ("SEED_IMPORT", "scripts/seed_db.py", json.dumps({"inserted": inserted, "skipped": skipped, "seed": str(SEED_FILE.relative_to(ROOT))})),
        )
        conn.commit()

    print(json.dumps({"inserted": inserted, "skipped": skipped}, indent=2))


if __name__ == "__main__":
    main()
