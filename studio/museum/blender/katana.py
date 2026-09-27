# SŌKAI katana: modeled in Blender from real cross-sections (meters, Z up, blade toward -X).
import bpy, bmesh, math
from mathutils import Vector
from common import mat, obj_from, loft, prism, sweep, superellipse, set_parent, empty, lemniscate_lobe, offset_poly

L = 0.71          # nagasa
R = 3.5           # sori radius (≈18 mm sori)
W0, WY = 0.0315, 0.0218   # blade width at machi / at yokote
T0, TY = 0.0036, 0.0025   # half kasane at machi / at yokote
KL = 0.034        # kissaki length

# half-profile (fraction of height from edge, fraction of max half-thickness)
PROF = [(0, .07), (.05, .28), (.13, .48), (.25, .68), (.38, .83), (.52, .94), (.62, .985), (.70, 1.0),
        (.78, .93), (.86, .845), (.905, .80), (1.0, 0.0)]
SH = .70


def cl(s):
    a = s / R
    return Vector((-R * math.sin(a), 0, R * (1 - math.cos(a)))), Vector((math.sin(a), 0, math.cos(a)))


def width(s):
    t = min(1, s / (L - KL))
    return W0 + (WY - W0) * t ** .92


def thick(s):
    t = min(1, s / (L - KL))
    return T0 + (TY - T0) * t


def blade_ring(s):
    p, up = cl(s)
    W, tm = width(s), thick(s)
    kz = L - KL
    edge, top, fs = 0.0, W, SH
    if s > kz:
        q = min(.9995, (s - kz) / KL)
        htip = .9 * WY
        top = WY * (1 - .10 * q * q)
        edge = htip * (1 - math.sqrt(max(0, 1 - q * q)))
        shin = SH * WY + (htip - SH * WY) * q
        fs = (shin - edge) / max(1e-6, top - edge)
        tm = TY * .9 * (1 - q) ** .55
    ring, vs = [], []
    side = [(hf, tf) for hf, tf in PROF]
    full = side + [(hf, -tf) for hf, tf in reversed(side[:-1])]
    for hf, tf in full:
        # remap so the shinogi ridge moves to the ko-shinogi inside the kissaki
        h = hf / SH * fs if hf <= SH else fs + (hf - SH) / (1 - SH) * (1 - fs)
        habs = edge + h * (top - edge)
        pos = p + up * (habs - W0 / 2) + Vector((0, tf * tm, 0))
        ring.append(pos)
        vs.append(hf)
    return ring, vs


def build_blade(parent):
    steel = mat('steel', (.62, .66, .70), metal=1, rough=.14)
    tang = mat('tang', (.09, .075, .06), metal=.7, rough=.72)
    # dense stations near machi, yokote and tip
    ss = []
    n = 420
    for i in range(n + 1):
        t = i / n
        ss.append((L - KL) * t)
    for i in range(1, 121):
        t = i / 120
        ss.append(L - KL + KL * (1 - (1 - t) ** 1.6) * .9995)
    ss.insert(1, 0.0004)
    ss = sorted(set(round(s, 7) for s in ss))
    rings, uvs = [], []
    for s in ss:
        r, vs = blade_ring(s)
        rings.append(r)
    u_vals = [s / L for s in ss]
    m = len(rings[0])
    v_vals = [PROF[i][0] for i in range(len(PROF))] + [PROF[i][0] for i in reversed(range(len(PROF) - 1))]
    verts, faces, fuv = loft(rings, closed=True, u_vals=u_vals, v_vals=v_vals + [v_vals[0]], cap0=True)
    tip = rings[-1][0].lerp(rings[-1][len(PROF) - 1], .5)
    # collapse the last ring into the point
    base = len(verts) - m
    for j in range(m):
        verts[base + j] = tip
    blade = obj_from('blade', verts, faces, fuv, [steel], parent=parent, sharp_angle=17)
    # nakago (tang): integral steel, straight, tapering, toward +X
    trings, tu = [], []
    for i in range(24):
        t = i / 23
        x = .0005 + .222 * t
        zb = -W0 / 2 + .0042 + t * .004
        zt = W0 / 2 - .0006 - t * .0045
        half_t = .0032 - t * .0008
        if t > .9:
            k = (t - .9) / .1
            zb += (zt - zb) * .45 * k * k
        pts = []
        for (a, b) in [(-1, 0), (-.8, .75), (-.25, 1), (.25, 1), (.8, .75), (1, 0), (.8, -.75), (.25, -1), (-.25, -1), (-.8, -.75)]:
            z = (zb + zt) / 2 + a * (zt - zb) / 2
            pts.append(Vector((x, b * half_t * (1 - .35 * (a > 0) * a), z)))
        trings.append(pts)
        tu.append(t)
    v, f, uv = loft(trings, closed=True, u_vals=tu, cap0=True, cap1=True)
    obj_from('blade_tang', v, f, uv, [tang], parent=blade, sharp_angle=40)
    return blade


