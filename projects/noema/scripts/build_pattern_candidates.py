#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.patterns import build_report


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pulotu", default="site/religion-decomposition.json")
    ap.add_argument("--drh", default="site/drh-decomposition.json")
    ap.add_argument("--output", default="site/pattern-candidates.json")
    args = ap.parse_args()
    pulotu = json.loads(Path(args.pulotu).read_text(encoding="utf-8"))
    drh = json.loads(Path(args.drh).read_text(encoding="utf-8"))
    out = build_report(pulotu, drh)
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({c["source"]: {"profiles": c["n_profiles"], "candidates": len(c["candidates"]), "conflicted_cells_excluded": c["conflicted_subject_feature_cells_excluded"]} for c in out["cohorts"]}, indent=2))


if __name__ == "__main__":
    main()
