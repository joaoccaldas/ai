#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from noema.media import commons_candidate

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "NOEMA-Research-Observatory/1.0 (https://github.com/joaoccaldas/ai)"


def request_json(params: dict) -> dict:
    url = API + "?" + urlencode(params)
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as response:  # nosec B310 - fixed HTTPS host
        return json.load(response)


def query_for(entity: dict) -> str:
    name = entity.get("name") or ""
    region = (entity.get("regions") or [""])[0]
    kind = (entity.get("kind") or "entity").replace("_", " ").lower()
    return " ".join(x for x in [name, kind, region] if x).strip()


def discover(entity: dict, limit: int) -> list[dict]:
    q = query_for(entity)
    doc = request_json({
        "action": "query",
        "format": "json",
        "formatversion": 2,
        "generator": "search",
        "gsrsearch": q,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 640,
        "iiextmetadatalanguage": "en",
        "iiextmetadatafilter": "ImageDescription|Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired|Restrictions",
    })
    out = []
    for page in (doc.get("query") or {}).get("pages") or []:
        candidate = commons_candidate(entity, page, q)
        if candidate:
            out.append(candidate)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default="data/reference/belief-catalog-v1.json")
    ap.add_argument("--output", default="data/candidates/wikimedia-media-candidates.json")
    ap.add_argument("--per-entity", type=int, default=3)
    args = ap.parse_args()
    catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    kinds = {"DEITY", "SPIRIT", "SUPERNATURAL_AGENT"}
    entities = [e for e in catalog.get("entities", []) if e.get("kind") in kinds]
    candidates = []
    errors = []
    for entity in entities:
        try:
            candidates.extend(discover(entity, args.per_entity))
        except Exception as exc:  # discovery failure must not promote or hide prior data
            errors.append({"entity_id": entity.get("id"), "error": type(exc).__name__, "message": str(exc)[:300]})
    seen = set()
    unique = []
    for c in candidates:
        if c["candidate_fingerprint"] in seen:
            continue
        seen.add(c["candidate_fingerprint"])
        unique.append(c)
    out = {
        "report_id": "NOEMA-WIKIMEDIA-MEDIA-CANDIDATES-V1",
        "status": "PENDING_IDENTITY_AND_RIGHTS_REVIEW",
        "provider": "WIKIMEDIA_COMMONS",
        "rules": [
            "Search ranking is discovery only and is not an identity assertion.",
            "No candidate may render in a public entity card until both identity and rights are explicitly approved.",
            "Creator, license, source page and file URL are preserved when the upstream metadata exposes them.",
            "Generated/reconstructed imagery must use a separate GENERATED provenance class and may never be mixed with documentary evidence."
        ],
        "entities_queried": len(entities),
        "candidate_count": len(unique),
        "errors": errors,
        "candidates": unique,
    }
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entities": len(entities), "candidates": len(unique), "errors": len(errors)}, indent=2))


if __name__ == "__main__":
    main()
