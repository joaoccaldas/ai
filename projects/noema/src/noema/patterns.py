from __future__ import annotations

from collections import Counter, defaultdict
from math import comb, sqrt

PULOTU_ACCEPTED = {"EXPLICIT_V1"}
DRH_ACCEPTED = {"CURATED_CROSSWALK_V1"}


def feature_key(dimension: str, facet: str) -> str:
    return f"{dimension}::{facet}"


def split_feature(key: str) -> tuple[str, str]:
    left, right = key.split("::", 1)
    return left, right


def _hypergeom_upper_tail(n: int, a_total: int, b_total: int, observed: int) -> float:
    """Exact fixed-marginal enrichment tail P[X >= observed]."""
    lo = max(0, a_total + b_total - n)
    hi = min(a_total, b_total)
    if observed <= lo:
        return 1.0
    if observed > hi:
        return 0.0
    denom = comb(n, b_total)
    return min(1.0, sum(comb(a_total, x) * comb(n - a_total, b_total - x) for x in range(observed, hi + 1)) / denom)


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
    ranked = sorted(enumerate(rows), key=lambda x: x[1]["p_enrichment"])
    m = len(rows)
    q_next = 1.0
    for rank_rev, (idx, row) in enumerate(reversed(ranked), start=1):
        rank = m - rank_rev + 1
        q = min(q_next, row["p_enrichment"] * m / rank)
        rows[idx]["q_bh"] = min(1.0, q)
        q_next = q


def _subject_features(doc: dict, *, source: str, comparable_only: bool = False) -> tuple[dict[str, set[str]], int, int]:
    subjects = doc.get("subjects") or []
    if source == "DRH":
        allowed_subjects = {str(s["id"]) for s in subjects if not comparable_only or bool(s.get("comparable_belief_system"))}
        accepted = DRH_ACCEPTED
    elif source == "PULOTU":
        allowed_subjects = {str(s["id"]) for s in subjects}
        accepted = PULOTU_ACCEPTED
    else:
        raise ValueError(f"unsupported source: {source}")

    states: dict[tuple[str, str], set[str]] = defaultdict(set)
    raw_rows = 0
    for a in doc.get("assertions") or []:
        sid = str(a.get("subject_id") or "")
        if sid not in allowed_subjects or a.get("mapping_status") not in accepted:
            continue
        dim, facet = a.get("dimension"), a.get("facet")
        if not dim or not facet:
            continue
        st = a.get("state")
        if st not in {"PRESENT", "ABSENT", "UNKNOWN", "CONTESTED"}:
            continue
        states[(sid, feature_key(dim, facet))].add(st)
        raw_rows += 1

    by_subject: dict[str, set[str]] = {sid: set() for sid in allowed_subjects}
    conflicted = 0
    for (sid, feat), observed_states in states.items():
        if "PRESENT" in observed_states and ("ABSENT" in observed_states or "CONTESTED" in observed_states):
            conflicted += 1
            continue
        if observed_states == {"PRESENT"}:
            by_subject[sid].add(feat)
    return by_subject, conflicted, raw_rows


def pairwise_candidates(doc: dict, *, source: str, comparable_only: bool = False, min_feature_count: int = 5, min_pair_count: int = 3, min_lift: float = 1.15, limit: int = 500) -> dict:
    profiles, conflict_cells, accepted_rows = _subject_features(doc, source=source, comparable_only=comparable_only)
    n = len(profiles)
    freq: Counter[str] = Counter()
    pair_counts: Counter[tuple[str, str]] = Counter()
    for features in profiles.values():
        for f in features:
            freq[f] += 1
        ordered = sorted(features)
        for i, a in enumerate(ordered):
            for b in ordered[i + 1:]:
                pair_counts[(a, b)] += 1

    eligible_features = {f for f, count in freq.items() if count >= min_feature_count}
    rows: list[dict] = []
    for (fa, fb), both in pair_counts.items():
        if fa not in eligible_features or fb not in eligible_features or both < min_pair_count:
            continue
        ca, cb = freq[fa], freq[fb]
        expected = (ca * cb) / n if n else 0
        lift = both / expected if expected else 0
        if lift < min_lift:
            continue
        da, a = split_feature(fa)
        db, b = split_feature(fb)
        rows.append({"feature_a": fa, "feature_b": fb, "dimension_a": da, "facet_a": a, "dimension_b": db, "facet_b": b, "cooccurrence": both, "n_profiles": n, "prevalence_a": ca / n if n else 0, "prevalence_b": cb / n if n else 0, "support": both / n if n else 0, "expected_under_fixed_marginals": expected, "lift": lift, "phi": _phi(n, both, ca, cb), "p_enrichment": _hypergeom_upper_tail(n, ca, cb, both)})
    _bh_adjust(rows)
    rows.sort(key=lambda r: (r.get("q_bh", 1.0), -r["cooccurrence"], -r["lift"], -abs(r["phi"]), r["feature_a"], r["feature_b"]))
    for rank, row in enumerate(rows, start=1):
        row["rank"] = rank
        row["candidate_status"] = "DESCRIPTIVE_CANDIDATE"
        row["unresolved_confounders"] = ["phylogeny", "spatial_autocorrelation", "known_contact", "source_dependence", "research_intensity", "missing_data_mechanism", "historical_scope_equivalence" if source == "DRH" else "historical_change_since_coded_state"]
    return {"source": source, "cohort_policy": "DRH RELIGIOUS_GROUP entries only; heterogeneous historical scopes remain separate upstream and aggregate presence is discovery-only." if source == "DRH" else "Pulotu cultural-tradition profiles using explicit PRESENT mappings only.", "n_profiles": n, "accepted_assertion_rows_considered": accepted_rows, "conflicted_subject_feature_cells_excluded": conflict_cells, "feature_count": len(freq), "eligible_feature_count": len(eligible_features), "candidate_count_before_limit": len(rows), "candidates": rows[:limit], "null_model": {"test": "one-sided hypergeometric enrichment with fixed feature marginals", "multiple_testing": "Benjamini-Hochberg within cohort", "interpretation": "Screens for surprising co-occurrence under naive fixed marginals only. It is not a causal, ancestral, diffusion, or independence test."}}


def build_report(pulotu: dict, drh: dict) -> dict:
    return {"report_id": "NOEMA-PATTERN-CANDIDATES-V1", "status": "HYPOTHESIS_GENERATION_ONLY", "principle": "A pattern candidate is a queue item for stronger models, not a conclusion.", "cohorts": [pairwise_candidates(pulotu, source="PULOTU"), pairwise_candidates(drh, source="DRH", comparable_only=True)], "cross_cohort_rule": "Never pool Pulotu and DRH into one statistical sample without an explicit harmonized cohort design.", "next_required_models": ["phylogenetic comparative model", "spatial autocorrelation model", "contact/diffusion network model", "source-dependence adjustment", "missing-data sensitivity analysis", "historical event-time model where dates permit"]}
