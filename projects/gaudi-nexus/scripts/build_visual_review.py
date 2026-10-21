"""Local review page for actual renders and preserved-source comparison.

Reads a build manifest; uses its measured values rather than invented scores.
"""
import argparse
import html
import json
import shutil
import base64
import hashlib
from pathlib import Path


def a1_alpha(output,drawings):
    """Working layout only; images/drawings must belong to the same candidate."""
    prep=json.loads((output/'candidate.blend.receipt.json').read_text())
    dr=json.loads((drawings/'drawings-receipt.json').read_text())
    if dr['source_sha256']!=prep['candidate_sha256']:
        raise ValueError('Board drawings and renders belong to different scenes')
    inputs={}
    def embed(path,x,y,w,h,mime):
        raw=path.read_bytes();inputs[str(path.relative_to(output))]=hashlib.sha256(raw).hexdigest()
        data=base64.b64encode(raw).decode()
        return f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" href="data:{mime};base64,{data}"/>'
    for name in ('market','method'):
        receipt=json.loads((output/(name+'.png.receipt.json')).read_text())
        if receipt['candidate_sha256']!=prep['candidate_sha256'] or hashlib.sha256((output/(name+'.png')).read_bytes()).hexdigest()!=receipt['render_sha256']:
            raise ValueError('Unverified board image: '+name)
    for name,sha in dr['files'].items():
        if hashlib.sha256((drawings/name).read_bytes()).hexdigest()!=sha:raise ValueError('Unverified drawing: '+name)
    page='''<svg xmlns="http://www.w3.org/2000/svg" width="594mm" height="841mm" viewBox="0 0 594 841"><rect width="594" height="841" fill="#f4f2ea"/><g font-family="sans-serif" fill="#263b32"><text x="24" y="24" font-size="3.5" letter-spacing="1">WORKING A1 / DESIGN CANDIDATE / 21 OCTOBER 2026</text><text x="24" y="54" font-size="23" letter-spacing="-1">LIVING THRESHOLD</text><text x="24" y="71" font-size="5">A daily market and civic meeting ground beside the Sagrada Família.</text><text x="24" y="82" font-size="3.8">Durable structure. Replaceable equipment. A shared lesson in how forces become form.</text>'''
    page+=embed(output/'market.png',24,94,546,341,'image/png')
    page+='<text x="24" y="445" font-size="3.5">Human-eye market study · 1.56 m / 32 mm · primary context hero still pending</text><text x="24" y="453" font-size="3">Illustrative procedural figures · material and lighting study, not construction approval</text>'
    page+=embed(drawings/'plan-level-0.svg',24,463,266,222,'image/svg+xml')
    page+=embed(drawings/'section-market.svg',304,463,266,222,'image/svg+xml')
    page+='<text x="24" y="697" font-size="3.5">20 fitted stalls · 2 independent teaching-room layouts · 8 workstations</text><text x="24" y="707" font-size="3">Actual scene geometry; programme allocation is not certified GFA or occupancy.</text>'
    page+=embed(output/'method.png',24,722,107,80,'image/png')
    page+='''<text x="145" y="738" font-size="5">LOAD → INVERT → BUILD</text><text x="145" y="751" font-size="3.5">A polygon under equal vertical point loads explains a structural rule.</text><text x="145" y="761" font-size="3.5">AI-assisted source iteration: freeze → generate → inspect → reject → refine.</text><text x="145" y="774" font-size="3">Retained: geometry, source identity and fixed-camera comparisons.</text><text x="145" y="784" font-size="3">Rejected: dark exhibit lighting; corrected in the actual scene.</text><text x="24" y="818" font-size="3">Not for submission: plaza edge, context hero, rights and independent review remain open.</text><text x="570" y="827" text-anchor="end" font-size="3">ORDER NUMBER REQUIRED</text></g></svg>'''
    (output/'A1-alpha.svg').write_text(page)
    (output/'a1-alpha-receipt.json').write_text(json.dumps({'status':'WORKING_LAYOUT_NOT_SUBMISSION',
        'candidate_sha256':prep['candidate_sha256'],'inputs':inputs,'dimensions_mm':[594,841],
        'file_sha256':hashlib.sha256((output/'A1-alpha.svg').read_bytes()).hexdigest(),
        'limits':['SVG alpha, not final JPEG.','Context hero and site-edge reconciliation remain open.',
                  'Participant order number unavailable; no identifier or acceptance invented.']},indent=2)+'\n')


