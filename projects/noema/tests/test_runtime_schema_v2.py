from __future__ import annotations

from pathlib import Path

from noema.evidence_ingestion_v2 import (
    AssertionKind,
    FieldConfidence,
    ObservationState,
    SourceIntegrityEvent,
    StructuredAssertion,
)
from noema.epistemic_stage import EpistemicStage
from noema.persistence_v2 import (
    store_reconciliation,
    store_source_integrity_event,
    store_structured_assertion,
)


ROOT = Path(__file__).resolve().parents[1]


class FakeCursor:
    def __init__(self, row=("11111111-1111-1111-1111-111111111111",)):
        self.row = row

    def fetchone(self):
        return self.row


class FakeConnection:
    def __init__(self):
        self.calls: list[tuple[str, tuple | None]] = []

    def execute(self, query, params=None):
        normalized = " ".join(query.split())
        self.calls.append((normalized, params))
        return FakeCursor()


def test_migration_007_covers_v2_assertion_and_epistemic_contracts():
    sql = (ROOT / "db" / "007_structured_assertions_v2.sql").read_text()
    assert "structured_assertion_candidates" in sql
    assert "source_ref text NOT NULL" in sql
    assert "assertion_field_confidence" in sql
    assert "source_integrity_events" in sql
    assert "assertion_extractor_votes" in sql
    assert "assertion_reconciliations" in sql
    assert "schema_migrations" in sql

    for kind in AssertionKind:
        assert f"'{kind.value}'" in sql
    for state in ObservationState:
        assert f"'{state.value}'" in sql
    for stage in EpistemicStage:
        assert f"'{stage.value}'" in sql

    assert "CHECK (NOT restricted OR sensitive)" in sql
    assert "CHECK (candidate_only = true)" in sql
    assert "CHECK (automatic_promotion = false)" in sql
    assert "INTERPRETATION' OR cardinality(alternatives) > 0" in sql


def test_migration_007_uses_plain_statements_for_neon_transport():
    sql = (ROOT / "db" / "007_structured_assertions_v2.sql").read_text()
    assert "DO $$" not in sql
    assert "DROP CONSTRAINT IF EXISTS analysis_runs_epistemic_stage_check" in sql
    assert "ADD CONSTRAINT analysis_runs_epistemic_stage_check" in sql
    assert "DROP CONSTRAINT IF EXISTS relationship_candidates_epistemic_stage_check" in sql


def test_store_structured_assertion_preserves_raw_source_and_creates_review_work():
    conn = FakeConnection()
    assertion = StructuredAssertion(
        assertion_id="doi:10.1000/example#p4-a2",
        kind=AssertionKind.CHRONOLOGY,
        text="A dated observation was reported.",
        source_id="10.1000/example",
        source_locator={"page": 4, "paragraph": 2},
        state=ObservationState.PRESENT,
        subject_id="site:example",
        field_confidence={
            "text": FieldConfidence(0.96, 0.61),
            "date": FieldConfidence(0.92, None),
        },
        limitations=("Dating context is indirect.",),
    )

    db_id = store_structured_assertion(conn, assertion, metadata={"extractor": "fixture"})
    assert db_id == "11111111-1111-1111-1111-111111111111"
    assert len(conn.calls) == 4

    insert_sql, params = conn.calls[0]
    assert "INSERT INTO structured_assertion_candidates" in insert_sql
    assert "ON CONFLICT (assertion_key) DO UPDATE SET last_seen_at = now()" in insert_sql
    assert params[0] == assertion.assertion_id
    assert params[1] == "10.1000/example"
    assert params[2] == "CHRONOLOGY"
    assert params[5] == "PRESENT"
    assert params[6] == "site:example"

    confidence_calls = [c for c in conn.calls if "assertion_field_confidence" in c[0]]
    assert len(confidence_calls) == 2
    review_sql, review_params = conn.calls[-1]
    assert "INSERT INTO review_queue" in review_sql
    assert review_params[1] == 80
    assert "candidate_only" in review_params[2]


def test_interpretation_alternatives_are_persisted_without_auto_promotion():
    conn = FakeConnection()
    assertion = StructuredAssertion(
        assertion_id="interp-1",
        kind=AssertionKind.INTERPRETATION,
        text="The pattern may reflect contact.",
        source_id="source:key:1",
        source_locator={"section": "discussion"},
        alternatives=("shared ancestry", "convergence", "coding bias"),
        sensitive=True,
    )
    store_structured_assertion(conn, assertion)
    params = conn.calls[0][1]
    assert params[8] == ["shared ancestry", "convergence", "coding bias"]
    assert params[10] is True
    assert "true, false" in conn.calls[0][0]


def test_retraction_creates_reassessment_not_automatic_negation():
    conn = FakeConnection()
    event = SourceIntegrityEvent(
        source_id="10.1000/retracted",
        event_type="retraction",
        event_date="2026-09-10",
        related_source_id="10.1000/retraction-notice",
        note="Publisher retraction notice",
    )
    store_source_integrity_event(conn, event)
    assert len(conn.calls) == 2
    integrity_sql, integrity_params = conn.calls[0]
    assert "INSERT INTO source_integrity_events" in integrity_sql
    assert integrity_params[0] == "10.1000/retracted"
    assert integrity_params[1] == "RETRACTION"
    assert integrity_params[5] == "REASSESS_DEPENDENCIES"
    review_sql, review_params = conn.calls[1]
    assert "SOURCE_INTEGRITY_EVENT" in review_sql
    assert "automatic_claim_negation" in review_params[1]
    assert "false" in review_params[1].lower()


def test_reconciliation_agreement_is_still_human_review_required():
    conn = FakeConnection()
    status = store_reconciliation(
        conn,
        assertion_key="assertion-1",
        extractor_count=3,
        extractor_votes=3,
        variant_count=1,
        source_grounding_verified=True,
    )
    assert status == "AGREEMENT"
    sql, params = conn.calls[0]
    assert "human_review_required, automatic_promotion" in sql
    assert "true, false" in sql
    assert params[4] == "AGREEMENT"


def test_reconciliation_distinguishes_disagreement_and_incomplete():
    conn = FakeConnection()
    assert store_reconciliation(
        conn,
        assertion_key="a",
        extractor_count=3,
        extractor_votes=3,
        variant_count=2,
    ) == "DISAGREEMENT"
    assert store_reconciliation(
        conn,
        assertion_key="b",
        extractor_count=3,
        extractor_votes=2,
        variant_count=1,
    ) == "INCOMPLETE"
