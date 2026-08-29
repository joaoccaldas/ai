from __future__ import annotations

import argparse
import datetime as dt
import json
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

QUERIES = (
    "religion ritual archaeology",
    "supernatural belief cultural evolution",
    "mythology comparative religion",
    "shamanism altered states anthropology",
    "mortuary ritual symbolic behavior archaeology",
    "divination superstition cognition",
    "sacred landscape archaeoastronomy",
    "ancestor worship cross cultural",
)


def get_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "NOEMA-Research/0.1 (https://github.com/joaoccaldas/ai)"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def discover(from_date: str, rows: int = 20) -> list[dict[str, Any]]:
    by_key: dict[str, dict[str, Any]] = {}
    for query in QUERIES:
        params = urllib.parse.urlencode(
            {
                "query.bibliographic": query,
                "filter": f"from-pub-date:{from_date}",
                "rows": rows,
                "select": "DOI,title,published,container-title,author,URL,type,subject,is-referenced-by-count,created,updated",
            }
        )
        payload = get_json(f"https://api.crossref.org/works?{params}")
        for item in payload.get("message", {}).get("items", []):
            doi = (item.get("DOI") or "").lower().strip()
            url = item.get("URL") or (f"https://doi.org/{doi}" if doi else "")
            if not url:
                continue
            key = doi or url
            title = (item.get("title") or [""])[0]
            container = (item.get("container-title") or [None])[0]
            candidate = {
                "provider": "Crossref",
                "provider_query": query,
                "doi": doi or None,
                "title": title,
                "canonical_url": url,
                "publisher_or_container": container,
                "type": item.get("type"),
                "subjects": item.get("subject") or [],
                "citation_count": item.get("is-referenced-by-count", 0),
                "raw_metadata": item,
                "status": "CANDIDATE_UNREVIEWED",
                "epistemic_note": "Discovery metadata only. Not evidence until source review and claim extraction.",
            }
            prior = by_key.get(key)
            if prior is None or candidate["citation_count"] > prior["citation_count"]:
                by_key[key] = candidate
    return sorted(by_key.values(), key=lambda x: (x["citation_count"], x["title"]), reverse=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=14)
    parser.add_argument("--rows", type=int, default=15)
    parser.add_argument("--output", type=Path, default=Path("noema-crossref-candidates.json"))
    args = parser.parse_args()
    today = dt.date.today()
    from_date = (today - dt.timedelta(days=max(1, args.days))).isoformat()
    candidates = discover(from_date, rows=max(1, min(args.rows, 100)))
    output = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "from_publication_date": from_date,
        "candidate_count": len(candidates),
        "queries": list(QUERIES),
        "candidates": candidates,
    }
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "candidate_count": len(candidates)}))


if __name__ == "__main__":
    main()
