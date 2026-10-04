from __future__ import annotations
import json
from pathlib import Path
from math import sqrt

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output'/'final10'
OUT.mkdir(parents=True, exist_ok=True)

L=9.0
rise=1.35
bay=5.0
pressures=[1.0,1.5,2.0,2.5,3.0]  # kPa = kN/m2 sensitivity cases only
rows=[]
for p in pressures:
    w=p*bay
    H=w*L**2/(8*rise)
    V=w*L/2
    R=sqrt(H**2+V**2)
    rows.append({
        'roof_pressure_kPa':p,
        'line_load_kN_per_m':round(w,3),
        'horizontal_reaction_kN_per_support':round(H,3),
        'vertical_reaction_kN_per_support':round(V,3),
        'resultant_reaction_kN_per_support':round(R,3),
    })

out={
 'status':'DESIGN_DEVELOPMENT_PROXY_NOT_CERTIFICATION',
 'method':'parabolic funicular under uniform vertical line load',
 'geometry':{'clear_span_m':L,'rise_m':rise,'tributary_bay_m':bay},
 'formulae':{'H':'w*L^2/(8*f)','V':'w*L/2'},
 'cases':rows,
 'interpretation':'Support design must visibly accommodate horizontal thrust or the roof system must provide an explicit tie/frame alternative. Final material sizing requires engineer-grade load combinations and analysis.'
}
(OUT/'structural_thrust_v1.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
