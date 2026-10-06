"""Local review page for actual renders and preserved-source comparison.

Reads a build manifest; uses its measured values rather than invented scores.
"""
import argparse
import html
import json
from pathlib import Path


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('output',type=Path);args=p.parse_args()
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
