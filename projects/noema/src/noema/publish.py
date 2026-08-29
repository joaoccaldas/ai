from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

PUBLISHABLE_ACCESS = {"PUBLIC", "ACADEMIC_USE", "ATTRIBUTION_REQUIRED"}


def is_publishable(record: Mapping[str, Any]) -> bool:
    access = str(record.get("access_level", "PUBLIC"))
    if access not in PUBLISHABLE_ACCESS:
        return False
    if record.get("reviewed") is False:
        return False
    if record.get("sacred_or_restricted") is True:
        return False
    if record.get("model_generated_evidence") is True:
        return False
    return True


def public_projection(records: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    safe: list[dict[str, Any]] = []
    for record in records:
        if not is_publishable(record):
            continue
        item = dict(record)
        item.pop("private_notes", None)
        item.pop("raw_source_text", None)
        item.pop("reviewer_identity", None)
        safe.append(item)
    return safe
