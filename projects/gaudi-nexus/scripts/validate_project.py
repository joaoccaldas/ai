from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

for rel in ["config/rubric.json", "config/requirements.json", "docs/PHASE_0.md", "docs/TECH_STACK.md", "visuals/A1_STORYBOARD.md"]:
    if not (ROOT/rel).exists(): errors.append(f"missing {rel}")

rubric = json.loads((ROOT/"config/rubric.json").read_text())
if sum(x["points"] for x in rubric["criteria"]) != rubric["total_points"]:
    errors.append("rubric points do not sum to total")

req = json.loads((ROOT/"config/requirements.json").read_text())
if not req["submission"]["anonymous"]:
    errors.append("competition submission must remain anonymous")

if errors:
    print("FAIL")
    for e in errors: print("-", e)
    sys.exit(1)
print("PASS: Phase-0 project contract is internally consistent")
