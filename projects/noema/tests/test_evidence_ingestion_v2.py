import pytest

from noema.evidence_ingestion_v2 import (
    AssertionKind,
    FieldConfidence,
    ObservationState,
    StructuredAssertion,
    crossref_integrity_flags,
    normalize_crossref_work,
    reconcile_extractor_outputs,
)


def test_crossref_integrity_preserves_publication_index_and_correction_dates():
    record = {
        "DOI": "10.1234/Example",
        "title": ["Example study"],
        "publisher": "Example Press",
        "published": {"date-parts": [[2026, 9, 1]]},
        "indexed": {"date-time": "2026-09-10T01:02:03Z"},
        "deposited": {"date-time": "2026-09-09T02:03:04Z"},
        "relation": {"is-preprint-of": [{"id-type": "doi", "id": "10.1234/x"}]},
        "update-to": [
            {
                "DOI": "10.1234/original",
                "type": "correction",
                "updated": {"date-parts": [[2026, 9, 9]]},
            }
        ],
        "license": [{"URL": "https://creativecommons.org/licenses/by/4.0/"}],
    }
    out = normalize_crossref_work(record)
    assert out.doi == "10.1234/example"
    assert out.published_date == "2026-09-01"
    assert out.indexed_date == "2026-09-10T01:02:03Z"
    assert out.updated_date == "2026-09-09T02:03:04Z"
    assert "CORRECTION_RELATED" in crossref_integrity_flags(out)
    assert "HAS_CROSSREF_RELATIONS" in crossref_integrity_flags(out)


def test_crossref_retraction_flag_is_not_silently_ignored():
    out = normalize_crossref_work({
        "DOI": "10.1/a",
        "title": ["Retracted example"],
        "update-to": [{"DOI": "10.1/b", "type": "retraction"}],
    })
    assert crossref_integrity_flags(out) == ("RETRACTION_RELATED",)


def test_interpretation_requires_alternative_explanation():
    with pytest.raises(ValueError):
        StructuredAssertion(
            assertion_id="a1",
            kind=AssertionKind.INTERPRETATION,
            text="This object was ritual.",
            source_id="paper:1",
            source_locator={"page": 3},
        )


def test_restricted_assertion_must_be_sensitive():
    with pytest.raises(ValueError):
        StructuredAssertion(
            assertion_id="a2",
            kind=AssertionKind.OBSERVATION,
            text="restricted material",
            source_id="archive:1",
            source_locator={"catalogue": "x"},
            restricted=True,
            sensitive=False,
        )


def test_extraction_confidence_is_distinct_from_evidential_confidence():
    confidence = FieldConfidence(extraction_confidence=0.99, evidential_confidence=0.45)
    assert confidence.extraction_confidence != confidence.evidential_confidence


def test_absence_has_explicit_nonbinary_states():
    assert ObservationState.UNKNOWN != ObservationState.ABSENT_AFTER_SEARCH
    assert ObservationState.PRESERVATION_UNLIKELY != ObservationState.ABSENT_AFTER_SEARCH


def _assertion(text="Observed deposit", kind=AssertionKind.OBSERVATION):
    return StructuredAssertion(
        assertion_id="same-id",
        kind=kind,
        text=text,
        source_id="paper:1",
        source_locator={"page": 1},
        alternatives=("manufacturing residue",) if kind == AssertionKind.INTERPRETATION else (),
    )


def test_multi_extractor_disagreement_goes_to_review_and_never_promotes():
    out = reconcile_extractor_outputs([
        [_assertion()],
        [_assertion("Ritual deposit", AssertionKind.INTERPRETATION)],
    ])
    assert out["agreements"] == []
    assert out["disagreements"][0]["human_review_required"] is True
    assert out["disagreements"][0]["automatic_promotion"] is False
    assert out["agreement_is_not_truth"] is True


def test_agreement_still_does_not_mean_truth():
    out = reconcile_extractor_outputs([[_assertion()], [_assertion()]])
    assert out["agreements"] == ["same-id"]
    assert out["agreement_is_not_truth"] is True
    assert out["automatic_promotion"] is False
