from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.evidence import build_analysis_projection


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("noema-analysis.json"))
    args = parser.parse_args()

    pack = json.loads(args.input.read_text(encoding="utf-8"))
    projection = build_analysis_projection(pack)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.output.with_suffix(args.output.suffix + ".tmp")
    tmp.write_text(json.dumps(projection, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(args.output)
    print(json.dumps({"pack_id": projection["pack_id"], "output": str(args.output), **projection["counts"]}))


if __name__ == "__main__":
    main()
