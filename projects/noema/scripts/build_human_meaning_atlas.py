from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.atlas import build_human_meaning_atlas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("societies", type=Path)
    parser.add_argument("packs", nargs="+", type=Path)
    parser.add_argument("--output", type=Path, default=Path("site/human-meaning-atlas.json"))
    args = parser.parse_args()

    societies = json.loads(args.societies.read_text(encoding="utf-8"))
    packs = [json.loads(path.read_text(encoding="utf-8")) for path in args.packs]
    result = build_human_meaning_atlas(packs, societies)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.output.with_suffix(args.output.suffix + ".tmp")
    tmp.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(args.output)
    print(json.dumps({"atlas_id": result["atlas_id"], **result["summary"], "output": str(args.output)}))


if __name__ == "__main__":
    main()
