from __future__ import annotations

import argparse
import json
from pathlib import Path

from noema.review_queue import build_review_queue


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates-dir", default="data/candidates/daily")
    ap.add_argument("--output", default="site/review-queue.json")
    args = ap.parse_args()

    root = Path(args.candidates_dir)
    docs: list[tuple[str, dict]] = []
    for path in sorted(root.glob("*.json")):
        try:
            doc = json.loads(path.read_text())
        except Exception:
            continue
        if isinstance(doc, dict) and doc.get("review_items"):
            docs.append((str(path), doc))

    out = build_review_queue(docs)
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(
        "review queue",
        out["summary"]["raw_review_items"],
        "raw ->",
        out["summary"]["deduplicated_review_items"],
        "deduplicated ->",
        target,
    )


if __name__ == "__main__":
    main()
