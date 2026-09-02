from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OpenAlexWork:
    work_id: str
    title: str
    doi: str | None
    publication_date: str | None
    work_type: str | None
    source_name: str | None
    authors: tuple[str, ...]
    referenced_works: tuple[str, ...]
    related_works: tuple[str, ...]
    topics: tuple[str, ...]

    def as_candidate(self) -> dict[str, Any]:
        return {
            "source_family": "OPENALEX",
            "status": "CANDIDATE_UNREVIEWED",
            "candidate_only": True,
            "work_id": self.work_id,
            "title": self.title,
            "doi": self.doi,
            "publication_date": self.publication_date,
            "work_type": self.work_type,
            "source_name": self.source_name,
            "authors": list(self.authors),
            "referenced_works": list(self.referenced_works),
            "related_works": list(self.related_works),
            "topics": list(self.topics),
            "claim_policy": "OpenAlex identity, topic and citation metadata are discovery context, not evidence or proof of source dependence.",
        }


def normalize_openalex_id(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    if value.startswith("https://openalex.org/"):
        value = value.rsplit("/", 1)[-1]
    return value or None


def normalize_doi(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip().lower()
    for prefix in ("https://doi.org/", "http://doi.org/", "doi:"):
        if value.startswith(prefix):
            value = value[len(prefix):]
    return value or None


def normalize_work(raw: dict[str, Any]) -> OpenAlexWork:
    work_id = normalize_openalex_id(raw.get("id"))
    if not work_id:
        raise ValueError("OpenAlex work id is required")
    title = (raw.get("title") or raw.get("display_name") or "").strip()
    if not title:
        raise ValueError(f"OpenAlex work {work_id} has no title")

    primary = raw.get("primary_location") or {}
    source = primary.get("source") or {}
    authors = []
    for authorship in raw.get("authorships") or []:
        author = authorship.get("author") or {}
        name = (author.get("display_name") or "").strip()
        if name:
            authors.append(name)

    topics = []
    for topic in raw.get("topics") or []:
        name = (topic.get("display_name") or "").strip()
        if name:
            topics.append(name)

    return OpenAlexWork(
        work_id=work_id,
        title=title,
        doi=normalize_doi(raw.get("doi") or (raw.get("ids") or {}).get("doi")),
        publication_date=raw.get("publication_date"),
        work_type=raw.get("type"),
        source_name=(source.get("display_name") or "").strip() or None,
        authors=tuple(authors),
        referenced_works=tuple(filter(None, (normalize_openalex_id(v) for v in raw.get("referenced_works") or []))),
        related_works=tuple(filter(None, (normalize_openalex_id(v) for v in raw.get("related_works") or []))),
        topics=tuple(topics),
    )


def citation_links(work: OpenAlexWork) -> list[dict[str, Any]]:
    """Return non-evidentiary citation/related-work links.

    A citation is not source dependence. These links are useful for follow-up
    review and possible dependence discovery only.
    """
    links = []
    for target in work.referenced_works:
        links.append({
            "source_a": f"OPENALEX:{work.work_id}",
            "source_b": f"OPENALEX:{target}",
            "link_type": "CITES",
            "independence_blocking": False,
        })
    for target in work.related_works:
        links.append({
            "source_a": f"OPENALEX:{work.work_id}",
            "source_b": f"OPENALEX:{target}",
            "link_type": "RELATED_WORK_HINT",
            "independence_blocking": False,
        })
    return links