def comparison(output,baseline,views=None):
    """Use actual adjacent render receipts; no model, renderer or invented score."""
    panels=[];rows=[];base=output/'baseline';base.mkdir(exist_ok=True)
    baseline_info=baseline/'baseline-sources.json'
    labels={r['view']:r['label'] for r in json.loads(baseline_info.read_text())} if baseline_info.is_file() else {}
    view_titles=[('market','The neighborhood market'),('arrival','Arrival and context'),
                 ('plaza','The whole plaza'),('method','How a load becomes a form')]
    for name,title in view_titles:
        if views is not None and name not in views:continue
        receipt=json.loads((output/(name+'.png.receipt.json')).read_text())
        import hashlib
        actual=hashlib.sha256((output/(name+'.png')).read_bytes()).hexdigest()
        if actual!=receipt['render_sha256']:raise ValueError('Render identity mismatch: '+name)
        previous=baseline/(name+'.png')
        before=''
        if previous.is_file():
            old=json.loads((baseline/(name+'.png.receipt.json')).read_text())
            keys=['camera','position_m','lens_mm','width','height','max_samples','hour_CEST','date','view_transform','source_sha256','blender_version','postprocess']
            if any(old[k]!=receipt[k] for k in keys):raise ValueError('Unmatched baseline profile: '+name)
            if hashlib.sha256(previous.read_bytes()).hexdigest()!=old['render_sha256']:
                raise ValueError('Baseline render identity mismatch: '+name)
            shutil.copy2(previous,base/previous.name)
            caption=html.escape(labels.get(name,'Before · preserved V6'))
            before=f'<figure><img src="baseline/{name}.png?v={old["render_sha256"][:16]}" alt="Baseline {html.escape(title)}"><figcaption>{caption}</figcaption></figure>'
        else:before='<div class="note">New interpretation display.<br>No prior matching view.</div>'
        panels.append(f'<section id="{name}" aria-labelledby="h-{name}"><h2 id="h-{name}">{title}</h2><div class="pair">{before}<figure><img src="{name}.png?v={actual[:16]}" alt="Actual candidate {html.escape(title)}"><figcaption>Candidate · actual Cycles render</figcaption></figure></div></section>')
        rows.append(f'<tr><td>{title}</td><td>{receipt["width"]} × {receipt["height"]}</td><td>{receipt["seconds_render"]:.2f} s</td><td><a href="{name}.png.receipt.json">Receipt</a></td></tr>')
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Living Threshold · before and after</title><style>
:root{font:16px/1.5 system-ui,sans-serif;color:#25362e;background:#f3f1e9}*{box-sizing:border-box}body{max-width:1480px;margin:auto;padding:40px 32px}h1{font-size:clamp(36px,6vw,76px);letter-spacing:-.055em;line-height:1.03;margin:16px 0}h2{font-size:24px;letter-spacing:-.025em;margin:0 0 16px}p{max-width:760px;color:#586258}small,.eyebrow{font-size:12px;letter-spacing:.13em;text-transform:uppercase}nav{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 40px}a{color:inherit;text-underline-offset:4px}nav a{padding:8px 14px;border:1px solid #abb6a8;border-radius:100px;text-decoration:none}section{scroll-margin-top:24px;margin:0 0 48px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;min-width:0;background:#e3e4d9}img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;background:#d9dfdb}figcaption{padding:10px 12px;font-size:13px}.note{display:grid;align-content:center;padding:28px;background:#e7e7dc;color:#687361}details{border-top:1px solid #bbc1b4;padding-top:16px}summary{cursor:pointer;font-weight:600}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:10px 4px;border-bottom:1px solid #d4d7ca}footer{margin-top:32px;font-size:13px;max-width:850px;color:#667060}@media(max-width:700px){body{padding:24px 16px}.pair{grid-template-columns:1fr}nav{margin-bottom:28px}.note{min-height:100px}td,th{font-size:12px}section{margin-bottom:32px}}
</style><header><div class="eyebrow">Living Threshold · visual study · 21 October 2026</div><h1>A market for daily life.</h1><p>More tactile stalls, a quieter aisle, and a small exhibit that makes the structural idea visible. Compare actual renders at the same cameras.</p><small>Design candidate · competition approval pending</small></header>
<nav aria-label="Compare views"><a href="#market">Market</a><a href="#arrival">Arrival</a><a href="#plaza">Plaza</a><a href="#method">Structural idea</a></nav>'''
    page+=''.join(panels)+'<details><summary>Sources, timings and limits</summary><p>Blender 5.2.2 · Cycles CPU on the existing Linux runner · AgX · no photographic finishing. Baseline camera/profile fields and actual image hashes are checked when this page is built.</p><table><tr><th>View</th><th>Pixels</th><th>Render time</th><th>Evidence</th></tr>'+''.join(rows)+'</table><p><a href="candidate.blend.receipt.json">Scene receipt</a> · <a href="RESEARCH.json">Research record</a></p></details><footer>The cathedral is preserved municipal massing with limited detail. Figures are illustrative. The hanging polygon explains equal point loads; it is not a catenary, a replica of Gaudí’s geometry, or engineering certification. No competition acceptance or submission is implied.</footer></html>'
    if views is not None:
        for name,_ in view_titles:
            if name not in views:
                import re
                page=re.sub(r'<a href="#'+name+r'">[^<]+</a>','',page)
        if not labels:page=page.replace('Before · preserved V6','Before · prior candidate')
        page=page.replace('same cameras.','same cameras. This page covers the selected refinement views only.')
        if 'plaza' in views and 'market' not in views:
            page=page.replace('A market for daily life.','Gardens for civic life.')
            page=page.replace('More tactile stalls, a quieter aisle, and a small exhibit that makes the structural idea visible.',
                'Four planted gathering areas, reused community furniture and clear approaches organise the shared plaza.')
    if not (output/'RESEARCH.json').is_file() and (output.parent/'RESEARCH.json').is_file():
        page=page.replace('href="RESEARCH.json"','href="../RESEARCH.json"')
    if (output/'A1-alpha.svg').is_file():
        page=page.replace('</nav>','<a href="A1-alpha.svg">Working A1</a></nav>')
    if baseline_info.is_file():
        shutil.copy2(baseline_info,base/baseline_info.name)
        page=page.replace('</details>','<p><a href="baseline/baseline-sources.json">View-specific baseline sources</a></p></details>')
    (output/'review.html').write_text(page)


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('output',type=Path);p.add_argument('--baseline',type=Path)
    p.add_argument('--views',nargs='+',choices=['market','arrival','plaza','method'])
    p.add_argument('--board-alpha',action='store_true');p.add_argument('--drawings',type=Path);args=p.parse_args()
    if args.board_alpha:
        if not args.drawings:p.error('--board-alpha requires --drawings from the same candidate')
        a1_alpha(args.output,args.drawings)
        raise SystemExit(0)
    if args.baseline:
        comparison(args.output,args.baseline,args.views)
        raise SystemExit(0)
    manifest=json.loads((args.output/'manifest.json').read_text())
    rows=''.join(f'<tr><td>{html.escape(r["view"])}</td><td>{r["seconds"]:.2f} s</td><td>{r["lens_mm"]:g} mm</td></tr>' for r in manifest['renders'])
    blend='living-threshold-visual-v1.blend';glb='living-threshold-visual-v1.glb'
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Living Threshold · visual review</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#111614;color:#edece3}body{max-width:1480px;margin:auto;padding:32px}header{display:flex;justify-content:space-between;gap:24px;align-items:end}h1{font-size:clamp(28px,5vw,62px);letter-spacing:-.05em;margin:8px 0}p{color:#b9beb3;line-height:1.6;max-width:850px}.eyebrow{letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#c7a676}nav{display:flex;gap:10px;flex-wrap:wrap;margin:28px 0 16px}button,a{color:inherit}button{background:transparent;border:1px solid #65705d;padding:12px 18px;border-radius:4px;cursor:pointer}button[aria-pressed=true]{background:#d0b386;color:#172017;border-color:#d0b386}figure{margin:0;background:#1d241e;aspect-ratio:16/9;position:relative}figure img{width:100%;height:100%;object-fit:contain}figure figcaption{position:absolute;bottom:0;left:0;padding:8px 12px;background:#111b;font-size:12px}section{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:32px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px;border-bottom:1px solid #354132}a{color:#d8bd91;margin-right:20px}small{color:#b5baa9}@media(max-width:720px){body{padding:20px}header{display:block}section{grid-template-columns:1fr;gap:20px}}
</style><header><div><div class="eyebrow">Living Threshold / Gaudí Nexus</div><h1>Light, craft, civic life.</h1><p>Visual development from the preserved Rev 17 municipal scene. The new market kit opens the stalls, while procedural canopy detail, ceramic glaze, limestone and Barcelona daylight refine the world.</p></div><small>5 October 2026<br>Candidate · approval pending</small></header>
<nav aria-label="Render views"><button data-view="context.png" aria-pressed="true">Plaza & context</button><button data-view="market.png" aria-pressed="false">Market life</button><button data-view="f3.png" aria-pressed="false">Registered F3</button><button data-view="aerial.png" aria-pressed="false">Urban overview</button><button data-view="../source-latest-survey/hero_f3_eevee.png" aria-pressed="false">Original F3 baseline</button></nav>
<figure><img id="frame" src="context.png" alt="Actual Cycles render of the Living Threshold civic plaza"><figcaption id="caption">Plaza & context · actual Cycles render</figcaption></figure>
<section><div><h2>Source preserved. Components reusable.</h2><p>1600 original non-camera objects retain their geometry and transforms. Municipal geometry is unchanged. Twenty solid stall proxies are retained and hidden behind open-front kit replacements. Seven trees share three mesh variants; the library includes hero and low-detail variants.</p><p><a href="BLEND">Open Blender scene</a><a href="GLB">Download GLB preview</a><a href="manifest.json">Build evidence</a></p></div><div><h2>Measured rendering</h2><p>RENDER_SETTINGS</p><table><thead><tr><th>View</th><th>Time</th><th>Lens</th></tr></thead><tbody>ROWS</tbody></table></div></section>
<p><small>The municipal cathedral is a simplified massing model. Glazing, trees, entourage and material choices are design-development representations. The GLB uses constant PBR approximations; Cycles procedural textures require baking for equivalent web appearance. Structural, annual environmental, site-survey and final competition approval remain separate.</small></p>
<script>const buttons=document.querySelectorAll('[data-view]');for(const b of buttons)b.addEventListener('click',()=>{for(const x of buttons)x.setAttribute('aria-pressed',String(x===b));document.getElementById('frame').src=b.dataset.view;document.getElementById('frame').alt=b.textContent;document.getElementById('caption').textContent=b.textContent+(b.textContent.includes('baseline')?' · preserved Eevee baseline':' · actual Cycles render');});</script></html>'''
    page=page.replace('Seven trees share three mesh variants',f'{manifest["trees"]} trees share three mesh variants').replace('Twenty solid stall proxies',f'{manifest["open_stall_kits"]} solid stall proxies')
    page=page.replace('the library includes hero and low-detail variants.',f'the library includes hero and low-detail variants. {manifest.get("planting_islands",0)} proposed herb and lavender beds add low curbs and timber seating around the plaza.')
    page=page.replace('<nav aria-label="Render views">','<nav aria-label="Render views"><button data-view="design.png" aria-pressed="true">Architecture & craft</button>')
    page=page.replace('data-view="context.png" aria-pressed="true"','data-view="context.png" aria-pressed="false"').replace('id="frame" src="context.png"','id="frame" src="design.png"').replace('Plaza & context · actual Cycles render','Architecture & craft · actual Cycles render')
    page=page.replace('<a href="manifest.json">Build evidence</a>','<a href="physics-colliders.glb">Static collision layer</a><a href="manifest.json">Build evidence</a>')
    settings=manifest['render']
    page=page.replace('BLEND',blend).replace('GLB',glb).replace('ROWS',rows).replace('RENDER_SETTINGS',f'{settings["width"]} × {settings["height"]} · {settings["samples"]} maximum samples · adaptive sampling · denoised · {settings["device"]} · AgX')
    (args.output/'review.html').write_text(page)
