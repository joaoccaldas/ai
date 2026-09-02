#!/usr/bin/env python3
"""OpenAlex candidate discovery and work-identity enrichment for NOEMA.

OpenAlex is a discovery/bibliometric source. Its concepts, citation graph and
related-work links are never evidence by themselves. They may nominate possible
source dependence or work identity matches for later review.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

BASE = "https://api.openalex.org/works"
QUERIES = (
    "religion ritual mythology spiritual practice",
    "altered states trance possession dissociation religion",
    "witchcraft possession epilepsy hallucination history",
    "autism schizotypy religiosity spirituality",
    "psychedelic mystical experience ritual",
)


def get_json(url: str, attempts: int = 4) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "NOEMA-Research/1.8"})
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.load(response)
        except (urllib.error.HTTPError, urllib.error.URLError) as exc:  # pragma: no cover - network path
            last = exc
            if isinstance(exc, urllib.error.HTTPError) and exc.code not in {429, 500, 502, 503, 504}:
                raise
            if attempt < attempts - 1:
                time.sleep(min(2**attempt, 16))
    raise RuntimeError(f"OpenAlex request failed: {last}")


def _doi(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip().lower()
    for prefix in ("https://doi.org/", "http://doi.org/", "doi:"):
        if value.startswith(prefix):
            value = value[len(prefix):]
    return value or None


def normalize_work(work: dict[str, Any], provider_query: str | None = None) -> dict[str, Any]:
    openalex_id = str(work.get("id") or "").strip()
    if not openalex_id:
        raise ValueError("OpenAlex work missing id")
    primary = work.get("primary_location") or {}
    source = primary.get("source") or {}
    ids = work.get("ids") or {}
    topics = [
        {
            "id": t.get("id"),
            "display_name": t.get("display_name"),
            "score": t.get("score"),
        }
        for t in (work.get("topics") or [])[:10]
        if t.get("display_name")
    ]
    concepts = [
        {
            "id": c.get("id"),
            "display_name": c.get("display_name"),
            "score": c.get("score"),
        }
        for c in (work.get("concepts") or [])[:10]
        if c.get("display_name")
    ]
    return {
        "provider": "OpenAlex",
        "provider_query": provider_query,
        "openalex_id": openalex_id,
        "doi": _doi(ids.get("doi") or work.get("doi")),
        "pmid_url": ids.get("pmid"),
        "title": work.get("display_name") or work.get("title"),
        "publication_date": work.get("publication_date"),
        "publication_year": work.get("publication_year"),
        "type": work.get("type"),
        "source_name": source.get("display_name"),
        "source_issn_l": source.get("issn_l"),
        "cited_by_count": int(work.get("cited_by_count") or 0),
        "referenced_works": list(work.get("referenced_works") or []),
        "related_works": list(work.get("related_works") or []),
        "topics": topics,
        "concepts": concepts,
        "canonical_url": openalex_id,
        "status": "CANDIDATE_UNREVIEWED",
        "candidate_only": True,
        "dependence_hint_only": True,
        "epistemic_note": (
            "OpenAlex metadata, concepts and citation links are discovery/bibliometric context only. "
            "Citation or dataset overlap may nominate possible source dependence but does not establish evidentiary independence or a historical relationship."
        ),
    }


def discover(days: int = 30, per_page: int = 25) -> list[dict[str, Any]]:
    cutoff = (dt.date.today() - dt.timedelta(days=max(days, 1))).isoformat()
    mailto = os.environ.get("OPENALEX_MAILTO", "").strip()
    by_id: dict[str, dict[str, Any]] = {}
    for query in QUERIES:
        params: dict[str, Any] = {
            "search": query,
            "filter": f"from_publication_date:{cutoff}",
            "per-page": max(1, min(per_page, 100)),
        }
        if mailto:
            params["mailto"] = mailto
        payload = get_json(BASE + "?" + urllib.parse.urlencode(params))
        for work in payload.get("results", []):
            candidate = normalize_work(work, provider_query=query)
            key = candidate["openalex_id"]
            prior = by_id.get(key)
            if prior is None or candidate["cited_by_count"] > prior["cited_by_count"]:
                by_id[key] = candidate
    return sorted(by_id.values(), key=lambda x: (x.get("publication_date") or "", x.get("cited_by_count", 0)), reverse=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--per-page", type=int, default=25)
    parser.add_argument("--output", type=Path, default=Path("projects/noema/data/candidates/openalex-latest.json"))
    args = parser.parse_args()
    records = discover(days=args.days, per_page=args.per_page)
    out = {
        "schema_version": "1.0",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source_family": "OPENALEX",
        "status": "CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED",
        "guardrails": {
            "metadata_is_evidence": False,
            "citation_link_proves_independence": False,
            "semantic_similarity_proves_relationship": False,
        },
        "queries": list(QUERIES),
        "records": records,
        "counts": {"unique_candidates": len(records), "query_count": len(QUERIES)},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(out["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
