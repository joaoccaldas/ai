from __future__ import annotations
import json, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output'/'final10'
OUT.mkdir(parents=True, exist_ok=True)

lat=41.4036
cases=[
 ('summer_solstice',23.44),
 ('equinox',0),
 ('winter_solstice',-23.44),
]
rows=[]
for name,dec in cases:
    altitude=90-abs(lat-dec)
    shadow_per_m=1/math.tan(math.radians(altitude))
    rows.append({
      'case':name,
      'solar_declination_deg':dec,
      'solar_noon_altitude_deg':round(altitude,2),
      'horizontal_shadow_m_per_1m_height':round(shadow_per_m,3),
      'shadow_for_6m_height_m':round(6*shadow_per_m,2)
    })
out={
 'status':'GEOMETRIC_SOLAR_BASELINE_NOT_ANNUAL_SIMULATION',
 'latitude_deg':lat,
 'method':'solar-noon altitude from latitude and representative declination',
 'cases':rows,
 'next_required':'SITE_TRUTH_V1 plus annual weather-based shading/daylight analysis before competition-facing environmental metrics are finalized'
}
(OUT/'barcelona_solar_baseline_v1.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
