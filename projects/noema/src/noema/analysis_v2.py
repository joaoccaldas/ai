from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from math import sqrt
from typing import Iterable, Mapping, Sequence


class AnalysisStage(StrEnum):
    NOMINATION = "NOMINATION"
    STRATIFIED = "STRATIFIED"
    ADJUSTED = "ADJUSTED"
    SPATIAL = "SPATIAL"
    PHYLOGENETIC = "PHYLOGENETIC"
    TEMPORAL = "TEMPORAL"
    CAUSAL_CANDIDATE = "CAUSAL_CANDIDATE"


@dataclass(frozen=True)
class BinaryObservation:
    subject_id: str
    feature_a: bool | None
    feature_b: bool | None
    strata: Mapping[str, str] = field(default_factory=dict)
    source_family: str | None = None
    time: float | None = None
    latitude: float | None = None
    longitude: float | None = None


@dataclass(frozen=True)
class AssociationSummary:
    n: int
    both: int
    a_total: int
    b_total: int
    phi: float


def binary_phi(rows: Sequence[BinaryObservation]) -> AssociationSummary:
    usable = [r for r in rows if r.feature_a is not None and r.feature_b is not None]
    n = len(usable)
    if n == 0:
        return AssociationSummary(0, 0, 0, 0, 0.0)
    both = sum(1 for r in usable if r.feature_a and r.feature_b)
    a_total = sum(1 for r in usable if r.feature_a)
    b_total = sum(1 for r in usable if r.feature_b)
    a = both
    b = a_total - both
    c = b_total - both
    d = n - a - b - c
    denom = sqrt((a + b) * (c + d) * (a + c) * (b + d))
    phi = 0.0 if denom == 0 else (a * d - b * c) / denom
    return AssociationSummary(n, both, a_total, b_total, phi)


def stratified_associations(
    rows: Sequence[BinaryObservation], *, stratifier: str, min_n: int = 8
) -> dict:
    groups: dict[str, list[BinaryObservation]] = {}
    unknown = 0
    for row in rows:
        value = row.strata.get(stratifier)
        if not value:
            unknown += 1
            continue
        groups.setdefault(value, []).append(row)
    summaries = []
    for value, members in sorted(groups.items()):
        summary = binary_phi(members)
        if summary.n >= min_n:
            summaries.append({"stratum": value, **summary.__dict__})
    return {
        "stage": AnalysisStage.STRATIFIED.value,
        "stratifier": stratifier,
        "strata_tested": len(summaries),
        "unknown_stratum_rows": unknown,
        "summaries": summaries,
        "interpretation": "Persistence or disappearance across strata is a confounding diagnostic, not causal proof.",
    }


def leave_one_group_out(
    rows: Sequence[BinaryObservation], *, group_field: str = "source_family"
) -> dict:
    baseline = binary_phi(rows)
    groups: dict[str, list[BinaryObservation]] = {}
    for row in rows:
        if group_field == "source_family":
            group = row.source_family
        else:
            group = row.strata.get(group_field)
        if group:
            groups.setdefault(group, []).append(row)
    perturbations = []
    for group in sorted(groups):
        kept = []
        for row in rows:
            current = row.source_family if group_field == "source_family" else row.strata.get(group_field)
            if current != group:
                kept.append(row)
        summary = binary_phi(kept)
        perturbations.append(
            {
                "removed_group": group,
                "n": summary.n,
                "phi": summary.phi,
                "delta_phi": summary.phi - baseline.phi,
            }
        )
    return {
        "baseline_phi": baseline.phi,
        "baseline_n": baseline.n,
        "group_field": group_field,
        "perturbations": perturbations,
        "automatic_causal_promotion": False,
    }


def chronological_direction(rows: Sequence[BinaryObservation]) -> dict:
    a_times = [r.time for r in rows if r.feature_a is True and r.time is not None]
    b_times = [r.time for r in rows if r.feature_b is True and r.time is not None]
    if not a_times or not b_times:
        return {
            "stage": AnalysisStage.TEMPORAL.value,
            "status": "INSUFFICIENT_DATED_OBSERVATIONS",
            "automatic_causal_promotion": False,
        }
    earliest_a = min(a_times)
    earliest_b = min(b_times)
    return {
        "stage": AnalysisStage.TEMPORAL.value,
        "status": "DESCRIPTIVE_ORDER_ONLY",
        "earliest_a": earliest_a,
        "earliest_b": earliest_b,
        "a_precedes_b_in_observed_sample": earliest_a < earliest_b,
        "warning": "Earliest observed evidence is not necessarily earliest historical presence.",
        "automatic_causal_promotion": False,
    }


def robustness_profile(
    rows: Sequence[BinaryObservation], *, stratifiers: Iterable[str] = ("region", "language_family")
) -> dict:
    baseline = binary_phi(rows)
    stratified = [stratified_associations(rows, stratifier=s) for s in stratifiers]
    source_sensitivity = leave_one_group_out(rows, group_field="source_family")
    max_abs_delta = max(
        [abs(p["delta_phi"]) for p in source_sensitivity["perturbations"]] or [0.0]
    )
    return {
        "analysis_id": "NOEMA-ROBUSTNESS-PROFILE-V1",
        "stage": AnalysisStage.STRATIFIED.value,
        "baseline": baseline.__dict__,
        "stratified": stratified,
        "source_family_leave_one_out": source_sensitivity,
        "max_abs_source_family_delta_phi": max_abs_delta,
        "required_next_models": [
            "spatial_autocorrelation",
            "phylogenetic_comparative_model",
            "contact_network_model",
            "missingness_sensitivity",
            "probabilistic_chronology",
        ],
        "candidate_only": True,
        "automatic_causal_promotion": False,
    }
