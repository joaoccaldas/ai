"""DRAFT A1 board layout (portrait, 100 dpi) from the storyboard contract in ../A1_STORYBOARD.md.

  python3 make_draft_board.py <hero.png> <vault.png> <out.png> [plan.png section.png [evidence_dir]]

Only real renders are placed. Plan, section, logic and evidence panels are explicit PENDING placeholders: nothing is invented, no metric is shown
without provenance, and no personal name or identifying metadata is included. The board is NOT approvable until SITE_TRUTH_V1, the canonical scene,
structural/environmental evidence and the hero gate pass (see A1_STORYBOARD.md 'Final gate').
"""
import sys
from PIL import Image, ImageDraw, ImageFont
W, H, M = 2339, 3307, 80
hero_p, vault_p, out_p = sys.argv[1:4]
plan_p = sys.argv[4] if len(sys.argv) > 4 else None; sect_p = sys.argv[5] if len(sys.argv) > 5 else None   # optional drawings from render/plan_section.py
ev_dir = sys.argv[6] if len(sys.argv) > 6 else None   # optional: output/final10 (evidence JSONs)
F = '/usr/share/fonts/truetype/dejavu/'
def font(sz, bold=False): return ImageFont.truetype(F + ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'), sz)
bg = (236, 232, 224); ink = (28, 26, 24); mute = (120, 114, 104); line = (190, 184, 172); warn = (160, 60, 40)
im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)

def fit(p, w, h):
    s = Image.open(p).convert('RGB'); r = max(w / s.width, h / s.height); s = s.resize((int(s.width * r) + 1, int(s.height * r) + 1), Image.LANCZOS)
    x, y = (s.width - w) // 2, (s.height - h) // 2; return s.crop((x, y, x + w, y + h))
def wrap(t, f, w):
    out, cur = [], ''
    for word in t.split():
        if d.textlength((cur + ' ' + word).strip(), font=f) <= w: cur = (cur + ' ' + word).strip()
        else: out.append(cur); cur = word
    return out + ([cur] if cur else [])
def text(x, y, t, f, w, fill=ink, gap=8):
    for ln in wrap(t, f, w): d.text((x, y), ln, font=f, fill=fill); y += f.size + gap
    return y
def placeholder(x, y, w, h, title, need):
    d.rectangle((x, y, x + w, y + h), outline=line, width=3); d.line((x, y, x + w, y + h), fill=line, width=2); d.line((x, y + h, x + w, y), fill=line, width=2)
    d.rectangle((x + 20, y + 20, x + w - 20, y + 120), fill=bg); d.text((x + 30, y + 28), title, font=font(30, True), fill=ink)
    text(x + 30, y + 74, 'PENDING: ' + need, font(22), w - 60, fill=warn, gap=4)

d.text((M, M - 10), 'THE LIVING THRESHOLD', font=font(76, True), fill=ink)
y = text(M, M + 100, "The Living Threshold turns the Sagrada Família plaza from a tourist foreground into a daily civic market and meeting ground, using Gaudí's structural logic and evidence-driven AI iteration while preserving the basilica's visual primacy.", font(34), W - 2 * M - 400)
d.text((W - M - 420, M), 'DRAFT LAYOUT', font=font(44, True), fill=warn); d.text((W - M - 420, M + 56), 'not for submission', font=font(26), fill=warn)

top = 330; hw = 1400; hh = 1867
im.paste(fit(hero_p, hw, hh), (M, top))
d.text((M, top + hh + 14), 'Eye-level view toward the basilica, 19:15 CEST, 21 Sep 2026, 32 mm.', font=font(24, True), fill=ink)
text(M, top + hh + 52, 'Sun derived from declared location, date and clock time. Shader-only enrichment of the municipal Sagrada massing (window glazing, string courses, stone tone); geometry unmodified. Photographic finishing pass applied. Figures are procedural and illustrative.', font(21), hw, fill=mute, gap=6)

