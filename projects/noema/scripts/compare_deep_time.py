from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.compare import build_comparison


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("protocol", type=Path)
    parser.add_argument("left_pack", type=Path)
    parser.add_argument("right_pack", type=Path)
    parser.add_argument("--output", type=Path, default=Path("noema-deep-time-comparison.json"))
    args = parser.parse_args()

    protocol = json.loads(args.protocol.read_text(encoding="utf-8"))
    left = json.loads(args.left_pack.read_text(encoding="utf-8"))
    right = json.loads(args.right_pack.read_text(encoding="utf-8"))
    result = build_comparison(protocol, left, right)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.output.with_suffix(args.output.suffix + ".tmp")
    tmp.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(args.output)
    print(json.dumps({"comparison_id": result["comparison_id"], **result["summary"], "output": str(args.output)}))


if __name__ == "__main__":
    main()
