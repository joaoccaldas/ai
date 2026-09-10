from __future__ import annotations

from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt
from random import Random
from statistics import mean
from typing import Sequence

from .analysis_v2 import BinaryObservation, binary_phi, leave_one_group_out, stratified_associations


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    r = 6371.0088
    p1, p2 = radians(lat1), radians(lat2)
    dp = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * r * asin(min(1.0, sqrt(a)))


def _spatial_rows(rows: Sequence[BinaryObservation]) -> list[BinaryObservation]:
    return [
        r for r in rows
        if r.feature_a is not None and r.feature_b is not None
        and r.latitude is not None and r.longitude is not None
    ]


def geographic_neighbor_agreement(
    rows: Sequence[BinaryObservation], *, radius_km: float = 750.0
) -> dict:
    """Descriptive spatial clustering diagnostic for the joint A/B state.

    This is intentionally not called a causal adjustment. It asks whether nearby
    observations share the same joint binary state more often than the global
    pairwise baseline would suggest.
    """
    usable = _spatial_rows(rows)
    if len(usable) < 8:
        return {
            "stage": "SPATIAL",
            "status": "INSUFFICIENT_GEOCODED_OBSERVATIONS",
            "n": len(usable),
            "automatic_causal_promotion": False,
        }
    states = [(bool(r.feature_a), bool(r.feature_b)) for r in usable]
    global_same = sum(1 for i in range(len(states)) for j in range(i + 1, len(states)) if states[i] == states[j])
    global_pairs = len(states) * (len(states) - 1) // 2
    global_rate = global_same / global_pairs if global_pairs else 0.0
    near_same = near_pairs = 0
    for i, left in enumerate(usable):
        for j in range(i + 1, len(usable)):
            right = usable[j]
            if haversine_km(left.latitude, left.longitude, right.latitude, right.longitude) <= radius_km:
                near_pairs += 1
                near_same += int(states[i] == states[j])
    if near_pairs == 0:
        return {
            "stage": "SPATIAL",
            "status": "NO_NEIGHBOR_PAIRS_WITHIN_RADIUS",
            "n": len(usable),
            "radius_km": radius_km,
            "automatic_causal_promotion": False,
        }
    near_rate = near_same / near_pairs
    return {
        "stage": "SPATIAL",
        "status": "DESCRIPTIVE_SPATIAL_CLUSTERING_DIAGNOSTIC",
        "n": len(usable),
        "radius_km": radius_km,
        "neighbor_pairs": near_pairs,
        "neighbor_state_agreement": near_rate,
        "global_state_agreement": global_rate,
        "excess_neighbor_agreement": near_rate - global_rate,
        "interpretation": "Positive excess agreement suggests spatial dependence worth modelling; it is not evidence of diffusion or causation.",
        "automatic_causal_promotion": False,
    }


def spatial_permutation_phi(
    rows: Sequence[BinaryObservation], *, permutations: int = 999, seed: int = 73021
) -> dict:
    """Permutation diagnostic that asks how unusual the observed phi is after shuffling B.

    This is a robustness screen, not a spatial regression. Coordinates are required so
    callers do not accidentally treat non-geographic cohorts as spatially adjusted.
    """
    usable = _spatial_rows(rows)
    if len(usable) < 12:
        return {
            "stage": "SPATIAL",
            "status": "INSUFFICIENT_GEOCODED_OBSERVATIONS",
            "n": len(usable),
            "automatic_causal_promotion": False,
        }
    baseline = binary_phi(usable)
    rng = Random(seed)
    b = [r.feature_b for r in usable]
    extreme = 0
    permuted_abs: list[float] = []
    for _ in range(permutations):
        shuffled = b[:]
        rng.shuffle(shuffled)
        sample = [
            BinaryObservation(
                subject_id=r.subject_id,
                feature_a=r.feature_a,
                feature_b=shuffled[i],
                strata=r.strata,
                source_family=r.source_family,
                time=r.time,
                latitude=r.latitude,
                longitude=r.longitude,
            )
            for i, r in enumerate(usable)
        ]
        value = abs(binary_phi(sample).phi)
        permuted_abs.append(value)
        if value >= abs(baseline.phi):
            extreme += 1
    return {
        "stage": "SPATIAL",
        "status": "GEOCODED_PERMUTATION_SCREEN",
        "n": baseline.n,
        "observed_phi": baseline.phi,
        "permutations": permutations,
        "two_sided_permutation_p": (extreme + 1) / (permutations + 1),
        "mean_abs_permuted_phi": mean(permuted_abs),
        "warning": "This shuffling screen does not model spatial covariance, phylogeny, contact or temporal dependence.",
        "automatic_causal_promotion": False,
    }


