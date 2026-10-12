from __future__ import annotations
from pathlib import Path
import json, math

ROOT = Path(__file__).resolve().parents[1]
CFG = json.loads((ROOT/'data/site/site_template.json').read_text())
OUT = ROOT/'output/m0'
OUT.mkdir(parents=True, exist_ok=True)

side = float(CFG['block']['side_m'])
ch = float(CFG['block']['chamfer_leg_m'])
rot = math.radians(float(CFG['block'].get('orientation_deg_from_east', 0)))
h = side/2
base = [
    (-h+ch,-h), (h-ch,-h), (h,-h+ch), (h,h-ch),
    (h-ch,h), (-h+ch,h), (-h,h-ch), (-h,-h+ch)
]

def rotate(p):
    x,y=p; c,s=math.cos(rot), math.sin(rot)
    return (x*c-y*s, x*s+y*c)
pts=[rotate(p) for p in base]

area=0.5*abs(sum(pts[i][0]*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*pts[i][1] for i in range(len(pts))))

geo = {
  'type':'FeatureCollection',
  'name':'cerda_block_template',
  'features':[{
    'type':'Feature',
    'properties':{
      'status':CFG['status'],
      'side_m':side,
      'chamfer_leg_m':ch,
      'area_m2':round(area,3),
      'warning':'Generic Cerdà template. Not final competition-site survey geometry.'
    },
    'geometry':{'type':'Polygon','coordinates':[[list(p) for p in pts+[pts[0]]]]}
  }]
}
(OUT/'cerda_block_template.geojson').write_text(json.dumps(geo,indent=2))

pad=14
scale=5.2
xmin=min(x for x,y in pts)-pad; xmax=max(x for x,y in pts)+pad
ymin=min(y for x,y in pts)-pad; ymax=max(y for x,y in pts)+pad
W=(xmax-xmin)*scale; H=(ymax-ymin)*scale
svgpts=' '.join(f'{(x-xmin)*scale:.1f},{(ymax-y)*scale:.1f}' for x,y in pts)
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" viewBox="0 0 {W:.1f} {H:.1f}">
<rect width="100%" height="100%" fill="white"/>
<polygon points="{svgpts}" fill="#f0f0f0" stroke="#111" stroke-width="2"/>
<line x1="{W/2:.1f}" y1="{H/2:.1f}" x2="{W/2:.1f}" y2="20" stroke="#555" stroke-width="1"/>
<text x="{W/2+5:.1f}" y="30" font-family="Arial" font-size="13">+Y / north placeholder</text>
<text x="20" y="{H-32:.1f}" font-family="Arial" font-size="13">PROVISIONAL Cerdà geometry template — not survey control</text>
<text x="20" y="{H-14:.1f}" font-family="Arial" font-size="12">side {side:g} m · chamfer leg {ch:g} m · area {area:.1f} m²</text>
</svg>'''
(OUT/'cerda_block_template.svg').write_text(svg)

report={
  'status':'PASS_PROVISIONAL_TEMPLATE',
  'geometry':{'side_m':side,'chamfer_leg_m':ch,'area_m2':round(area,3),'vertex_count':8},
  'authority':'template_only',
  'next_required':['municipal or competition boundary geometry','verified true-north/orientation','existing trees/site furniture','Sagrada context geometry','view-corridor origins']
}
(OUT/'site_truth_report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