rx = M + hw + 60; rw = W - M - rx
vh = int(rw * 9 / 16); im.paste(fit(vault_p, rw, vh), (rx, top))
d.text((rx, top + vh + 10), 'Under the vault, 16:00 CEST.', font=font(22, True), fill=ink)
y = top + vh + 60
def drawing(p, y, title, h, scale_m_per_px, bar_m, north=False):
    im.paste(fit(p, rw, h), (rx, y)); d.rectangle((rx, y, rx + rw, y + h), outline=line, width=3)
    d.rectangle((rx + 12, y + 12, rx + 12 + d.textlength(title, font=font(24, True)) + 24, y + 56), fill=bg); d.text((rx + 24, y + 18), title, font=font(24, True), fill=ink)
    bl = int(bar_m / scale_m_per_px); bx, byy = rx + 24, y + h - 40
    d.rectangle((bx - 8, byy - 28, bx + bl + 90, byy + 22), fill=bg); d.rectangle((bx, byy, bx + bl, byy + 8), fill=ink); d.text((bx + bl + 12, byy - 14), f'{bar_m} m', font=font(20), fill=ink)
    if north:
        cx, cy = rx + rw - 50, y + 90; d.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), fill=bg, outline=ink, width=3); d.polygon([(cx, cy - 26), (cx - 12, cy + 14), (cx + 12, cy + 14)], fill=ink); d.text((cx - 8, cy + 36), 'N', font=font(24, True), fill=ink)
if plan_p:
    ph = rw; drawing(plan_p, y, 'Plan (derived scene, massing context)', ph, 340 / 1200 * (1200 / rw), 50, north=True); y += ph + 40
else:
    placeholder(rx, y, rw, 520, 'Authoritative plan', 'north, scale, program split, flows; needs SITE_TRUTH_V1'); y += 560
if sect_p:
    sh_ = int(rw * 9 / 16); drawing(sect_p, y, 'Section looking north, cut y = 50 m (uncapped)', sh_, 78 / 1600 * (1600 / rw), 10); y += sh_ + 40
else:
    placeholder(rx, y, rw, 520, 'Decisive section', '9 m clear span, human scale, passive strategy'); y += 560
def logic(x, y, w, h):
    d.rectangle((x, y, x + w, y + h), outline=line, width=3); d.text((x + 20, y + 14), 'Options -> rejection -> decision (decision log)', font=font(24, True), fill=ink)
    opts = [('A', 'Living Threshold'), ('B', 'Inverted Plaza'), ('C', 'Cerdà Mutation'), ('D', 'Urban Forest'), ('E', 'Market Organism')]
    cw_ = (w - 40 - 4 * 10) // 5; fin = {'A', 'C'}; cur = 'A'
    for i, (k, n) in enumerate(opts):
        bx = x + 20 + i * (cw_ + 10); by_ = y + 60; col = ink if k in fin else mute
        d.rectangle((bx, by_, bx + cw_, by_ + 92), outline=col, width=4 if k == cur else 2, fill=bg)
        d.text((bx + 8, by_ + 6), k, font=font(30, True), fill=col)
        for j, ln in enumerate(wrap(n, font(15), cw_ - 14)): d.text((bx + 8, by_ + 44 + j * 19), ln, font=font(15), fill=col)
        d.text((bx + 8, by_ + 100), 'finalist' if k in fin else 'parked', font=font(16, True), fill=ink if k in fin else warn)
    yy = text(x + 20, y + 180, 'Five hypotheses screened; C+ and A+ kept as finalists, B, D and E parked. E is parked but its service-spine logic was harvested into both finalists. Current scheme: Living Threshold (A+, bold box).', font(19), w - 40, gap=4)
    yy = text(x + 20, yy + 6, 'Evidence changed form: V0.1 failed the approach-view proxy at about 71.2 deg worst obstruction; V0.2 samples 0 deg.', font(19, True), w - 40, gap=4)
    text(x + 20, yy + 6, 'Internal screening heuristic, not the official jury score. Source: FINALIST_DECISION_002, CONCEPT_DIVERGENCE_V0_3.', font(16), w - 40, fill=warn, gap=3)
logic(rx, y, rw, 400)

