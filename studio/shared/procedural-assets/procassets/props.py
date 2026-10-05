"""Lifestyle props for cafe/florist/hotel/hall rooms. Each returns a bmesh; face.material_index indexes the registry material list."""
import math, random
import bmesh
from mathutils import Vector, Matrix
from .geom import box, cyl, lathe, arc_tube

def potted_olive(h=1.6, seed=4):   # mats: 0 terracotta, 1 bark, 2 silver-green leaf
    r = random.Random(seed); bm = bmesh.new()
    lathe(bm, [(0.17, 0), (0.2, 0.02), (0.25, 0.32), (0.27, 0.34), (0.25, 0.345), (0.0, 0.33)], 24, 0)
    # twisted trunk (3 strands) + branches
    tips = []
    for s in range(3):
        a0 = s * 2.1; pts = []
        for k in range(9):
            t = k / 8; z = 0.33 + t * h * 0.45; ang = a0 + t * 2.2; rr = 0.035 * (1 - t) + 0.03 * math.sin(t * 6 + s)
            pts.append(Vector((math.cos(ang) * rr, math.sin(ang) * rr, z)))
        for k in range(8): cyl(bm, pts[k], pts[k + 1], 0.03 * (1 - k / 10), 0.028 * (1 - (k + 1) / 10), 7, 1, caps=False)
        top = pts[-1]
        for b in range(4):
            ang = r.uniform(0, 6.28); L = r.uniform(0.35, 0.6); tip = top + Vector((math.cos(ang) * L, math.sin(ang) * L, r.uniform(0.15, 0.4)))
            cyl(bm, top, tip, 0.014, 0.006, 5, 1); tips.append(tip)
    for tip in tips:
        for i in range(70):
            c = tip + Vector((r.gauss(0, 0.16), r.gauss(0, 0.16), r.gauss(0, 0.13))); a = r.uniform(0, 6.28); L = 0.07; wd = 0.012
            d = Vector((math.cos(a), math.sin(a), r.uniform(-0.3, 0.3))).normalized(); side = d.cross(Vector((0, 0, 1))).normalized() * wd
            v = [bm.verts.new(x) for x in (c, c + d * L * 0.5 + side, c + d * L, c + d * L * 0.5 - side)]; f = bm.faces.new(v); f.material_index = 2
    return bm
def vase_flowers(h=0.28, stems=9, seed=2):   # mats: 0 ceramic vase, 1 stem green, 2 petal, 3 centre
    r = random.Random(seed); bm = bmesh.new()
    lathe(bm, [(0.05, 0), (0.09, 0.05), (0.105, 0.13), (0.07, 0.22), (0.045, 0.26), (0.055, h), (0.045, h), (0.04, h - 0.02), (0.0, 0.02)], 26, 0)
    for s in range(stems):
        a = s * 6.283 / stems + r.uniform(-0.3, 0.3); lean = r.uniform(0.1, 0.4); L = r.uniform(0.3, 0.45)
        base = Vector((0, 0, h - 0.04)); tip = base + Vector((math.cos(a) * lean * L, math.sin(a) * lean * L, L)); cyl(bm, base, tip, 0.004, 0.003, 5, 1)
        for p in range(8):
            pa = p * 6.283 / 8; d1 = Vector((math.cos(pa), math.sin(pa), 0.15)).normalized(); side = d1.cross(Vector((0, 0, 1))).normalized() * 0.014
            v = [bm.verts.new(x) for x in (tip, tip + d1 * 0.03 + side, tip + d1 * 0.06, tip + d1 * 0.03 - side)]; f = bm.faces.new(v); f.material_index = 2
        cyl(bm, tip, tip + Vector((0, 0, 0.006)), 0.011, 0.01, 8, 3)
    return bm
