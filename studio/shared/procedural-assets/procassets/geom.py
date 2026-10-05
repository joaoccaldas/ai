"""Shared geometry helpers: boxes, frusta, lathe (revolve), arcs. Z up, metres."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix

def box(bm, c, s, rotz=0.0, mi=0):
    g = bmesh.ops.create_cube(bm, size=1.0)
    for v in g['verts']:
        q = Matrix.Rotation(rotz, 3, 'Z') @ Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2])); v.co = q + Vector(c)
    for f in {f for v in g['verts'] for f in v.link_faces}: f.material_index = mi

def cyl(bm, p0, p1, r0, r1, n=12, mi=0, caps=True):
    p0 = Vector(p0); p1 = Vector(p1); t = p1 - p0
    a = Vector((0, 0, 1)) if abs(t.normalized().z) < 0.9 else Vector((1, 0, 0)); u = t.cross(a).normalized(); v = t.cross(u).normalized()
    ring = lambda c, r: [bm.verts.new(c + (u * math.cos(2 * math.pi * i / n) + v * math.sin(2 * math.pi * i / n)) * r) for i in range(n)]
    A = ring(p0, r0); B = ring(p1, r1); fs = []
    for i in range(n): fs.append(bm.faces.new((A[i], A[(i + 1) % n], B[(i + 1) % n], B[i])))
    if caps: fs += [bm.faces.new(A), bm.faces.new(B[::-1])]
    for f in fs: f.material_index = mi; f.smooth = True

def lathe(bm, profile, seg=28, mi=0, cap_bottom=True, center=(0, 0, 0)):
    """Revolve [(radius, z), ...] around Z. Radius 0 allowed at the ends."""
    cx, cy, cz = center; rings = []
    for r, z in profile:
        if r <= 1e-6: rings.append(None); continue
        rings.append([bm.verts.new((cx + math.cos(2 * math.pi * i / seg) * r, cy + math.sin(2 * math.pi * i / seg) * r, cz + z)) for i in range(seg)])
    fs = []
    for k in range(len(profile) - 1):
        a, b = rings[k], rings[k + 1]
        if a is None and b is None: continue
        if a is None:
            apex = bm.verts.new((cx, cy, cz + profile[k][1]))
            for i in range(seg): fs.append(bm.faces.new((apex, b[(i + 1) % seg], b[i])))
        elif b is None:
            apex = bm.verts.new((cx, cy, cz + profile[k + 1][1]))
            for i in range(seg): fs.append(bm.faces.new((a[i], a[(i + 1) % seg], apex)))
        else:
            for i in range(seg): fs.append(bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i])))
    if cap_bottom and rings[0] is not None: fs.append(bm.faces.new(rings[0][::-1]))
    for f in fs: f.material_index = mi; f.smooth = True

def arc_tube(bm, center, radius, a0, a1, r_tube, steps=12, plane='XZ', mi=0):
    pts = []
    for k in range(steps + 1):
        a = a0 + (a1 - a0) * k / steps
        pts.append(Vector(center) + (Vector((math.cos(a) * radius, 0, math.sin(a) * radius)) if plane == 'XZ' else Vector((math.cos(a) * radius, math.sin(a) * radius, 0)) if plane == 'XY' else Vector((0, math.cos(a) * radius, math.sin(a) * radius))))
    for k in range(steps): cyl(bm, pts[k], pts[k + 1], r_tube, r_tube, 8, mi, caps=False)
