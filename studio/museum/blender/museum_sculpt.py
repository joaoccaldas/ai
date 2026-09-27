# One sculpture per project. Executed inside museum.py (shares B, P, lathe, ex, sculpt, to_world, rot_of).
import math, random, bmesh
from mathutils import Vector, Matrix
rs = random.Random(5)


def at(top, dx=0, dy=0, dz=0):
    return (top.x + dx, top.y + dy, top.z + dz)


def ico(name, r, c, material, sub=2, **props):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    bmesh.ops.translate(bm, vec=Vector(c), verts=bm.verts)
    o = B.mesh(name, bm, material, **props)
    return o


@sculpt('eclat')            # a massive brilliant-cut diamond, floating in a beam
def _(top, ang):
    c = at(top, dz=1.15)
    R = .55
    prof = [(0.0, .22), (.30, .22), (.47, .12), (R, 0.0), (R, -.035), (.30, -.32), (0.0, -.56)]
    lathe('eclat_diamond', prof, c, P((.9, .95, 1.0)), seg=16, phase=[0, 0, .5, 0, 0, .5, 0], flat=True, **ex('eclat', mat='diamond', spin='z'))
    B.torus('eclat_halo', .62, .012, at(top, dz=.03), P((.7, .6, .35), metal=1), axis='Z', seg=96, sides=6, **ex('eclat', mat='gold'))


@sculpt('aurelia')          # a monumental gold ring with an emerald
def _(top, ang):
    a = rot_of(ang)
    rr = .42
    ring = B.torus('aurelia_band', rr, .065, at(top, dz=.1 + rr), P((.8, .6, .25), metal=1), axis='Y', seg=128, sides=16, **ex('aurelia', mat='gold', spin='z'))
    ring.rotation_euler = (0, 0, a + math.pi / 2)
    g = at(top, dz=.1 + 2 * rr + .12)
    lathe('aurelia_gem', [(0, .1), (.1, .1), (.16, .04), (.17, 0), (.1, -.1), (0, -.16)], g, P((.05, .4, .2)), seg=12, phase=[0, 0, .5, 0, .5, 0], flat=True, **ex('aurelia', mat='emerald', spin='z'))
    for k in range(4):
        aa = k * math.pi / 2 + .6
        B.cyl(f'aurelia_prong_{k}', .012, .16, (g[0] + .13 * math.cos(aa), g[1] + .13 * math.sin(aa), g[2] - .07), P((.8, .6, .25), metal=1), seg=8, **ex('aurelia', mat='gold'))
    B.cyl('aurelia_cushion', .34, .1, at(top, dz=.05), P((.05, .05, .08)), seg=48, **ex('aurelia', mat='velvet'))


@sculpt('lume')             # three frosted serum bottles on river stones
def _(top, ang):
    for k, (dx, dy, s) in enumerate(((-.2, -.12, 1.0), (.18, -.05, .8), (0, .22, .65))):
        base = at(top, dx, dy)
        prof = [(0, 0), (.13 * s, 0), (.14 * s, .02 * s), (.14 * s, .44 * s), (.12 * s, .5 * s), (.05 * s, .55 * s), (.05 * s, .62 * s)]
        lathe(f'lume_bottle_{k}', prof, base, P((.75, .8, .75)), seg=40, **ex('lume', mat='frost'))
        lathe(f'lume_cap_{k}', [(.058 * s, .6 * s), (.062 * s, .62 * s), (.062 * s, .74 * s), (.045 * s, .82 * s), (0, .84 * s)], base, P((.8, .78, .75)), seg=24, **ex('lume', mat='ceramic'))
    for k in range(5):
        B.sphere(f'lume_stone_{k}', rs.uniform(.08, .13), at(top, rs.uniform(-.45, .45), rs.uniform(-.45, .45), .03), P((.5, .5, .48)), scale=(1.3, 1, .45), seg=14, **ex('lume', mat='stone'))


