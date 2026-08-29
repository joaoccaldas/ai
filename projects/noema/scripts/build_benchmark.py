from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path


def stable_rank(society_id: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{society_id}".encode("utf-8")).hexdigest()


def build(rows: list[dict[str, str]], size: int, salt: str) -> list[dict[str, object]]:
    eligible = [r for r in rows if r.get("ID") and r.get("Name") and r.get("region")]
    by_region: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in eligible:
        by_region[row["region"]].append(row)
    regions = sorted(by_region)
    if not regions:
        raise ValueError("No D-PLACE regions found")

    target = min(size, len(eligible))
    selected: list[dict[str, str]] = []
    base = target // len(regions)
    remainder = target % len(regions)
    for i, region in enumerate(regions):
        quota = base + (1 if i < remainder else 0)
        ranked = sorted(by_region[region], key=lambda r: stable_rank(r["ID"], salt))
        selected.extend(ranked[:quota])

    # Some small regions may not satisfy their quota. Fill from the global pool
    # without changing already-selected societies.
    used = {r["ID"] for r in selected}
    if len(selected) < target:
        global_ranked = sorted(eligible, key=lambda r: stable_rank(r["ID"], salt))
        remaining = [r for r in global_ranked if r["ID"] not in used]
        selected.extend(remaining[: target - len(selected)])

    result = []
    for row in sorted(selected[:target], key=lambda r: (r["region"], r["Name"], r["ID"])):
        result.append(
            {
                "dplace_id": row["ID"],
                "name": row["Name"],
                "region": row["region"],
                "glottocode": row.get("Glottocode") or None,
                "language_level_glottocodes": row.get("Language_Level_Glottocodes") or None,
                "focal_year": int(row["main_focal_year"]) if (row.get("main_focal_year") or "").isdigit() else None,
                "latitude": float(row["Latitude"]) if row.get("Latitude") else None,
                "longitude": float(row["Longitude"]) if row.get("Longitude") else None,
                "contribution_id": row.get("Contribution_ID") or None,
            }
        )
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--size", type=int, default=100)
    parser.add_argument("--salt", default="noema-benchmark-v1")
    parser.add_argument("--output", type=Path, default=Path("noema-benchmark-100.json"))
    args = parser.parse_args()
    with args.input.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    societies = build(rows, max(1, args.size), args.salt)
    payload = {
        "benchmark_id": "NOEMA-DPLACE-100-v1",
        "selection_method": "region-stratified stable SHA-256 ranking",
        "salt": args.salt,
        "requested_size": args.size,
        "actual_size": len(societies),
        "source": "https://github.com/D-PLACE/dplace-cldf/blob/master/cldf/societies.csv",
        "license_note": "Derived from D-PLACE; retain upstream attribution and applicable CC BY-NC terms.",
        "societies": societies,
    }
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "actual_size": len(societies)}))


if __name__ == "__main__":
    main()
