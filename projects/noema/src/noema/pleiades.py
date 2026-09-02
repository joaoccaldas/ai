from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class PleiadesName:
    attested: str | None
    romanized: str | None
    language: str | None
    start: int | None
    end: int | None
    certainty: str | None


@dataclass(frozen=True)
class PleiadesPlace:
    place_id: str
    title: str
    description: str | None
    uri: str
    longitude: float | None
    latitude: float | None
    bbox: tuple[float, float, float, float] | None
    place_types: tuple[str, ...]
    names: tuple[PleiadesName, ...]
    connects_with: tuple[str, ...]
    review_state: str | None
    provenance: str | None

    def as_link_record(self) -> dict[str, Any]:
        return {
            "source_family": "PLEIADES",
            "link_role": "ANCIENT_PLACE_RECONCILIATION",
            "place_id": self.place_id,
            "title": self.title,
            "description": self.description,
            "uri": self.uri,
            "longitude": self.longitude,
            "latitude": self.latitude,
            "bbox": list(self.bbox) if self.bbox else None,
            "place_types": list(self.place_types),
            "names": [name.__dict__ for name in self.names],
            "connects_with": list(self.connects_with),
            "review_state": self.review_state,
            "provenance": self.provenance,
            "evidence_status": "PLACE_IDENTITY_CONTEXT_NOT_RELIGIOUS_EVIDENCE",
        }


def _place_id(raw: dict[str, Any]) -> str:
    value = str(raw.get("id") or "").strip()
    if not value:
        uri = str(raw.get("uri") or "").rstrip("/")
        value = uri.rsplit("/", 1)[-1] if uri else ""
    if not value:
        raise ValueError("Pleiades place id is required")
    return value


def _coordinate_pair(raw: dict[str, Any]) -> tuple[float | None, float | None]:
    point = raw.get("reprPoint")
    if not isinstance(point, list) or len(point) != 2:
        return None, None
    lon, lat = point
    if not isinstance(lon, (int, float)) or not isinstance(lat, (int, float)):
        return None, None
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError("Pleiades representative point is outside valid coordinate bounds")
    return float(lon), float(lat)


def normalize_place(raw: dict[str, Any]) -> PleiadesPlace:
    place_id = _place_id(raw)
    title = str(raw.get("title") or "").strip()
    if not title:
        raise ValueError(f"Pleiades place {place_id} has no title")
    lon, lat = _coordinate_pair(raw)

    bbox = None
    box = raw.get("bbox")
    if isinstance(box, list) and len(box) == 4 and all(isinstance(v, (int, float)) for v in box):
        bbox = tuple(float(v) for v in box)

    names = []
    for name in raw.get("names") or []:
        attested = str(name.get("attested") or "").strip() or None
        romanized_values = name.get("romanized") or []
        if isinstance(romanized_values, str):
            romanized = romanized_values.strip() or None
        else:
            romanized = next((str(v).strip() for v in romanized_values if str(v).strip()), None)
        names.append(PleiadesName(
            attested=attested,
            romanized=romanized,
            language=(str(name.get("language") or "").strip() or None),
            start=name.get("start") if isinstance(name.get("start"), int) else None,
            end=name.get("end") if isinstance(name.get("end"), int) else None,
            certainty=(str(name.get("associationCertainty") or "").strip() or None),
        ))

    uri = str(raw.get("uri") or f"https://pleiades.stoa.org/places/{place_id}").strip()
    return PleiadesPlace(
        place_id=place_id,
        title=title,
        description=str(raw.get("description") or "").strip() or None,
        uri=uri,
        longitude=lon,
        latitude=lat,
        bbox=bbox,
        place_types=tuple(str(v).strip() for v in raw.get("placeTypes") or [] if str(v).strip()),
        names=tuple(names),
        connects_with=tuple(str(v).strip() for v in raw.get("connectsWith") or [] if str(v).strip()),
        review_state=str(raw.get("review_state") or "").strip() or None,
        provenance=str(raw.get("provenance") or "").strip() or None,
    )