@sculpt('maison-lumen')     # a silver candelabra, candles lit
def _(top, ang):
    base = at(top)
    lathe('lumen_stem', [(.22, 0), (.24, .03), (.12, .08), (.05, .2), (.04, .7), (.07, .74), (.035, .78), (.035, .98), (.06, 1.0), (0, 1.02)], base, P((.7, .7, .72), metal=1), seg=36, **ex('maison-lumen', mat='silver'))
    tips = [(0, 0, 1.0)]
    for k in range(4):
        a = k * math.pi / 2 + .4
        pts = [Vector(at(top, 0, 0, .74)), Vector(at(top, .18 * math.cos(a), .18 * math.sin(a), .72)), Vector(at(top, .32 * math.cos(a), .32 * math.sin(a), .82)), Vector(at(top, .36 * math.cos(a), .36 * math.sin(a), .92))]
        v, f, uv = sweep(pts, lambda u: .022, 10)
        B.poly(f'lumen_arm_{k}', v, f, P((.7, .7, .72), metal=1), **ex('maison-lumen', mat='silver'))
        tips.append((.36 * math.cos(a), .36 * math.sin(a), .92))
    for k, (x, y, z) in enumerate(tips):
        B.cyl(f'lumen_cup_{k}', .05, .04, at(top, x, y, z + .02), P((.7, .7, .72), metal=1), seg=20, **ex('maison-lumen', mat='silver'))
        h = .26 + .06 * (k == 0)
        B.cyl(f'lumen_candle_{k}', .03, h, at(top, x, y, z + .04 + h / 2), P((.9, .88, .8)), seg=16, **ex('maison-lumen', mat='candle'))
        B.sphere(f'EMIT_lumen_flame_{k}', .018, at(top, x, y, z + .06 + h + .02), m_flat('flame', (1, .6, .2), emit=(1, .55, .2), strength=30), scale=(1, 1, 2.2), seg=10,
                 **emit_props((1, .55, .2), 9, 'flicker'), exh='maison-lumen')


@sculpt('vin-ra')           # an oversized wine glass with a pour of red, and its bottle
def _(top, ang):
    g = at(top, -.15, 0)
    lathe('vinora_glass', [(0, 0), (.3, 0), (.31, .015), (.06, .04), (.03, .1), (.03, .55), (.07, .6), (.22, .7), (.3, .88), (.29, 1.05), (.27, 1.2)], g, P((.9, .9, .9)), seg=64, cap_top=False, **ex('vin-ra', mat='glass'))
    lathe('vinora_wine', [(0, .62), (.16, .66), (.25, .78), (.285, .9), (0, .9)], g, P((.35, .02, .05)), seg=48, **ex('vin-ra', mat='wine'))
    b = at(top, .32, .12)
    lathe('vinora_bottle', [(0, 0), (.13, 0), (.13, .6), (.11, .68), (.045, .8), (.045, 1.0), (.05, 1.02), (0, 1.02)], b, P((.03, .08, .04)), seg=40, **ex('vin-ra', mat='bottle'))
    lathe('vinora_label', [(.132, .2), (.132, .45)], b, P((.85, .8, .7)), seg=40, cap_top=False, cap_bot=False, **ex('vin-ra', mat='label'))


@sculpt('ember-oak')        # a steaming cup on a saucer, beans scattered
def _(top, ang):
    c = at(top)
    lathe('ember_saucer', [(0, 0), (.36, 0), (.42, .035), (.44, .05), (.36, .03), (.12, .025), (0, .025)], c, P((.85, .82, .76)), seg=64, **ex('ember-oak', mat='ceramic'))
    lathe('ember_cup', [(0, .03), (.14, .03), (.2, .12), (.24, .3), (.25, .42), (.23, .42), (.22, .3), (.18, .12), (0, .08)], c, P((.85, .82, .76)), seg=64, **ex('ember-oak', mat='ceramic'))
    B.cyl('ember_coffee', .225, .01, at(top, dz=.37), P((.08, .04, .02)), seg=48, **ex('ember-oak', mat='coffee', dyn='steam'))
    h = B.torus('ember_handle', .09, .02, at(top, .27, 0, .26), P((.85, .82, .76)), axis='Y', seg=48, sides=10, arc=.6, **ex('ember-oak', mat='ceramic'))
    h.rotation_euler = (0, math.radians(-110), 0)
    for k in range(34):
        a, r = rs.random() * 6.28, rs.uniform(.45, .58)
        o = B.sphere(f'ember_bean_{k}', .03, at(top, r * math.cos(a), r * math.sin(a), .02), P((.18, .08, .03)), scale=(1.4, 1, .6), seg=8, **ex('ember-oak', mat='bean'))


