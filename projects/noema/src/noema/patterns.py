from __future__ import annotations

from collections import Counter, defaultdict
from itertools import combinations
from math import comb, sqrt
import json
import re

PULOTU_ACCEPTED = {"EXPLICIT_V1"}
DRH_ACCEPTED = {"CURATED_CROSSWALK_V1"}


def feature_key(dimension: str, facet: str) -> str:
    return f"{dimension}::{facet}"


def split_feature(key: str) -> tuple[str, str]:
    left, right = key.split("::", 1)
    return left, right


def normalized_facet(facet: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (facet or "").lower()).strip("_")


def _hypergeom_upper_tail(n: int, a_total: int, b_total: int, observed: int) -> float:
    """Exact fixed-marginal enrichment tail P[X >= observed]."""
    lo = max(0, a_total + b_total - n)
    hi = min(a_total, b_total)
    if observed <= lo:
        return 1.0
    if observed > hi:
        return 0.0
    denom = comb(n, b_total)
    return min(
        1.0,
        sum(
            comb(a_total, x) * comb(n - a_total, b_total - x)
            for x in range(observed, hi + 1)
        )
        / denom,
    )


def _phi(n: int, both: int, a_total: int, b_total: int) -> float:
    a = both
    b = a_total - both
    c = b_total - both
    d = n - a - b - c
    denom = sqrt((a + b) * (c + d) * (a + c) * (b + d))
    if denom == 0:
        return 0.0
    return (a * d - b * c) / denom


def _bh_adjust(rows: list[dict]) -> None:
    """Benjamini-Hochberg over the complete supplied testing universe."""
    if not rows:
        return
    ranked = sorted(enumerate(rows), key=lambda x: x[1]["p_enrichment"])
    m = len(rows)
    q_next = 1.0
    for rank_rev, (idx, row) in enumerate(reversed(ranked), start=1):
        rank = m - rank_rev + 1
        q = min(q_next, row["p_enrichment"] * m / rank)
        rows[idx]["q_bh"] = min(1.0, q)
        q_next = q


def _origin_key(assertion: dict, source: str) -> str:
    if source == "DRH":
        upstream = assertion.get("upstream_question_id")
        if upstream:
            return f"DRH:QUESTION:{upstream}"
    elif source == "PULOTU":
        upstream = assertion.get("upstream_variable")
        if upstream:
            return f"PULOTU:VARIABLE:{upstream}"
    locator = assertion.get("source_locator") or {}
    if locator:
        return f"{source}:LOCATOR:{json.dumps(locator, sort_keys=True, separators=(',', ':'))}"
    # Missing provenance cannot establish coding independence.
    return f"{source}:MISSING_ORIGIN"


def _subject_cells(
    doc: dict, *, source: str, comparable_only: bool = False
) -> tuple[dict[str, dict[str, dict]], int, int, int]:
    """Return explicit binary cells only.

    A feature is present only when its accepted source states are exactly PRESENT.
    It is absent only when they are exactly ABSENT. UNKNOWN, CONTESTED, mixed
    present/unknown, mixed absent/unknown, and direct present/absent conflicts do not
    enter pair denominators.
    """
    subjects = doc.get("subjects") or []
    if source == "DRH":
        allowed_subjects = {
            str(s["id"])
            for s in subjects
            if not comparable_only or bool(s.get("comparable_belief_system"))
        }
        accepted = DRH_ACCEPTED
    elif source == "PULOTU":
        allowed_subjects = {str(s["id"]) for s in subjects}
        accepted = PULOTU_ACCEPTED
    else:
        raise ValueError(f"unsupported source: {source}")

    states: dict[tuple[str, str], set[str]] = defaultdict(set)
    origins: dict[tuple[str, str], set[str]] = defaultdict(set)
    accepted_rows = 0
    for assertion in doc.get("assertions") or []:
        sid = str(assertion.get("subject_id") or "")
        if sid not in allowed_subjects or assertion.get("mapping_status") not in accepted:
            continue
        dimension, facet = assertion.get("dimension"), assertion.get("facet")
        if not dimension or not facet:
            continue
        state = assertion.get("state")
        if state not in {"PRESENT", "ABSENT", "UNKNOWN", "CONTESTED"}:
            continue
        key = (sid, feature_key(dimension, facet))
        states[key].add(state)
        origins[key].add(_origin_key(assertion, source))
        accepted_rows += 1

    by_subject: dict[str, dict[str, dict]] = {sid: {} for sid in allowed_subjects}
    conflicted = 0
    ambiguous_or_unknown = 0
    for key, observed_states in states.items():
        sid, feature = key
        if "PRESENT" in observed_states and (
            "ABSENT" in observed_states or "CONTESTED" in observed_states
        ):
            conflicted += 1
            continue
        if observed_states == {"PRESENT"}:
            by_subject[sid][feature] = {"present": True, "origins": set(origins[key])}
        elif observed_states == {"ABSENT"}:
            by_subject[sid][feature] = {"present": False, "origins": set(origins[key])}
        else:
            ambiguous_or_unknown += 1
    return by_subject, conflicted, ambiguous_or_unknown, accepted_rows


