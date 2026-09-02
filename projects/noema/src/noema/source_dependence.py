from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable


STRONG_DEPENDENCY_TYPES = {
    "SAME_WORK",
    "DERIVED_FROM",
    "SHARED_DATASET",
    "SHARED_SAMPLE",
}


@dataclass(frozen=True)
class SourceFingerprint:
    source_id: str
    doi: str | None = None
    pmid: str | None = None
    pmcid: str | None = None
    datasets: tuple[str, ...] = field(default_factory=tuple)
    samples: tuple[str, ...] = field(default_factory=tuple)
    parent_source_ids: tuple[str, ...] = field(default_factory=tuple)

    def normalized(self) -> "SourceFingerprint":
        return SourceFingerprint(
            source_id=self.source_id.strip(),
            doi=_norm_identifier(self.doi, "doi:"),
            pmid=_norm_identifier(self.pmid, "pmid:"),
            pmcid=_norm_identifier(self.pmcid, "pmcid:"),
            datasets=tuple(sorted({_norm_token(v) for v in self.datasets if _norm_token(v)})),
            samples=tuple(sorted({_norm_token(v) for v in self.samples if _norm_token(v)})),
            parent_source_ids=tuple(sorted({v.strip() for v in self.parent_source_ids if v.strip()})),
        )


@dataclass(frozen=True)
class DependencyEdge:
    source_a: str
    source_b: str
    dependency_type: str
    reasons: tuple[str, ...]
    independence_blocking: bool

    def as_dict(self) -> dict:
        return {
            "source_a": self.source_a,
            "source_b": self.source_b,
            "dependency_type": self.dependency_type,
            "reasons": list(self.reasons),
            "independence_blocking": self.independence_blocking,
        }


def _norm_identifier(value: str | None, prefix: str) -> str | None:
    if not value:
        return None
    text = value.strip().lower()
    if prefix == "doi:":
        for lead in ("https://doi.org/", "http://doi.org/", "doi:"):
            if text.startswith(lead):
                text = text[len(lead) :]
    elif text.startswith(prefix):
        text = text[len(prefix) :]
    return text.strip() or None


def _norm_token(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _edge(a: str, b: str, dependency_type: str, reasons: Iterable[str]) -> DependencyEdge:
    left, right = sorted((a, b))
    return DependencyEdge(
        source_a=left,
        source_b=right,
        dependency_type=dependency_type,
        reasons=tuple(sorted(set(reasons))),
        independence_blocking=dependency_type in STRONG_DEPENDENCY_TYPES,
    )


def compare_sources(a: SourceFingerprint, b: SourceFingerprint) -> list[DependencyEdge]:
    a = a.normalized()
    b = b.normalized()
    if a.source_id == b.source_id:
        return []

    edges: list[DependencyEdge] = []

    identifier_matches = []
    for label, left, right in (
        ("doi", a.doi, b.doi),
        ("pmid", a.pmid, b.pmid),
        ("pmcid", a.pmcid, b.pmcid),
    ):
        if left and right and left == right:
            identifier_matches.append(f"shared {label}:{left}")
    if identifier_matches:
        edges.append(_edge(a.source_id, b.source_id, "SAME_WORK", identifier_matches))
        return edges

    if b.source_id in a.parent_source_ids:
        edges.append(_edge(a.source_id, b.source_id, "DERIVED_FROM", [f"{a.source_id} explicitly depends on {b.source_id}"]))
    if a.source_id in b.parent_source_ids:
        edges.append(_edge(a.source_id, b.source_id, "DERIVED_FROM", [f"{b.source_id} explicitly depends on {a.source_id}"]))

    shared_datasets = sorted(set(a.datasets) & set(b.datasets))
    if shared_datasets:
        edges.append(_edge(a.source_id, b.source_id, "SHARED_DATASET", [f"dataset:{v}" for v in shared_datasets]))

    shared_samples = sorted(set(a.samples) & set(b.samples))
    if shared_samples:
        edges.append(_edge(a.source_id, b.source_id, "SHARED_SAMPLE", [f"sample:{v}" for v in shared_samples]))

    return edges


def build_dependency_graph(fingerprints: Iterable[SourceFingerprint]) -> dict:
    records = [fp.normalized() for fp in fingerprints]
    ids = [fp.source_id for fp in records]
    if len(ids) != len(set(ids)):
        raise ValueError("source_id values must be unique")

    edges: list[DependencyEdge] = []
    for index, left in enumerate(records):
        for right in records[index + 1 :]:
            edges.extend(compare_sources(left, right))

    components = _independence_components(ids, edges)
    return {
        "schema_version": "1.0",
        "principle": "Source independence is evaluated from work, dataset, sample and explicit derivation identity. Author overlap alone is not dependence.",
        "nodes": [
            {
                "source_id": fp.source_id,
                "doi": fp.doi,
                "pmid": fp.pmid,
                "pmcid": fp.pmcid,
                "datasets": list(fp.datasets),
                "samples": list(fp.samples),
                "parent_source_ids": list(fp.parent_source_ids),
            }
            for fp in records
        ],
        "edges": [edge.as_dict() for edge in sorted(edges, key=lambda e: (e.source_a, e.source_b, e.dependency_type))],
        "independence_groups": components,
        "counts": {
            "sources": len(records),
            "dependency_edges": len(edges),
            "independence_groups": len(components),
            "singleton_groups": sum(1 for group in components if len(group) == 1),
        },
    }


def _independence_components(source_ids: list[str], edges: Iterable[DependencyEdge]) -> list[list[str]]:
    adjacency = {source_id: set() for source_id in source_ids}
    for edge in edges:
        if not edge.independence_blocking:
            continue
        adjacency[edge.source_a].add(edge.source_b)
        adjacency[edge.source_b].add(edge.source_a)

    visited: set[str] = set()
    components: list[list[str]] = []
    for source_id in sorted(source_ids):
        if source_id in visited:
            continue
        stack = [source_id]
        group: list[str] = []
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            group.append(current)
            stack.extend(sorted(adjacency[current] - visited, reverse=True))
        components.append(sorted(group))
    return sorted(components, key=lambda group: (group[0], len(group)))
