#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import urllib.request
from collections import Counter
from pathlib import Path

BASE = "https://raw.githubusercontent.com/D-PLACE/dplace-dataset-pulotu/main/cldf"
FILES = {name: f"{BASE}/{name}" for name in ("variables.csv", "codes.csv", "societies.csv", "data.csv")}


def download(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "NOEMA/1.0 (+https://github.com/joaoccaldas/ai)"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode("utf-8-sig")


def rows(text: str):
    return list(csv.DictReader(io.StringIO(text)))


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def infer_state(value: str, code_name: str, code_description: str) -> str:
    text = " ".join(x for x in (value, code_name, code_description) if x).strip().lower()
    if not text:
        return "UNKNOWN"
    absent_prefixes = ("absent", "no evidence", "none", "never")
    contested_markers = ("possible", "disputed", "ambiguous", "uncertain")
    if any(text.startswith(x) for x in absent_prefixes):
        return "ABSENT"
    if any(x in text for x in contested_markers):
        return "CONTESTED"
    return "PRESENT"


def load_mapping(path: Path):
    text = path.read_text(encoding="utf-8")
    doc = json.loads(text)
    return doc["sources"]["PULOTU"], sha256_text(text), doc.get("mapping_version")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mapping", default="ontology/source_mappings.json")
    ap.add_argument("--output", default="site/religion-decomposition.json")
    ap.add_argument("--include-missing", action="store_true")
    args = ap.parse_args()

    mapping, mapping_digest, mapping_version = load_mapping(Path(args.mapping))
    downloaded = {name: download(url) for name, url in FILES.items()}
    file_digests = {name: sha256_text(text) for name, text in downloaded.items()}
    source_digest = hashlib.sha256(
        json.dumps(file_digests, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()

    vars_rows = rows(downloaded["variables.csv"])
    codes_rows = rows(downloaded["codes.csv"])
    societies_rows = rows(downloaded["societies.csv"])
    data_rows = rows(downloaded["data.csv"])

    variables = {r["ID"]: r for r in vars_rows}
    codes = {r["ID"]: r for r in codes_rows}
    societies = {r["ID"]: r for r in societies_rows}
    explicit = mapping["mappings"]

    subjects = []
    for sid, s in societies.items():
        subjects.append({
            "id": sid,
            "name": s.get("Name") or sid,
            "latitude": float(s["Latitude"]) if s.get("Latitude") else None,
            "longitude": float(s["Longitude"]) if s.get("Longitude") else None,
            "glottocode": s.get("Glottocode") or None,
            "ethonyms": s.get("Ethonyms") or None,
            "comment": s.get("Comment") or None,
            "source": "PULOTU",
            "unit_type": "CULTURAL_TRADITION_PROFILE",
            "comparable_belief_system": True,
        })

    assertions = []
    for d in data_rows:
        sid = d.get("Soc_ID") or d.get("Language_ID") or d.get("Society_ID")
        var_id = d.get("Var_ID") or d.get("Parameter_ID")
        if not sid or not var_id or sid not in societies:
            continue
        value = (d.get("Value") or "").strip()
        code_id = (d.get("Code_ID") or "").strip()
        code = codes.get(code_id, {})
        code_name = (code.get("Name") or "").strip()
        code_desc = (code.get("Description") or "").strip()
        state = infer_state(value, code_name, code_desc)
        if state == "UNKNOWN" and not args.include_missing:
            continue
        v = variables.get(var_id, {})
        source_value = code_desc or code_name or value
        common = {
            "subject_id": sid,
            "subject_name": societies[sid].get("Name") or sid,
            "unit_type": "CULTURAL_TRADITION_PROFILE",
            "state": state,
            "source_id": "PULOTU",
            "review_status": "UPSTREAM_CODED_MAPPING_REVIEW_PENDING",
            "temporal_scope": "HISTORICAL_ATTESTED",
            "upstream_dataset": "Pulotu",
            "upstream_variable": var_id,
            "upstream_variable_name": v.get("Name") or f"Pulotu variable {var_id}",
            "upstream_category": v.get("Category") or None,
            "upstream_section": v.get("Section") or None,
            "upstream_subsection": v.get("Subsection") or None,
            "upstream_code": code_id or None,
            "upstream_value": value or None,
            "upstream_value_label": source_value or None,
            "comment": d.get("Comment") or None,
            "source_locator": {
                "table": "cldf/data.csv",
                "row_id": d.get("ID"),
                "variable_id": var_id,
                "society_id": sid,
            },
        }
        mapped = explicit.get(var_id)
        if mapped:
            for m in mapped:
                a = dict(common)
                a.update({"dimension": m["dimension"], "facet": m["facet"]})
                if m.get("qualifier"):
                    a["qualifier"] = m["qualifier"]
                if m.get("mapping_note"):
                    a["mapping_note"] = m["mapping_note"]
                a["mapping_status"] = "NEEDS_REVIEW" if m.get("conditional") else "EXPLICIT_V1"
                assertions.append(a)
        elif mapping.get("raw_fallback", {}).get("enabled"):
            a = dict(common)
            a.update({
                "dimension": "RAW_SOURCE_FEATURE",
                "facet": f"PULOTU_VAR_{var_id}",
                "qualifier": v.get("Simplified_Name") or v.get("Name") or None,
                "mapping_status": "UNMAPPED_RAW",
            })
            assertions.append(a)

    counts = Counter(a["dimension"] for a in assertions)
    accepted_count = sum(1 for a in assertions if a["mapping_status"] == "EXPLICIT_V1")
    conditional_count = sum(1 for a in assertions if a["mapping_status"] == "NEEDS_REVIEW")
    mapped_count = accepted_count + conditional_count
    raw_count = sum(1 for a in assertions if a["mapping_status"] == "UNMAPPED_RAW")
    out = {
        "dataset_id": "NOEMA-RELIGION-DECOMPOSITION-PULOTU-V1",
        "status": "research-preview",
        "source": {
            "name": "Pulotu: Database of Austronesian Supernatural Beliefs and Practices",
            "upstream_repo": "https://github.com/D-PLACE/dplace-dataset-pulotu",
            "upstream_ref": "main",
            "files": FILES,
            "file_sha256": file_digests,
            "source_digest": source_digest,
            "attribution": "Watts et al. (2015), Pulotu; CLDF distribution maintained in D-PLACE ecosystem.",
            "license_rule": "Redistribution must follow the license and attribution terms of the upstream dataset/repository.",
        },
        "crosswalk": {
            "mapping_version": mapping_version,
            "mapping_sha256": mapping_digest,
        },
        "semantics": {
            "mapped_feature": "NOEMA crosswalk applied to an upstream coded variable; mapping itself remains reviewable.",
            "accepted_profile_feature": "EXPLICIT_V1 mappings may enter descriptive profile comparison; this is not a claim of historical independence or common origin.",
            "conditional_feature": "NEEDS_REVIEW mappings remain searchable but are excluded from accepted profile comparison.",
            "raw_feature": "Searchable upstream variable retained without forcing a NOEMA semantic mapping.",
            "absence": "Only an upstream code interpreted as explicit absence; missing rows/values are not converted to absence.",
            "similarity": "Shared coded features are descriptive and do not establish ancestry, diffusion or identical meaning.",
        },
        "summary": {
            "subjects": len(subjects),
            "upstream_variables": len(variables),
            "assertions": len(assertions),
            "mapped_assertions": mapped_count,
            "accepted_assertions": accepted_count,
            "conditional_assertions": conditional_count,
            "raw_assertions": raw_count,
            "dimensions": dict(sorted(counts.items())),
        },
        "subjects": subjects,
        "variables": [{
            "id": k,
            "name": v.get("Name"),
            "simplified_name": v.get("Simplified_Name"),
            "category": v.get("Category"),
            "section": v.get("Section"),
            "subsection": v.get("Subsection"),
            "mapped": k in explicit,
        } for k, v in variables.items()],
        "assertions": assertions,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(out["summary"], indent=2))


if __name__ == "__main__":
    main()
