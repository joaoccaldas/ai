"""Lifestyle props for cafe/florist/hotel/hall rooms. Each returns a bmesh; face.material_index indexes the registry material list."""
import math, random
import bmesh
from mathutils import Vector, Matrix
from .geom import box, cyl, lathe, arc_tube

def planter_ribbed(h=.48, r=.26, ribs=48, segments=192):
    """Hollow terracotta planter with a rolled rim; no plant or drainage claim."""
    if not all(math.isfinite(v) for v in (h, r)) or not .2 <= h <= .9 or not .12 <= r <= .45 or not isinstance(ribs, int) or not 0 <= ribs <= 64 or not isinstance(segments, int) or not 48 <= segments <= 384 or (ribs and segments < ribs * 4):
        raise ValueError('Planter dimensions/detail outside bounded brief')
    from .geom import smooth_profile
    bm = bmesh.new()
    # Separate outer/inner profiles retain a visible wall and closed base.
    profile = [(0,0),(.64,0),(.68,.025),(.68,.07),(.70,.11),
               (.84,.46),(.97,.86),(1,.92),(1,.98),(.97,1),
               (.90,1),(.88,.96),(.90,.90),(.78,.47),(.64,.16),(0,.16)]
    curve = smooth_profile(profile, per=3)
    lathe(bm, [(max(0., a)*r, max(0., min(1., z))*h) for a,z in curve], segments, 0)
    for v in bm.verts:
        radius = math.hypot(v.co.x, v.co.y)
        # Exterior-only ribbing: the interior remains smooth and usable.
        outer = (.70 + .28 * min(1., max(0., (v.co.z/h-.11)/.75))) * r
        if ribs and .11*h < v.co.z < .86*h and radius > outer - .012*r:
            fade = min(1., (v.co.z/h-.11)/.08, (.86-v.co.z/h)/.08)
            scale = 1 + .022 * max(0.,fade) * math.cos(ribs*math.atan2(v.co.y,v.co.x))
            v.co.x *= scale; v.co.y *= scale
    return bm


def lantern_louvred(h=.54, d=.30, slats=32):
    """Oak slats, brass rings/handle, opaque porcelain diffuser; no live light."""
    if not all(math.isfinite(v) for v in (h,d)) or not .25 <= h <= .9 or not .18 <= d <= .5 or not isinstance(slats,int) or not 16 <= slats <= 48:
        raise ValueError('Lantern dimensions/detail outside bounded brief')
    from .geom import rbox
    bm = bmesh.new(); r = d/2
    # Raised foot and canopy; all rendering comes from existing materials.
    lathe(bm, [(0,0),(.82*r,0),(.88*r,.018),(.88*r,.04),(0,.04)], 96, 1)
    lathe(bm, [(0,h-.08),(.93*r,h-.08),(r,h-.065),(r,h-.04),(.93*r,h-.025),(0,h-.025)], 96, 1)
    lathe(bm, [(0,.055),(.64*r,.055),(.68*r,.075),(.68*r,h-.10),(.60*r,h-.09),(0,h-.09)], 96, 2)
    for i in range(slats):
        a = 2*math.pi*i/slats
        # Bevel in the local frame before placement. Beveling a long thin box
        # after rotation produced collapsed corner faces at some angles.
        before = set(bm.verts)
        rbox(bm, (0,0,0),(.025,.009,h-.12),r=.002,mi=0,seg=2)
        transform = Matrix.Translation(Vector((math.cos(a)*.84*r,math.sin(a)*.84*r,(h-.04)/2))) @ Matrix.Rotation(a,4,'Z')
        for v in set(bm.verts)-before: v.co = transform @ v.co
    arc_tube(bm,(0,0,h-.045),r*.75,0,math.pi,.006,32,'XZ',1)
    return bm

