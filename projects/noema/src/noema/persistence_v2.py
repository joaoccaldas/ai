from __future__ import annotations

import json
from typing import Any, Mapping, Protocol

from .evidence_ingestion_v2 import SourceIntegrityEvent, StructuredAssertion


class CursorLike(Protocol):
    def fetchone(self) -> Any: ...


class ConnectionLike(Protocol):
    def execute(self, query: str, params: Any = None) -> CursorLike: ...


def _row_id(row: Any) -> str:
    if isinstance(row, Mapping):
        return str(row["id"])
    return str(row[0])


def store_structured_assertion(
    conn: ConnectionLike,
    assertion: StructuredAssertion,
    *,
    metadata: Mapping[str, Any] | None = None,
) -> str:
    """Persist a V2 assertion as candidate-only work and enqueue human review.

    The first substantive extraction for an assertion key is immutable here. A repeated
    ingestion only refreshes `last_seen_at`; competing extraction variants belong in
    the extractor-vote/reconciliation tables. This prevents a later automation run
    from silently rewriting an already reviewed scientific object.
    """

    row = conn.execute(
        """
        INSERT INTO structured_assertion_candidates (
          assertion_key, source_ref, assertion_kind, assertion_text, source_locator,
          observation_state, subject_ref, object_ref, alternatives, limitations,
          sensitive, restricted, candidate_only, automatic_promotion, metadata
        ) VALUES (
          %s, %s, %s, %s, %s::jsonb,
          %s, %s, %s, %s, %s,
          %s, %s, true, false, %s::jsonb
        )
        ON CONFLICT (assertion_key) DO UPDATE
          SET last_seen_at = now()
        RETURNING id
        """,
        (
            assertion.assertion_id,
            assertion.source_id,
            assertion.kind.value,
            assertion.text,
            json.dumps(dict(assertion.source_locator), sort_keys=True),
            assertion.state.value if assertion.state else None,
            assertion.subject_id,
            assertion.object_id,
            list(assertion.alternatives),
            list(assertion.limitations),
            assertion.sensitive,
            assertion.restricted,
            json.dumps(dict(metadata or {}), sort_keys=True),
        ),
    ).fetchone()
    assertion_db_id = _row_id(row)

    for field_name, confidence in assertion.field_confidence.items():
        conn.execute(
            """
            INSERT INTO assertion_field_confidence (
              assertion_id, field_name, extraction_confidence, evidential_confidence
            ) VALUES (%s::uuid, %s, %s, %s)
            ON CONFLICT (assertion_id, field_name) DO NOTHING
            """,
            (
                assertion_db_id,
                field_name,
                confidence.extraction_confidence,
                confidence.evidential_confidence,
            ),
        )

    conn.execute(
        """
        INSERT INTO review_queue (
          item_type, object_id, status, priority, reason, proposed_action, metadata
        ) VALUES (
          'STRUCTURED_ASSERTION_V2', %s, 'PENDING', %s,
          'Typed source assertion requires human scientific review',
          'REVIEW_ASSERTION',
          %s::jsonb
        )
        ON CONFLICT (item_type, object_id, status) DO NOTHING
        """,
        (
            assertion_db_id,
            80 if assertion.kind.value in {"CHRONOLOGY", "RELATIONSHIP_CLAIM", "INTERPRETATION"} else 60,
            json.dumps(
                {
                    "assertion_key": assertion.assertion_id,
                    "source_ref": assertion.source_id,
                    "assertion_kind": assertion.kind.value,
                    "candidate_only": True,
                    "automatic_promotion": False,
                },
                sort_keys=True,
            ),
        ),
    )
    return assertion_db_id


def store_source_integrity_event(
    conn: ConnectionLike,
    event: SourceIntegrityEvent,
    *,
    metadata: Mapping[str, Any] | None = None,
) -> None:
    """Persist correction/retraction/update metadata without negating a claim.

    Retractions and corrections create reassessment work. They do not automatically
    reverse any historical assertion or hypothesis.
    """

    event_type = event.event_type.upper()
    requires_review = "RETRACT" in event_type or "CORRECT" in event_type
    conn.execute(
        """
        INSERT INTO source_integrity_events (
          source_ref, event_type, event_date_text, related_source_ref, note,
          integrity_effect, metadata
        ) VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
        ON CONFLICT DO NOTHING
        """,
        (
            event.source_id,
            event_type,
            event.event_date,
            event.related_source_id,
            event.note,
            "REASSESS_DEPENDENCIES" if requires_review else "METADATA_ONLY",
            json.dumps(dict(metadata or {}), sort_keys=True),
        ),
    )
    if requires_review:
        object_id = "|".join(
            [event.source_id, event_type, event.event_date or "", event.related_source_id or ""]
        )
        conn.execute(
            """
            INSERT INTO review_queue (
              item_type, object_id, status, priority, reason, proposed_action, metadata
            ) VALUES (
              'SOURCE_INTEGRITY_EVENT', %s, 'PENDING', 95,
              'Correction or retraction metadata may affect dependent assertions',
              'REASSESS_SOURCE_DEPENDENCIES',
              %s::jsonb
            )
            ON CONFLICT (item_type, object_id, status) DO NOTHING
            """,
            (
                object_id,
                json.dumps(
                    {
                        "source_ref": event.source_id,
                        "event_type": event_type,
                        "automatic_claim_negation": False,
                    },
                    sort_keys=True,
                ),
            ),
        )


def store_reconciliation(
    conn: ConnectionLike,
    *,
    assertion_key: str,
    extractor_count: int,
    extractor_votes: int,
    variant_count: int,
    source_grounding_verified: bool = False,
    metadata: Mapping[str, Any] | None = None,
) -> str:
    """Persist extractor agreement/disagreement as review state, never truth."""

    if extractor_count < 1 or extractor_votes < 0 or extractor_votes > extractor_count:
        raise ValueError("invalid extractor counts")
    if variant_count < 1:
        raise ValueError("variant_count must be positive")
    if extractor_votes < extractor_count:
        status = "INCOMPLETE"
    elif variant_count > 1:
        status = "DISAGREEMENT"
    else:
        status = "AGREEMENT"

    conn.execute(
        """
        INSERT INTO assertion_reconciliations (
          assertion_key, extractor_count, extractor_votes, variant_count,
          reconciliation_status, source_grounding_verified,
          human_review_required, automatic_promotion, metadata
        ) VALUES (%s, %s, %s, %s, %s, %s, true, false, %s::jsonb)
        ON CONFLICT (assertion_key) DO UPDATE SET
          extractor_count = EXCLUDED.extractor_count,
          extractor_votes = EXCLUDED.extractor_votes,
          variant_count = EXCLUDED.variant_count,
          reconciliation_status = EXCLUDED.reconciliation_status,
          source_grounding_verified = EXCLUDED.source_grounding_verified,
          human_review_required = true,
          automatic_promotion = false,
          metadata = EXCLUDED.metadata,
          reconciled_at = now()
        """,
        (
            assertion_key,
            extractor_count,
            extractor_votes,
            variant_count,
            status,
            source_grounding_verified,
            json.dumps(dict(metadata or {}), sort_keys=True),
        ),
    )
    return status
