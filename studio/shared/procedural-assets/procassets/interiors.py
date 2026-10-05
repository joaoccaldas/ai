"""Interior / lifestyle assets for hotel, hall, museum, jewelry, florist and gym rooms. Each returns a bmesh; face.material_index indexes the registry material list."""
import math, random
import bmesh
from mathutils import Vector, Matrix
from .geom import box, rbox, cyl, lathe, arc_tube

def sofa_two_seat(w=1.8, d=0.88, h=0.8):   # mats: 0 fabric, 1 timber legs
    bm = bmesh.new(); sh = 0.42
    for sx in (-1, 1):
        for sy in (-1, 1): cyl(bm, (sx*(w/2-0.1), sy*(d/2-0.1), 0), (sx*(w/2-0.1), sy*(d/2-0.1), 0.14), 0.025, 0.02, 8, 1)
    rbox(bm, (0, 0, 0.2), (w, d, 0.12), 0.015, 0, 0)
    for sx in (-1, 1): rbox(bm, (sx*(w/2-0.1), 0, 0.42), (0.2, d, 0.5), 0.05, 0, 0)               # arms
    for sx in (-0.5, 0.5): rbox(bm, (sx*(w-0.4)/1.0*0.5, 0.06, sh-0.02), ((w-0.4)/2-0.01, d-0.18, 0.2), 0.05, 0, 0)  # seat cushions
    rbox(bm, (0, -d/2+0.1, h*0.62), (w-0.4, 0.2, 0.6), 0.06, 0, 0)                                                   # back
    for sx in (-0.5, 0.5): rbox(bm, (sx*(w-0.4)*0.5, -d/2+0.22, h*0.66), ((w-0.4)/2-0.02, 0.14, 0.44), 0.06, 0, 0)  # back cushions
    return bm
def armchair(w=0.82, d=0.84, h=0.85):    # mats: 0 fabric, 1 timber legs
    bm = bmesh.new()
    for sx in (-1, 1):
        for sy in (-1, 1): cyl(bm, (sx*(w/2-0.1), sy*(d/2-0.1), 0), (sx*(w/2-0.1), sy*(d/2-0.1), 0.15), 0.022, 0.018, 8, 1)
    rbox(bm, (0, 0, 0.21), (w, d, 0.12), 0.015, 0, 0); rbox(bm, (0, 0.04, 0.4), (w-0.34, d-0.2, 0.2), 0.05, 0, 0)
    for sx in (-1, 1): rbox(bm, (sx*(w/2-0.09), 0, 0.42), (0.18, d, 0.46), 0.05, 0, 0)
    rbox(bm, (0, -d/2+0.1, h*0.6), (w-0.3, 0.2, 0.62), 0.07, 0, 0); return bm
def rug_round(d=2.0):    # mats: 0 field, 1 border
    bm = bmesh.new(); r = d / 2
    lathe(bm, [(0.0, 0.012), (r*0.86, 0.012), (r*0.86, 0.014), (r*0.97, 0.014), (r, 0.01), (r, 0.0), (0.0, 0.0)], 56, 0, cap_bottom=False)
    for f in bm.faces:
        c = f.calc_center_median()
        if math.hypot(c.x, c.y) > r * 0.86: f.material_index = 1
    return bm
def book_stack(n=5, seed=6):    # mats: 0,1,2 cover colours, 3 page edge
    r = random.Random(seed); bm = bmesh.new(); z = 0.0
    for i in range(n):
        L = r.uniform(0.2, 0.3); W = L * r.uniform(0.7, 0.78); T = r.uniform(0.022, 0.05); a = r.uniform(-0.25, 0.25); mi = r.randint(0, 2)
        rbox(bm, (r.uniform(-0.01, 0.01), r.uniform(-0.01, 0.01), z + T / 2), (L, W, T), 0.003, a, mi, 2)
        box(bm, (0, 0, z + T / 2), (L * 0.98 * 0.0 + L - 0.004, W - 0.01, T * 0.6), a, 3) if False else None
        z += T
    return bm
def picture_frame(w=0.5, h=0.4, t=0.025):   # mats: 0 frame wood, 1 canvas
    bm = bmesh.new(); f = 0.035
    box(bm, (0, 0, h/2-f/2), (w, t, f), 0, 0); box(bm, (0, 0, -h/2+f/2), (w, t, f), 0, 0); box(bm, (w/2-f/2, 0, 0), (f, t, h-2*f), 0, 0); box(bm, (-w/2+f/2, 0, 0), (f, t, h-2*f), 0, 0)
    box(bm, (0, t*0.1, 0), (w-2*f, 0.006, h-2*f), 0, 1); return bm
