from pathlib import Path
import json, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

score=json.loads((ROOT/'config/WIN_SCORECARD.json').read_text())
steps=score.get('steps',[])
if len(steps)!=10:
    errors.append(f"WIN_SCORECARD must contain exactly 10 steps, found {len(steps)}")
if sum(x.get('weight_pct',0) for x in steps)!=100:
    errors.append("WIN_SCORECARD weights must sum to 100")
if len({x['id'] for x in steps})!=10:
    errors.append("WIN_SCORECARD step ids must be unique")

required=[
 'config/program_audit_v1.json',
 'config/structural_validation_contract.json',
 'config/environmental_validation_contract.json',
 'config/hero_gate.json',
 'config/release_manifest_template.json',
 'docs/CANONICAL_SCENE_CONTRACT.md',
 'docs/FINAL_10_COMPLETION_GATES.md',
]
for rel in required:
    if not (ROOT/rel).exists():
        errors.append(f"missing final-10 control: {rel}")

program=json.loads((ROOT/'config/program_audit_v1.json').read_text())
if program['target_gfa_m2'] < program['official_range_m2'][0] or program['target_gfa_m2'] > program['official_range_m2'][1]:
    errors.append("program target GFA outside official range")
if sum(program['official_split_pct'].values())!=100:
    errors.append("official program split must sum to 100")

hero=json.loads((ROOT/'config/hero_gate.json').read_text())
if hero['approval_rule'].find('>=9.0/10') < 0:
    errors.append("hero gate must enforce >=9.0/10")

release=json.loads((ROOT/'config/release_manifest_template.json').read_text())
a1=next(x for x in release['final_artifacts'] if x['id']=='A1_MAIN')
if a1['max_mb']!=15 or a1['dimensions_mm']!=[594,841]:
    errors.append("A1 release contract drifted from official brief")

if errors:
    print("FAIL")
    for e in errors: print("-",e)
    sys.exit(1)

print("PASS: final-10 control plane is internally consistent")
open_steps=[x for x in steps if x['status'] not in ('DONE','PASS')]
print("Open steps:", len(open_steps))
for x in open_steps:
    print(f"- {x['id']}: {x['name']} [{x['status']}]")
