from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import re
import time
import urllib.error
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
    "paleolithic symbolic behavior burial ritual",
    "neanderthal mortuary symbolic behavior",
)

DOMAIN_ANCHORS = (
    "religion", "religious", "ritual", "supernatural", "myth", "mythology",
    "shaman", "shamanism", "mortuary", "burial", "funerary", "divination",
    "superstition", "sacred", "ancestor", "worship", "spiritual", "spirit",
    "deity", "deities", "god", "gods", "animism", "afterlife", "magic",
    "occult", "cosmology", "ceremony", "ceremonial", "trance", "altered state",
    "rock art", "symbolic behavior", "symbolic behaviour", "paleolithic",
    "palaeolithic", "neanderthal", "hominin", "archaeoastronomy", "pilgrimage",
)

SELECT_FIELDS = (
    "DOI,title,published,container-title,author,URL,type,subject,"
    "is-referenced-by-count,created,indexed"
)


def get_json(url: str, attempts: int = 3) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "NOEMA-Research/0.2 (https://github.com/joaoccaldas/ai)"},
    )
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:1000]
            if 400 <= exc.code < 500 and exc.code != 429:
                raise RuntimeError(f"Crossref HTTP {exc.code}: {body}") from exc
            last_error = exc
        except urllib.error.URLError as exc:
            last_error = exc
        if attempt < attempts - 1:
            time.sleep(2**attempt)
    raise RuntimeError(f"Crossref request failed after {attempts} attempts: {last_error}")


def _date_from_parts(value: Any) -> dt.date | None:
    try:
        parts = value["date-parts"][0]
        year = int(parts[0])
        month = int(parts[1]) if len(parts) > 1 else 1
        day = int(parts[2]) if len(parts) > 2 else 1
        return dt.date(year, month, day)
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def _indexed_date(value: Any) -> dt.date | None:
    try:
        stamp = str(value.get("date-time") or "")
        return dt.datetime.fromisoformat(stamp.replace("Z", "+00:00")).date() if stamp else None
    except (AttributeError, ValueError):
        return None


def _domain_hits(title: str, container: str | None, subjects: list[str]) -> list[str]:
    text = " ".join([title, container or "", *subjects]).lower()
    hits: list[str] = []
    for anchor in DOMAIN_ANCHORS:
        pattern = r"(?<!\w)" + re.escape(anchor) + r"(?!\w)"
        if re.search(pattern, text):
            hits.append(anchor)
    return hits


def _score_candidate(
    *,
    hits: list[str],
    work_type: str | None,
    citation_count: int,
    published_date: dt.date | None,
    cutoff: dt.date,
) -> float:
    score = min(len(hits), 5) * 2.0
    if published_date and published_date >= cutoff:
        score += 6.0
    type_bonus = {
        "journal-article": 2.0,
        "proceedings-article": 1.5,
        "book-chapter": 0.75,
        "book": 0.25,
        "posted-content": 0.5,
    }.get(work_type or "", 0.0)
    score += type_bonus
    score += min(math.log1p(max(citation_count, 0)) * 0.2, 1.5)
    return round(score, 3)


def discover(from_index_date: str, rows: int = 20) -> list[dict[str, Any]]:
    by_key: dict[str, dict[str, Any]] = {}
    cutoff = dt.date.fromisoformat(from_index_date)
    mailto = os.environ.get("CROSSREF_MAILTO", "").strip()
    for query in QUERIES:
        request_params: dict[str, Any] = {
            "query.bibliographic": query,
            "filter": f"from-index-date:{from_index_date}",
            "rows": rows,
            "select": SELECT_FIELDS,
        }
        if mailto:
            request_params["mailto"] = mailto
        params = urllib.parse.urlencode(request_params)
        payload = get_json(f"https://api.crossref.org/works?{params}")
        for item in payload.get("message", {}).get("items", []):
            doi = (item.get("DOI") or "").lower().strip()
            url = item.get("URL") or (f"https://doi.org/{doi}" if doi else "")
            if not url:
                continue
            title = (item.get("title") or [""])[0].strip()
            if not title:
                continue
            container = (item.get("container-title") or [None])[0]
            subjects = item.get("subject") or []
            hits = _domain_hits(title, container, subjects)
            if not hits:
                continue
            citation_count = int(item.get("is-referenced-by-count", 0) or 0)
            published_date = _date_from_parts(item.get("published") or {})
            indexed_date = _indexed_date(item.get("indexed") or {})
            reason = "RECENT_PUBLICATION" if published_date and published_date >= cutoff else "NEWLY_INDEXED_LEGACY"
            relevance_score = _score_candidate(
                hits=hits,
                work_type=item.get("type"),
                citation_count=citation_count,
                published_date=published_date,
                cutoff=cutoff,
            )
            key = doi or url
            candidate = {
                "provider": "Crossref",
                "provider_query": query,
                "doi": doi or None,
                "title": title,
                "canonical_url": url,
                "publisher_or_container": container,
                "type": item.get("type"),
                "subjects": subjects,
                "citation_count": citation_count,
                "published_date": published_date.isoformat() if published_date else None,
                "indexed_date": indexed_date.isoformat() if indexed_date else None,
                "discovery_reason": reason,
                "domain_hits": hits,
                "relevance_score": relevance_score,
                "raw_metadata": item,
                "status": "CANDIDATE_UNREVIEWED",
                "epistemic_note": "Discovery metadata only. Not evidence until source review and claim extraction.",
            }
            prior = by_key.get(key)
            if prior is None or candidate["relevance_score"] > prior["relevance_score"]:
                by_key[key] = candidate
    return sorted(
        by_key.values(),
        key=lambda x: (
            x["discovery_reason"] == "RECENT_PUBLICATION",
            x["relevance_score"],
            x["published_date"] or "",
            x["citation_count"],
            x["title"],
        ),
        reverse=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=14)
    parser.add_argument("--rows", type=int, default=15)
    parser.add_argument("--output", type=Path, default=Path("noema-crossref-candidates.json"))
    args = parser.parse_args()
    today = dt.date.today()
    from_index_date = (today - dt.timedelta(days=max(1, args.days))).isoformat()
    candidates = discover(from_index_date, rows=max(1, min(args.rows, 100)))
    reason_counts: dict[str, int] = {}
    for candidate in candidates:
        reason = candidate["discovery_reason"]
        reason_counts[reason] = reason_counts.get(reason, 0) + 1
    output = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "from_index_date": from_index_date,
        "candidate_count": len(candidates),
        "reason_counts": reason_counts,
        "queries": list(QUERIES),
        "candidates": candidates,
    }
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "candidate_count": len(candidates), "reason_counts": reason_counts}))


if __name__ == "__main__":
    main()