def oval_ring(x, ry, rz, n=48, e=2.2, cy=0, cz=0):
    return [Vector((x, cy + y, cz + z)) for (y, z) in superellipse(ry, rz, n, e)]


def build_fittings(parent_blade, parent_saya):
    fit = mat('fitting', (.80, .80, .82), metal=1, rough=.24)
    iron = mat('iron', (.05, .05, .055), metal=.85, rough=.42)
    wood = mat('wood', (.55, .43, .27), rough=.7)
    ray = mat('samegawa', (.78, .75, .66), rough=.62)
    silk = mat('silk', (.02, .05, .16), rough=.55)
    lacq = mat('lacquer', (.005, .02, .045), rough=.08, coat=1)
    cord = mat('cord', (.02, .04, .12), rough=.6)
    horn = mat('horn', (.01, .01, .012), rough=.2, coat=.6)
    inner = mat('inner', (.01, .008, .006), rough=.9)
    bamboo = mat('bamboo', (.62, .5, .3), rough=.55)
    gilt = mat('gilt', (.95, .70, .32), metal=1, rough=.22)

    # --- habaki: sleeve around the machi, a raised line, flaring toward the guard
    rings, us = [], []
    prof = [(-.0345, .90), (-.0341, .975), (-.0335, 1.0), (-.0132, 1.0), (-.0128, 1.022), (-.0112, 1.022),
            (-.0108, 1.0), (-.0012, 1.018), (0, 1.0)]
    for x, k in prof:
        pts = []
        for (y, z) in superellipse((T0 + .0021) * k, (W0 / 2 + .0017) * k, 40, 3.2):
            zz = z - (.0005 if z > 0 else 0)
            yy = y * (1 - .28 * max(0, z / (W0 / 2)))  # narrower toward the mune
            pts.append(Vector((x, yy, zz)))
        rings.append(pts)
        us.append((x + .0345) / .0345)
    v, f, uv = loft(rings, u_vals=us, cap0=True, cap1=True)
    obj_from('habaki', v, f, uv, [fit], parent=parent_blade, sharp_angle=35)

    # --- seppa
    for name, x0 in (('seppa_front', 0.0), ('seppa_back', .0072)):
        rings = [oval_ring(x0 + dx, .0148 * k, .0208 * k, 56, 2.4) for dx, k in ((0, .96), (.0003, 1), (.0019, 1), (.0022, .96))]
        v, f, uv = loft(rings, cap0=True, cap1=True)
        obj_from(name, v, f, uv, [fit], parent=parent_blade, sharp_angle=40)

    build_tsuba(parent_blade, iron, fit)
    for d in ('sakura', 'nami'):
        t = build_tsuba(parent_blade, iron, fit, d, 'tsuba_' + d)
        t['variant'] = d

    # --- tsuka: wooden core, samegawa, ito ribbons
    X0, X1 = .0094, .283

    def rad(x):
        t = (x - .0235) / (.262 - .0235)
        t = min(1, max(0, t))
        waist = 1 - .055 * math.sin(math.pi * t)
        return .0123 * waist * (1 - .03 * t), .0162 * waist * (1 - .02 * t)

    def core_rings(off, x0, x1, n=40):
        out, u = [], []
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n
            ry, rz = rad(x)
            out.append(oval_ring(x, ry + off, rz + off, 48, 2.15))
            u.append(i / n)
        return out, u

    r, u = core_rings(-.0009, .0235, .262)
    v, f, uv = loft(r, u_vals=u, cap0=True, cap1=True)
    obj_from('tsuka', v, f, uv, [wood], parent=parent_blade)
    r, u = core_rings(0, .0235, .262, 60)
    v, f, uv = loft(r, u_vals=u, cap0=True, cap1=True)
    obj_from('samegawa', v, f, uv, [ray], parent=parent_blade)

    # ito: 2 left + 2 right helices; diamonds on both faces every P/2, alternating over/under
    P, xa, xb = .0512, .021, .265
    w, th = .0142, .00115
    ribbons = []
    for k, (dirn, phase) in enumerate(((1, 0), (1, math.pi), (-1, math.pi), (-1, 0))):
        rings, us = [], []
        N = 420
        for i in range(N + 1):
            x = xa + (xb - xa) * i / N
            th0 = dirn * 2 * math.pi * (x - xa) / P + phase
            ry, rz = rad(x)
            # crossing parity: A ribbons over at even crossings, B at odd ones
            cidx = (x - xa - P / 4) / (P / 2)
            near = math.exp(-((cidx - round(cidx)) * 3.2) ** 2)
            over = (round(cidx) + (0 if dirn > 0 else 1)) % 2 == 0
            lift = .00035 + (.00085 * near if over else -.0002 * near)

            def S(xx, tt, off):
                ryy, rzz = rad(xx)
                return Vector((xx, (ryy + off) * math.sin(tt), (rzz + off) * math.cos(tt)))

            c = S(x, th0, lift)
            dx = .0004
            c2 = S(x + dx, th0 + dirn * 2 * math.pi * dx / P, lift)
            T = (c2 - c).normalized()
            nrm = Vector((0, math.sin(th0) / ry, math.cos(th0) / rz)).normalized()
            B = nrm.cross(T).normalized()
            pts = []
            M = 10
            for j in range(M):
                a = j / M * 2 * math.pi
                # flattened lens-shaped cross-section, thicker in the middle
                pts.append(c + B * (w / 2 * math.cos(a)) + nrm * (th / 2 * (1 + math.sin(a))))
            rings.append(pts)
            us.append(i / N)
        v, f, uv = loft(rings, u_vals=us, cap0=True, cap1=True)
        ribbons.append((v, f, uv))
    V, F, UV = [], [], []
    for v, f, uv in ribbons:
        o = len(V)
        V += v
        F += [tuple(i + o for i in ff) for ff in f]
        UV += uv
    obj_from('ito', V, F, UV, [silk], parent=parent_blade)

    # menuki: gilt infinity knots on both faces, partially beneath the ito
    for name, x, side in (('menuki_front', .098, 1), ('menuki_back', .176, -1)):
        V, F, UV = [], [], []
        for lobe in (1, -1):
            pts = []
            for i in range(49):
                t = -math.pi / 2 + math.pi * i / 48
                d = 1 + math.sin(t) ** 2
                a = .0165
                px, pz = lobe * a * math.cos(t) / d, 1.5 * a * math.sin(t) * math.cos(t) / d
                ry, rz = rad(x + px)
                pts.append(Vector((x + px, side * (ry + .0003 + .0009 * (1 - abs(pz) / .01)), pz)))
            v, f, uv = sweep(pts, lambda u: .00135, 10)
            o = len(V)
            V += v
            F += [tuple(i + o for i in ff) for ff in f]
            UV += uv
        # small domed centre boss
        for i in range(1):
            ry, rz = rad(x)
            rings = []
            for k2, (rr, hh) in enumerate(((.0042, 0), (.0038, .0012), (.0026, .002), (.001, .0024), (0, .0025))):
                rings.append([Vector((x + rr * math.cos(a / 16 * 2 * math.pi), side * (ry + .0006 + hh), rr * math.sin(a / 16 * 2 * math.pi))) for a in range(16)])
            v, f, uv = loft(rings, cap0=True)
            o = len(V)
            V += v
            F += [tuple(i + o for i in ff) for ff in f]
            UV += uv
        obj_from(name, V, F, UV, [gilt], parent=parent_blade)

    # mekugi (bamboo pin) crossing the handle near the fuchi
    x = .046
    ry, rz = rad(x)
    rings = []
    for yy, k in ((-(ry + .0013), .7), (-(ry + .0011), 1), (ry + .0011, 1), (ry + .0013, .7)):
        rings.append([Vector((x + .0021 * k * math.cos(a / 18 * 2 * math.pi), yy, .0021 * k * math.sin(a / 18 * 2 * math.pi) + .0005)) for a in range(18)])
    v, f, uv = loft(rings, cap0=True, cap1=True)
    obj_from('mekugi', v, f, uv, [bamboo], parent=parent_blade)

    # fuchi collar
    rings, us = [], []
    for x, k in ((.0094, .95), (.0097, 1.0), (.0228, 1.0), (.0235, .985)):
        rings.append(oval_ring(x, .0147 * k, .0190 * k, 56, 2.3))
    v, f, uv = loft(rings, cap0=True, cap1=True)
    obj_from('fuchi', v, f, uv, [fit], parent=parent_blade, sharp_angle=35)
    # kashira pommel, domed
    rings, us = [], []
    for x, k in ((.2615, .97), (.262, 1.0), (.2745, 1.0), (.2790, .95), (.2815, .84), (.2828, .62), (.2833, .34), (.28345, 0)):
        rings.append(oval_ring(x, .0142 * k, .0186 * k, 56, 2.3))
    v, f, uv = loft(rings, cap0=True)
    obj_from('kashira', v, f, uv, [fit], parent=parent_blade, sharp_angle=40)

    build_saya(parent_saya, lacq, fit, horn, cord, inner)


