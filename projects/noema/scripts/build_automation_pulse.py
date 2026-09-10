from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.automation_pulse import build, load_contract, load_manifests


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs-dir", default="projects/noema/data/runs")
    ap.add_argument("--contract", default="projects/noema/data/automation-contract-v1.json")
    ap.add_argument("--output", default="projects/noema/site/automation-pulse.json")
    args = ap.parse_args()
    manifests = load_manifests(Path(args.runs_dir))
    contract = load_contract(Path(args.contract))
    output = build(manifests, contract)
    p = Path(args.output)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print("automation pulse", len(manifests), "runs /", len(output.get("task_health", [])), "contract tasks ->", p)


if __name__ == "__main__":
    main()
