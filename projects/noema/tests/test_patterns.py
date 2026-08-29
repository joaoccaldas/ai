from noema.patterns import build_report, pairwise_candidates


def _binary_assertion(subject, dimension, facet, present, mapping, upstream):
    return {
        "subject_id": str(subject),
        "dimension": dimension,
        "facet": facet,
        "state": "PRESENT" if present else "ABSENT",
        "mapping_status": mapping,
        "upstream_variable": upstream,
        "upstream_question_id": upstream,
    }


def _pulotu_doc():
    subjects = [{"id": str(i)} for i in range(12)]
    assertions = []
    for i in range(12):
        assertions.append(_binary_assertion(i, "D1", "A", i < 10, "EXPLICIT_V1", "V_A"))
        assertions.append(_binary_assertion(i, "D2", "B", i < 8, "EXPLICIT_V1", "V_B"))
        assertions.append(_binary_assertion(i, "D3", "C", i in {0, 2, 4, 6, 8, 10}, "EXPLICIT_V1", "V_C"))
    return {"subjects": subjects, "assertions": assertions}


def _drh_doc():
    subjects = [{"id": "DRH:1", "comparable_belief_system": True}, {"id": "DRH:2", "comparable_belief_system": True}]
    assertions = [
        {"subject_id":"DRH:1","dimension":"D","facet":"X","state":"PRESENT","mapping_status":"CURATED_CROSSWALK_V1","upstream_question_id":"Q1"},
        {"subject_id":"DRH:1","dimension":"D","facet":"X","state":"ABSENT","mapping_status":"CURATED_CROSSWALK_V1","upstream_question_id":"Q1"},
        {"subject_id":"DRH:2","dimension":"D","facet":"X","state":"PRESENT","mapping_status":"CURATED_CROSSWALK_V1","upstream_question_id":"Q1"},
    ]
    return {"subjects": subjects, "assertions": assertions}


def test_pairwise_candidates_use_explicit_binary_denominators():
    out = pairwise_candidates(_pulotu_doc(), source="PULOTU", min_feature_count=3, min_known_count=1, min_pair_known=1, min_pair_count=3, min_lift=1.0)
    assert out["null_model"]["test"].startswith("one-sided hypergeometric")
    assert "explicitly PRESENT or explicitly ABSENT" in out["null_model"]["missingness_rule"]
    assert "complete eligible independent" in out["null_model"]["multiple_testing"]
    assert out["tested_feature_pairs"] == 3
    assert out["candidates"]
    for row in out["candidates"]:
        assert row["n_comparable"] == 12
        assert row["profiles_excluded_for_pair_missingness"] == 0
        assert 0 <= row["p_enrichment"] <= 1
        assert 0 <= row["q_bh"] <= 1
        assert "phylogeny" in row["unresolved_confounders"]
        assert row["candidate_status"] == "DESCRIPTIVE_CANDIDATE"


def test_unknown_and_uncoded_are_not_treated_as_absence():
    subjects = [{"id": str(i)} for i in range(6)]
    assertions = []
    for i in range(4):
        assertions.append(_binary_assertion(i, "D1", "A", i < 2, "EXPLICIT_V1", "V_A"))
        assertions.append(_binary_assertion(i, "D2", "B", i in {0, 2}, "EXPLICIT_V1", "V_B"))
    assertions.append({"subject_id":"4","dimension":"D1","facet":"A","state":"UNKNOWN","mapping_status":"EXPLICIT_V1","upstream_variable":"V_A"})
    assertions.append({"subject_id":"4","dimension":"D2","facet":"B","state":"PRESENT","mapping_status":"EXPLICIT_V1","upstream_variable":"V_B"})
    # subject 5 has no rows at all
    out = pairwise_candidates({"subjects":subjects,"assertions":assertions}, source="PULOTU", min_feature_count=1, min_known_count=1, min_pair_known=1, min_pair_count=1, min_lift=0)
    assert out["tested_feature_pairs"] == 1
    row = out["candidates"][0]
    assert row["n_comparable"] == 4
    assert row["cohort_profiles"] == 6
    assert row["profiles_excluded_for_pair_missingness"] == 2


def test_conflicting_drh_scopes_are_excluded_not_majority_voted():
    out = pairwise_candidates(_drh_doc(), source="DRH", comparable_only=True, min_feature_count=1, min_known_count=1, min_pair_known=1, min_pair_count=1, min_lift=0)
    assert out["conflicted_subject_feature_cells_excluded"] == 1


def test_same_upstream_crosswalk_pair_is_not_a_pattern():
    subjects = [{"id": str(i)} for i in range(8)]
    assertions = []
    for i in range(8):
        assertions += [
            _binary_assertion(i,"D1","burial",i < 4,"EXPLICIT_V1","V1"),
            _binary_assertion(i,"D2","funerary",i < 4,"EXPLICIT_V1","V1"),
        ]
    out = pairwise_candidates({"subjects":subjects,"assertions":assertions}, source="PULOTU", min_feature_count=1, min_known_count=1, min_pair_known=1, min_pair_count=1, min_lift=0)
    assert out["same_upstream_origin_feature_pairs_excluded"] == 1
    assert out["tested_feature_pairs"] == 0
    assert out["candidates"] == []


def test_identical_facets_across_dimensions_are_not_a_pattern():
    subjects = [{"id": str(i)} for i in range(8)]
    assertions = []
    for i in range(8):
        assertions += [
            _binary_assertion(i,"D1","syncretism",i < 4,"EXPLICIT_V1","V1"),
            _binary_assertion(i,"D2","syncretism",i < 4,"EXPLICIT_V1","V2"),
        ]
    out = pairwise_candidates({"subjects":subjects,"assertions":assertions}, source="PULOTU", min_feature_count=1, min_known_count=1, min_pair_known=1, min_pair_count=1, min_lift=0)
    assert out["semantic_duplicate_feature_pairs_excluded"] == 1
    assert out["tested_feature_pairs"] == 0


def test_report_keeps_source_cohorts_separate():
    out = build_report(_pulotu_doc(), _drh_doc())
    assert [c["source"] for c in out["cohorts"]] == ["PULOTU", "DRH"]
    assert "Never pool Pulotu and DRH" in out["cross_cohort_rule"]
