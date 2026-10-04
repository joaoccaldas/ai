from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
reg_path = ROOT / "visuals/evidence_registry.json"
if not reg_path.exists():
    print("FAIL: missing visuals/evidence_registry.json")
    sys.exit(1)

reg = json.loads(reg_path.read_text())
errors = []

for entry in reg.get("entries", []):
    p = ROOT / entry["path"]
    if not p.exists():
        errors.append(f"missing evidence file: {entry['path']}")
    if entry.get("competition_use") and entry.get("authority") != "authoritative":
        errors.append(f"competition visual is not authoritative: {entry['id']}")

if len(reg.get("visual_pass_requirements", [])) < 8:
    errors.append("visual pass requirements are incomplete")

if errors:
    print("FAIL")
    for err in errors:
        print("-", err)
    sys.exit(1)

print("PASS: visual evidence registry is internally consistent")
print("G1 still requires:", ", ".join(reg.get("required_for_G1", [])))
