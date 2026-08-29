from noema.decomposition import compare_subjects, pattern_candidates, query_assertions


def sample():
    return [
        {"subject_id":"A","subject_name":"Alpha","dimension":"AGENCY_ONTOLOGY","facet":"ancestors","state":"PRESENT","source_id":"S1","mapping_status":"EXPLICIT_V1"},
        {"subject_id":"A","subject_name":"Alpha","dimension":"RITUAL_GRAMMAR","facet":"offering","state":"PRESENT","source_id":"S1","mapping_status":"EXPLICIT_V1"},
        {"subject_id":"B","subject_name":"Beta","dimension":"AGENCY_ONTOLOGY","facet":"ancestors","state":"PRESENT","source_id":"S2","mapping_status":"CURATED_CROSSWALK_V1"},
        {"subject_id":"B","subject_name":"Beta","dimension":"ALTERED_STATE_INDUCTION","facet":"drumming","state":"PRESENT","source_id":"S2","mapping_status":"CURATED_CROSSWALK_V1"},
        {"subject_id":"C","subject_name":"Gamma","dimension":"AGENCY_ONTOLOGY","facet":"ancestors","state":"UNKNOWN","source_id":"S3","mapping_status":"EXPLICIT_V1"},
        {"subject_id":"C","subject_name":"Gamma","dimension":"RITUAL_GRAMMAR","facet":"offering","state":"PRESENT","source_id":"S3","mapping_status":"NEEDS_REVIEW"},
        {"subject_id":"D","subject_name":"Delta","dimension":"AGENCY_ONTOLOGY","facet":"ancestors","state":"PRESENT","source_id":"S4","mapping_status":"AUTO_ROUTE_REVIEW_REQUIRED"},
    ]


def test_query_searches_metadata():
    got=query_assertions(sample(), text="alpha", dimensions={"AGENCY_ONTOLOGY"})
    assert len(got)==1 and got[0]["subject_id"]=="A"


def test_compare_accepts_curated_cross_source_mapping():
    out=compare_subjects(sample(), ["A","B"])
    assert "AGENCY_ONTOLOGY::ancestors" in out["common_features"]
    assert any(x["feature"]=="RITUAL_GRAMMAR::offering" for x in out["differentiators"])
    assert "CURATED_CROSSWALK_V1" in out["semantics"]["accepted_mapping_statuses"]


def test_compare_distinguishes_unknown_from_absence():
    out=compare_subjects(sample(), ["A","C"])
    assert "does not mean true absence" in out["semantics"]["not_present_in_profile"]
    assert "AGENCY_ONTOLOGY::ancestors" in next(x["feature"] for x in out["differentiators"] if x["feature"]=="AGENCY_ONTOLOGY::ancestors")


def test_conditional_and_auto_route_do_not_enter_profiles():
    out=compare_subjects(sample(), ["A","C","D"])
    assert "RITUAL_GRAMMAR::offering" not in out["common_features"]
    assert "AGENCY_ONTOLOGY::ancestors" not in out["common_features"]


def test_dependence_penalty_reduces_pattern_priority():
    rows=sample()
    no_penalty=pattern_candidates(rows, min_subjects=2)
    ancestors=next(x for x in no_penalty if x["feature"]=="AGENCY_ONTOLOGY::ancestors")
    with_penalty=pattern_candidates(rows, min_subjects=2, dependence={("A","B"):0.75})
    penalized=next(x for x in with_penalty if x["feature"]=="AGENCY_ONTOLOGY::ancestors")
    assert penalized["investigation_score"] < ancestors["investigation_score"]
    assert "Candidate recurrence only" in penalized["interpretation"]