def tsuba_outline(design, n=180):
    if design == 'sakura':
        return superellipse(.0388, .0388, n, 2.0)
    if design == 'nami':
        out = []
        for i in range(n):
            ph = i / n * 2 * math.pi
            r = .0405 * (1 - .07 * math.sin(2 * ph) ** 2)
            out.append((r * math.sin(ph) * .95, r * math.cos(ph)))
        return out
    return superellipse(.0375, .0405, n, 2.05)


def egg(cx, cz, ang, half, width, n=48):
    pts = []
    for i in range(n):
        t = i / n * 2 * math.pi
        lx = half * math.cos(t)
        ly = width * math.sin(t) * (1 - .32 * math.cos(t))
        pts.append((cx + lx * math.cos(ang) - ly * math.sin(ang), cz + lx * math.sin(ang) + ly * math.cos(ang)))
    return pts


def build_tsuba(parent, iron, fit, design='infinity', name='tsuba'):
    x0, x1 = .0022, .0072
    outline = tsuba_outline(design)
    plate = prism(name, outline, x0, x1, iron, parent=parent)
    cutters = []
    # nakago-ana, kept inside the seppa footprint
    zb, zt = -W0 / 2 + .0042, W0 / 2 - .0006
    na = [(-.0034, zb), (.0034, zb), (.0036, 0), (.0025, zt - .002), (0, zt), (-.0025, zt - .002), (-.0036, 0)]
    cutters.append(prism(f'cut_{name}_nakago', na, x0 - .01, x1 + .01, iron))
    a = .0322
    inlay_paths = []
    if design == 'sakura':
        for k in range(5):
            ang = math.pi / 2 + k * 2 * math.pi / 5
            cy, cz = .0272 * math.cos(ang), .0272 * math.sin(ang)
            cutters.append(prism(f'cut_{name}_petal_{k}', egg(cy, cz, ang, .0064, .0052), x0 - .01, x1 + .01, iron))
            inlay_paths.append(offset_poly(egg(cy, cz, ang, .0064, .0052, 96), .0009, inward=False))
    elif design == 'nami':
        cutters.append(prism(f'cut_{name}_moon', egg(-.0232, .0135, 0, .0062, .0062), x0 - .01, x1 + .01, iron))
        inlay_paths.append(offset_poly(egg(-.0232, .0135, 0, .0062, .0062, 96), .0009, inward=False))
        for k, (cy, cz, rot) in enumerate(((.022, -.012, .3), (.017, .02, -.5), (-.016, -.024, 2.4))):
            cres = []
            r = .0085
            for i in range(33):
                ph = math.pi * i / 32
                cres.append((r * math.cos(ph), r * math.sin(ph)))
            for i in range(31, 0, -1):
                ph = math.pi * i / 32
                cres.append((r * .9 * math.cos(ph), r * .3 * math.sin(ph) + .0012))
            cres = [(cy + x * math.cos(rot) - y * math.sin(rot), cz + x * math.sin(rot) + y * math.cos(rot)) for x, y in cres]
            cutters.append(prism(f'cut_{name}_wave_{k}', cres, x0 - .01, x1 + .01, iron))
        for k in range(3):
            wave = [(-.03 + .06 * t / 60, -.004 + k * .0045 - .0005 * math.sin(t / 60 * 9 + k) * 6) for t in range(61)]
            wave = [(y, z) for (y, z) in wave if (y * y / .031 ** 2 + z * z / .034 ** 2) < 1 and not (abs(y) < .0165 and abs(z) < .022)]
            if len(wave) > 3:
                inlay_paths.append(('open', wave))
    for lobe in ((1, -1) if design == 'infinity' else ()):
        pts = lemniscate_lobe(a, 1.95, lobe, 96)
        inner = offset_poly(pts, .0024, inward=True)
        inner = [(y, z) for (y, z) in inner if abs(y) > .0178]
        cutters.append(prism(f'cut_{name}_lobe_{lobe}', inner, x0 - .01, x1 + .01, iron))
    # crescent moons above and below
    for sz in ((1, -1) if design == 'infinity' else ()):
        cres = []
        c = (0, sz * .0292)
        r = .0071
        for i in range(33):
            ph = math.pi * i / 32
            cres.append((c[0] + r * math.cos(ph), c[1] + sz * r * math.sin(ph)))
        for i in range(31, 0, -1):
            ph = math.pi * i / 32
            cres.append((c[0] + r * .93 * math.cos(ph), c[1] + sz * r * .38 * math.sin(ph)))
        if sz < 0:
            cres.reverse()
        cutters.append(prism(f'cut_{name}_moon_{sz}', cres, x0 - .01, x1 + .01, iron))
    for c in cutters:
        md = plate.modifiers.new('cut_' + c.name, 'BOOLEAN')
        md.operation = 'DIFFERENCE'
        md.solver = 'EXACT'
        md.object = c
        c.hide_render = True
        c.hide_viewport = True
        c.parent = None
        c['cutter'] = True
    bv = plate.modifiers.new('bevel', 'BEVEL')
    bv.width = .00032
    bv.segments = 2
    bv.limit_method = 'ANGLE'
    bv.angle_limit = math.radians(35)
    plate.modifiers.new('wn', 'WEIGHTED_NORMAL').keep_sharp = True
    # raised gilt infinity band on both faces, framing the openings
    V, F, UV = [], [], []
    for path in inlay_paths:
        closed = not (isinstance(path, tuple) and path[0] == 'open')
        pp = path if closed else path[1]
        for xf in (x0 - .0004, x1 + .0004):
            pts3 = [Vector((xf, y, z)) for (y, z) in pp] + ([Vector((xf, *pp[0]))] if closed else [])
            v, f, uv = sweep(pts3, lambda u: .0009, 8, flat=(1.0, .55), axis=Vector((1, 0, 0)), closed=closed)
            o = len(V)
            V += v
            F += [tuple(i + o for i in ff) for ff in f]
            UV += uv
    for lobe in ((1, -1) if design == 'infinity' else ()):
        pts2 = lemniscate_lobe(a, 1.95, lobe, 140)
        mid = offset_poly(pts2, .0003, inward=True)
        mid = [(y, z) for (y, z) in mid if abs(y) > .0150]
        for xf in (x0 - .0004, x1 + .0004):
            pts3 = [Vector((xf, y, z)) for (y, z) in mid]
            v, f, uv = sweep(pts3, lambda u: .00115, 8, flat=(1.0, .55), axis=Vector((1, 0, 0)))
            o = len(V)
            V += v
            F += [tuple(i + o for i in ff) for ff in f]
            UV += uv
    # mimi (rim): rounded, slightly proud of the plate
    pts = [Vector(((x0 + x1) / 2, y, z)) for (y, z) in offset_poly(tsuba_outline(design, 180), .0012, inward=True)]
    pts.append(pts[0])
    v, f, uv = sweep(pts, lambda u: .0031, 14, flat=(1.0, .95), axis=Vector((1, 0, 0)), closed=True)
    o = len(V)
    V += v
    F += [tuple(i + o for i in ff) for ff in f]
    UV += uv
    obj_from(name + '_inlay', V, F, UV, [fit], parent=plate)
    return plate