def vase_fluted(h=.52, r=.17, flutes=48, segments=288, profile_steps=4):
    """Hollow porcelain vessel, radial fluting and a separate brass lip slot.

    Source units metres, base-centred; flutes=0 is the plain comparison.
    """
    if not .15 <= h <= 1.5 or not .05 <= r <= .4 or not 0 <= flutes <= 64 or not 48 <= segments <= 512 or not 1 <= profile_steps <= 6 or (flutes and segments < flutes * 6):
        raise ValueError('Vessel dimensions/detail outside reviewed bounds')
    bm = bmesh.new()
    profile = [(0, 0), (.62, 0), (.68, .025), (.68, .06), (.49, .10),
               (.58, .20), (.94, .45), (1, .62), (.86, .80), (.65, .90),
               (.68, .98), (.70, 1), (.64, 1), (.62, .98), (.59, .90),
               (.79, .80), (.93, .62), (.87, .45), (.5, .22), (0, .16)]
    from .geom import smooth_profile
    curved = smooth_profile(profile, per=profile_steps)
    # Preserve the actual base and rim planes when the spline overshoots.
    lathe(bm, [(max(0., radius) * r, min(1., max(0., z)) * h) for radius, z in curved], segments, 0)
    for v in bm.verts:
        if flutes and .10 * h < v.co.z < .91 * h:
            theta = math.atan2(v.co.y, v.co.x)
            fade = min(1., (v.co.z / h - .10) / .12, (.91 - v.co.z / h) / .10)
            scale = 1 + .035 * max(0., fade) * math.cos(flutes * theta)
            v.co.x *= scale; v.co.y *= scale
    # A narrow rolled lip sits above the porcelain, with no coplanar overlay.
    lathe(bm, [(.70*r, h), (.705*r, h+.0015), (.695*r, h+.003),
               (.645*r, h+.003), (.635*r, h+.0015), (.64*r, h)], segments, 1, cap_bottom=False)
    return bm


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
def pendant_lamp(drop=1.0, d=0.38):   # origin at the ceiling attachment; mats: 0 shade metal, 1 cord, 2 bulb emissive
    bm = bmesh.new(); cyl(bm, (0, 0, -drop + 0.12), (0, 0, 0), 0.004, 0.004, 6, 1); cyl(bm, (0, 0, -0.03), (0, 0, 0.0), 0.04, 0.04, 14, 1)
    lathe(bm, [(0.025, 0.16), (d*0.2, 0.12), (d*0.42, 0.04), (d*0.5, 0.0), (d*0.48, -0.002), (d*0.4, 0.015), (d*0.18, 0.115), (0.02, 0.15)], 28, 0, cap_bottom=False, center=(0, 0, -drop))
    lathe(bm, [(0.0, -0.08), (0.04, -0.07), (0.05, -0.04), (0.035, 0.0), (0.0, 0.03)], 14, 2, cap_bottom=False, center=(0, 0, -drop)); return bm
def bar_stool(h=0.75, d=0.36):    # mats: 0 timber seat, 1 steel frame
    bm = bmesh.new(); lathe(bm, [(0.0, h), (d/2, h), (d/2*1.02, h-0.015), (d/2*0.95, h-0.045), (0.0, h-0.045)], 28, 0)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4; cyl(bm, (math.cos(a)*d*0.3, math.sin(a)*d*0.3, h-0.045), (math.cos(a)*d*0.5, math.sin(a)*d*0.5, 0.0), 0.012, 0.011, 8, 1)
    arc_tube(bm, (0, 0, 0.26), d * 0.43, 0, 2 * math.pi, 0.01, 28, 'XY'); return bm


def _mark(bm):
    """Remember how many verts exist; new geometry is appended after them."""
    return len(bm.verts)


def _transform_new(bm, start, matrix):
    """Transform only the geometry created since `_mark` returned `start`.
    (Python BMVert wrappers are not stable identities, so a set of them cannot
    be used to tell old from new; vertex order can.)"""
    bm.verts.ensure_lookup_table()
    bmesh.ops.transform(bm, matrix=matrix, verts=[bm.verts[i] for i in range(start, len(bm.verts))])