def coffee_cup(d=0.08, h=0.065):   # mat 0 porcelain
    bm = bmesh.new(); r = d / 2
    lathe(bm, [(r*0.5, 0.0), (r*0.55, 0.004), (r, h*0.35), (r*1.12, h), (r*1.05, h), (r*0.95, h*0.95), (r*0.5, 0.01)], 28, 0)
    lathe(bm, [(0.0, 0.0), (r*1.7, 0.0), (r*1.8, 0.012), (r*1.2, 0.016), (r*0.9, 0.012), (0.0, 0.01)], 32, 0, cap_bottom=False)
    arc_tube(bm, (r * 1.08, 0, h * 0.55), r * 0.45, -math.pi / 2, math.pi / 2, 0.004, 10, 'XZ'); return bm
def wine_glass(h=0.2):    # mat 0 glass
    bm = bmesh.new(); lathe(bm, [(0.0, 0.0), (0.04, 0.0), (0.04, 0.004), (0.006, 0.01), (0.005, h*0.4), (0.02, h*0.45), (0.045, h*0.62), (0.05, h*0.8), (0.04, h*0.99), (0.038, h*0.99), (0.046, h*0.8), (0.04, h*0.62), (0.0, h*0.46)], 28, 0); return bm
def wine_bottle(h=0.3):   # mats: 0 glass, 1 label, 2 foil
    bm = bmesh.new(); lathe(bm, [(0.0, 0.0), (0.037, 0.0), (0.038, 0.005), (0.038, h*0.55), (0.03, h*0.7), (0.013, h*0.82), (0.012, h*0.95), (0.014, h*0.97), (0.0, h*0.97)], 28, 0)
    cyl(bm, (0, 0, h*0.88), (0, 0, h*0.97), 0.0142, 0.0146, 20, 2); cyl(bm, (0, 0, h*0.2), (0, 0, h*0.42), 0.0388, 0.0388, 28, 1, caps=False); return bm
def plate_setting(d=0.26):   # mats: 0 porcelain, 1 steel cutlery, 2 napkin
    bm = bmesh.new(); r = d / 2
    lathe(bm, [(0.0, 0.0), (r*0.6, 0.0), (r*0.65, 0.006), (r, 0.016), (r*1.0, 0.018), (r*0.9, 0.014), (r*0.55, 0.008), (0.0, 0.008)], 40, 0)
    for s, nm in ((-1, 'fork'), (1, 'knife')):
        x = s * (r + 0.05); box(bm, (x, 0, 0.004), (0.016 if nm == 'fork' else 0.014, 0.19, 0.004), 0, 1)
    box(bm, (-(r + 0.12), 0, 0.006), (0.09, 0.09, 0.012), 0, 2); return bm
def pendant_lamp(drop=1.0, d=0.38):   # mats: 0 shade metal, 1 cord, 2 bulb emissive
    bm = bmesh.new(); cyl(bm, (0, 0, 0), (0, 0, drop), 0.004, 0.004, 6, 1); cyl(bm, (0, 0, drop - 0.01), (0, 0, drop + 0.03), 0.03, 0.03, 12, 1)
    lathe(bm, [(0.025, 0.0), (d*0.2, -0.04), (d*0.42, -0.14), (d*0.5, -0.16), (d*0.48, -0.162), (d*0.4, -0.145), (d*0.18, -0.045), (0.02, -0.01)], 28, 0, cap_bottom=False, center=(0, 0, drop))
    lathe(bm, [(0.0, -0.08), (0.04, -0.07), (0.05, -0.04), (0.035, -0.01), (0.0, 0.0)], 14, 2, cap_bottom=False, center=(0, 0, drop)); return bm
def bar_stool(h=0.75, d=0.36):    # mats: 0 timber seat, 1 steel frame
    bm = bmesh.new(); lathe(bm, [(0.0, h), (d/2, h), (d/2*1.02, h-0.015), (d/2*0.95, h-0.045), (0.0, h-0.045)], 28, 0)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4; cyl(bm, (math.cos(a)*d*0.3, math.sin(a)*d*0.3, h-0.045), (math.cos(a)*d*0.5, math.sin(a)*d*0.5, 0.0), 0.012, 0.011, 8, 1)
    arc_tube(bm, (0, 0, 0.26), d * 0.43, 0, 2 * math.pi, 0.01, 28, 'XY'); return bm
