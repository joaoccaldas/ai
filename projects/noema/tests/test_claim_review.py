import pytest

from noema.claim_candidates import ClaimCandidateInput
from noema.review import APPROVED, PENDING, REJECTED, REOPENED, can_create_evidence, transition


def candidate(**overrides):
    values = {
        "source_id": "source-1",
        "claim_text": "Ritual X is attested at site Y.",
        "claim_type": "OBSERVATION",
        "source_locator": {"page": 42},
        "extraction_method": "structured-extractor-v1",
        "extraction_confidence": 0.72,
        "subject_entity_id": "entity-1",
        "predicate": "ATTESTED_AT",
        "object_literal": {"site": "Y"},
    }
    values.update(overrides)
    return ClaimCandidateInput(**values)


def test_candidate_fingerprint_is_stable_across_whitespace():
    a = candidate(claim_text="Ritual X is attested at site Y.")
    b = candidate(claim_text="  Ritual X   is attested at site Y.  ")
    assert a.fingerprint == b.fingerprint


def test_source_locator_is_mandatory():
    with pytest.raises(ValueError, match="source_locator"):
        candidate(source_locator={})


def test_extractor_confidence_does_not_escape_bounds():
    with pytest.raises(ValueError, match="between 0 and 1"):
        candidate(extraction_confidence=1.1)


def test_only_approved_state_can_create_evidence():
    assert can_create_evidence(APPROVED)
    assert not can_create_evidence(PENDING)
    assert not can_create_evidence(REJECTED)
    assert not can_create_evidence(REOPENED)


def test_rejected_candidate_requires_explicit_reopen():
    with pytest.raises(ValueError):
        transition(REJECTED, APPROVED)
    assert transition(REJECTED, REOPENED).action == "REOPEN"
    assert transition(REOPENED, APPROVED).action == "APPROVE"
