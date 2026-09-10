from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# This script is executed both from an installed NOEMA environment and directly
# from the repository root by lightweight UI/operations workflows. Keep the
# package import deterministic in both cases without requiring an implicit cwd.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from noema.automation_pulse import build, load_contract, load_manifests


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs-dir", default="projects/noema/data/runs")
    ap.add_argument("--contract", default="projects/noema/data/automation-registry-v2.json")
    ap.add_argument("--output", default="projects/noema/site/automation-pulse.json")
    args = ap.parse_args()
    manifests = load_manifests(Path(args.runs_dir))
    contract = load_contract(Path(args.contract))
    output = build(manifests, contract)
    p = Path(args.output)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print("automation pulse", len(manifests), "runs /", len(output.get("task_health", [])), "registry tasks ->", p)


if __name__ == "__main__":
    main()
