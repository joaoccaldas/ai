from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any, Mapping


def _norm_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def _stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


@dataclass(frozen=True)
class ClaimCandidateInput:
    source_id: str
    claim_text: str
    claim_type: str
    source_locator: Mapping[str, Any]
    extraction_method: str
    extraction_confidence: float = 0.5
    subject_entity_id: str | None = None
    object_entity_id: str | None = None
    predicate: str | None = None
    object_literal: Any = None

    def __post_init__(self) -> None:
        if not self.source_id.strip():
            raise ValueError("source_id is required")
        if not _norm_text(self.claim_text):
            raise ValueError("claim_text is required")
        if not self.claim_type.strip():
            raise ValueError("claim_type is required")
        if not dict(self.source_locator):
            raise ValueError("source_locator is required")
        if not self.extraction_method.strip():
            raise ValueError("extraction_method is required")
        if not 0 <= self.extraction_confidence <= 1:
            raise ValueError("extraction_confidence must be between 0 and 1")

    @property
    def fingerprint(self) -> str:
        identity = {
            "source_id": self.source_id.strip().lower(),
            "claim_text": _norm_text(self.claim_text),
            "claim_type": self.claim_type.strip().upper(),
            "source_locator": dict(self.source_locator),
            "subject_entity_id": self.subject_entity_id,
            "object_entity_id": self.object_entity_id,
            "predicate": _norm_text(self.predicate).upper() or None,
            "object_literal": self.object_literal,
        }
        return hashlib.sha256(_stable_json(identity).encode("utf-8")).hexdigest()
