from noema.patterns import build_report, pairwise_candidates


def _pulotu_doc():
    subjects = [{"id": str(i)} for i in range(12)]
    assertions = []
    for i in range(12):
        if i < 10:
            assertions.append({"subject_id": str(i), "dimension": "D1", "facet": "A", "state": "PRESENT", "mapping_status": "EXPLICIT_V1", "upstream_variable": "V_A"})
        if i < 8:
            assertions.append({"subject_id": str(i), "dimension": "D2", "facet": "B", "state": "PRESENT", "mapping_status": "EXPLICIT_V1", "upstream_variable": "V_B"})
        if i in {0, 2, 4, 6, 8, 10}:
            assertions.append({"subject_id": str(i), "dimension": "D3", "facet": "C", "state": "PRESENT", "mapping_status": "EXPLICIT_V1", "upstream_variable": "V_C"})
    return {"subjects": subjects, "assertions": assertions}


def _drh_doc():
    subjects = [{"id": "DRH:1", "comparable_belief_system": True}, {"id": "DRH:2", "comparable_belief_system": True}]
    assertions = [
        {"subject_id":"DRH:1","dimension":"D","facet":"X","state":"PRESENT","mapping_status":"CURATED_CROSSWALK_V1","upstream_question_id":"Q1"},
        {"subject_id":"DRH:1","dimension":"D","facet":"X","state":"ABSENT","mapping_status":"CURATED_CROSSWALK_V1","upstream_question_id":"Q1"},
        {"subject_id":"DRH:2","dimension":"D","facet":"X","state":"PRESENT","mapping_status":"CURATED_CROSSWALK_V1","upstream_question_id":"Q1"},
    ]
    return {"subjects": subjects, "assertions": assertions}


def test_pairwise_candidates_are_fixed_marginal_descriptive_results():
    out = pairwise_candidates(_pulotu_doc(), source="PULOTU", min_feature_count=3, min_pair_count=3, min_lift=1.0)
    assert out["null_model"]["test"].startswith("one-sided hypergeometric")
    assert "complete eligible independent" in out["null_model"]["multiple_testing"]
    assert out["tested_feature_pairs"] == 3
    assert out["candidates"]
    for row in out["candidates"]:
        assert 0 <= row["p_enrichment"] <= 1
        assert 0 <= row["q_bh"] <= 1
        assert "phylogeny" in row["unresolved_confounders"]
        assert row["candidate_status"] == "DESCRIPTIVE_CANDIDATE"


def test_conflicting_drh_scopes_are_excluded_not_majority_voted():
    out = pairwise_candidates(_drh_doc(), source="DRH", comparable_only=True, min_feature_count=1, min_pair_count=1, min_lift=0)
    assert out["conflicted_subject_feature_cells_excluded"] == 1


def test_same_upstream_crosswalk_pair_is_not_a_pattern():
    subjects = [{"id": str(i)} for i in range(8)]
    assertions = []
    for i in range(8):
        assertions += [
            {"subject_id":str(i),"dimension":"D1","facet":"burial","state":"PRESENT","mapping_status":"EXPLICIT_V1","upstream_variable":"V1"},
            {"subject_id":str(i),"dimension":"D2","facet":"funerary","state":"PRESENT","mapping_status":"EXPLICIT_V1","upstream_variable":"V1"},
        ]
    out = pairwise_candidates({"subjects":subjects,"assertions":assertions}, source="PULOTU", min_feature_count=1, min_pair_count=1, min_lift=0)
    assert out["same_upstream_origin_feature_pairs_excluded"] == 1
    assert out["tested_feature_pairs"] == 0
    assert out["candidates"] == []


def test_identical_facets_across_dimensions_are_not_a_pattern():
    subjects = [{"id": str(i)} for i in range(8)]
    assertions = []
    for i in range(8):
        assertions += [
            {"subject_id":str(i),"dimension":"D1","facet":"syncretism","state":"PRESENT","mapping_status":"EXPLICIT_V1","upstream_variable":"V1"},
            {"subject_id":str(i),"dimension":"D2","facet":"syncretism","state":"PRESENT","mapping_status":"EXPLICIT_V1","upstream_variable":"V2"},
        ]
    out = pairwise_candidates({"subjects":subjects,"assertions":assertions}, source="PULOTU", min_feature_count=1, min_pair_count=1, min_lift=0)
    assert out["semantic_duplicate_feature_pairs_excluded"] == 1
    assert out["tested_feature_pairs"] == 0


def test_report_keeps_source_cohorts_separate():
    out = build_report(_pulotu_doc(), _drh_doc())
    assert [c["source"] for c in out["cohorts"]] == ["PULOTU", "DRH"]
    assert "Never pool Pulotu and DRH" in out["cross_cohort_rule"]
