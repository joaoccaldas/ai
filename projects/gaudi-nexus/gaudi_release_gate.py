#!/usr/bin/env python3
"""Read-only competition evidence gate; never renders, fabricates evidence, or changes source."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQUIRED = ("config/current_world.json", "docs/DECISIONS.md", "visuals/A1_STORYBOARD.md", "docs/REALISM_PLAYBOOK.md")
APPROVALS = ("visual_pixels_reviewed", "structural_evidence_reviewed", "environment_evidence_reviewed", "a1_board_reviewed", "rights_reviewed", "competition_rules_reviewed")

def audit(root=ROOT):
    root = Path(root)
    findings = []
    for name in REQUIRED:
        if not (root / name).is_file():
            findings.append({"id": "MISSING_FILE", "path": name})
    world = {}
    if (root / REQUIRED[0]).is_file():
        try:
            world = json.loads((root / REQUIRED[0]).read_text(encoding="utf-8"))
        except (ValueError, UnicodeError) as exc:
            findings.append({"id": "INVALID_WORLD_JSON", "detail": str(exc)})
    status = world.get("current_3d", {})
    if status.get("status") != "SITE_TRUTH_V1_APPROVED":
        findings.append({"id": "SITE_TRUTH_NOT_APPROVED", "observed": status.get("status", "unknown")})
    if not status.get("binary_identity_verified_utc"):
        findings.append({"id": "BINARY_IDENTITY_UNVERIFIED"})
    for blocker in status.get("promotion_blockers", []):
        findings.append({"id": "SOURCE_RECORDED_BLOCKER", "detail": blocker})
    if status.get("new_hero_candidate", {}).get("status") != "VISUAL_APPROVED":
        findings.append({"id": "HERO_VISUAL_NOT_APPROVED"})
    for name in APPROVALS:
        record = world.get("release_approvals", {}).get(name)
        if not (isinstance(record, dict) and record.get("approved") is True and record.get("evidence_sha256") and record.get("reviewer")):
            findings.append({"id": "APPROVAL_MISSING", "approval": name})
    hashes = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in REQUIRED if (root / name).is_file()}
    return {"schema": "caldas.gaudi.release-audit/v1", "ready": len(findings) == 0, "revision": status.get("revision"), "evidence_file_hashes": hashes, "findings": findings}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = audit(args.root)
    data = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(data, encoding="utf-8")
    else:
        print(data, end="")
    return 0 if result["ready"] else 2

if __name__ == "__main__":
    raise SystemExit(main())
