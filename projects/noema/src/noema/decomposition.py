from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any, Iterable

VALID_STATES = {"PRESENT", "ABSENT", "UNKNOWN", "CONTESTED", "NOT_APPLICABLE"}
ACCEPTED_MAPPING_STATUSES = {"EXPLICIT_V1", "CURATED_CROSSWALK_V1"}


def feature_key(assertion: dict[str, Any]) -> str:
    return f"{assertion.get('dimension','RAW')}::{assertion.get('facet','UNKNOWN')}"


def searchable_blob(assertion: dict[str, Any]) -> str:
    fields = [
        assertion.get("subject_id"), assertion.get("subject_name"), assertion.get("dimension"),
        assertion.get("facet"), assertion.get("qualifier"), assertion.get("state"),
        assertion.get("source_id"), assertion.get("upstream_variable_name"),
        assertion.get("upstream_question_name"), assertion.get("upstream_category"),
        assertion.get("upstream_section"), assertion.get("upstream_subsection"),
        assertion.get("upstream_answer"), assertion.get("world_region"),
        assertion.get("region_name"), assertion.get("comment"),
    ]
    return " ".join(str(x) for x in fields if x).lower()


def is_accepted_mapping(assertion: dict[str, Any]) -> bool:
    return assertion.get("mapping_status") in ACCEPTED_MAPPING_STATUSES


def query_assertions(
    assertions: Iterable[dict[str, Any]], *, text: str = "", dimensions: set[str] | None = None,
    facets: set[str] | None = None, states: set[str] | None = None,
    subjects: set[str] | None = None, source_ids: set[str] | None = None,
    include_conditional: bool = True,
) -> list[dict[str, Any]]:
    q = text.strip().lower()
    out: list[dict[str, Any]] = []
    for a in assertions:
        if dimensions and a.get("dimension") not in dimensions: continue
        if facets and a.get("facet") not in facets: continue
        if states and a.get("state") not in states: continue
        if subjects and a.get("subject_id") not in subjects: continue
        if source_ids and a.get("source_id") not in source_ids: continue
        if not include_conditional and not is_accepted_mapping(a): continue
        if q and q not in searchable_blob(a): continue
        out.append(a)
    return out


def subject_profiles(assertions: Iterable[dict[str, Any]], *, states: set[str] | None = None) -> dict[str, set[str]]:
    accepted_states = states or {"PRESENT", "CONTESTED"}
    profiles: dict[str, set[str]] = defaultdict(set)
    for a in assertions:
        if a.get("state") in accepted_states and is_accepted_mapping(a):
            profiles[str(a["subject_id"])].add(feature_key(a))
    return dict(profiles)


def compare_subjects(assertions: Iterable[dict[str, Any]], subject_ids: list[str]) -> dict[str, Any]:
    if len(set(subject_ids)) < 2:
        raise ValueError("compare_subjects requires at least two distinct subjects")
    rows = list(assertions)
    profiles = subject_profiles(rows)
    selected = {sid: profiles.get(sid, set()) for sid in subject_ids}
    common = set.intersection(*(v for v in selected.values())) if selected else set()
    union = set.union(*(v for v in selected.values())) if selected else set()
    differentiators = []
    for feat in sorted(union - common):
        present_in = [sid for sid, fs in selected.items() if feat in fs]
        absent_from = [sid for sid, fs in selected.items() if feat not in fs]
        differentiators.append({"feature": feat, "present_in": present_in, "not_present_in_profile": absent_from})
    pairwise = []
    for i, left in enumerate(subject_ids):
        for right in subject_ids[i + 1:]:
            a, b = selected[left], selected[right]
            denominator = len(a | b)
            pairwise.append({
                "left": left, "right": right,
                "jaccard_observed": round(len(a & b) / denominator, 4) if denominator else None,
                "shared": sorted(a & b), "left_only": sorted(a - b), "right_only": sorted(b - a),
                "warning": "Observed-feature similarity is descriptive; missing data, shared ancestry and contact are not corrected here."
            })
    return {
        "subjects": subject_ids,
        "common_features": sorted(common),
        "differentiators": differentiators,
        "pairwise": pairwise,
        "semantics": {
            "not_present_in_profile": "No accepted PRESENT/CONTESTED assertion in the current profile; this does not mean true absence.",
            "common_feature": "Shared coded feature; not evidence of common origin or shared meaning.",
            "accepted_mapping_statuses": sorted(ACCEPTED_MAPPING_STATUSES),
        }
    }


def pattern_candidates(
    assertions: Iterable[dict[str, Any]], *, min_subjects: int = 2,
    dependence: dict[tuple[str, str], float] | None = None,
) -> list[dict[str, Any]]:
    """Rank recurring accepted features for investigation, not as historical conclusions.

    dependence[(a,b)] is 0..1 where 1 means strongly non-independent through ancestry/contact.
    The penalty is intentionally conservative and descriptive, not a phylogenetic model.
    """
    profiles = subject_profiles(assertions, states={"PRESENT"})
    by_feature: dict[str, list[str]] = defaultdict(list)
    for sid, features in profiles.items():
        for feat in features:
            by_feature[feat].append(sid)
    results = []
    dependence = dependence or {}
    for feat, subjects in by_feature.items():
        if len(subjects) < min_subjects:
            continue
        penalties = []
        for i, left in enumerate(subjects):
            for right in subjects[i + 1:]:
                penalties.append(max(dependence.get((left, right), 0.0), dependence.get((right, left), 0.0)))
        mean_dep = sum(penalties) / len(penalties) if penalties else 0.0
        independence = max(0.0, 1.0 - mean_dep)
        score = len(subjects) * independence
        results.append({
            "feature": feat,
            "subject_count": len(subjects),
            "subjects": sorted(subjects),
            "dependence_penalty": round(mean_dep, 4),
            "investigation_score": round(score, 4),
            "interpretation": "Candidate recurrence only. Test ancestry, contact, ecology, coding dependence and chronology before historical interpretation."
        })
    return sorted(results, key=lambda x: (-x["investigation_score"], -x["subject_count"], x["feature"]))


def dimension_matrix(assertions: Iterable[dict[str, Any]]) -> dict[str, Any]:
    rows = list(assertions)
    subjects = sorted({str(a.get("subject_id")) for a in rows if a.get("subject_id")})
    dims = sorted({str(a.get("dimension")) for a in rows if a.get("dimension")})
    matrix = []
    for sid in subjects:
        per_dim = Counter(
            a.get("dimension") for a in rows
            if a.get("subject_id") == sid and a.get("state") == "PRESENT" and is_accepted_mapping(a)
        )
        matrix.append({"subject_id": sid, "dimensions": {d: per_dim.get(d, 0) for d in dims}})
    return {"subjects": subjects, "dimensions": dims, "matrix": matrix}