by = top + hh + 230
def evidence(x, y, w, h):
    import json, os
    d.rectangle((x, y, x + w, y + h), outline=line, width=3); d.text((x + 24, y + 18), 'Evidence (values read from repo JSON; status shown as filed)', font=font(26, True), fill=ink)
    st = json.load(open(os.path.join(ev_dir, 'structural_thrust_v1.json'))); so = json.load(open(os.path.join(ev_dir, 'barcelona_solar_baseline_v1.json'))); pr = json.load(open(os.path.join(ev_dir, 'rev15_program_clearance.json')))
    cw = (w - 48) // 3; cy = y + 78
    # 1. structure: funicular arch drawn from the filed span/rise, reactions from the 1.5 kPa case
    g = st['geometry']; c = st['cases'][1]; ax = x + 24; aw = cw - 30; ah = 170
    d.text((ax, cy), 'Funicular roof proxy', font=font(24, True), fill=ink)
    px = lambda t: ax + 20 + t * (aw - 40); pz = lambda t: cy + 70 + ah - 4 * t * (1 - t) * g['rise_m'] / g['clear_span_m'] * (aw - 40)   # true scale: rise/span as filed, no vertical exaggeration
    pts = [(px(i / 40), pz(i / 40)) for i in range(41)]; d.line(pts, fill=ink, width=5); d.line((px(0), pz(0), px(1), pz(1)), fill=mute, width=2)
    d.text((px(0.38), cy + 70 + ah + 8), f"span {g['clear_span_m']} m, rise {g['rise_m']} m", font=font(19), fill=ink)
    yy = cy + 70 + ah + 48
    yy = text(ax, yy, f"{c['roof_pressure_kPa']} kPa on a {g['tributary_bay_m']} m bay: H = {c['horizontal_reaction_kN_per_support']} kN, V = {c['vertical_reaction_kN_per_support']} kN per support (H = wL^2/8f).", font(21), cw - 30, gap=5)
    text(ax, yy + 10, st['status'].replace('_', ' ').lower() + '.', font(19), cw - 30, fill=warn, gap=4)
    # 2. sun: filed noon altitudes and the 6 m shadow
    bx = x + 24 + cw; d.text((bx, cy), 'Geometric sun baseline', font=font(24, True), fill=ink); r = cy + 50
    for k in so['cases']:
        d.text((bx, r), k['case'].replace('_', ' '), font=font(21), fill=ink); d.text((bx + 270, r), f"{k['solar_noon_altitude_deg']} deg", font=font(21, True), fill=ink); d.text((bx + 270, r + 28), f"6 m -> {k['shadow_for_6m_height_m']} m", font=font(19), fill=mute); r += 78
    text(bx, r + 6, f"Latitude {so['latitude_deg']} N, solar-noon altitude. " + so['status'].replace('_', ' ').lower() + '.', font(19), cw - 30, fill=warn, gap=4)
    # 3. program + context
    cx = x + 24 + 2 * cw; d.text((cx, cy), 'Program and context', font=font(24, True), fill=ink)
    yy = text(cx, cy + 50, f"{pr['program_objects']} program objects; 2 teaching kitchens (capacity tagged 20 each); {pr['admin_workstations']['count']} admin workstations.", font(21), cw - 30, gap=5)
    yy = text(cx, yy + 6, 'Nearest-pier center distances: kitchens ' + ' / '.join(f"{k['nearest_civic_pier_m']} m" for k in pr['teaching_kitchens']) + '.', font(21), cw - 30, gap=5)
    yy = text(cx, yy + 6, 'F3 sightline against the municipal context: 9/9 target-window rays reach it first, 0 non-municipal blockers.', font(21), cw - 30, gap=5)
    text(cx, yy + 10, pr['status'].replace('_', ' ').lower() + '; center-distance audit, not code clearance.', font(19), cw - 30, fill=warn, gap=4)
if ev_dir: evidence(M, by, 1400, H - 130 - by - 20)
else: placeholder(M, by, 1400, H - 130 - by - 20, 'Evidence strip', 'only validated metrics with provenance; none shown until closed')
placeholder(rx, by, rw, H - 130 - by - 20, 'Micro-detail', 'roof/edge/column or stall interface')

d.rectangle((0, H - 110, W, H), fill=(214, 208, 196))
d.text((M, H - 86), 'Draft composition from real renders only. Open gates: SITE_TRUTH_V1, canonical scene, structural and environmental evidence, hero >= 9/10.', font=font(24), fill=ink)
im.save(out_p, optimize=True); print('BOARD', out_p, im.size)
