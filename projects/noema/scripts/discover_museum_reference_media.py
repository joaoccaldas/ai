#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "reference" / "belief-catalog-v1.json"
OUT = ROOT / "site" / "museum-reference-media.json"
UA = "NOEMA/1.1 research observatory (+https://joaoccaldas.github.io/ai/projects/noema/site/)"

def get_json(url: str, params: dict) -> dict:
    q = urlencode(params, doseq=True)
    req = Request(f"{url}?{q}", headers={"User-Agent": UA, "Accept": "application/json"})
    with urlopen(req, timeout=30) as r:
        return json.load(r)

def names_for(entity: dict) -> list[str]:
    vals = [entity.get("name", ""), *(entity.get("aliases") or [])]
    out = []
    for v in vals:
        v = str(v).strip()
        if not v or "counterpart" in v.lower():
            continue
        out.append(v)
    return out

def explicit_identity(entity: dict, *texts: str) -> tuple[bool, str]:
    hay = " ".join(t for t in texts if t).casefold()
    for n in names_for(entity):
        needle = n.casefold()
        if needle and needle in hay:
            return True, n
    return False, ""

def aic(entity: dict, limit: int) -> list[dict]:
    fields = ",".join([
        "id","title","image_id","date_display","artist_display","place_of_origin",
        "medium_display","credit_line","is_public_domain"
    ])
    doc = get_json(
        "https://api.artic.edu/api/v1/artworks/search",
        {
            "q": entity["name"],
            "query[term][is_public_domain]": "true",
            "limit": max(8, limit * 5),
            "fields": fields,
        },
    )
    iiif = (doc.get("config") or {}).get("iiif_url") or "https://www.artic.edu/iiif/2"
    rows = []
    for x in doc.get("data") or []:
        ok, matched = explicit_identity(entity, x.get("title",""))
        if not ok or not x.get("is_public_domain") or not x.get("image_id"):
            continue
        image = f"{iiif}/{x['image_id']}/full/843,/0/default.jpg"
        rows.append({
            "entity_id": entity["id"],
            "entity_name": entity.get("name"),
            "entity_kind": entity.get("kind"),
            "provider": "ART_INSTITUTE_CHICAGO",
            "provider_record_id": str(x.get("id")),
            "provider_title": x.get("title") or "",
            "matched_name": matched,
            "provider_page_url": f"https://www.artic.edu/artworks/{x.get('id')}",
            "image_url": image,
            "thumbnail_url": image,
            "date_display": x.get("date_display") or "",
            "creator": x.get("artist_display") or "",
            "place": x.get("place_of_origin") or "",
            "medium": x.get("medium_display") or "",
            "credit": x.get("credit_line") or "",
            "rights": "PUBLIC_DOMAIN",
            "rights_basis": "AIC is_public_domain=true; IIIF public-domain image",
            "identity_basis": "INSTITUTION_CATALOG_TITLE_EXPLICIT",
            "display_class": "MUSEUM_REFERENCE",
            "display_gate": "REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY",
            "evidence_status": "NOT_EVIDENCE",
            "epistemic_note": "Museum catalog reference image. It may illustrate the named entity or a historical depiction, but the image itself is not evidence for origin, theology, diffusion, or a NOEMA claim.",
        })
        if len(rows) >= limit:
            break
    return rows

def cma(entity: dict, limit: int) -> list[dict]:
    doc = get_json(
        "https://openaccess-api.clevelandart.org/api/artworks/",
        {"q": entity["name"], "cc0": "", "has_image": 1, "limit": max(8, limit * 5)},
    )
    rows = []
    for x in doc.get("data") or []:
        images = x.get("images") or {}
        web = (images.get("web") or {}).get("url")
        if x.get("share_license_status") != "CC0" or not web:
            continue
        ok, matched = explicit_identity(
            entity,
            x.get("title",""),
            x.get("tombstone",""),
            x.get("description","") or "",
        )
        if not ok:
            continue
        rows.append({
            "entity_id": entity["id"],
            "entity_name": entity.get("name"),
            "entity_kind": entity.get("kind"),
            "provider": "CLEVELAND_MUSEUM_OF_ART",
            "provider_record_id": str(x.get("id")),
            "provider_title": x.get("title") or "",
            "matched_name": matched,
            "provider_page_url": x.get("url") or f"https://www.clevelandart.org/art/{x.get('id')}",
            "image_url": web,
            "thumbnail_url": ((images.get("print") or {}).get("url") or web),
            "date_display": x.get("creation_date") or x.get("culture") or "",
            "creator": "; ".join(c.get("description","") for c in (x.get("creators") or []) if isinstance(c, dict)),
            "place": ", ".join(x.get("culture") or []) if isinstance(x.get("culture"), list) else str(x.get("culture") or ""),
            "medium": x.get("technique") or "",
            "credit": x.get("creditline") or "",
            "rights": "CC0",
            "rights_basis": "CMA share_license_status=CC0 and image supplied by Open Access API",
            "identity_basis": "INSTITUTION_CATALOG_TEXT_EXPLICIT",
            "display_class": "MUSEUM_REFERENCE",
            "display_gate": "REFERENCE_RENDER_ALLOWED_PROVIDER_ASSERTED_IDENTITY",
            "evidence_status": "NOT_EVIDENCE",
            "epistemic_note": "Museum catalog reference image. It may illustrate the named entity or a historical depiction, but the image itself is not evidence for origin, theology, diffusion, or a NOEMA claim.",
        })
        if len(rows) >= limit:
            break
    return rows

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-provider", type=int, default=1)
    ap.add_argument("--sleep", type=float, default=0.2)
    args = ap.parse_args()
    cat = json.loads(CATALOG.read_text())
    entities = [e for e in cat.get("entities", []) if e.get("kind") in {"DEITY","SPIRIT","SUPERNATURAL_AGENT"}]
    records = []
    errors = []
    provider_counts = {"ART_INSTITUTE_CHICAGO": 0, "CLEVELAND_MUSEUM_OF_ART": 0}
    for e in entities:
        for provider, fn in (("ART_INSTITUTE_CHICAGO", aic), ("CLEVELAND_MUSEUM_OF_ART", cma)):
            try:
                got = fn(e, args.per_provider)
                records.extend(got)
                provider_counts[provider] += len(got)
            except Exception as exc:
                errors.append({"entity_id": e.get("id"), "provider": provider, "error": f"{type(exc).__name__}: {exc}"})
            time.sleep(max(0, args.sleep))
    seen = set()
    dedup = []
    for r in sorted(records, key=lambda x: (x["entity_name"], x["provider"], x["provider_record_id"])):
        k = (r["entity_id"], r["provider"], r["provider_record_id"])
        if k in seen:
            continue
        seen.add(k)
        dedup.append(r)
    doc = {
        "report_id": "NOEMA-MUSEUM-REFERENCE-MEDIA-V1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "REFERENCE_MEDIA_PROVIDER_ASSERTED_NOT_EVIDENCE",
        "policy": {
            "purpose": "Visual reference and iconography context for entity navigation.",
            "render_rule": "Only institution-cataloged records with explicit entity-name match and public-domain/CC0 image status may render in reference surfaces.",
            "not_evidence": True,
            "claim_rule": "A displayed image does not support a NOEMA historical, causal, theological, diffusion, or origin claim unless separately linked through the claim/evidence graph."
        },
        "providers": provider_counts,
        "entities_queried": len(entities),
        "record_count": len(dedup),
        "errors": errors,
        "records": dedup,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"entities": len(entities), "records": len(dedup), "providers": provider_counts, "errors": len(errors)}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