@sculpt('den')              # an oval brass mirror on an easel
def _(top, ang):
    a = rot_of(ang)
    c = Vector(at(top, dz=.95))
    pts = []
    for i in range(97):
        t = i / 96 * 6.2832
        pts.append(Vector((0, .32 * math.cos(t), .5 * math.sin(t))))
    rot = Matrix.Rotation(a, 3, 'Z')
    pts = [c + rot @ p for p in pts]
    v, f, uv = sweep(pts, lambda u: .03, 12, closed=True)
    B.poly('eden_frame', v, f, P((.7, .55, .3), metal=1), **ex('den', mat='gold'))
    ring = [c + rot @ Vector((0, .31 * math.cos(i / 48 * 6.2832), .49 * math.sin(i / 48 * 6.2832))) for i in range(48)]
    B.poly('eden_mirror', ring + [c], [(i, (i + 1) % 48, 48) for i in range(48)], P((.8, .8, .82), metal=1), **ex('den', mat='mirror'))
    for k, (dv, du) in enumerate(((-.2, -.12), (.2, -.12), (0, .22))):
        p0 = Vector(at(top)) + rot @ Vector((du, dv, 0))
        p1 = c + rot @ Vector((0, dv * .3, .35 if k < 2 else .1))
        v, f, uv = sweep([p0, p1], lambda u: .015, 8)
        B.poly(f'eden_leg_{k}', v, f, P((.7, .55, .3), metal=1), **ex('den', mat='gold'))


@sculpt('pulse')            # a kettlebell with a lime neon band, plates leaning
def _(top, ang):
    B.sphere('pulse_bell', .3, at(top, dz=.3), P((.03, .03, .03)), seg=40, **ex('pulse', mat='iron_black'))
    B.cyl('pulse_base', .2, .04, at(top, dz=.02), P((.03, .03, .03)), seg=32, **ex('pulse', mat='iron_black'))
    hdl = B.torus('pulse_handle', .19, .04, at(top, dz=.6), P((.03, .03, .03)), axis='Y', seg=48, sides=12, arc=.5, **ex('pulse', mat='iron_black'))
    hdl.rotation_euler = (0, 0, rot_of(ang))
    B.torus('EMIT_pulse_band', .305, .012, at(top, dz=.3), m_flat('lime', (.7, 1, .1), emit=(.75, 1, .15), strength=20), axis='Z', seg=96, sides=8, **emit_props((.75, 1, .15), 4.5, 'pulse'), exh='pulse')
    for k, s in enumerate((1, -1)):
        pl = B.cyl(f'pulse_plate_{k}', .26, .05, at(top, s * .45, .1, .3), P((.05, .05, .05)), seg=48, rot=(math.pi / 2, 0, rot_of(ang) + s * .25), **ex('pulse', mat='rubber'))


@sculpt('inner-group')      # an orbit: many paths around one centre
def _(top, ang):
    c = at(top, dz=.95)
    ico('inner_core', .16, c, P((.9, .95, .95)), sub=3, **ex('inner-group', mat='pearl'))
    for k, (r, tilt) in enumerate(((.38, .3), (.55, -.5), (.72, .9))):
        o = B.torus(f'inner_ring_{k}', r, .008, c, P((.4, .8, .75), metal=1), axis='Z', seg=128, sides=6, **ex('inner-group', mat='orbit', spin=['z', 'y', 'x'][k]))
        o.rotation_euler = (tilt, tilt * .6, 0)
        for j in range(2 + k):
            a = j / (2 + k) * 6.2832
            p = Matrix.Rotation(tilt, 3, 'X') @ Matrix.Rotation(tilt * .6, 3, 'Y') @ Vector((r * math.cos(a), r * math.sin(a), 0))
            ico(f'inner_moon_{k}_{j}', .045 + .01 * k, (c[0] + p.x, c[1] + p.y, c[2] + p.z), P((.5, .9, .8)), sub=2, **ex('inner-group', mat='moon'))


@sculpt('laurie-hedges')    # a vintage cinema camera on a wooden tripod
def _(top, ang):
    a = rot_of(ang)
    rot = Matrix.Rotation(a, 3, 'Z')
    head = Vector(at(top, dz=1.25))
    for k in range(3):
        aa = k * 2.094 + .3
        foot = Vector(at(top, .45 * math.cos(aa), .45 * math.sin(aa), .02))
        v, f, uv = sweep([foot, head + Vector((0, 0, -.05))], lambda u: .022, 8)
        B.poly(f'laurie_leg_{k}', v, f, P((.25, .15, .08)), **ex('laurie-hedges', mat='wood'))
    body = B.box('laurie_body', (.26, .52, .32), (head.x, head.y, head.z + .18), P((.04, .04, .04)), rot=(0, 0, a), bevel=.02, **ex('laurie-hedges', mat='camera'))
    fwd = rot @ Vector((0, -1, 0))
    lens = head + Vector((0, 0, .18)) + fwd * .38
    B.cyl('laurie_lens', .08, .24, tuple(lens), P((.04, .04, .04)), seg=32, rot=(math.pi / 2, 0, a), **ex('laurie-hedges', mat='camera'))
    B.cyl('laurie_glass', .065, .01, tuple(lens + fwd * .12), P((.2, .3, .35)), seg=32, rot=(math.pi / 2, 0, a), **ex('laurie-hedges', mat='lens'))
    for k, off in enumerate((-.12, .16)):
        rc = head + Vector((0, 0, .5)) + rot @ Vector((0, off, 0))
        B.cyl(f'laurie_reel_{k}', .17, .04, tuple(rc), P((.5, .5, .5), metal=1), seg=40, rot=(0, math.pi / 2, a), **ex('laurie-hedges', mat='reel', spin='x'))