def telescope_refractor(L=1.45, ap=0.11, H=1.12):   # mats: 0 enamel tube, 1 steel, 2 brass, 3 objective glass, 4 rubber feet
    """Refracting telescope on an equatorial mount and wooden-free steel tripod:
    tapered legs with a spreader tray, mount head, counterweight bar, tube with
    dew shield, objective cell and lens, focuser and finder scope."""
    bm = bmesh.new(); head = Vector((0, 0, H))
    feet = [Vector((math.cos(a) * 0.55, math.sin(a) * 0.55, 0.0)) for a in (math.pi / 2, math.pi / 2 + 2.094, math.pi / 2 + 4.189)]
    for f in feet:
        cyl(bm, head + (f - head) * 0.06, f + Vector((0, 0, 0.04)), 0.024, 0.017, 10, 1)
        cyl(bm, f + Vector((0, 0, 0.04)), f, 0.02, 0.02, 10, 4)                      # rubber foot
    mids = [head + (f - head) * 0.55 for f in feet]
    for i in range(3): cyl(bm, mids[i], mids[(i + 1) % 3], 0.008, 0.008, 6, 1)        # spreader
    lathe(bm, [(0.0, 0.0), (0.09, 0.0), (0.09, 0.03), (0.0, 0.03)], 24, 1, center=tuple(head))   # tripod head
    before = _mark(bm)                                                              # mount head (polar axis tilted)
    lathe(bm, [(0.0, 0.0), (0.055, 0.0), (0.055, 0.16), (0.045, 0.18), (0.0, 0.18)], 20, 1)
    _transform_new(bm, before, Matrix.Translation(head + Vector((0, 0, 0.03))) @ Matrix.Rotation(math.radians(-30), 4, 'X'))
    pivot = head + Vector((0, -0.08, 0.19))
    cyl(bm, pivot + Vector((0, 0.0, 0)), pivot + Vector((0, 0.42, -0.18)), 0.012, 0.012, 10, 1)   # counterweight bar
    before = _mark(bm)
    lathe(bm, [(0.0, 0.0), (0.055, 0.0), (0.06, 0.012), (0.06, 0.05), (0.055, 0.062), (0.0, 0.062)], 24, 1)
    _transform_new(bm, before, Matrix.Translation(pivot + Vector((0, 0.34, -0.15))) @ Matrix.Rotation(math.radians(-67), 4, 'X'))
    r = ap * 0.58; dew = ap * 0.72                                                     # the tube, along +Z then aimed
    before = _mark(bm)
    lathe(bm, [(0.0, -0.06), (0.022, -0.06), (0.022, 0.0), (r * 0.9, 0.0), (r, 0.02), (r, L * 0.78), (r * 1.06, L * 0.8),
               (r * 1.06, L * 0.83), (dew, L * 0.84), (dew, L), (dew - 0.004, L), (dew - 0.004, L * 0.86), (0.0, L * 0.86)], 32, 0)
    lathe(bm, [(r * 1.08, L * 0.42), (r * 1.08, L * 0.46), (0.0, L * 0.46)], 24, 2)    # tube ring (brass)
    lathe(bm, [(r * 0.98, L * 0.858), (0.0, L * 0.862)], 32, 3, cap_bottom=False)      # objective lens
    cyl(bm, Vector((0, r, L * 0.62)), Vector((0, r + 0.05, L * 0.62)), 0.008, 0.008, 8, 2)   # finder bracket
    cyl(bm, Vector((0, r + 0.06, L * 0.52)), Vector((0, r + 0.06, L * 0.78)), 0.016, 0.02, 12, 0)   # finder scope
    cyl(bm, Vector((0, 0, -0.06)), Vector((0, 0, -0.14)), 0.016, 0.016, 12, 1)         # eyepiece holder
    cyl(bm, Vector((0, 0, -0.14)), Vector((0, 0, -0.2)), 0.019, 0.019, 14, 4)          # eyepiece
    aim = Matrix.Translation(pivot + Vector((0, -0.06, 0.02))) @ Matrix.Rotation(math.radians(-55), 4, 'X') @ Matrix.Translation(Vector((0, 0, -L * 0.42)))
    _transform_new(bm, before, aim)
    return bm


def globe_on_stand(d=0.5, tilt=23.4):   # mats: 0 sea, 1 graticule, 2 brass meridian, 3 stand
    """A blank graticule globe: sea-coloured sphere with latitude and longitude
    rings every 30°, a brass meridian and axis, on a turned stand. Deliberately
    blank: a room paints its own data on it."""
    bm = bmesh.new(); R = d / 2; zc = 0.34 + R + 0.03
    lathe(bm, [(0.17, 0.0), (0.17, 0.025), (0.15, 0.04), (0.07, 0.07), (0.045, 0.12), (0.06, 0.2), (0.04, 0.27),
               (0.03, 0.34), (0.0, 0.34)], 40, 3)
    before = _mark(bm)
    g = bmesh.ops.create_icosphere(bm, subdivisions=4, radius=R)
    for f in {f for v in g['verts'] for f in v.link_faces}: f.material_index = 0; f.smooth = True
    for lat in (-60, -30, 0, 30, 60):                                                  # latitude rings
        a = math.radians(lat); rr = (R + 0.002) * math.cos(a)
        arc_tube(bm, (0, 0, (R + 0.002) * math.sin(a)), rr, 0, 2 * math.pi, 0.0018, 48, 'XY', 1)
    for lon in range(0, 180, 30):                                                      # meridians
        before_m = _mark(bm)
        arc_tube(bm, (0, 0, 0), R + 0.002, 0, 2 * math.pi, 0.0018, 48, 'XZ', 1)
        _transform_new(bm, before_m, Matrix.Rotation(math.radians(lon), 4, 'Z'))
    arc_tube(bm, (0, 0, 0), R + 0.03, -math.pi / 2, math.pi / 2 + 0.0, 0.007, 36, 'XZ', 2)   # brass meridian (half ring)
    cyl(bm, Vector((0, 0, -R - 0.04)), Vector((0, 0, R + 0.04)), 0.004, 0.004, 8, 2)        # axis
    _transform_new(bm, before, Matrix.Translation(Vector((0, 0, zc))) @ Matrix.Rotation(math.radians(tilt), 4, 'Y'))
    cyl(bm, Vector((0, 0, 0.34)), Vector((0, 0, zc - R * 0.98)), 0.012, 0.01, 12, 2)         # stand neck to meridian
    return bm
