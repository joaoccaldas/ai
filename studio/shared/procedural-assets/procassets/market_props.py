"""Market-stall detail props (price boards, scales, preserves, cheese, bunting). Each returns a bmesh; material_index indexes the registry material list."""
import math
import bmesh
from .geom import box, cyl, lathe, arc_tube, rbox

def chalkboard_easel(h=1.1, w=0.5):   # mats: 0 timber frame, 1 chalkboard, 2 chalk text strip
    bm = bmesh.new(); bh = 0.7
    for s in (-1, 1):
        cyl(bm, (s * w * 0.46, 0.0, bh + 0.12), (s * w * 0.5, 0.0, 0.0), 0.016, 0.016, 8, 0)
    cyl(bm, (0, -0.02, bh + 0.12), (0, -0.4, 0.0), 0.014, 0.014, 8, 0)
    rbox(bm, (0, 0.0, 0.3 + bh / 2 + 0.05), (w, 0.03, bh), 0.006, 0, 0); box(bm, (0, 0.018, 0.3 + bh / 2 + 0.05), (w - 0.05, 0.004, bh - 0.05), 0, 1)
    for k in range(4):
        box(bm, (-0.03 * (k % 2), 0.021, 0.3 + bh - 0.1 - k * 0.1), (w * (0.5 - 0.06 * k), 0.002, 0.03), 0, 2)
    return bm

def hanging_scale(drop=0.9):   # origin at hook; mats: 0 brass, 1 steel chain, 2 enamel pan
    bm = bmesh.new(); cyl(bm, (0, 0, -0.35), (0, 0, 0), 0.004, 0.004, 6, 1)
    lathe(bm, [(0.0, -0.45), (0.03, -0.44), (0.05, -0.39), (0.05, -0.36), (0.0, -0.35)], 20, 0, cap_bottom=False)
    for k in range(3):
        a = k * 2 * math.pi / 3; cyl(bm, (math.cos(a) * 0.04, math.sin(a) * 0.04, -0.44), (math.cos(a) * 0.15, math.sin(a) * 0.15, -drop + 0.1), 0.002, 0.002, 4, 1)
    lathe(bm, [(0.0, -drop), (0.12, -drop), (0.17, -drop + 0.03), (0.18, -drop + 0.05), (0.17, -drop + 0.05), (0.0, -drop + 0.012)], 28, 2); return bm

def preserve_jar(h=0.11, r=0.04):   # mats: 0 glass, 1 jam, 2 lid metal, 3 label
    bm = bmesh.new()
    lathe(bm, [(0.0, 0.0), (r * 0.95, 0.0), (r, 0.005), (r, h * 0.82), (r * 0.8, h * 0.9), (r * 0.8, h), (r * 0.75, h), (r * 0.75, h * 0.9), (0.0, h * 0.9)], 28, 0)
    lathe(bm, [(0.0, 0.004), (r * 0.9, 0.004), (r * 0.92, h * 0.78), (r * 0.7, h * 0.86), (0.0, h * 0.86)], 24, 1)
    cyl(bm, (0, 0, h * 0.9), (0, 0, h * 1.04), r * 0.84, r * 0.84, 24, 2); cyl(bm, (0, 0, h * 0.25), (0, 0, h * 0.65), r * 1.006, r * 1.006, 28, 3, caps=False); return bm

def cheese_wheel(d=0.32, h=0.1):   # mats: 0 rind, 1 cut face
    bm = bmesh.new(); r = d / 2
    lathe(bm, [(0.0, 0.0), (r * 0.94, 0.0), (r, h * 0.12), (r * 1.01, h * 0.5), (r, h * 0.88), (r * 0.94, h), (0.0, h)], 36, 0)
    wedge = bmesh.ops.create_cube(bm, size=1.0)   # thin slab on the wheel top reads as a cut face
    bmesh.ops.scale(bm, vec=(r * 0.5, 0.004, h * 0.9), verts=wedge['verts']); bmesh.ops.translate(bm, vec=(r * 0.5, 0.0, h * 0.5), verts=wedge['verts'])
    for f in {f for v in wedge['verts'] for f in v.link_faces}: f.material_index = 1
    return bm

def bunting_string(length=4.0, flags=14, sag=0.35):   # origin at left anchor; catenary-ish parabola; mats: 0 string, 1/2/3 flag colours
    bm = bmesh.new(); n = 40; pts = []
    for i in range(n + 1):
        t = i / n; pts.append((t * length, 0.0, -4 * sag * t * (1 - t)))
    for a, b in zip(pts, pts[1:]): cyl(bm, a, b, 0.0025, 0.0025, 4, 0, caps=False)
    for k in range(flags):
        t = (k + 0.5) / flags; x = t * length; z = -4 * sag * t * (1 - t); w = length / flags * 0.7; hgt = w * 1.15; mi = 1 + k % 3
        v = [bm.verts.new((x - w / 2, 0.0, z)), bm.verts.new((x + w / 2, 0.0, z)), bm.verts.new((x, 0.004, z - hgt))]
        f = bm.faces.new(v); f.material_index = mi
        v2 = [bm.verts.new(tuple(u.co)) for u in v[::-1]]; g = bm.faces.new(v2); g.material_index = mi   # back face on its own verts
    return bm

def olive_tin(w=0.12, h=0.06):   # mats: 0 tin steel, 1 label
    bm = bmesh.new(); r = w / 2
    cyl(bm, (0, 0, 0), (0, 0, h), r, r, 28, 0); cyl(bm, (0, 0, h * 0.2), (0, 0, h * 0.8), r * 1.004, r * 1.004, 28, 1, caps=False)
    arc_tube(bm, (0, 0, h), r * 0.55, 0, 2 * math.pi, 0.002, 20, 'XY', 0); return bm
