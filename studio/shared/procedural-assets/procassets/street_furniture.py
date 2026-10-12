"""Street / shop-front assets reusable across any urban or retail scene. Each returns a bmesh; material_index indexes the registry material list. Metres, Z up, origin at base centre."""
import math
import bmesh
from .geom import box, cyl, lathe, arc_tube, rbox

def manhole_cover(d=0.65):   # mats: 0 cast iron, 1 frame stone
    bm = bmesh.new(); r = d / 2
    lathe(bm, [(0.0, -0.01), (r * 1.18, -0.01), (r * 1.18, 0.0), (r * 1.02, 0.0)], 40, 1, cap_bottom=True)
    lathe(bm, [(0.0, -0.002), (r, -0.002), (r, 0.012), (r * 0.96, 0.014), (0.0, 0.014)], 40, 0)
    for j in range(-3, 4):   # raised anti-slip ribs, clipped to the plate
        o = j * 0.075; L = 2 * math.sqrt(max(r * r * 0.85 - o * o, 0.0)); box(bm, (o, 0, 0.017), (0.012, L, 0.006), 0, 0)
    return bm

def kerb_stone(L=1.0, w=0.15, h=0.25):   # mats: 0 granite
    bm = bmesh.new(); rbox(bm, (0, 0, h / 2), (L, w, h), 0.012, 0, 0); return bm

def parasol(r=1.3, h=2.4, ribs=8):   # mats: 0 pole aluminium, 1 canvas
    bm = bmesh.new(); cyl(bm, (0, 0, 0), (0, 0, h + 0.18), 0.022, 0.016, 12, 0); cyl(bm, (0, 0, 0), (0, 0, 0.03), 0.14, 0.14, 20, 0)
    prev = None; apex = (0, 0, h + 0.18)
    for i in range(ribs):
        a0 = 2 * math.pi * i / ribs; a1 = 2 * math.pi * (i + 1) / ribs; am = (a0 + a1) / 2
        e0 = (r * math.cos(a0), r * math.sin(a0), h - 0.42); e1 = (r * math.cos(a1), r * math.sin(a1), h - 0.42); em = (r * 1.04 * math.cos(am), r * 1.04 * math.sin(am), h - 0.46)
        vs = [bm.verts.new(v) for v in (apex, e0, em, e1)]; f = bm.faces.new(vs); f.material_index = 1
        vs2 = [bm.verts.new(tuple(v.co)) for v in vs[::-1]]; g = bm.faces.new(vs2); g.material_index = 1
        cyl(bm, apex, e0, 0.006, 0.006, 4, 0)
    return bm

def wall_shelf(w=1.2, d=0.25, rows=3, gap=0.32):   # mats: 0 timber, 1 steel bracket
    bm = bmesh.new()
    for r in range(rows):
        z = 0.25 + r * gap; box(bm, (0, 0, z), (w, d, 0.025), 0, 0)
        for s in (-1, 1): box(bm, (s * (w / 2 - 0.08), -d / 2 + 0.01, z - 0.1), (0.014, 0.012, 0.18), 0, 1); box(bm, (s * (w / 2 - 0.08), -d * 0.2, z - 0.016), (0.014, d * 0.6, 0.012), 0, 1)
    box(bm, (0, -d / 2 - 0.005, 0.25 + gap * (rows - 1) / 2), (w, 0.01, gap * (rows - 1) + 0.3), 0, 0); return bm

def paper_bag(w=0.18, d=0.1, h=0.3):   # mats: 0 kraft paper
    bm = bmesh.new(); hw, hd = w / 2, d / 2
    v = [bm.verts.new(p) for p in [(-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-hw * 0.9, -hd * 1.15, h), (hw * 0.9, -hd * 1.15, h), (hw * 0.9, hd * 1.15, h), (-hw * 0.9, hd * 1.15, h)]]
    for q in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new([v[i] for i in q])
    return bm

def hanging_basket(r=0.17, drop=0.9):   # origin at hook; mats: 0 wire/steel, 1 soil, 2 foliage
    bm = bmesh.new()
    for k in range(3):
        a = k * 2 * math.pi / 3; cyl(bm, (0, 0, 0), (r * math.cos(a), r * math.sin(a), -drop * 0.55), 0.003, 0.003, 4, 0)
    lathe(bm, [(0.0, -drop * 0.55 - 0.1), (r * 0.7, -drop * 0.55 - 0.08), (r, -drop * 0.55), (r * 1.05, -drop * 0.55 + 0.02)], 24, 0, cap_bottom=False)
    lathe(bm, [(0.0, -drop * 0.55 - 0.02), (r * 0.95, -drop * 0.55 - 0.02), (r * 0.9, -drop * 0.55 + 0.01), (0.0, -drop * 0.55 + 0.01)], 20, 1)
    for k in range(9):
        a = k * 0.7; rr = r * (0.2 + 0.1 * (k % 3)); cx, cy = rr * math.cos(a), rr * math.sin(a); z = -drop * 0.55 + 0.03
        g = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=5, radius=0.07 + 0.01 * (k % 3))
        for vv in g['verts']: vv.co = vv.co * 1.0; vv.co.x += cx; vv.co.y += cy; vv.co.z = vv.co.z * 0.7 + z + 0.04
        for f in {f for vv in g['verts'] for f in vv.link_faces}: f.material_index = 2
    return bm

def step_ladder(h=1.2, w=0.45):   # mats: 0 aluminium
    bm = bmesh.new(); top = h
    for s in (-1, 1):
        cyl(bm, (s * w / 2, 0.0, top), (s * w * 0.55, 0.38, 0.0), 0.016, 0.016, 8, 0); cyl(bm, (s * w / 2, 0.0, top), (s * w * 0.55, -0.45, 0.0), 0.014, 0.014, 8, 0)
    for k in range(4): z = top * (0.2 + 0.2 * k); y = 0.38 * (1 - z / top); box(bm, (0, y * 0.95, z), (w * 1.05, 0.08, 0.02), 0, 0)
    box(bm, (0, 0.0, top + 0.01), (w * 1.1, 0.26, 0.025), 0, 0); return bm

def milk_crate_stack(n=6, w=0.33, d=0.33, h=0.26):   # mats: 0 plastic crate
    bm = bmesh.new()
    for i in range(n):
        z = (i // 2) * h; x = (i % 2 - 0.5) * (w + 0.01)
        box(bm, (x, 0, z + 0.012), (w, d, 0.024), 0, 0)
        for s in (-1, 1):
            box(bm, (x + s * (w / 2 - 0.01), 0, z + h / 2), (0.02, d, h), 0, 0); box(bm, (x, s * (d / 2 - 0.01), z + h / 2), (w, 0.02, h), 0, 0)
    return bm