def saya_center(s):
    p, up = cl(s)
    return p + up * (width(min(s, L - KL)) / 2 - W0 / 2 + .0003), up


def saya_dims(s):
    t = s / .742
    return .0126 - .0017 * t, width(min(s, L - KL)) / 2 + .0060 + .0006 * (1 - t)


def build_saya(parent, lacq, fit, horn, cord, inner):
    def rings_between(s0, s1, n, prof=None, e=2.35):
        out, us = [], []
        for i in range(n + 1):
            s = s0 + (s1 - s0) * i / n
            c, up = saya_center(s)
            ry, rz = saya_dims(s)
            k = prof(i / n) if prof else 1
            tang = Vector((-math.cos(s / R), 0, math.sin(s / R)))
            side = Vector((0, 1, 0))
            pts = [c + side * y * k + up * z * k for (y, z) in superellipse(ry, rz, 56, e)]
            out.append(pts)
            us.append(s / .742)
        return out, us

    r, u = rings_between(.0135, .7185, 180)
    v, f, uv = loft(r, u_vals=u, cap0=False, cap1=True)
    obj_from('saya', v, f, uv, [lacq], parent=parent)
    # hollow mouth interior (visible when drawn)
    out = []
    for s in (.0005, .012, .06):
        c, up = saya_center(s)
        out.append([c + Vector((0, y, 0)) + up * z for (y, z) in superellipse(T0 + .0024, W0 / 2 + .0021, 40, 3.0)])
    v, f, uv = loft(out, cap1=True)
    obj_from('saya_inner', v, f, uv, [inner], parent=parent)

    # koiguchi: mouth ring with an actual opening
    def kprof(t):
        return [.985, 1.02, 1.02, 1.0][min(3, int(t * 3.999))]
    r, u = rings_between(0, .0145, 3, prof=kprof)
    mouth = [[c for c in ring] for ring in r]
    inner_ring = []
    c, up = saya_center(0)
    inner_ring = [c + Vector((0, y, 0)) + up * z for (y, z) in superellipse(T0 + .0024, W0 / 2 + .0021, 56, 3.0)]
    # annulus face at the mouth
    v, f, uv = loft([inner_ring] + mouth, cap1=True)
    obj_from('koiguchi', v, f, uv, [fit], parent=parent, sharp_angle=35)

    # kojiri: end cap
    def jprof(t):
        return [1.025, 1.03, 1.03, 1.0, .9, .7, .38, .05][min(7, int(t * 7.999))]
    out = []
    for s, k in ((.7175, 1.022), (.718, 1.03), (.735, 1.03), (.739, .98), (.7415, .88), (.743, .66), (.7437, .35), (.7439, .02)):
        c, up = saya_center(s)
        ry, rz = saya_dims(s)
        out.append([c + Vector((0, y * k, 0)) + up * z * k for (y, z) in superellipse(ry, rz, 56, 2.35)])
    v, f, uv = loft(out, cap0=True, cap1=True)
    obj_from('kojiri', v, f, uv, [fit], parent=parent, sharp_angle=35)

    # kurigata: horn knob on the omote face with a real opening
    s = .108
    c, up = saya_center(s)
    ry, rz = saya_dims(s)
    base = c + Vector((0, ry + .0005, 0)) - up * .0035
    pts = []
    for i in range(49):
        a = i / 48 * 2 * math.pi
        pts.append(base + Vector((0, .0042 + .0042 * math.sin(a), 0)) + up * (.0056 * math.cos(a)))
    v, f, uv = sweep(pts, lambda u: .0021, 12, closed=True)
    obj_from('kurigata', v, f, uv, [horn], parent=parent)

    # sageo: cord threaded through the kurigata, wound around the saya, two hanging tails
    V, F, UV = [], [], []

    def add(v, f, uv):
        o = len(V)
        V.extend(v)
        F.extend(tuple(i + o for i in ff) for ff in f)
        UV.extend(uv)
    tips = []
    wind = []
    s0, turns, pitch = .128, 4, .0095
    for i in range(turns * 64 + 1):
        t = i / 64
        s = s0 + t * pitch
        c, up = saya_center(s)
        ry, rz = saya_dims(s)
        a = t * 2 * math.pi
        wind.append(c + Vector((0, (ry + .0024) * math.sin(a), 0)) + up * ((rz + .0024) * math.cos(a)))
    add(*sweep(wind, lambda u: .0031, 10, flat=(1.0, .42)))
    # tails
    end = wind[-1]
    for k, (dx, dy, drop) in enumerate(((.010, .006, .135), (-.012, .012, .115))):
        pts = []
        for i in range(40):
            t = i / 39
            pts.append(end + Vector((dx * math.sin(t * 2.2) - .006 * t, dy * t + .004 * math.sin(t * 3), -drop * t ** 1.1)))
        add(*sweep(pts, lambda u: .0031, 10, flat=(1.0, .42)))
        # tassel end
        tip = pts[-1]
        rings = []
        for kk, (rr, hh) in enumerate(((.0030, .001), (.0036, -.001), (.0036, -.011), (.0030, -.013), (0, -.0135))):
            rings.append([tip + Vector((rr * math.cos(a / 12 * 2 * math.pi), rr * math.sin(a / 12 * 2 * math.pi), hh)) for a in range(12)])
        tv, tf_, tuv = loft(rings, cap0=True)
        tips.append((tv, tf_, tuv))
    obj_from('sageo', V, F, UV, [cord], parent=parent)
    TV, TF, TUV = [], [], []
    for tv, tf_, tuv in tips:
        o = len(TV)
        TV += tv
        TF += [tuple(i + o for i in ff) for ff in tf_]
        TUV += tuv
    obj_from('sageo_tips', TV, TF, TUV, [fit], parent=bpy.data.objects['sageo'], sharp_angle=40)


def build_katana():
    root = empty('KATANA')
    blade_asm = empty('BLADE_ASSEMBLY', root)
    saya_asm = empty('SAYA_ASSEMBLY', root)
    build_blade(blade_asm)
    build_fittings(blade_asm, saya_asm)
    # bake boolean/bevel modifiers into real geometry, drop the cutters
    dg = bpy.context.evaluated_depsgraph_get()
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and len(o.modifiers):
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
            o.modifiers.clear()
            old = o.data
            o.data = me
            me.name = o.name
    for o in list(bpy.data.objects):
        if o.get('cutter'):
            bpy.data.objects.remove(o)
    return root, blade_asm, saya_asm


def saya_support_points():
    """Undersides of the saya where a stand should cradle it (katana-local)."""
    out = []
    for s in (.16, .58):
        c, up = saya_center(s)
        ry, rz = saya_dims(s)
        out.append((c - up * rz, s))
    return out
