#!/usr/bin/env python3
"""Build NOEMA's compact comparison projection.

Compare needs accepted/coded decomposition values, but not the full source
assertion corpora. This builder reconstructs the same browser comparison state
from reference, Pulotu and DRH inputs and emits only the fields needed to
render pairwise matrices. Source-level evidence remains in dedicated
workbenches.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/reference/belief-catalog-v1.json"
PULOTU = ROOT / "site/religion-decomposition.json"
DRH = ROOT / "site/drh-decomposition.json"
DEFAULT_OUTPUT = ROOT / "site/compare-index-v18.json"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_fingerprint(paths: list[Path]) -> str:
    payload = "\n".join(f"{path.name}:{sha256(path)}" for path in paths)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def uniq(values: list[Any]) -> list[str]:
    return sorted({str(v) for v in values if v not in (None, "")}, key=str.casefold)


def clean_dimensions(value: Any) -> dict[str, list[str]]:
    if not isinstance(value, dict):
        return {}
    out: dict[str, list[str]] = {}
    for dimension, values in value.items():
        if not isinstance(values, list):
            values = [values]
        cleaned = uniq(values)
        if cleaned:
            out[str(dimension)] = cleaned
    return dict(sorted(out.items()))


def reference_records(doc: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for entity in doc.get("entities", []):
        records.append({
            "id": str(entity["id"]),
            "name": str(entity.get("name") or entity["id"]),
            "kind": str(entity.get("kind") or "REFERENCE_ENTITY"),
            "source_family": "REFERENCE",
            "profile_status": entity.get("profile_status") or "REFERENCE_ONLY",
            "regions": uniq(entity.get("regions") or []),
            "year_from": entity.get("year_from"),
            "year_to": entity.get("year_to"),
            "dimensions": clean_dimensions(entity.get("dimensions")),
        })
    return records


def assertion_dimensions(assertions: list[dict[str, Any]], *, accepted_mapping: str) -> dict[str, dict[str, list[str]]]:
    staged: dict[str, dict[str, list[str]]] = {}
    for assertion in assertions:
        if assertion.get("state") != "PRESENT" or assertion.get("mapping_status") != accepted_mapping:
            continue
        subject = str(assertion.get("subject_id") or "")
        dimension = assertion.get("dimension")
        facet = assertion.get("facet")
        if not subject or not dimension or facet in (None, ""):
            continue
        staged.setdefault(subject, {}).setdefault(str(dimension), []).append(str(facet))
    return {
        subject: {dimension: uniq(values) for dimension, values in sorted(dimensions.items())}
        for subject, dimensions in staged.items()
    }


def pulotu_records(doc: dict[str, Any]) -> list[dict[str, Any]]:
    mapped = assertion_dimensions(doc.get("assertions", []), accepted_mapping="EXPLICIT_V1")
    records = []
    for subject in doc.get("subjects", []):
        upstream_id = str(subject.get("id") or "")
        if not upstream_id:
            continue
        records.append({
            "id": f"PULOTU:{upstream_id}",
            "name": str(subject.get("name") or upstream_id),
            "kind": "CULTURAL_TRADITION_PROFILE",
            "source_family": "PULOTU",
            "profile_status": "UPSTREAM_CODED_MAPPING_REVIEW_PENDING",
            "regions": [],
            "year_from": None,
            "year_to": None,
            "dimensions": mapped.get(upstream_id, {}),
        })
    return records


def drh_records(doc: dict[str, Any]) -> list[dict[str, Any]]:
    mapped = assertion_dimensions(doc.get("assertions", []), accepted_mapping="CURATED_CROSSWALK_V1")
    records = []
    for subject in doc.get("subjects", []):
        ident = str(subject.get("id") or "")
        if not ident:
            continue
        kind = "HISTORICAL_RELIGIOUS_GROUP" if subject.get("comparable_belief_system") else f"DRH_{subject.get('unit_type') or 'ENTRY'}"
        records.append({
            "id": ident,
            "name": str(subject.get("name") or ident),
            "kind": kind,
            "source_family": "DRH",
            "profile_status": "UPSTREAM_EXPERT_CODED_MAPPING_REVIEW_PENDING",
            "regions": uniq([subject.get("world_region"), subject.get("region_name")]),
            "year_from": subject.get("year_from"),
            "year_to": subject.get("year_to"),
            "dimensions": mapped.get(ident, {}),
        })
    return records


def build(catalog_path: Path = CATALOG, pulotu_path: Path = PULOTU, drh_path: Path = DRH) -> dict[str, Any]:
    inputs = [catalog_path, pulotu_path, drh_path]
    missing = [str(p) for p in inputs if not p.exists()]
    if missing:
        raise FileNotFoundError(f"missing comparison inputs: {', '.join(missing)}")

    records = [
        *reference_records(load(catalog_path)),
        *pulotu_records(load(pulotu_path)),
        *drh_records(load(drh_path)),
    ]
    ids = [r["id"] for r in records]
    if len(ids) != len(set(ids)):
        duplicates = sorted({x for x in ids if ids.count(x) > 1})
        raise ValueError(f"duplicate comparison ids: {duplicates[:10]}")

    records.sort(key=lambda r: (r["name"].casefold(), r["source_family"], r["id"]))
    families = sorted({r["source_family"] for r in records})
    dimension_keys = sorted({d for r in records for d in r["dimensions"]})
    return {
        "schema_version": "1.0",
        "projection": "NOEMA_COMPACT_COMPARE_V18",
        "source_fingerprint": source_fingerprint(inputs),
        "epistemic_note": "Pairwise component overlap is descriptive comparison only. Shared coding does not establish equivalent meaning, descent, diffusion, contact or causation.",
        "mapping_rules": {
            "REFERENCE": "catalog canonical dimensions only",
            "PULOTU": "PRESENT assertions with EXPLICIT_V1 mappings only",
            "DRH": "PRESENT assertions with CURATED_CROSSWALK_V1 mappings only",
            "unknown_or_uncoded": "render explicitly; never infer absence",
        },
        "sources": [
            {"family": "REFERENCE", "sha256": sha256(catalog_path)},
            {"family": "PULOTU", "sha256": sha256(pulotu_path)},
            {"family": "DRH", "sha256": sha256(drh_path)},
        ],
        "counts": {
            "records": len(records),
            "comparable_records": sum(bool(r["dimensions"]) for r in records),
            "source_families": len(families),
            "dimensions": len(dimension_keys),
        },
        "records": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, default=CATALOG)
    parser.add_argument("--pulotu", type=Path, default=PULOTU)
    parser.add_argument("--drh", type=Path, default=DRH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    out = build(args.catalog, args.pulotu, args.drh)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(out["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