def monstera_potted(h=1.0, seed=5):   # mats: 0 pot, 1 stem, 2 leaf
    r = random.Random(seed); bm = bmesh.new()
    lathe(bm, [(0.14, 0), (0.17, 0.02), (0.2, 0.3), (0.205, 0.32), (0.19, 0.32), (0.0, 0.3)], 24, 0)
    for i in range(14):
        a = i * 2.4 + r.uniform(-0.3, 0.3); lean = r.uniform(0.15, 0.55); L = r.uniform(0.45, h * 0.9)
        base = Vector((math.cos(a) * 0.04, math.sin(a) * 0.04, 0.3)); mid = base + Vector((math.cos(a) * lean * L * 0.4, math.sin(a) * lean * L * 0.4, L * 0.7)); tip = base + Vector((math.cos(a) * lean * L, math.sin(a) * lean * L, L * 0.85))
        cyl(bm, base, mid, 0.008, 0.006, 5, 1); cyl(bm, mid, tip, 0.006, 0.005, 5, 1)
        d = (tip - mid).normalized(); side = d.cross(Vector((0, 0, 1))).normalized(); sz = r.uniform(0.16, 0.26)
        ctr = tip + d * sz * 0.2; pts = [tip, ctr + side * sz * 0.55 - d * sz * 0.1, ctr + side * sz * 0.6 + d * sz * 0.5, ctr + d * sz * 1.0, ctr - side * sz * 0.6 + d * sz * 0.5, ctr - side * sz * 0.55 - d * sz * 0.1]
        pts = [p + Vector((0, 0, -0.05 * sz)) if k in (2, 4) else p for k, p in enumerate(pts)]
        vs = [bm.verts.new(p) for p in pts]; f = bm.faces.new(vs); f.material_index = 2
        f2 = bm.faces.new(vs[::-1]) if False else None
    return bm
def flower_bucket(h=0.28, d=0.24, stems=22, seed=8):   # mats: 0 zinc, 1 stem, 2 petal, 3 centre
    r = random.Random(seed); bm = bmesh.new()
    lathe(bm, [(d/2*0.85, 0), (d/2, h*0.98), (d/2*1.04, h), (d/2*1.0, h), (d/2*0.96, h*0.9), (0.0, 0.01)], 28, 0)
    for s in range(stems):
        a = s * 2.4; rr = r.uniform(0.0, d * 0.3); L = r.uniform(0.35, 0.55); lean = r.uniform(0.05, 0.4)
        base = Vector((math.cos(a) * rr, math.sin(a) * rr, h * 0.7)); tip = base + Vector((math.cos(a) * lean * L, math.sin(a) * lean * L, L)); cyl(bm, base, tip, 0.004, 0.003, 5, 1)
        for p in range(9):
            pa = p * 6.283 / 9; d1 = Vector((math.cos(pa), math.sin(pa), 0.12)).normalized(); side = d1.cross(Vector((0, 0, 1))).normalized() * 0.018
            v = [bm.verts.new(x) for x in (tip, tip + d1 * 0.035 + side, tip + d1 * 0.07, tip + d1 * 0.035 - side)]; f = bm.faces.new(v); f.material_index = 2
        cyl(bm, tip, tip + Vector((0, 0, 0.007)), 0.012, 0.011, 8, 3)
    return bm
def dumbbell_pair(L=0.2, head=0.075):   # mats: 0 rubber, 1 steel
    bm = bmesh.new()
    for y in (-0.12, 0.12):
        cyl(bm, (-L/2, y, head/2+0.0), (L/2, y, head/2+0.0), 0.016, 0.016, 12, 1)
        for sx in (-1, 1): cyl(bm, (sx*(L/2-0.025), y, head/2), (sx*(L/2+0.025), y, head/2), head/2, head/2, 6, 0)
    return bm
def kettlebell(h=0.25, d=0.2):   # mat 0 iron
    bm = bmesh.new(); lathe(bm, [(0.0, 0.0), (d*0.35, 0.0), (d*0.5, d*0.25), (d*0.5, d*0.5), (d*0.34, d*0.72), (d*0.2, d*0.78), (0.0, d*0.78)], 24, 0)
    arc_tube(bm, (0, 0, d*0.74), d*0.3, -0.2, math.pi + 0.2, 0.017, 14, 'XZ'); return bm
def yoga_mat_rolled(L=0.62, d=0.18):   # mat 0 rubber
    bm = bmesh.new(); cyl(bm, (-L/2, 0, d/2), (L/2, 0, d/2), d/2, d/2, 32, 0); cyl(bm, (-L/2-0.001, 0, d/2), (-L/2+0.004, 0, d/2), d/2*1.0, d/2*0.3, 32, 0, caps=False); return bm
def plinth_display(w=0.5, d=0.5, h=1.05):   # mats: 0 body, 1 top slab
    bm = bmesh.new(); box(bm, (0, 0, h/2-0.03), (w, d, h-0.06), 0, 0); rbox(bm, (0, 0, h-0.015), (w+0.06, d+0.06, 0.03), 0.004, 0, 1); box(bm, (0, 0, 0.02), (w+0.04, d+0.04, 0.04), 0, 1); return bm
def display_case_glass(w=0.6, d=0.6, h=1.45):   # mats: 0 base, 1 frame, 2 glass
    bm = bmesh.new(); bh = 0.8; box(bm, (0, 0, bh/2), (w, d, bh), 0, 0)
    for sx in (-1, 1):
        for sy in (-1, 1): box(bm, (sx*(w/2-0.012), sy*(d/2-0.012), (bh+h)/2), (0.024, 0.024, h-bh), 0, 1)
    for z in (bh+0.012, h-0.012): box(bm, (0, 0, z), (w, d, 0.024), 0, 1)
    for sx in (-1, 1): box(bm, (sx*(w/2-0.003), 0, (bh+h)/2), (0.004, d-0.04, h-bh-0.05), 0, 2); box(bm, (0, sx*(d/2-0.003), (bh+h)/2), (w-0.04, 0.004, h-bh-0.05), 0, 2)
    return bm
