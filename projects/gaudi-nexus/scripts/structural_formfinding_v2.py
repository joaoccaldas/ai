from __future__ import annotations
import json, math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output'/'final10'
VIS=ROOT/'visuals'
DOCS=ROOT/'docs'
OUT.mkdir(parents=True,exist_ok=True)
VIS.mkdir(parents=True,exist_ok=True)
DOCS.mkdir(parents=True,exist_ok=True)

L=9.0
F=1.35
BAY=5.0
W=7.5  # kN/m, equivalent to 1.5 kPa over 5 m tributary width
PRESSURE=1.5
NPTS=37

def reactions(f: float, w: float=W):
    H=w*L*L/(8*f)
    V=w*L/2
    R=(H*H+V*V)**0.5
    theta=math.degrees(math.atan2(V,H))
    return H,V,R,theta

def parabola_points(f: float):
    pts=[]
    for i in range(NPTS):
        x=L*i/(NPTS-1)
        y=4*f*x*(L-x)/(L*L)
        pts.append([round(x,4),round(y,4)])
    return pts

rise_family=[0.90,1.125,1.35,1.575,1.80]
family=[]
for f in rise_family:
    H,V,R,theta=reactions(f)
    family.append({
        "rise_m":f,
        "rise_span_ratio":round(f/L,4),
        "horizontal_reaction_kN_per_support":round(H,3),
        "vertical_reaction_kN_per_support":round(V,3),
        "resultant_reaction_kN_per_support":round(R,3),
        "support_resultant_angle_deg_above_horizontal":round(theta,3),
        "support_tangent_slope":round(4*f/L,4),
        "support_tangent_angle_deg":round(math.degrees(math.atan(4*f/L)),3),
        "funicular_coordinates_m":parabola_points(f)
    })

H,V,R,theta=reactions(F)
chosen=next(x for x in family if abs(x["rise_m"]-F)<1e-9)

# Cross-check geometric equilibrium: tangent angle at springing equals resultant reaction angle.
angle_residual=chosen["support_tangent_angle_deg"]-chosen["support_resultant_angle_deg_above_horizontal"]

out={
    "status":"DESIGN_DEVELOPMENT_FUNicular_PROOF_NOT_ENGINEER_CERTIFICATION".upper(),
    "method":"parabolic funicular under uniform vertical line load",
    "geometry":{
        "clear_span_m":L,
        "chosen_rise_m":F,
        "rise_span_ratio":round(F/L,4),
        "tributary_bay_m":BAY
    },
    "design_development_load":{
        "roof_pressure_kPa":PRESSURE,
        "line_load_kN_per_m":W,
        "basis":"illustrative design-development load already used in structural_thrust_v1; not a code load combination"
    },
    "formulae":{
        "funicular_y":"4*f*x*(L-x)/L^2",
        "horizontal_thrust_H":"w*L^2/(8*f)",
        "vertical_reaction_V":"w*L/2",
        "support_resultant_R":"sqrt(H^2+V^2)",
        "support_tangent_slope":"4*f/L"
    },
    "chosen_case":{
        **{k:v for k,v in chosen.items() if k!="funicular_coordinates_m"},
        "crown_compression_proxy_kN":round(H,3),
        "springing_compression_proxy_kN":round(R,3),
        "equilibrium_angle_residual_deg":round(angle_residual,6),
        "funicular_coordinates_m":chosen["funicular_coordinates_m"]
    },
    "rise_sensitivity":[{k:v for k,v in x.items() if k!="funicular_coordinates_m"} for x in family],
    "load_path":[
        "roof pressure -> distributed vertical line load on 9 m bay",
        "funicular compression shell -> crown compression / springing thrust",
        "springing block + replaceable bearing -> vertical + horizontal reaction transfer",
        "primary pier/foundation or explicit tie/frame alternative -> ground"
    ],
    "joint_consistency":[
        "J01 separates primary pier, springing block, replaceable bearing/movement layer and shell",
        "waterproofing, gutter, ceramic fin bracket, MEP rail and acoustic insert remain secondary/serviceable systems",
        "horizontal thrust must be carried visibly by support/foundation strategy or replaced by an explicit tie/frame alternative"
    ],
    "claim_boundary":"This demonstrates geometry-force consistency and sensitivity for design development. It is not FEA, code load combinations, reinforcement sizing, stability/buckling verification, foundation design, or engineer certification."
}
(OUT/'structural_formfinding_v2.json').write_text(json.dumps(out,indent=2)+'\n')

# Jury-readable SVG: one chosen funicular, load arrows, reaction vectors, and rise/thrust sensitivity.
Wsvg,Hsvg=1200,720
margin=90
sx=(Wsvg-2*margin)/L
base_y=500
sy=170/F

def pxy(x,y):
    return margin+x*sx, base_y-y*sy

pts=parabola_points(F)
path=" ".join(("M" if i==0 else "L")+f" {pxy(x,y)[0]:.1f} {pxy(x,y)[1]:.1f}" for i,(x,y) in enumerate(pts))
load_arrows=[]
for x in [0.75,1.75,2.75,3.75,4.5,5.25,6.25,7.25,8.25]:
    y=4*F*x*(L-x)/(L*L)
    px,py=pxy(x,y)
    load_arrows.append(f'<line x1="{px:.1f}" y1="{py-65:.1f}" x2="{px:.1f}" y2="{py-8:.1f}" class="load" marker-end="url(#arrow)"/>')

rows=[]
for i,x in enumerate(family):
    rows.append(
        f'<text x="830" y="{235+i*42}" class="small">{x["rise_span_ratio"]:.3f}</text>'
        f'<text x="945" y="{235+i*42}" class="small">{x["horizontal_reaction_kN_per_support"]:.1f} kN</text>'
        f'<text x="1070" y="{235+i*42}" class="small">{x["resultant_reaction_kN_per_support"]:.1f} kN</text>'
    )

svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{Wsvg}" height="{Hsvg}" viewBox="0 0 {Wsvg} {Hsvg}">
<defs>
<style>
text{{font-family:Arial,Helvetica,sans-serif;fill:#171717}} .title{{font-size:30px;font-weight:700}} .sub{{font-size:17px}} .small{{font-size:15px}} .tiny{{font-size:13px}}
.arch{{fill:none;stroke:#171717;stroke-width:8;stroke-linecap:round}} .ground{{stroke:#777;stroke-width:2}} .load{{stroke:#8c2f1d;stroke-width:2.5}} .react{{stroke:#235b75;stroke-width:5}} .guide{{stroke:#aaa;stroke-dasharray:6 6;stroke-width:1.5}} .box{{fill:#f6f4ef;stroke:#c8c4ba;stroke-width:1.5}}
</style>
<marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#8c2f1d"/></marker>
<marker id="arrowb" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#235b75"/></marker>
</defs>
<text x="70" y="58" class="title">Living Threshold — 9 m funicular bay</text>
<text x="70" y="88" class="sub">Force-derived curvature, not decorative Gaudí styling · design-development proof</text>
<line x1="{margin}" y1="{base_y}" x2="{margin+L*sx}" y2="{base_y}" class="ground"/>
<path d="{path}" class="arch"/>
{''.join(load_arrows)}
<line x1="{margin}" y1="{base_y}" x2="{margin-62}" y2="{base_y-38}" class="react" marker-end="url(#arrowb)"/>
<line x1="{margin+L*sx}" y1="{base_y}" x2="{margin+L*sx+62}" y2="{base_y-38}" class="react" marker-end="url(#arrowb)"/>
<line x1="{margin+L*sx/2}" y1="{base_y}" x2="{margin+L*sx/2}" y2="{base_y-F*sy}" class="guide"/>
<text x="{margin+L*sx/2+12:.1f}" y="{base_y-F*sy/2:.1f}" class="small">rise 1.35 m</text>
<text x="{margin+L*sx/2-45:.1f}" y="{base_y+35}" class="small">9.0 m clear span</text>
<rect x="720" y="125" width="425" height="335" rx="12" class="box"/>
<text x="750" y="165" class="sub" font-weight="700">Rise / thrust sensitivity @ 1.5 kPa</text>
<text x="830" y="200" class="tiny">f/L</text><text x="945" y="200" class="tiny">H/support</text><text x="1070" y="200" class="tiny">R/support</text>
{''.join(rows)}
<text x="750" y="420" class="small">Chosen f/L = 0.150 → H = {H:.1f} kN, R = {R:.1f} kN</text>
<rect x="70" y="565" width="1075" height="100" rx="10" class="box"/>
<text x="95" y="598" class="small" font-weight="700">Load path</text>
<text x="95" y="628" class="small">roof pressure → compression shell → springing block / replaceable bearing → pier + foundation (or explicit tie/frame alternative)</text>
<text x="95" y="653" class="tiny">Claim boundary: geometry-force consistency only; not FEA, code load combinations, reinforcement, buckling, foundation design or engineer certification.</text>
</svg>'''
(VIS/'structural_formfinding_v2.svg').write_text(svg)

doc=f"""# Structural Form-Finding V2

## Why this exists

The Living Threshold roof is not curved because curved forms look like Gaudí. The curvature is selected from a funicular load path.

For the 9.0 m clear span and a design-development 1.5 kPa roof-pressure case across a 5.0 m tributary bay:

- line load: **{W:.2f} kN/m**
- selected rise: **{F:.2f} m** (f/L = {F/L:.3f})
- horizontal reaction: **{H:.2f} kN/support**
- vertical reaction: **{V:.2f} kN/support**
- resultant at springing: **{R:.2f} kN/support**
- support resultant angle: **{theta:.2f}°**

For a parabolic funicular under uniform vertical line load, the springing tangent angle and reaction angle coincide. The numerical residual here is **{angle_residual:.6f}°**, which is the internal equilibrium cross-check.

## Why 1.35 m rise is meaningful

The sensitivity family keeps span and load fixed and changes only rise. At f/L 0.10, horizontal thrust is **84.38 kN/support**. At the chosen 0.15 it falls to **56.25 kN/support**. At 0.20 it is **42.19 kN/support**.

This makes the trade explicit: a shallower roof reduces height but rapidly increases horizontal thrust; a deeper funicular reduces thrust but changes enclosure, sightline and civic scale.

## Load path

1. roof pressure becomes distributed vertical line load;
2. the funicular shell carries that load primarily through compression;
3. the springing block and replaceable bearing receive vertical + horizontal reactions;
4. the primary pier/foundation carries those reactions to ground, or the scheme must declare an explicit tie/frame alternative.

## J01 consistency

The physical-detail gate already separates the primary pier, springing block, movement/bearing layer and shell. Waterproofing, gutter, ceramic fins, MEP rail and acoustic inserts remain secondary and replaceable, so the force path is not confused with maintenance layers.

## Claim boundary

This is design-development structural logic, not certification. It does not replace FEA, code load combinations, material nonlinearities, shell buckling/stability, reinforcement sizing, foundations, seismic/wind checks, or review by a qualified structural engineer.
"""
(DOCS/'STRUCTURAL_FORMFINDING_V2.md').write_text(doc)
print(json.dumps({"json":str(OUT/'structural_formfinding_v2.json'),"svg":str(VIS/'structural_formfinding_v2.svg'),"doc":str(DOCS/'STRUCTURAL_FORMFINDING_V2.md'),"chosen_H":H,"chosen_R":R,"angle_residual":angle_residual},indent=2))
