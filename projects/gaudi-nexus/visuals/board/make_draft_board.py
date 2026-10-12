"""DRAFT A1 board layout (portrait, 100 dpi) from the storyboard contract in ../A1_STORYBOARD.md.

  python3 make_draft_board.py <hero.png> <vault.png> <out.png>

Only real renders are placed. Plan, section, logic and evidence panels are explicit PENDING placeholders: nothing is invented, no metric is shown
without provenance, and no personal name or identifying metadata is included. The board is NOT approvable until SITE_TRUTH_V1, the canonical scene,
structural/environmental evidence and the hero gate pass (see A1_STORYBOARD.md 'Final gate').
"""
import sys
from PIL import Image, ImageDraw, ImageFont
W, H, M = 2339, 3307, 80
hero_p, vault_p, out_p = sys.argv[1:4]
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
placeholder(rx, y, rw, 520, 'Authoritative plan', 'north, scale, program split, flows; needs SITE_TRUTH_V1'); y += 560
placeholder(rx, y, rw, 520, 'Decisive section', '9 m clear span, human scale, passive strategy'); y += 560
placeholder(rx, y, rw, 330, 'Gaudi + AI logic', 'force/material logic, option generation to decision')

by = top + hh + 230
placeholder(M, by, 1400, H - 130 - by - 20, 'Evidence strip', 'only validated metrics with provenance; none shown until closed')
placeholder(rx, by, rw, H - 130 - by - 20, 'Micro-detail', 'roof/edge/column or stall interface')

d.rectangle((0, H - 110, W, H), fill=(214, 208, 196))
d.text((M, H - 86), 'Draft composition from real renders only. Open gates: SITE_TRUTH_V1, canonical scene, structural and environmental evidence, hero >= 9/10.', font=font(24), fill=ink)
im.save(out_p, optimize=True); print('BOARD', out_p, im.size)