@sculpt('wander')           # a globe on a brass meridian
def _(top, ang):
    c = at(top, dz=.75)
    B.sphere('wander_globe', .42, c, P((.1, .25, .35)), seg=48, **ex('wander', mat='globe', spin='z'))
    m = B.torus('wander_meridian', .47, .012, c, P((.7, .55, .3), metal=1), axis='Y', seg=96, sides=8, **ex('wander', mat='gold'))
    m.rotation_euler = (0, .41, rot_of(ang))
    lathe('wander_stand', [(.22, 0), (.24, .03), (.06, .08), (.04, .3), (0, .31)], at(top), P((.7, .55, .3), metal=1), seg=32, **ex('wander', mat='gold'))


@sculpt('dunhaven')         # a lighthouse on granite, its beacon turning
def _(top, ang):
    for k in range(6):
        B.sphere(f'dun_rock_{k}', rs.uniform(.18, .3), at(top, rs.uniform(-.3, .3), rs.uniform(-.3, .3), .1), P((.3, .3, .32)), scale=(1.3, 1.1, .7), seg=10, **ex('dunhaven', mat='granite'))
    base = at(top, dz=.18)
    lathe('dun_tower', [(.2, 0), (.18, .5), (.15, 1.0), (.14, 1.18), (0, 1.18)], base, P((.9, .9, .88)), seg=36, **ex('dunhaven', mat='white'))
    for k in range(3):
        z0 = .15 + k * .33
        lathe(f'dun_stripe_{k}', [(.2 - .045 * z0 + .004, z0), (.2 - .045 * (z0 + .12) + .004, z0 + .12)], base, P((.6, .08, .06)), seg=36, cap_top=False, cap_bot=False, **ex('dunhaven', mat='red'))
    B.cyl('dun_lantern', .12, .18, at(top, dz=.18 + 1.27), P((.8, .85, .9)), seg=24, **ex('dunhaven', mat='glass'))
    B.sphere('EMIT_dun_beacon', .06, at(top, dz=.18 + 1.27), m_flat('beacon', (1, .9, .6), emit=(1, .9, .6), strength=40), seg=16, **emit_props((1, .9, .6), 12, 'beacon'), exh='dunhaven')
    lathe('dun_cap', [(.16, 1.36), (.13, 1.4), (0, 1.52)], base, P((.1, .1, .1)), seg=24, **ex('dunhaven', mat='iron_black'))


@sculpt('wild-stem')        # a hand-thrown vase and a wild bouquet
def _(top, ang):
    base = at(top)
    lathe('wild_vase', [(0, 0), (.14, 0), (.22, .15), (.2, .38), (.1, .52), (.12, .6), (.1, .6)], base, P((.3, .35, .3)), seg=48, cap_top=False, **ex('wild-stem', mat='glaze'))
    for k in range(16):
        a = rs.random() * 6.28
        lean = rs.uniform(.1, .45)
        h = rs.uniform(.7, 1.15)
        pts = [Vector(at(top, 0, 0, .45))]
        for j in range(1, 6):
            t = j / 5
            pts.append(Vector(at(top, math.cos(a) * lean * t * t, math.sin(a) * lean * t * t, .45 + h * t)))
        v, f, uv = sweep(pts, lambda u: .008, 6)
        B.poly(f'wild_stem_{k}', v, f, P((.15, .3, .12)), **ex('wild-stem', mat='stem'))
        tip = pts[-1]
        for j in range(9):
            B.sphere(f'wild_bloom_{k}_{j}', .035, (tip.x + rs.uniform(-.06, .06), tip.y + rs.uniform(-.06, .06), tip.z + rs.uniform(-.03, .05)), P((.9, .4, .6)), scale=(1, 1, .5), seg=6, **ex('wild-stem', mat='bloom'))


