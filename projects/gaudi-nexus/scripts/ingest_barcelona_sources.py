#!/usr/bin/env python3
"""Authoritative Barcelona source-ingestion scaffold.

This script deliberately does not hide network/download failures. Raw binaries
should be archived outside Git and referenced by checksum/provenance.
"""
from __future__ import annotations
from pathlib import Path
import hashlib, json, sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "config/authoritative_sources_v0_1.json"

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def main() -> int:
    cfg = json.loads(MANIFEST.read_text())
    print("Authoritative source priority:")
    for i, src in enumerate(cfg["sources"], 1):
        print(f"{i}. {src['id']}: {src['status']}")
    print()
    print("Next machine action:")
    print("- download municipal topographic GPKG outside Git")
    print("- record SHA-256 + layer inventory + CRS")
    print("- recover municipal Sagrada Família DWG direct endpoint")
    print("- convert to open intermediate")
    print("- run discrepancy report before promoting SITE_TRUTH_V1.0")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
