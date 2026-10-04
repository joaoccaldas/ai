from pathlib import Path
import csv, json, sys
ROOT=Path(__file__).resolve().parents[1]
errs=[]
req=[
 'config/site_origin.json','config/tolerances.json','config/design_gates.json',
 'data/evidence/ledger.csv','data/site/site_template.json',
 'output/m0/cerda_block_template.geojson','output/m0/site_truth_report.json'
]
for p in req:
    if not (ROOT/p).exists(): errs.append(f'missing {p}')
origin=json.loads((ROOT/'config/site_origin.json').read_text())
if origin['axis_convention']['+Z']!='up': errs.append('axis convention must keep +Z up')
site=json.loads((ROOT/'data/site/site_template.json').read_text())
if site['status']!='PROVISIONAL_GEOMETRY_TEMPLATE': errs.append('site template must remain explicitly provisional')
with (ROOT/'data/evidence/ledger.csv').open() as f:
    rows=list(csv.DictReader(f))
ids={r['id'] for r in rows}
for sid in origin['source_ids']+site['source_ids']:
    if sid not in ids: errs.append(f'unresolved source id {sid}')
if errs:
    print('FAIL')
    print('\n'.join('- '+e for e in errs))
    sys.exit(1)
print('PASS: M0 scaffold is traceable and provisional geometry is correctly fenced off')