def pairwise_candidates(
    doc: dict,
    *,
    source: str,
    comparable_only: bool = False,
    min_feature_count: int = 5,
    min_known_count: int = 10,
    min_pair_known: int = 20,
    min_pair_count: int = 3,
    min_lift: float = 1.15,
    limit: int = 500,
) -> dict:
    profiles, conflict_cells, ambiguous_cells, accepted_rows = _subject_cells(
        doc, source=source, comparable_only=comparable_only
    )
    cohort_n = len(profiles)
    present_count: Counter[str] = Counter()
    known_count: Counter[str] = Counter()
    for cells in profiles.values():
        for feature, cell in cells.items():
            known_count[feature] += 1
            if cell["present"]:
                present_count[feature] += 1

    eligible_features = sorted(
        feature
        for feature in known_count
        if known_count[feature] >= min_known_count
        and present_count[feature] >= min_feature_count
    )
    eligible_set = set(eligible_features)

    semantic_duplicate_pairs: set[tuple[str, str]] = set()
    for fa, fb in combinations(eligible_features, 2):
        _, a = split_feature(fa)
        _, b = split_feature(fb)
        if normalized_facet(a) == normalized_facet(b):
            semantic_duplicate_pairs.add((fa, fb))

    # If the same upstream question/variable codes both sides in any comparable cell,
    # the whole feature pair is excluded. A crosswalk tautology is not a discovery.
    source_dependent_pairs: set[tuple[str, str]] = set()
    for cells in profiles.values():
        known = sorted(f for f in cells if f in eligible_set)
        for fa, fb in combinations(known, 2):
            if cells[fa]["origins"] & cells[fb]["origins"]:
                source_dependent_pairs.add((fa, fb))

    excluded_pairs = semantic_duplicate_pairs | source_dependent_pairs
    tested: list[dict] = []
    insufficient_overlap = 0
    degenerate_pairs = 0

    # Pair-specific complete-case analysis: a subject enters a pair's denominator only
    # when both features are explicitly PRESENT or explicitly ABSENT. Missing/unknown
    # data never become zeroes.
    for fa, fb in combinations(eligible_features, 2):
        if (fa, fb) in excluded_pairs:
            continue
        comparable = [
            cells
            for cells in profiles.values()
            if fa in cells and fb in cells
        ]
        n = len(comparable)
        if n < min_pair_known:
            insufficient_overlap += 1
            continue
        a_total = sum(1 for cells in comparable if cells[fa]["present"])
        b_total = sum(1 for cells in comparable if cells[fb]["present"])
        both = sum(
            1
            for cells in comparable
            if cells[fa]["present"] and cells[fb]["present"]
        )
        if a_total in {0, n} or b_total in {0, n}:
            degenerate_pairs += 1
            continue
        expected = (a_total * b_total) / n
        da, a = split_feature(fa)
        db, b = split_feature(fb)
        tested.append(
            {
                "feature_a": fa,
                "feature_b": fb,
                "dimension_a": da,
                "facet_a": a,
                "dimension_b": db,
                "facet_b": b,
                "cooccurrence": both,
                "n_profiles": n,
                "n_comparable": n,
                "cohort_profiles": cohort_n,
                "profiles_excluded_for_pair_missingness": cohort_n - n,
                "prevalence_a": a_total / n,
                "prevalence_b": b_total / n,
                "support": both / n,
                "expected_under_fixed_marginals": expected,
                "lift": both / expected if expected else 0,
                "phi": _phi(n, both, a_total, b_total),
                "p_enrichment": _hypergeom_upper_tail(n, a_total, b_total, both),
            }
        )

    # Correct over all eligible, independent, sufficiently observed, non-degenerate
    # pairs before display-oriented filtering.
    _bh_adjust(tested)
    rows = [
        row
        for row in tested
        if row["cooccurrence"] >= min_pair_count and row["lift"] >= min_lift
    ]
    rows.sort(
        key=lambda r: (
            r.get("q_bh", 1.0),
            -r["cooccurrence"],
            -r["lift"],
            -abs(r["phi"]),
            r["feature_a"],
            r["feature_b"],
        )
    )
    for rank, row in enumerate(rows, start=1):
        row["rank"] = rank
        row["candidate_status"] = "DESCRIPTIVE_CANDIDATE"
        row["unresolved_confounders"] = [
            "phylogeny",
            "spatial_autocorrelation",
            "known_contact",
            "source_dependence_beyond_same_upstream_field",
            "research_intensity",
            "missing_data_mechanism_beyond_complete_case_filtering",
            "historical_scope_equivalence"
            if source == "DRH"
            else "historical_change_since_coded_state",
        ]

    return {
        "source": source,
        "cohort_policy": (
            "DRH RELIGIOUS_GROUP entries only; heterogeneous historical scopes remain separate upstream and aggregate feature states remain discovery-only."
            if source == "DRH"
            else "Pulotu cultural-tradition profiles using accepted crosswalk states only."
        ),
        "n_profiles": cohort_n,
        "accepted_assertion_rows_considered": accepted_rows,
        "conflicted_subject_feature_cells_excluded": conflict_cells,
        "unknown_or_ambiguous_subject_feature_cells_excluded": ambiguous_cells,
        "feature_count": len(known_count),
        "eligible_feature_count": len(eligible_features),
        "semantic_duplicate_feature_pairs_excluded": len(semantic_duplicate_pairs),
        "same_upstream_origin_feature_pairs_excluded": len(source_dependent_pairs),
        "insufficient_pairwise_observation_pairs_excluded": insufficient_overlap,
        "degenerate_feature_pairs_excluded": degenerate_pairs,
        "tested_feature_pairs": len(tested),
        "candidate_count_before_limit": len(rows),
        "candidates": rows[:limit],
        "null_model": {
            "test": "one-sided hypergeometric enrichment with fixed feature marginals on pair-specific explicitly observed binary states",
            "missingness_rule": "A profile enters a feature-pair denominator only when both features are explicitly PRESENT or explicitly ABSENT. UNKNOWN, CONTESTED, mixed scopes, uncoded rows and missing rows are excluded, never converted to absence.",
            "multiple_testing": "Benjamini-Hochberg across the complete eligible independent sufficiently-observed non-degenerate feature-pair testing universe within cohort, before display filtering",
            "mapping_dependence_guard": "Feature pairs sharing an upstream question/variable anywhere in the cohort, plus identical normalized facets across dimensions, are excluded from testing.",
            "interpretation": "Screens for surprising co-occurrence under a pairwise complete-case fixed-marginal null only. It is not a causal, ancestral, diffusion, phylogenetic, spatial, missingness-mechanism, or full source-independence test.",
        },
    }


def build_report(pulotu: dict, drh: dict) -> dict:
    return {
        "report_id": "NOEMA-PATTERN-CANDIDATES-V1",
        "status": "HYPOTHESIS_GENERATION_ONLY",
        "principle": "A pattern candidate is a queue item for stronger models, not a conclusion.",
        "cohorts": [
            pairwise_candidates(pulotu, source="PULOTU"),
            pairwise_candidates(drh, source="DRH", comparable_only=True),
        ],
        "cross_cohort_rule": "Never pool Pulotu and DRH into one statistical sample without an explicit harmonized cohort design.",
        "next_required_models": [
            "phylogenetic comparative model",
            "spatial autocorrelation model",
            "contact/diffusion network model",
            "source-dependence adjustment",
            "missing-data sensitivity analysis",
            "historical event-time model where dates permit",
        ],
    }
