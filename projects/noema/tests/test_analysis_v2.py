from noema.analysis_v2 import (
    BinaryObservation,
    binary_phi,
    chronological_direction,
    leave_one_group_out,
    robustness_profile,
    stratified_associations,
)


def rows():
    return [
        BinaryObservation("s1", True, True, {"region":"A","language_family":"L1"}, "F1", 1000),
        BinaryObservation("s2", True, True, {"region":"A","language_family":"L1"}, "F1", 900),
        BinaryObservation("s3", False, False, {"region":"A","language_family":"L1"}, "F2", 800),
        BinaryObservation("s4", False, False, {"region":"A","language_family":"L1"}, "F2", 700),
        BinaryObservation("s5", True, False, {"region":"B","language_family":"L2"}, "F3", 600),
        BinaryObservation("s6", False, True, {"region":"B","language_family":"L2"}, "F3", 500),
        BinaryObservation("s7", True, False, {"region":"B","language_family":"L2"}, "F4", 400),
        BinaryObservation("s8", False, True, {"region":"B","language_family":"L2"}, "F4", 300),
        BinaryObservation("s9", None, True, {"region":"B","language_family":"L2"}, "F4", 200),
    ]


def test_binary_phi_uses_complete_cases_only():
    out = binary_phi(rows())
    assert out.n == 8
    assert -1 <= out.phi <= 1


def test_stratification_reports_unknown_separately():
    rs = rows() + [BinaryObservation("s10", True, True, {}, "F5", 100)]
    out = stratified_associations(rs, stratifier="region", min_n=1)
    assert out["unknown_stratum_rows"] == 1
    assert out["stage"] == "STRATIFIED"
    assert "not causal proof" in out["interpretation"]


def test_leave_one_source_family_out_quantifies_fragility():
    out = leave_one_group_out(rows(), group_field="source_family")
    assert out["perturbations"]
    assert all("delta_phi" in x for x in out["perturbations"])
    assert out["automatic_causal_promotion"] is False


def test_temporal_direction_is_descriptive_not_origin_claim():
    out = chronological_direction(rows())
    assert out["status"] == "DESCRIPTIVE_ORDER_ONLY"
    assert "not necessarily earliest historical presence" in out["warning"]
    assert out["automatic_causal_promotion"] is False


def test_temporal_direction_abstains_without_dates():
    undated = [BinaryObservation("a", True, False), BinaryObservation("b", False, True)]
    out = chronological_direction(undated)
    assert out["status"] == "INSUFFICIENT_DATED_OBSERVATIONS"


def test_robustness_profile_lists_required_stronger_models():
    out = robustness_profile(rows())
    assert out["candidate_only"] is True
    assert out["automatic_causal_promotion"] is False
    assert "spatial_autocorrelation" in out["required_next_models"]
    assert "phylogenetic_comparative_model" in out["required_next_models"]
    assert "probabilistic_chronology" in out["required_next_models"]
