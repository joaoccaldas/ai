from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any, Iterable, Mapping


class AssertionKind(StrEnum):
    OBSERVATION = "OBSERVATION"
    MEASUREMENT = "MEASUREMENT"
    CHRONOLOGY = "CHRONOLOGY"
    ENTITY = "ENTITY"
    RELATIONSHIP_CLAIM = "RELATIONSHIP_CLAIM"
    INTERPRETATION = "INTERPRETATION"
    LIMITATION = "LIMITATION"


class ObservationState(StrEnum):
    PRESENT = "PRESENT"
    ABSENT_AFTER_SEARCH = "ABSENT_AFTER_SEARCH"
    UNKNOWN = "UNKNOWN"
    NOT_RECORDED = "NOT_RECORDED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    CONTESTED = "CONTESTED"
    PRESERVATION_UNLIKELY = "PRESERVATION_UNLIKELY"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"


@dataclass(frozen=True)
class FieldConfidence:
    extraction_confidence: float
    evidential_confidence: float | None = None

    def __post_init__(self) -> None:
        if not 0 <= self.extraction_confidence <= 1:
            raise ValueError("extraction_confidence must be between 0 and 1")
        if self.evidential_confidence is not None and not 0 <= self.evidential_confidence <= 1:
            raise ValueError("evidential_confidence must be between 0 and 1")


@dataclass(frozen=True)
class StructuredAssertion:
    assertion_id: str
    kind: AssertionKind
    text: str
    source_id: str
    source_locator: Mapping[str, Any]
    state: ObservationState | None = None
    subject_id: str | None = None
    object_id: str | None = None
    field_confidence: Mapping[str, FieldConfidence] = field(default_factory=dict)
    alternatives: tuple[str, ...] = ()
    limitations: tuple[str, ...] = ()
    sensitive: bool = False
    restricted: bool = False

    def __post_init__(self) -> None:
        if not self.assertion_id.strip() or not self.text.strip() or not self.source_id.strip():
            raise ValueError("assertion_id, text and source_id are required")
        if not self.source_locator:
            raise ValueError("source_locator is required")
        if self.kind == AssertionKind.INTERPRETATION and not self.alternatives:
            raise ValueError("interpretations require at least one alternative explanation")
        if self.restricted and not self.sensitive:
            raise ValueError("restricted assertions must also be marked sensitive")

    @property
    def candidate_only(self) -> bool:
        return True

    @property
    def automatic_promotion(self) -> bool:
        return False


@dataclass(frozen=True)
class SourceIntegrityEvent:
    source_id: str
    event_type: str
    event_date: str | None
    related_source_id: str | None = None
    note: str | None = None


@dataclass(frozen=True)
class CrossrefIntegrityEnvelope:
    doi: str
    title: str
    published_date: str | None
    indexed_date: str | None
    updated_date: str | None
    relation: Mapping[str, Any]
    update_to: tuple[SourceIntegrityEvent, ...]
    license_urls: tuple[str, ...]
    publisher: str | None


def _date_parts(record: Mapping[str, Any] | None) -> str | None:
    if not record:
        return None
    parts = record.get("date-parts")
    if not parts or not parts[0]:
        return None
    values = [int(v) for v in parts[0][:3]]
    if len(values) == 1:
        return f"{values[0]:04d}"
    if len(values) == 2:
        return f"{values[0]:04d}-{values[1]:02d}"
    return f"{values[0]:04d}-{values[1]:02d}-{values[2]:02d}"


def normalize_crossref_work(message: Mapping[str, Any]) -> CrossrefIntegrityEnvelope:
    doi = str(message.get("DOI") or "").strip().lower()
    if not doi:
        raise ValueError("Crossref record requires DOI")
    titles = message.get("title") or []
    title = str(titles[0] if titles else doi)
    indexed = message.get("indexed") or {}
    updated = message.get("deposited") or {}
    published = message.get("published") or message.get("published-print") or message.get("published-online")
    updates = []
    for event in message.get("update-to") or []:
        updates.append(
            SourceIntegrityEvent(
                source_id=doi,
                event_type=str(event.get("type") or "UPDATE").upper(),
                event_date=_date_parts(event.get("updated")),
                related_source_id=str(event.get("DOI") or "").lower() or None,
                note=str(event.get("label") or "") or None,
            )
        )
    licenses = tuple(
        str(item.get("URL")) for item in (message.get("license") or []) if item.get("URL")
    )
    return CrossrefIntegrityEnvelope(
        doi=doi,
        title=title,
        published_date=_date_parts(published),
        indexed_date=indexed.get("date-time"),
        updated_date=updated.get("date-time"),
        relation=dict(message.get("relation") or {}),
        update_to=tuple(updates),
        license_urls=licenses,
        publisher=message.get("publisher"),
    )


def crossref_integrity_flags(envelope: CrossrefIntegrityEnvelope) -> tuple[str, ...]:
    flags: list[str] = []
    for event in envelope.update_to:
        kind = event.event_type.upper()
        if "RETRACT" in kind:
            flags.append("RETRACTION_RELATED")
        elif "CORRECT" in kind:
            flags.append("CORRECTION_RELATED")
        else:
            flags.append("UPDATED_RECORD")
    if envelope.relation:
        flags.append("HAS_CROSSREF_RELATIONS")
    return tuple(sorted(set(flags)))


def reconcile_extractor_outputs(outputs: Iterable[Iterable[StructuredAssertion]]) -> dict[str, Any]:
    """Compare independent structured extractions without treating agreement as truth."""
    grouped: dict[str, list[StructuredAssertion]] = {}
    extractor_count = 0
    for batch in outputs:
        extractor_count += 1
        seen_this_batch: set[str] = set()
        for item in batch:
            if item.assertion_id in seen_this_batch:
                raise ValueError("an extractor batch contains duplicate assertion_id")
            seen_this_batch.add(item.assertion_id)
            grouped.setdefault(item.assertion_id, []).append(item)

    agreements: list[str] = []
    disagreements: list[dict[str, Any]] = []
    for assertion_id, variants in sorted(grouped.items()):
        signatures = {
            (v.kind.value, v.text.strip(), v.state.value if v.state else None, v.subject_id, v.object_id)
            for v in variants
        }
        if len(variants) == extractor_count and len(signatures) == 1:
            agreements.append(assertion_id)
        else:
            disagreements.append(
                {
                    "assertion_id": assertion_id,
                    "extractor_votes": len(variants),
                    "extractor_count": extractor_count,
                    "variant_count": len(signatures),
                    "human_review_required": True,
                    "automatic_promotion": False,
                }
            )
    return {
        "extractor_count": extractor_count,
        "agreements": agreements,
        "disagreements": disagreements,
        "agreement_is_not_truth": True,
        "automatic_promotion": False,
    }