def phylogenetic_family_sensitivity(rows: Sequence[BinaryObservation]) -> dict:
    """Language-family robustness using stratification and leave-one-family-out perturbation."""
    known = [r for r in rows if r.strata.get("language_family")]
    families = sorted({r.strata.get("language_family") for r in known})
    if len(known) < 12 or len(families) < 2:
        return {
            "stage": "PHYLOGENETIC",
            "status": "INSUFFICIENT_LANGUAGE_FAMILY_COVERAGE",
            "n": len(known),
            "families": len(families),
            "automatic_causal_promotion": False,
        }
    stratified = stratified_associations(known, stratifier="language_family", min_n=4)
    leave_one = leave_one_group_out(known, group_field="language_family")
    deltas = [abs(x["delta_phi"]) for x in leave_one["perturbations"]]
    return {
        "stage": "PHYLOGENETIC",
        "status": "LANGUAGE_FAMILY_SENSITIVITY_ONLY",
        "n": len(known),
        "families": len(families),
        "stratified": stratified,
        "leave_one_family_out": leave_one,
        "max_abs_delta_phi": max(deltas) if deltas else 0.0,
        "warning": "Language-family stratification is not a phylogenetic comparative model and does not establish inheritance.",
        "automatic_causal_promotion": False,
    }


def model_survival_profile(rows: Sequence[BinaryObservation]) -> dict:
    """Bundle successive robustness diagnostics without collapsing them to a magic score."""
    baseline = binary_phi(rows)
    region = stratified_associations(rows, stratifier="region", min_n=4)
    source = leave_one_group_out(rows, group_field="source_family")
    spatial = geographic_neighbor_agreement(rows)
    phylo = phylogenetic_family_sensitivity(rows)

    flags: list[str] = []
    if source["perturbations"] and max(abs(x["delta_phi"]) for x in source["perturbations"]) > 0.15:
        flags.append("SOURCE_FAMILY_FRAGILITY")
    if spatial.get("status") == "DESCRIPTIVE_SPATIAL_CLUSTERING_DIAGNOSTIC" and abs(spatial.get("excess_neighbor_agreement", 0.0)) > 0.10:
        flags.append("SPATIAL_DEPENDENCE_SIGNAL")
    if phylo.get("status") == "LANGUAGE_FAMILY_SENSITIVITY_ONLY" and phylo.get("max_abs_delta_phi", 0.0) > 0.15:
        flags.append("LANGUAGE_FAMILY_FRAGILITY")

    return {
        "analysis_id": "NOEMA-MODEL-SURVIVAL-V1",
        "baseline": baseline.__dict__,
        "region_stratification": region,
        "source_family_sensitivity": source,
        "spatial_diagnostic": spatial,
        "language_family_sensitivity": phylo,
        "fragility_flags": flags,
        "required_next_models": [
            "spatial_lag_or_gaussian_process_model",
            "explicit_phylogenetic_comparative_model",
            "historical_contact_network_model",
            "probabilistic_chronology_model",
            "missingness_detectability_sensitivity",
            "multilevel_adjusted_model",
        ],
        "candidate_only": True,
        "automatic_causal_promotion": False,
        "interpretation": "Model-survival diagnostics reveal fragility. They do not convert association into causation.",
    }
