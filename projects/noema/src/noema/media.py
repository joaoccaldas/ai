from __future__ import annotations

from hashlib import sha256
from html import unescape
from html.parser import HTMLParser


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def html_text(value: str | None) -> str:
    if not value:
        return ""
    parser = _TextExtractor()
    parser.feed(unescape(value))
    return " ".join(" ".join(parser.parts).split())


def ext_value(extmetadata: dict, key: str) -> str:
    raw = (extmetadata or {}).get(key) or {}
    return html_text(raw.get("value") if isinstance(raw, dict) else str(raw))


def media_candidate_fingerprint(entity_id: str, provider: str, provider_page_id: str | int | None, media_url: str) -> str:
    payload = f"{entity_id}\n{provider}\n{provider_page_id or ''}\n{media_url}".encode("utf-8")
    return sha256(payload).hexdigest()


def commons_candidate(entity: dict, page: dict, search_query: str) -> dict | None:
    infos = page.get("imageinfo") or []
    if not infos:
        return None
    info = infos[0]
    media_url = info.get("url")
    if not media_url:
        return None
    ext = info.get("extmetadata") or {}
    page_id = page.get("pageid")
    title = page.get("title") or ""
    source_page = info.get("descriptionurl") or ("https://commons.wikimedia.org/wiki/" + title.replace(" ", "_"))
    return {
        "candidate_fingerprint": media_candidate_fingerprint(entity["id"], "WIKIMEDIA_COMMONS", page_id, media_url),
        "entity_id": entity["id"],
        "entity_name": entity.get("name"),
        "entity_kind": entity.get("kind"),
        "provider": "WIKIMEDIA_COMMONS",
        "provider_page_id": page_id,
        "provider_title": title,
        "search_query": search_query,
        "source_page_url": source_page,
        "media_url": media_url,
        "thumbnail_url": info.get("thumburl"),
        "creator": ext_value(ext, "Artist"),
        "credit": ext_value(ext, "Credit"),
        "license": ext_value(ext, "LicenseShortName"),
        "license_url": ext_value(ext, "LicenseUrl"),
        "usage_terms": ext_value(ext, "UsageTerms"),
        "attribution_required": ext_value(ext, "AttributionRequired"),
        "restrictions": ext_value(ext, "Restrictions"),
        "description": ext_value(ext, "ImageDescription"),
        "identity_match_status": "PENDING_REVIEW",
        "rights_review_status": "PENDING_REVIEW",
        "decision": "PENDING_REVIEW",
        "display_gate": "DO_NOT_RENDER_PUBLICLY_UNTIL_IDENTITY_AND_RIGHTS_APPROVED"
    }