@sculpt('studio-nord')      # a concrete maquette, lit from within
def _(top, ang):
    a = rot_of(ang)
    B.box('nord_base', (1.0, 1.0, .04), at(top, dz=.02), P((.4, .4, .4)), rot=(0, 0, a), **ex('studio-nord', mat='concrete'))
    blocks = [((.7, .4, .22), (0, 0, .15)), ((.5, .5, .22), (.12, .08, .37)), ((.62, .3, .2), (-.1, -.08, .58)), ((.36, .36, .26), (.05, .1, .81))]
    rot = Matrix.Rotation(a, 3, 'Z')
    for k, (sz, off) in enumerate(blocks):
        p = Vector(at(top)) + rot @ Vector(off)
        B.box(f'nord_block_{k}', sz, tuple(p), P((.5, .5, .5)), rot=(0, 0, a), bevel=.004, **ex('studio-nord', mat='concrete'))
        w = p + rot @ Vector((0, -sz[1] / 2 - .002, 0))
        B.box(f'EMIT_nord_win_{k}', (sz[0] * .7, .004, .03), tuple(w), m_flat('nord_win', (1, .8, .5), emit=(1, .78, .5), strength=8), rot=(0, 0, a), **emit_props((1, .78, .5), 2.2), exh='studio-nord')


@sculpt('flowstate')        # a flowing glass ribbon
def _(top, ang):
    c = Vector(at(top, dz=.2))
    rings = []
    N = 160
    for i in range(N + 1):
        t = i / N
        th = t * 6.2832 * 1.5
        p = c + Vector((.38 * math.cos(th), .38 * math.sin(th), 1.1 * t))
        tw = t * math.pi * 2
        wdir = Vector((math.cos(th) * math.cos(tw), math.sin(th) * math.cos(tw), math.sin(tw) * .6)).normalized()
        rings.append([p - wdir * .14, p + wdir * .14])
    V, F = [], []
    for i, (a2, b2) in enumerate(rings):
        V += [a2, b2]
        if i:
            k = 2 * i
            F.append((k - 2, k - 1, k + 1, k))
    B.poly('flow_ribbon', V, F, P((.3, .5, 1.0)), **ex('flowstate', mat='ribbon', spin='z'))


@sculpt('volt')             # a neon bolt over a stack of shoe boxes
def _(top, ang):
    a = rot_of(ang)
    for k, (w, d, h, dz, ro) in enumerate(((.62, .38, .2, .1, 0), (.58, .36, .2, .3, .12), (.6, .37, .2, .5, -.08))):
        B.box(f'volt_box_{k}', (w, d, h), at(top, dz=dz), P((.03, .03, .03)), rot=(0, 0, a + ro), bevel=.004, **ex('volt', mat='box'))
        B.box(f'volt_stripe_{k}', (w + .004, .02, h * .3), at(top, dz=dz), P((.8, 1, .2)), rot=(0, 0, a + ro), **ex('volt', mat='acid'))
    rot = Matrix.Rotation(a, 3, 'Z')
    pts = [(-.12, 1.55), (.08, 1.2), (-.04, 1.18), (.12, .8)]
    P3 = [Vector(at(top)) + rot @ Vector((x, 0, z)) for x, z in pts]
    v, f, uv = sweep(P3, lambda u: .025, 10)
    B.poly('EMIT_volt_bolt', v, f, m_flat('acid_neon', (.85, 1, .2), emit=(.85, 1, .2), strength=30), **emit_props((.85, 1, .2), 7, 'neon'), exh='volt')


@sculpt('belong')           # a mirror ball turning above the floor
def _(top, ang):
    c = at(top, dz=1.35)
    ico('belong_ball', .42, c, P((.8, .8, .85), metal=1), sub=3, **ex('belong', mat='mirrorball', spin='z'))
    B.cyl('belong_chain', .006, 6.2 - c[2] - .4, (c[0], c[1], (c[2] + .42 + 6.2) / 2), P((.6, .6, .6), metal=1), seg=6, **ex('belong', mat='silver'))
    for k, col in enumerate(((1, .3, .7), (.3, .7, 1), (1, .8, .3))):
        aa = k * 2.1
        B.sphere(f'EMIT_belong_spot_{k}', .04, at(top, .45 * math.cos(aa), .45 * math.sin(aa), .06), m_flat(f'spot{k}', col, emit=col, strength=25), seg=10,
                 **emit_props(col, 6, 'disco'), exh='belong')
