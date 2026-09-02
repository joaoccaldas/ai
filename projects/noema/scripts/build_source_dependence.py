#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.source_dependence import SourceFingerprint, build_dependency_graph


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build NOEMA source-dependence projection")
    parser.add_argument("--manifest", default="data/reference/source-fingerprints-v1.json")
    parser.add_argument("--output", default="site/source-dependence.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = Path(args.manifest)
    output_path = Path(args.output)
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))

    records = []
    for raw in payload.get("sources", []):
        records.append(
            SourceFingerprint(
                source_id=raw["source_id"],
                doi=raw.get("doi"),
                pmid=raw.get("pmid"),
                pmcid=raw.get("pmcid"),
                datasets=tuple(raw.get("datasets", [])),
                samples=tuple(raw.get("samples", [])),
                parent_source_ids=tuple(raw.get("parent_source_ids", [])),
            )
        )

    graph = build_dependency_graph(records)
    graph["manifest_id"] = payload.get("manifest_id")
    graph["generated_from"] = str(manifest_path)
    graph["status"] = "RESEARCH_PREVIEW"
    graph["guardrails"] = {
        "author_overlap_is_dependence": False,
        "shared_dataset_means_same_conclusion": False,
        "independent_analysis_means_independent_data": False,
        "dependence_edge_is_evidence_against_claim": False,
    }
    graph["notes"] = payload.get("notes", [])

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(graph["counts"], sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
