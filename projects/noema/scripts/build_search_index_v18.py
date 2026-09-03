#!/usr/bin/env python3
"""Build NOEMA's compact browser search projection.

The browser must never download the full DRH or Pulotu projections merely to
render Explore. This build step extracts only navigation/search metadata from
large source projections and reference entities. Full evidence remains behind
entity/source-specific routes.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUTS = (
    ROOT / "data/reference/belief-catalog-v1.json",
    ROOT / "site/religion-decomposition.json",
    ROOT / "site/drh-decomposition.json",
)

TEXT_KEYS = ("name", "title", "label", "entry_name", "culture_name", "tradition_name")
ID_KEYS = ("id", "entity_id", "entry_id", "culture_id", "profile_id")


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def display_path(path: Path) -> str:
    """Return a stable repo-relative path when possible, absolute otherwise.

    Unit tests and external adapter callers may intentionally provide fixtures
    outside the NOEMA project root. That must not make projection building fail.
    """
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path)


def first(d: dict[str, Any], keys: Iterable[str]) -> Any:
    for key in keys:
        value = d.get(key)
        if value not in (None, "", [], {}):
            return value
    return None


def string_list(value: Any, limit: int = 24) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (int, float, bool)):
        return [str(value)]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if isinstance(item, (str, int, float, bool)):
                out.append(str(item))
            elif isinstance(item, dict):
                label = first(item, TEXT_KEYS)
                if label:
                    out.append(str(label))
            if len(out) >= limit:
                break
        return out
    return []


def dimension_terms(d: dict[str, Any]) -> tuple[list[str], list[str]]:
    dims = d.get("dimensions") or d.get("accepted_dimensions") or {}
    dimensions: list[str] = []
    components: list[str] = []
    if isinstance(dims, dict):
        for key, vals in dims.items():
            dimensions.append(str(key))
            components.extend(string_list(vals, limit=24))
    return dimensions[:20], components[:60]


def source_family(path: Path, d: dict[str, Any]) -> str:
    explicit = first(d, ("source_profile", "source_family", "provider", "dataset"))
    if explicit:
        return str(explicit).upper()
    name = path.name.lower()
    if "drh" in name:
        return "DRH"
    if "religion-decomposition" in name or "pulotu" in name:
        return "PULOTU"
    return "REFERENCE"


def looks_like_profile(d: dict[str, Any]) -> bool:
    name = first(d, TEXT_KEYS)
    ident = first(d, ID_KEYS)
    if not name or not ident:
        return False
    if any(k in d for k in ("dimensions", "accepted_dimensions", "regions", "region", "traditions", "profile_status", "source_profile", "expert_name")):
        return True
    return str(ident).startswith(("GOD-", "SYS-", "RIT-", "SUB-", "DRH", "PULOTU"))


def walk(obj: Any) -> Iterable[dict[str, Any]]:
    if isinstance(obj, dict):
        if looks_like_profile(obj):
            yield obj
        for value in obj.values():
            if isinstance(value, (dict, list)):
                yield from walk(value)
    elif isinstance(obj, list):
        for value in obj:
            if isinstance(value, (dict, list)):
                yield from walk(value)


def project(path: Path, d: dict[str, Any]) -> dict[str, Any]:
    ident = str(first(d, ID_KEYS))
    name = str(first(d, TEXT_KEYS))
    dimensions, components = dimension_terms(d)
    regions = string_list(d.get("regions") or d.get("region") or d.get("geographic_scope"), limit=12)
    aliases = string_list(d.get("aliases") or d.get("alternate_names"), limit=12)
    roles = string_list(d.get("roles"), limit=12)
    traditions = string_list(d.get("traditions"), limit=12)
    kind = str(first(d, ("kind", "entity_type", "type", "profile_type")) or "PROFILE")
    family = source_family(path, d)
    searchable = " ".join([ident, name, kind, family, *aliases, *regions, *roles, *traditions, *dimensions, *components])
    return {
        "id": ident,
        "name": name,
        "kind": kind,
        "source_family": family,
        "aliases": aliases,
        "regions": regions,
        "roles": roles,
        "traditions": traditions,
        "dimensions": dimensions,
        "components": components,
        "profile_status": d.get("profile_status") or d.get("status") or "SOURCE_BOUNDED",
        "search_text": searchable.lower(),
    }


def build(inputs: Iterable[Path]) -> dict[str, Any]:
    records: dict[str, dict[str, Any]] = {}
    sources: list[dict[str, Any]] = []
    for path in inputs:
        if not path.exists():
            sources.append({"path": display_path(path), "status": "MISSING"})
            continue
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        count_before = len(records)
        data = json.loads(raw)
        for d in walk(data):
            record = project(path, d)
            key = f"{record['source_family']}::{record['id']}"
            current = records.get(key)
            if current is None or len(record["search_text"]) > len(current["search_text"]):
                records[key] = record
        sources.append({
            "path": display_path(path),
            "status": "LOADED",
            "sha256": digest,
            "records_added": len(records) - count_before,
        })
    ordered = sorted(records.values(), key=lambda r: (r["name"].casefold(), r["source_family"], r["id"]))
    return {
        "schema_version": "1.0",
        "projection": "NOEMA_COMPACT_SEARCH_V18",
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "epistemic_note": "Search metadata only. Matching, co-occurrence and semantic proximity are not evidence of historical relationship, descent, diffusion or causation.",
        "sources": sources,
        "counts": {
            "records": len(ordered),
            "source_families": len({r["source_family"] for r in ordered}),
        },
        "records": ordered,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "site/search-index-v18.json")
    parser.add_argument("inputs", nargs="*", type=Path)
    args = parser.parse_args()
    inputs = args.inputs or list(DEFAULT_INPUTS)
    out = build(inputs)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(out["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
