from pathlib import Path
import json, base64, html

ROOT=Path(__file__).resolve().parents[1]
score=json.loads((ROOT/"config/WIN_SCORECARD.json").read_text())
world=json.loads((ROOT/"config/current_world.json").read_text())
req=json.loads((ROOT/"config/requirements.json").read_text())

hero_path=Path("f3_hero_review_960.png")
if not hero_path.exists():
    raise SystemExit("Expected f3_hero_review_960.png")
hero_b64=base64.b64encode(hero_path.read_bytes()).decode()

W,H=1682,1188
pad=54
left=940
right_x=1010
right_w=618

assessment=score.get("current_assessment",{})
brief=assessment.get("brief_compliance_readiness_pct_range",[0,0])
winning=assessment.get("winning_readiness_pct_range",[0,0])

def esc(x): return html.escape(str(x))

svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<rect width="100%" height="100%" fill="#f3f0e9"/>
<rect x="{pad}" y="{pad}" width="{W-2*pad}" height="{H-2*pad}" fill="#f8f6f1" stroke="#141414" stroke-width="2"/>

<!-- title -->
<text x="78" y="105" font-family="Arial,Helvetica,sans-serif" font-size="19" font-weight="700" letter-spacing="4">AI × GAUDÍ / LIVING THRESHOLD</text>
<text x="78" y="143" font-family="Georgia,serif" font-size="30">A1 ALPHA · evidence-first jury diagnostic</text>
<text x="1600" y="104" text-anchor="end" font-family="Arial,sans-serif" font-size="13">NOT FINAL SUBMISSION</text>

<!-- hero -->
<rect x="78" y="180" width="{left-78}" height="610" fill="#ddd8cf"/>
<image href="data:image/png;base64,{hero_b64}" x="78" y="180" width="{left-78}" height="610" preserveAspectRatio="xMidYMid slice"/>
<rect x="78" y="744" width="{left-78}" height="46" fill="#0f0f0f" opacity=".86"/>
<text x="96" y="774" font-family="Arial,sans-serif" font-size="15" fill="white">F3 · 1.56 m eye · 32 mm · authoritative municipal context · PREVIEW, NOT HERO-APPROVED</text>

<!-- right thesis -->
<text x="{right_x}" y="198" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="3">THESIS</text>
<text x="{right_x}" y="232" font-family="Georgia,serif" font-size="28">
<tspan x="{right_x}" dy="0">A civic market threshold that</tspan>
<tspan x="{right_x}" dy="34">returns daily life to the Sagrada</tspan>
<tspan x="{right_x}" dy="34">plaza without competing with it.</tspan>
</text>

<!-- evidence blocks -->
<g font-family="Arial,sans-serif">
<rect x="{right_x}" y="350" width="{right_w}" height="128" fill="#ece7dd" stroke="#aaa49a"/>
<text x="{right_x+18}" y="378" font-size="12" font-weight="700" letter-spacing="2">SITE TRUTH</text>
<text x="{right_x+18}" y="407" font-size="16">Rev18 candidate · 1,603 objects</text>
<text x="{right_x+18}" y="432" font-size="14">Municipal 3D integrated · proxy hidden</text>
<text x="{right_x+18}" y="456" font-size="13">BLOCKER: official 1:1000 topography + sightline/shadow close</text>

<rect x="{right_x}" y="494" width="{right_w}" height="128" fill="#ece7dd" stroke="#aaa49a"/>
<text x="{right_x+18}" y="522" font-size="12" font-weight="700" letter-spacing="2">GAUDÍ + STRUCTURE</text>
<text x="{right_x+18}" y="551" font-size="16">9 m span · funicular/thrust logic · repeatable 5 m bay</text>
<text x="{right_x+18}" y="576" font-size="14">Functional translation, not stylistic imitation</text>
<text x="{right_x+18}" y="600" font-size="13">BLOCKER: form-finding/load path + one resolved joint proof</text>

<rect x="{right_x}" y="638" width="{right_w}" height="128" fill="#ece7dd" stroke="#aaa49a"/>
<text x="{right_x+18}" y="666" font-size="12" font-weight="700" letter-spacing="2">AI + EVIDENCE</text>
<text x="{right_x+18}" y="695" font-size="16">brief → variants → kill tests → site truth → validation</text>
<text x="{right_x+18}" y="720" font-size="14">AI is an iterative design instrument with provenance gates</text>
<text x="{right_x+18}" y="744" font-size="13">BLOCKER: compress workflow into one jury-readable system diagram</text>
</g>

<!-- lower strip -->
<line x1="78" y1="828" x2="1604" y2="828" stroke="#141414" stroke-width="2"/>
<text x="78" y="866" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">AUTHORITATIVE PLAN</text>
<rect x="78" y="884" width="430" height="205" fill="#e7e2d8" stroke="#aaa49a"/>
<text x="293" y="979" text-anchor="middle" font-family="Georgia,serif" font-size="25">PENDING</text>
<text x="293" y="1010" text-anchor="middle" font-family="Arial,sans-serif" font-size="13">after topography reconciliation</text>

<text x="548" y="866" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">DECISIVE SECTION</text>
<rect x="548" y="884" width="430" height="205" fill="#e7e2d8" stroke="#aaa49a"/>
<text x="763" y="979" text-anchor="middle" font-family="Georgia,serif" font-size="25">PENDING</text>
<text x="763" y="1010" text-anchor="middle" font-family="Arial,sans-serif" font-size="13">9 m span + passive strategy + civic threshold</text>

<text x="1018" y="866" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">CURRENT READINESS</text>
<rect x="1018" y="884" width="586" height="205" fill="#151515"/>
<text x="1043" y="930" font-family="Arial,sans-serif" fill="white" font-size="15">Brief compliance</text>
<text x="1568" y="930" text-anchor="end" font-family="Georgia,serif" fill="white" font-size="30">{brief[0]}–{brief[1]}%</text>
<text x="1043" y="980" font-family="Arial,sans-serif" fill="white" font-size="15">Winning readiness</text>
<text x="1568" y="980" text-anchor="end" font-family="Georgia,serif" fill="white" font-size="30">{winning[0]}–{winning[1]}%</text>
<text x="1043" y="1030" font-family="Arial,sans-serif" fill="#d0cbc1" font-size="12">Project-management ranges, not jury scores.</text>
<text x="1043" y="1056" font-family="Arial,sans-serif" fill="#d0cbc1" font-size="12">Missing cells are intentional: they define the next work.</text>

<text x="1600" y="1135" text-anchor="end" font-family="Arial,sans-serif" font-size="12">anonymous-final rule applies · participant number omitted from alpha</text>
</svg>'''

Path("a1_alpha_v0_1.svg").write_text(svg)
receipt={
 "status":"A1_ALPHA_BUILT",
 "format":"SVG",
 "dimensions_px":[W,H],
 "orientation":"landscape",
 "hero_source":"f3_hero_review_960.png",
 "purpose":"Jury-read diagnostic, not submission artifact",
 "intentional_pending_cells":["authoritative plan","decisive section"],
 "rule":"No invented metrics or graphics. Pending evidence remains visibly pending."
}
Path("a1_alpha_receipt.json").write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt,indent=2))
