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
    if caps: fs += [bm.faces.new(A[::-1]), bm.faces.new(B)]
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

def rbox(bm, c, s, r=0.02, rotz=0.0, mi=0, seg=3):
    """Rounded box: like box() but with bevelled edges."""
    before = set(bm.faces); g = bmesh.ops.create_cube(bm, size=1.0)
    for v in g['verts']:
        q = Matrix.Rotation(rotz, 3, 'Z') @ Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2])); v.co = q + Vector(c)
    edges = list({e for v in g['verts'] for e in v.link_edges})
    if r > 0: bmesh.ops.bevel(bm, geom=edges, offset=r, segments=seg, affect='EDGES')
    for f in set(bm.faces) - before: f.material_index = mi; f.smooth = True

def smooth_profile(profile, per=4):
    """Resample a coarse moulding profile with Catmull-Rom so curves read as curves."""
    pts = [Vector((d, y, 0)) for d, y in profile]; out = []
    for k in range(len(pts) - 1):
        p0 = pts[max(k - 1, 0)]; p1, p2 = pts[k], pts[k + 1]; p3 = pts[min(k + 2, len(pts) - 1)]
        for s_ in range(per):
            t = s_ / per; t2, t3 = t * t, t * t * t
            q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            out.append((q.x, q.y))
    out.append(profile[-1]); return out

def frame_sweep(bm, outline, profile, mi=0, per=4):
    """Sweep a moulding profile around a closed outline with true mitres.

    outline(d) returns the closed loop [(x, z), ...] inset by d metres (same
    point count for every d). profile is [(inset, depth), ...] from the outer
    back edge, round the face, to the inner back edge; depth runs along +Y.
    Each side owns its vertices: shading stays smooth along the profile and
    crisp at every mitre (shared corner normals would blur them).
    """
    prof = smooth_profile(profile, per) if per > 1 else profile
    loops = [outline(d) for d, _ in prof]; n = len(loops[0]); fs = []
    for i in range(n):
        j = (i + 1) % n
        a = [bm.verts.new((L[i][0], y, L[i][1])) for L, (_, y) in zip(loops, prof)]
        b = [bm.verts.new((L[j][0], y, L[j][1])) for L, (_, y) in zip(loops, prof)]
        for k in range(len(prof) - 1): fs.append(bm.faces.new((a[k], b[k], b[k + 1], a[k + 1])))
        fs.append(bm.faces.new((a[-1], b[-1], b[0], a[0])))   # back face closes the solid
    for f in fs: f.material_index = mi; f.smooth = True

def rect_outline(w, h, zc=0.0):
    return lambda d: [(-w/2 + d, zc - h/2 + d), (w/2 - d, zc - h/2 + d), (w/2 - d, zc + h/2 - d), (-w/2 + d, zc + h/2 - d)]

def arch_outline(w, h, steps=24):
    """Rectangle with a semicircular head; base at z=0, crown at z=h."""
    def loop(d):
        r = w/2 - d; zc = h - w/2
        pts = [(-r, d), (r, d)]
        pts += [(math.cos(math.pi * k / steps) * r, zc + math.sin(math.pi * k / steps) * r) for k in range(steps + 1)]
        return pts
    return loop

def panel(bm, outline, inset, bevel, y0, y1, mi=0):
    """A slab inside an outline with a bevelled front edge (glass, boards)."""
    back = [bm.verts.new((x, y0, z)) for x, z in outline(inset)]
    front = [bm.verts.new((x, y1, z)) for x, z in outline(inset + bevel)]
    # Zero bevel is a plain slab: a duplicate front/edge ring creates four
    # zero-area faces on every rectangular mirror backing board.
    edge = [bm.verts.new((x, y1 - bevel * 0.35, z)) for x, z in outline(inset)] if bevel > 0 else front
    n = len(back); fs = [bm.faces.new(front), bm.faces.new(back[::-1])]
    for a, b in ((back, edge), (edge, front)):
        if a is b:
            continue
        for i in range(n): fs.append(bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i])))
    for f in fs: f.material_index = mi
