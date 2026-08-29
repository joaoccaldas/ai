#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


def load(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def source_matrix(doc: dict, *, source: str, dimensions: list[str]) -> dict:
    if source == "PULOTU":
        subjects = {str(s["id"]) for s in doc.get("subjects", [])}
        accepted = {"EXPLICIT_V1"}
    elif source == "DRH":
        subjects = {str(s["id"]) for s in doc.get("subjects", []) if s.get("comparable_belief_system")}
        accepted = {"CURATED_CROSSWALK_V1"}
    else:
        raise ValueError(source)
    state_counts = defaultdict(Counter)
    any_subjects = defaultdict(set)
    binary_subjects = defaultdict(set)
    assertion_counts = Counter()
    for a in doc.get("assertions", []):
        sid = str(a.get("subject_id") or "")
        dim = a.get("dimension")
        state = a.get("state")
        if sid not in subjects or dim not in dimensions or a.get("mapping_status") not in accepted:
            continue
        assertion_counts[dim] += 1
        any_subjects[dim].add(sid)
        if state in {"PRESENT", "ABSENT", "UNKNOWN", "CONTESTED"}:
            state_counts[dim][state] += 1
        if state in {"PRESENT", "ABSENT"}:
            binary_subjects[dim].add(sid)
    total = len(subjects)
    rows = []
    for dim in dimensions:
        rows.append({
            "dimension": dim,
            "cohort_profiles": total,
            "accepted_assertion_rows": assertion_counts[dim],
            "profiles_with_any_accepted_assertion": len(any_subjects[dim]),
            "profiles_with_explicit_binary_state": len(binary_subjects[dim]),
            "profile_semantic_coverage_pct": round(100 * len(any_subjects[dim]) / total, 2) if total else 0,
            "profile_binary_coverage_pct": round(100 * len(binary_subjects[dim]) / total, 2) if total else 0,
            "state_rows": {k: state_counts[dim][k] for k in ["PRESENT", "ABSENT", "UNKNOWN", "CONTESTED"]},
        })
    return {"source": source, "cohort_profiles": total, "rows": rows}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ontology", default="ontology/decomposition_v1.json")
    ap.add_argument("--pulotu", default="site/religion-decomposition.json")
    ap.add_argument("--drh", default="site/drh-decomposition.json")
    ap.add_argument("--output", default="site/coverage-matrix.json")
    args = ap.parse_args()
    ontology, pulotu, drh = load(args.ontology), load(args.pulotu), load(args.drh)
    dimensions = list(ontology.get("dimensions", {}).keys())
    out = {
        "report_id": "NOEMA-COVERAGE-MATRIX-V1",
        "status": "DESCRIPTIVE_DATA_READINESS",
        "dimensions": dimensions,
        "sources": [source_matrix(pulotu, source="PULOTU", dimensions=dimensions), source_matrix(drh, source="DRH", dimensions=dimensions)],
        "interpretation": {
            "semantic_coverage": "Share of cohort profiles with at least one accepted mapped assertion in the dimension.",
            "binary_coverage": "Share with at least one explicit PRESENT or ABSENT mapped state in the dimension. This is a readiness indicator, not proof that every feature pair inside the dimension is jointly observed.",
            "warning": "High row counts can reflect questionnaire design or multiple source questions. Coverage is not evidence strength."
        }
    }
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({s["source"]: {"profiles": s["cohort_profiles"], "dimensions_with_binary_coverage": sum(r["profiles_with_explicit_binary_state"] > 0 for r in s["rows"])} for s in out["sources"]}, indent=2))


if __name__ == "__main__":
    main()
