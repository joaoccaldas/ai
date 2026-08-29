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
    # Missing upstream provenance is not evidence of independence. All such rows share
    # one conservative sentinel so a pair depending on unknown origins is excluded.
    return f"{source}:MISSING_ORIGIN"


def _subject_features(
    doc: dict, *, source: str, comparable_only: bool = False
) -> tuple[dict[str, dict[str, set[str]]], int, int]:
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
    present_origins: dict[tuple[str, str], set[str]] = defaultdict(set)
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
        if state == "PRESENT":
            present_origins[key].add(_origin_key(assertion, source))
        accepted_rows += 1

    by_subject: dict[str, dict[str, set[str]]] = {sid: {} for sid in allowed_subjects}
    conflicted = 0
    for key, observed_states in states.items():
        sid, feature = key
        if "PRESENT" in observed_states and (
            "ABSENT" in observed_states or "CONTESTED" in observed_states
        ):
            conflicted += 1
            continue
        # Be conservative when a source has both PRESENT and UNKNOWN scopes.
        if observed_states == {"PRESENT"} and present_origins[key]:
            by_subject[sid][feature] = set(present_origins[key])
    return by_subject, conflicted, accepted_rows


def pairwise_candidates(
    doc: dict,
    *,
    source: str,
    comparable_only: bool = False,
    min_feature_count: int = 5,
    min_pair_count: int = 3,
    min_lift: float = 1.15,
    limit: int = 500,
) -> dict:
    profiles, conflict_cells, accepted_rows = _subject_features(
        doc, source=source, comparable_only=comparable_only
    )
    n = len(profiles)
    freq: Counter[str] = Counter()
    for features in profiles.values():
        for feature in features:
            freq[feature] += 1

    eligible_features = sorted(
        feature for feature, count in freq.items() if count >= min_feature_count
    )
    semantic_duplicate_pairs: set[tuple[str, str]] = set()
    for fa, fb in combinations(eligible_features, 2):
        _, a = split_feature(fa)
        _, b = split_feature(fb)
        if normalized_facet(a) == normalized_facet(b):
            semantic_duplicate_pairs.add((fa, fb))

    # A pair whose two mapped features ever derive from the same upstream question /
    # variable is excluded from the entire testing universe. This is intentionally
    # conservative: duplicated crosswalk semantics are not discoveries.
    source_dependent_pairs: set[tuple[str, str]] = set()
    for features in profiles.values():
        present = sorted(f for f in features if f in set(eligible_features))
        for fa, fb in combinations(present, 2):
            if features[fa] & features[fb]:
                source_dependent_pairs.add((fa, fb))

    excluded_pairs = semantic_duplicate_pairs | source_dependent_pairs
    pair_counts: Counter[tuple[str, str]] = Counter()
    for features in profiles.values():
        present = sorted(f for f in features if f in set(eligible_features))
        for pair in combinations(present, 2):
            if pair not in excluded_pairs:
                pair_counts[pair] += 1

    # Build the complete independent testing universe first. BH correction happens
    # before display-oriented support/lift filters, avoiding post-selection FDR.
    tested: list[dict] = []
    for fa, fb in combinations(eligible_features, 2):
        if (fa, fb) in excluded_pairs:
            continue
        both = pair_counts[(fa, fb)]
        ca, cb = freq[fa], freq[fb]
        expected = (ca * cb) / n if n else 0
        lift = both / expected if expected else 0
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
                "prevalence_a": ca / n if n else 0,
                "prevalence_b": cb / n if n else 0,
                "support": both / n if n else 0,
                "expected_under_fixed_marginals": expected,
                "lift": lift,
                "phi": _phi(n, both, ca, cb),
                "p_enrichment": _hypergeom_upper_tail(n, ca, cb, both),
            }
        )
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
            "missing_data_mechanism",
            "historical_scope_equivalence"
            if source == "DRH"
            else "historical_change_since_coded_state",
        ]

    return {
        "source": source,
        "cohort_policy": (
            "DRH RELIGIOUS_GROUP entries only; heterogeneous historical scopes remain separate upstream and aggregate presence is discovery-only."
            if source == "DRH"
            else "Pulotu cultural-tradition profiles using explicit PRESENT mappings only."
        ),
        "n_profiles": n,
        "accepted_assertion_rows_considered": accepted_rows,
        "conflicted_subject_feature_cells_excluded": conflict_cells,
        "feature_count": len(freq),
        "eligible_feature_count": len(eligible_features),
        "semantic_duplicate_feature_pairs_excluded": len(semantic_duplicate_pairs),
        "same_upstream_origin_feature_pairs_excluded": len(source_dependent_pairs),
        "tested_feature_pairs": len(tested),
        "candidate_count_before_limit": len(rows),
        "candidates": rows[:limit],
        "null_model": {
            "test": "one-sided hypergeometric enrichment with fixed feature marginals",
            "multiple_testing": "Benjamini-Hochberg across the complete eligible independent feature-pair testing universe within cohort, before display filtering",
            "mapping_dependence_guard": "Feature pairs sharing an upstream question/variable anywhere in the cohort, plus identical normalized facets across dimensions, are excluded from testing.",
            "interpretation": "Screens for surprising co-occurrence under naive fixed marginals only. It is not a causal, ancestral, diffusion, phylogenetic, spatial, or full source-independence test.",
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
