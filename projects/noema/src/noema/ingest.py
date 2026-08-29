from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from typing import Any, Mapping
from urllib.parse import urlsplit, urlunsplit


PUBLIC_ACCESS = {"PUBLIC", "ACADEMIC_USE", "ATTRIBUTION_REQUIRED"}


@dataclass(frozen=True)
class SourceEnvelope:
    title: str
    source_type: str
    canonical_url: str
    publisher: str | None = None
    published_year: int | None = None
    doi: str | None = None
    access_level: str = "PUBLIC"
    external_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.title.strip():
            raise ValueError("source title is required")
        if not self.canonical_url.startswith(("https://", "http://")):
            raise ValueError("source canonical_url must be HTTP(S)")
        if self.access_level not in PUBLIC_ACCESS | {"COMMUNITY_RESTRICTED", "DO_NOT_PUBLISH"}:
            raise ValueError("unknown access level")

    @property
    def dedupe_key(self) -> str:
        if self.doi:
            raw = f"doi:{self.doi.lower().strip()}"
        elif self.external_id:
            raw = f"external:{self.source_type}:{self.external_id}"
        else:
            raw = f"url:{canonicalize_url(self.canonical_url)}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def canonicalize_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), "", ""))


def from_consensus_record(record: Mapping[str, Any]) -> SourceEnvelope:
    metadata = dict(record.get("metadata") or {})
    year = metadata.get("publish_year")
    return SourceEnvelope(
        title=str(record["title"]),
        source_type="PEER_REVIEWED_PAPER",
        canonical_url=str(record["url"]),
        publisher=metadata.get("journal"),
        published_year=int(year) if year else None,
        doi=metadata.get("doi"),
        external_id=str(record.get("id")) if record.get("id") else None,
        metadata={
            "authors": metadata.get("authors"),
            "citation_count": metadata.get("citation_count"),
            "abstract": record.get("text"),
            "provider": "Consensus",
        },
    )


def from_dataset_manifest(record: Mapping[str, Any]) -> SourceEnvelope:
    return SourceEnvelope(
        title=str(record["title"]),
        source_type=str(record.get("source_type", "DATASET")),
        canonical_url=str(record["canonical_url"]),
        publisher=record.get("publisher"),
        published_year=record.get("published_year"),
        doi=record.get("doi"),
        access_level=str(record.get("access_level", "PUBLIC")),
        external_id=record.get("external_id"),
        metadata=dict(record.get("metadata") or {}),
    )


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
