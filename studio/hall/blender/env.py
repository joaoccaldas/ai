# Environments: THE ATELIER (night, garden, portal) and THE INFINITE VAULT. Blender Z-up, camera looks +Y.
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
from common import obj_from, loft, sweep, superellipse, prism

rnd = random.Random(7)
HOME = Vector((0.24, 0.0, 0.66))   # katana origin (habaki) in world space

# ---------------------------------------------------------------- materials
NM = {}


def nodes_mat(name, build):
    if name in NM:
        return NM[name]
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    build(nt, b)
    NM[name] = m
    return m


def _n(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items():
        if k.startswith('i_'):
            n.inputs[k[2:].replace('_', ' ')].default_value = v
        else:
            setattr(n, k, v)
    return n


def ramp(nt, fac_out, stops):
    r = nt.nodes.new('ShaderNodeValToRGB')
    el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], (*stops[0][1], 1)
    el[1].position, el[1].color = stops[-1][0], (*stops[-1][1], 1)
    for p, c in stops[1:-1]:
        e = el.new(p)
        e.color = (*c, 1)
    nt.links.new(fac_out, r.inputs[0])
    return r


def objrand(nt):
    # per-object random stored as a mesh attribute so it survives joining
    at = nt.nodes.new('ShaderNodeAttribute')
    at.attribute_name = 'rnd'
    return at.outputs['Fac']


def m_wood(name, c1, c2, scale=18, rough=.45, stretch=(1, 14, 1)):
    def b(nt, bs):
        tc = nt.nodes.new('ShaderNodeTexCoord')
        mp = _n(nt, 'ShaderNodeMapping')
        mp.inputs['Scale'].default_value = stretch
        nt.links.new(tc.outputs['Object'], mp.inputs[0])
        # per-object offset so planks differ
        add = _n(nt, 'ShaderNodeVectorMath', operation='ADD')
        nt.links.new(mp.outputs[0], add.inputs[0])
        cmb = _n(nt, 'ShaderNodeCombineXYZ')
        r = objrand(nt)
        for i in range(3):
            mul = _n(nt, 'ShaderNodeMath', operation='MULTIPLY', i_Value=0)
            nt.links.new(r, mul.inputs[0])
            mul.inputs[1].default_value = 37.0 * (i + 1)
            nt.links.new(mul.outputs[0], cmb.inputs[i])
        nt.links.new(cmb.outputs[0], add.inputs[1])
        wv = _n(nt, 'ShaderNodeTexWave', wave_type='BANDS', bands_direction='Z')
        wv.inputs['Scale'].default_value = scale * .25
        wv.inputs['Distortion'].default_value = 7
        wv.inputs['Detail'].default_value = 6
        wv.inputs['Detail Roughness'].default_value = .62
        nt.links.new(add.outputs[0], wv.inputs['Vector'])
        nz = _n(nt, 'ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = scale * 2
        nz.inputs['Detail'].default_value = 8
        nt.links.new(add.outputs[0], nz.inputs['Vector'])
        mx = _n(nt, 'ShaderNodeMix', data_type='FLOAT')
        mx.inputs[0].default_value = .45
        nt.links.new(wv.outputs['Fac'], mx.inputs[2])
        nt.links.new(nz.outputs['Fac'], mx.inputs[3])
        rp = ramp(nt, mx.outputs[0], [(.2, c1), (.55, tuple((a + b) / 2 for a, b in zip(c1, c2))), (.85, c2)])
        # per-plank tint
        hsv = _n(nt, 'ShaderNodeHueSaturation')
        nt.links.new(rp.outputs[0], hsv.inputs['Color'])
        mv = _n(nt, 'ShaderNodeMapRange')
        mv.inputs['To Min'].default_value = .72
        mv.inputs['To Max'].default_value = 1.2
        nt.links.new(r, mv.inputs[0])
        nt.links.new(mv.outputs[0], hsv.inputs['Value'])
        nt.links.new(hsv.outputs[0], bs.inputs['Base Color'])
        bs.inputs['Roughness'].default_value = rough
    return nodes_mat(name, b)


def m_noise(name, c1, c2, scale=6, rough=.8, detail=6, metal=0.0):
    def b(nt, bs):
        nz = _n(nt, 'ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = scale
        nz.inputs['Detail'].default_value = detail
        nz.inputs['Roughness'].default_value = .6
        rp = ramp(nt, nz.outputs['Fac'], [(.3, c1), (.7, c2)])
        nt.links.new(rp.outputs[0], bs.inputs['Base Color'])
        bs.inputs['Roughness'].default_value = rough
        bs.inputs['Metallic'].default_value = metal
    return nodes_mat(name, b)


def m_flat(name, c, rough=.6, metal=0.0, emit=None, strength=0.0):
    def b(nt, bs):
        bs.inputs['Base Color'].default_value = (*c, 1)
        bs.inputs['Roughness'].default_value = rough
        bs.inputs['Metallic'].default_value = metal
        if emit:
            bs.inputs['Emission Color'].default_value = (*emit, 1)
            bs.inputs['Emission Strength'].default_value = strength
    return nodes_mat(name, b)


def m_paper(name, c, emit, strength):
    """Backlit washi: diffuse + translucency + faint glow."""
    def b(nt, bs):
        nz = _n(nt, 'ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = 60
        nz.inputs['Detail'].default_value = 10
        rp = ramp(nt, nz.outputs['Fac'], [(.35, tuple(x * .86 for x in c)), (.7, c)])
        nt.links.new(rp.outputs[0], bs.inputs['Base Color'])
        bs.inputs['Roughness'].default_value = .9
        bs.inputs['Emission Color'].default_value = (*emit, 1)
        bs.inputs['Emission Strength'].default_value = strength
        bs.inputs['Transmission Weight'].default_value = .0
    return nodes_mat(name, b)


def m_wave_cloth(name, base, line):
    def b(nt, bs):
        tc = nt.nodes.new('ShaderNodeTexCoord')
        wv = _n(nt, 'ShaderNodeTexWave', wave_type='RINGS')
        wv.inputs['Scale'].default_value = 34
        wv.inputs['Distortion'].default_value = 1.5
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        rp = ramp(nt, wv.outputs['Fac'], [(.0, base), (.9, base), (.93, line), (.96, base)])
        nt.links.new(rp.outputs[0], bs.inputs['Base Color'])
        bs.inputs['Roughness'].default_value = .85
        bs.inputs['Sheen Weight'].default_value = .5
    return nodes_mat(name, b)


# ---------------------------------------------------------------- geometry helpers
def coll(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


class Builder:
    def __init__(self, c):
        self.c = c

    def mesh(self, name, bm, material, **props):
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(material)
        o = bpy.data.objects.new(name, me)
        self.c.objects.link(o)
        for k, v in props.items():
            o[k] = v
        for p in me.polygons:
            p.use_smooth = False
        return o

    def box(self, name, size, loc, material, rot=(0, 0, 0), bevel=0.0, **props):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1)
        bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
        if bevel > 0:
            bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, affect='EDGES', profile=.5)
        M = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rot[2], 4, 'Z') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[0], 4, 'X')
        bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
        o = self.mesh(name, bm, material, **props)
        return o

    def cyl(self, name, r, h, loc, material, seg=24, rot=(0, 0, 0), r2=None, smooth=True, **props):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
        M = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rot[2], 4, 'Z') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[0], 4, 'X')
        bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
        o = self.mesh(name, bm, material, **props)
        if smooth:
            for p in o.data.polygons:
                p.use_smooth = abs(p.normal.z) < .9 if rot == (0, 0, 0) else True
        return o

    def sphere(self, name, r, loc, material, scale=(1, 1, 1), seg=16, **props):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(6, seg // 2), radius=r)
        bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
        o = self.mesh(name, bm, material, **props)
        for p in o.data.polygons:
            p.use_smooth = True
        return o

    def torus(self, name, R_, r, loc, material, axis='Y', seg=96, sides=12, arc=1.0, **props):
        rings = []
        n = seg
        for i in range(n + (1 if arc < 1 else 0)):
            a = i / n * 2 * math.pi * arc
            c = Vector((R_ * math.cos(a), 0, R_ * math.sin(a)))
            out = Vector((math.cos(a), 0, math.sin(a)))
            rings.append([c + out * (r * math.cos(b / sides * 2 * math.pi)) + Vector((0, r * math.sin(b / sides * 2 * math.pi), 0)) for b in range(sides)])
        if arc >= 1:
            v, f, uv = loft(rings + [rings[0]], closed=True)
        else:
            v, f, uv = loft(rings, closed=True, cap0=True, cap1=True)
        rot = {'Y': Matrix.Identity(3), 'Z': Matrix.Rotation(math.pi / 2, 3, 'X'), 'X': Matrix.Rotation(math.pi / 2, 3, 'Z')}[axis]
        v = [rot @ p + Vector(loc) for p in v]
        o = obj_from(name, v, f, uv, [material], coll=self.c)
        for k, val in props.items():
            o[k] = val
        return o

    def poly(self, name, verts, faces, material, smooth=True, **props):
        o = obj_from(name, verts, faces, None, [material], coll=self.c, smooth=smooth)
        for k, val in props.items():
            o[k] = val
        return o


def emit_props(color, strength, dyn=None):
    d = {'emit': list(color), 'strength': strength}
    if dyn:
        d['dyn'] = dyn
    return d


# ---------------------------------------------------------------- shared props
def katana_stand(B, supports, wood, fit_col=(.7, .72, .75)):
    """katana-kake: two carved uprights + a beam with wave relief and a mon crest."""
    xs = [HOME.x + p.x for p, s in supports]
    zs = [HOME.z + p.z for p, s in supports]
    base_z = .452
    for i, (x, zt) in enumerate(zip(xs, zs)):
        h = zt - base_z
        # upright profile in YZ with a U cradle at the top, extruded along X
        prof = [(-.075, 0), (.075, 0), (.075, .026), (.05, .045), (.045, h - .035), (.052, h + .014), (.036, h + .03),
                (.02, h + .004), (.012, h - .006), (0, h - .01), (-.012, h - .006), (-.02, h + .004),
                (-.036, h + .03), (-.052, h + .014), (-.045, h - .035), (-.05, .045), (-.075, .026)]
        prof = [(y, z + base_z) for y, z in prof]
        o = prism(f'stand_up_{i}', prof, x - .022, x + .022, wood, coll=B.c)
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=.0025, segments=2, affect='EDGES', profile=.5)
        bm.to_mesh(o.data)
        bm.free()
        B.box(f'stand_foot_{i}', (.07, .19, .03), (x, 0, base_z + .015), wood, bevel=.006)
    x0, x1 = min(xs) - .09, max(xs) + .09
    B.box('stand_beam', (x1 - x0, .045, .075), ((x0 + x1) / 2, 0, base_z + .06), wood, bevel=.006)
    B.box('stand_base', (x1 - x0 + .08, .12, .025), ((x0 + x1) / 2, 0, base_z + .0125), wood, bevel=.006)
    # mon crest (5 petals) on the beam front
    silver = m_flat('mon_silver', fit_col, rough=.3, metal=1)
    cx = (x0 + x1) / 2
    B.cyl('stand_mon', .03, .006, (cx, -.024, base_z + .06), silver, seg=40, rot=(math.pi / 2, 0, 0))
    for k in range(5):
        a = k / 5 * 2 * math.pi + math.pi / 2
        B.sphere(f'stand_mon_p{k}', .011, (cx + .014 * math.cos(a), -.028, base_z + .06 + .014 * math.sin(a)), silver, scale=(1, .35, 1), seg=12)
    # carved wave relief strips along the beam
    wv = m_flat('stand_relief', (.10, .06, .035), rough=.55)
    for side in (-1, 1):
        for k in range(3):
            pts = []
            for i in range(60):
                t = i / 59
                x = cx + side * (.05 + t * (x1 - x0) * .38)
                pts.append(Vector((x, -.0235, base_z + .045 + .012 * k * .7 + .008 * math.sin(t * 18 + k))))
            v, f, uv = sweep(pts, lambda u: .0022, 6)
            B.poly(f'stand_wave_{side}_{k}', v, f, wv)


def blossom_branch(B, origin, direction, length, seed, bark, bloom, count=40, name='sakura'):
    r = random.Random(seed)
    V, F = [], []
    BV, BF = [], []

    def branch(p, d, ln, rad, depth):
        pts = [p]
        cur = p.copy()
        dd = d.normalized()
        for i in range(8):
            dd = (dd + Vector((r.uniform(-.25, .25), r.uniform(-.25, .25), r.uniform(-.15, .2)))).normalized()
            cur = cur + dd * ln / 8
            pts.append(cur.copy())
        v, f, uv = sweep(pts, lambda u: rad * (1 - .7 * u), 6)
        o = len(V)
        V.extend(v)
        F.extend(tuple(i + o for i in ff) for ff in f)
        for i in range(2, 9):
            if r.random() < .8:
                c = pts[i] + Vector((r.uniform(-.04, .04), r.uniform(-.04, .04), r.uniform(-.03, .04))) * ln * 3
                blossom(c, ln * .09)
        if depth > 0:
            for k in range(2):
                i = r.randint(3, 7)
                nd = (dd + Vector((r.uniform(-.9, .9), r.uniform(-.9, .9), r.uniform(-.1, .7)))).normalized()
                branch(pts[i], nd, ln * .6, rad * .55, depth - 1)

    def blossom(c, s):
        for k in range(5):
            a = k / 5 * 2 * math.pi + r.random()
            pc = c + Vector((math.cos(a), math.sin(a), r.uniform(-.3, .3))) * s * .55
            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=6, v_segments=4, radius=s * .5)
            bmesh.ops.scale(bm, vec=Vector((1, 1, .45)), verts=bm.verts)
            M = Matrix.Translation(pc) @ Matrix.Rotation(r.random() * 3, 4, Vector((r.random(), r.random(), r.random())).normalized())
            bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
            o = len(BV)
            BV.extend(v.co.copy() for v in bm.verts)
            BF.extend(tuple(v.index + o for v in f.verts) for f in bm.faces)
            bm.free()
    branch(origin, direction, length, length * .035, 2)
    B.poly(name + '_bark', V, F, bark)
    return B.poly(name + '_bloom', BV, BF, bloom, nobake=1, mat='blossom')


def stone_lantern(B, x, y, s, stone, glow_col):
    z = 0
    parts = [(.10, .08, 'c'), (.05, .55, 'c'), (.20, .07, 'b'), (.17, .20, 'lamp'), (.30, .06, 'roof'), (.06, .08, 'c')]
    for i, (r, h, kind) in enumerate(parts):
        rr, hh = r * s, h * s
        if kind == 'c':
            B.cyl(f'toro_{x}_{i}', rr, hh, (x, y, z + hh / 2), stone, seg=8)
        elif kind == 'b':
            B.box(f'toro_{x}_{i}', (rr * 2, rr * 2, hh), (x, y, z + hh / 2), stone, bevel=.01 * s)
        elif kind == 'lamp':
            for dx in (-1, 1):
                for dy in (-1, 1):
                    B.box(f'toro_{x}_{i}_{dx}{dy}', (.04 * s, .04 * s, hh), (x + dx * rr * .8, y + dy * rr * .8, z + hh / 2), stone)
            B.box(f'EMIT_toro_{x}', (rr * 1.3, rr * 1.3, hh * .8), (x, y, z + hh / 2), m_flat('toro_glow', glow_col, emit=glow_col, strength=18),
                  **emit_props(glow_col, 7, 'flicker'))
        elif kind == 'roof':
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=rr, radius2=rr * .15, depth=hh * 2.2)
            bmesh.ops.translate(bm, vec=Vector((x, y, z + hh)), verts=bm.verts)
            B.mesh(f'toro_{x}_roof', bm, stone)
            hh = hh * 2
        z += hh


# ================================================================ ATELIER
def build_atelier(supports):
    c = coll('ENV_ATELIER')
    B = Builder(c)
    floor = m_wood('floor_wood', (.030, .014, .007), (.11, .055, .026), scale=10, rough=.25)
    timber = m_wood('timber', (.018, .009, .005), (.07, .036, .018), scale=14, rough=.5, stretch=(1, 1, 12))
    table = m_wood('table_wood', (.035, .017, .008), (.13, .065, .03), scale=9, rough=.35)
    plaster = m_noise('plaster', (.16, .11, .07), (.26, .19, .12), scale=5, rough=.95)
    shoji = m_paper('shoji_paper', (.55, .45, .32), (1.0, .55, .24), .32)
    shoji_night = m_paper('shoji_moon', (.35, .38, .45), (.3, .45, .85), .12)
    tatami = m_noise('tatami', (.25, .20, .09), (.38, .31, .15), scale=120, rough=.8, detail=2)
    stone = m_noise('stone', (.05, .05, .052), (.16, .155, .15), scale=9, rough=.8)
    moss = m_noise('moss', (.01, .03, .008), (.05, .09, .02), scale=14, rough=.9)
    gravel = m_noise('gravel', (.05, .05, .06), (.16, .16, .18), scale=90, rough=.9, detail=3)
    water = m_flat('pond', (.004, .008, .012), rough=.05)
    iron = m_noise('iron_tools', (.02, .02, .022), (.09, .085, .08), scale=40, rough=.55, metal=.8)
    bark = m_noise('bark', (.02, .012, .01), (.06, .04, .03), scale=30, rough=.9)
    cloth = m_wave_cloth('indigo_cloth', (.006, .01, .03), (.12, .15, .22))
    paper_scroll = m_noise('scroll_paper', (.55, .47, .33), (.72, .64, .47), scale=30, rough=.9)
    ink = m_flat('ink', (.01, .01, .012), rough=.7)
    ceramic = m_noise('ceramic', (.01, .012, .016), (.08, .09, .1), scale=18, rough=.25, metal=.2)
    pine = m_flat('pine', (.012, .03, .016), rough=.9)
    bloom = m_flat('blossom', (.95, .72, .78), rough=.7)

    # --- floor planks (x-running), gaps between planks
    y = -4.2
    i = 0
    while y < 3.62:
        w = rnd.uniform(.16, .24)
        xs = -5.2
        while xs < 5.2:
            ln = rnd.uniform(1.8, 3.6)
            x1 = min(5.2, xs + ln)
            B.box(f'plank_{i}', (x1 - xs - .004, w - .005, .04), ((xs + x1) / 2, y + w / 2, -.02 + rnd.uniform(-.0015, .0015)), floor, bevel=.003)
            xs = x1
            i += 1
        y += w
    # --- tatami (right rear, beside the forge)
    for k, (x, yy) in enumerate([(2.35, 2.1), (2.35, 1.2)]):
        B.box(f'tatami_{k}', (1.75, .88, .05), (x, yy, .025), tatami, bevel=.01)
        B.box(f'tatami_edge_{k}', (1.76, .04, .052), (x, yy + .44, .026), m_flat('heri', (.01, .015, .03), rough=.7))

    # --- structure
    H = 3.2
    for x in (-5.0, -2.4, .7, 2.4, 5.0):
        B.box(f'pillar_b_{x}', (.17, .17, H), (x, 3.62, H / 2), timber, bevel=.012)
    for y in (-3.8, -1.2, 1.2):
        for x in (-5.0, 5.0):
            B.box(f'pillar_s_{x}_{y}', (.17, .17, H), (x, y, H / 2), timber, bevel=.012)
    B.box('beam_back', (10.3, .2, .26), (0, 3.62, 2.35), timber, bevel=.012)
    B.box('beam_top', (10.3, .22, .3), (0, 3.62, H - .15), timber, bevel=.012)
    for x in (-5.0, 5.0):
        B.box(f'beam_side_{x}', (.2, 7.8, .28), (x, -.1, 2.35), timber, bevel=.012)
    for k in range(9):
        B.box(f'rafter_{k}', (.14, 8.0, .18), (-4.8 + k * 1.2, -.1, H + .05), timber, bevel=.01)
    B.box('ceiling', (10.4, 8.0, .03), (0, -.1, H + .16), timber)
    B.box('wall_front', (10.4, .1, H), (0, -3.95, H / 2), plaster)
    # left wall: plaster + shoji band
    B.box('wall_left', (.08, 7.6, H), (-5.08, -.1, H / 2), plaster)
    # right wall: plaster (forge wall) with small high window glow
    B.box('wall_right', (.08, 7.6, H), (5.08, -.1, H / 2), plaster)
    # back wall above the opening
    B.box('ranma', (10.2, .06, H - 2.48), (0, 3.66, 2.48 + (H - 2.48) / 2), plaster)
    # back: shoji screens right of the opening (backlit)
    def shoji_panel(name, x, y, w, h, z0, paper):
        B.box(name + '_paper', (w, .012, h), (x, y, z0 + h / 2), paper)
        B.box(name + '_frame_l', (.045, .05, h), (x - w / 2, y - .01, z0 + h / 2), timber)
        B.box(name + '_frame_r', (.045, .05, h), (x + w / 2, y - .01, z0 + h / 2), timber)
        B.box(name + '_frame_t', (w, .05, .05), (x, y - .01, z0 + h), timber)
        B.box(name + '_frame_b', (w, .05, .08), (x, y - .01, z0 + .04), timber)
        for k in range(1, 4):
            B.box(name + f'_kv{k}', (.016, .03, h), (x - w / 2 + w * k / 4, y - .01, z0 + h / 2), timber)
        for k in range(1, 7):
            B.box(name + f'_kh{k}', (w, .03, .016), (x, y - .01, z0 + h * k / 7), timber)
    shoji_panel('shoji_r1', 1.13, 3.58, .86, 2.3, .02, shoji)
    shoji_panel('shoji_r2', 1.98, 3.58, .86, 2.3, .02, shoji)
    # slid-open panels, stacked left of the opening
    shoji_panel('shoji_l1', -2.83, 3.50, .86, 2.3, .02, shoji_night)
    shoji_panel('shoji_l2', -3.73, 3.58, .86, 2.3, .02, shoji_night)
    shoji_panel('shoji_l3', -4.55, 3.50, .86, 2.3, .02, shoji_night)
    # forge-side back wall section with a blade rack and a calligraphy scroll
    B.box('wall_back_r', (2.55, .06, 2.4), (3.72, 3.66, 1.2), plaster)
    B.box('rack_rail_1', (2.0, .06, .06), (3.65, 3.55, 1.95), timber, bevel=.008)
    B.box('rack_rail_2', (2.0, .06, .06), (3.65, 3.55, 1.1), timber, bevel=.008)
    for k in range(6):
        x = 2.9 + k * .3
        B.box(f'rack_blade_{k}', (.03, .012, 1.05 - (k % 2) * .12), (x, 3.52, 1.5), iron)
        B.box(f'rack_hilt_{k}', (.036, .03, .26), (x, 3.52, 2.13 - (k % 2) * .06), m_flat('rack_hilt', (.01, .012, .02), rough=.6))
    # hanging scroll with an ensō (the infinite circle)
    B.box('scroll_paper_back', (.62, .015, 1.5), (-3.7, 3.55, 1.65), paper_scroll)
    B.cyl('scroll_rod_t', .018, .72, (-3.7, 3.53, 2.42), timber, rot=(0, math.pi / 2, 0))
    B.cyl('scroll_rod_b', .022, .72, (-3.7, 3.53, .9), timber, rot=(0, math.pi / 2, 0))
    pts = []
    for i in range(80):
        t = i / 79
        a = math.pi * .35 + t * math.pi * 1.86
        pts.append(Vector((-3.7 + .21 * math.cos(a), 3.538, 1.82 + .21 * math.sin(a))))
    v, f, uv = sweep(pts, lambda u: .018 * (1.1 - .9 * u ** 2) + .004, 8, flat=(1, .15))
    B.poly('enso', v, f, ink)
    # --- engawa + railing + garden
    B.box('engawa', (5.4, 1.2, .08), (-.9, 4.25, -.04), floor, bevel=.004)
    for x in (-3.4, -1.9, -.4, 1.1):
        B.box(f'rail_post_{x}', (.07, .07, .62), (x, 4.78, .31), timber, bevel=.006)
    B.box('rail_top', (5.0, .07, .06), (-1.15, 4.78, .62), timber, bevel=.006)
    B.box('rail_mid', (5.0, .04, .04), (-1.15, 4.78, .32), timber)
    B.box('garden_ground', (18, 12, .1), (-1, 10.5, -.35), gravel)
    B.box('pond', (7, 4.6, .02), (-1.2, 7.3, -.26), water, nobake=1, mat='water')
    for k in range(34):
        a = rnd.random() * math.pi * 2
        rr = rnd.uniform(.3, .9)
        x, y = -1.2 + math.cos(a) * rnd.uniform(3.4, 4.2), 7.3 + math.sin(a) * rnd.uniform(2.2, 2.8)
        B.sphere(f'rock_{k}', rr * .5, (x, y, -.3), stone, scale=(rnd.uniform(.9, 1.6), rnd.uniform(.8, 1.3), rnd.uniform(.4, .8)), seg=9)
        if rnd.random() < .6:
            B.sphere(f'mossmound_{k}', rr * .45, (x + .2, y + .25, -.28), moss, scale=(1.3, 1.1, .35), seg=10)
    stone_lantern(B, 1.6, 5.9, 1.25, stone, (1.0, .6, .25))
    stone_lantern(B, -4.2, 9.2, 1.4, stone, (1.0, .6, .25))
    # rock waterfall at the back-left of the pond
    for k in range(9):
        B.sphere(f'fall_rock_{k}', rnd.uniform(.5, 1.0), (-5.6 + rnd.uniform(-.8, .8), 10.6 + rnd.uniform(-.4, .6), -.2 + k * .32), stone,
                 scale=(rnd.uniform(1.2, 1.8), 1.0, rnd.uniform(.6, .9)), seg=10)
    for k in range(5):
        B.sphere(f'fall_moss_{k}', .5, (-5.6 + rnd.uniform(-.7, .7), 10.3, .3 + k * .5), moss, scale=(1.4, 1.0, .3), seg=10)
    fall_col = (.55, .75, 1.0)
    for k in range(7):
        B.box(f'EMIT_fall_water_{k}', (.05, .02, 2.6), (-5.25 + k * .06, 9.95, .95), m_flat('fall_water', fall_col, emit=fall_col, strength=3),
              **emit_props(fall_col, .9, 'fall'))
    # bamboo only at the edges of the view
    for k in range(26):
        x = rnd.choice([rnd.uniform(-9, -6.5), rnd.uniform(4.2, 7)])
        B.cyl(f'bamboo_{k}', .035, 6, (x, rnd.uniform(9, 13), 2.7), m_flat('bamboo_stalk', (.05, .08, .04), rough=.5), seg=8)
    # arched bridge across the pond
    red = m_noise('bridge_lacquer', (.12, .02, .015), (.25, .05, .03), scale=20, rough=.5)
    for k in range(15):
        t = k / 14
        x = -3.4 + t * 3.2
        z = .05 + .55 * math.sin(t * math.pi)
        B.box(f'bridge_plank_{k}', (.2, 1.1, .05), (x, 7.4, z), m_wood('bridge_wood', (.05, .03, .02), (.12, .07, .04), scale=12, rough=.6), rot=(0, -math.cos(t * math.pi) * .5, 0))
    for side in (-1, 1):
        pts = [Vector((-3.4 + t / 20 * 3.2, 7.4 + side * .55, .5 + .55 * math.sin(t / 20 * math.pi))) for t in range(21)]
        v, f, uv = sweep(pts, lambda u: .028, 8)
        B.poly(f'bridge_rail_{side}', v, f, red)
        for k in range(5):
            t = k / 4
            B.cyl(f'bridge_post_{side}_{k}', .03, .5, (-3.4 + t * 3.2, 7.4 + side * .55, .28 + .55 * math.sin(t * math.pi)), red, seg=8)
    stone_lantern(B, -1.6, 10.8, 1.1, stone, (1.0, .6, .25))
    stone_lantern(B, 2.9, 7.8, .9, stone, (1.0, .6, .25))
    # pines: layered pads
    for k, (x, y, h) in enumerate([(3.2, 9.5, 2.6), (-6.2, 10.5, 3.2), (-4.4, 6.2, 1.6)]):
        pts = [Vector((x, y, -.3)), Vector((x + .2, y, h * .4)), Vector((x - .1, y + .1, h * .8)), Vector((x + .3, y, h))]
        v, f, uv = sweep(pts, lambda u: .12 * (1 - .6 * u), 8)
        B.poly(f'pine_trunk_{k}', v, f, bark)
        for j in range(11):
            B.sphere(f'pine_pad_{k}_{j}', rnd.uniform(.35, .65), (x + rnd.uniform(-1.2, 1.2), y + rnd.uniform(-.5, .5), h * rnd.uniform(.5, 1.08)), pine,
                     scale=(1.7, 1.2, .33), seg=18, nobake=1, mat='pine')
    # sakura tree (garden) and the vase branch (interior)
    blossom_branch(B, Vector((-2.8, 8.2, -.3)), Vector((.2, 0, 1)), 3.2, 11, bark, bloom, name='sakura_tree')
    blossom_branch(B, Vector((-.6, 6.6, -.3)), Vector((-.3, .2, 1)), 2.4, 17, bark, bloom, name='sakura_tree2')
    # ---- THE PORTAL: a ring of light in the garden (entrance to the Infinite Vault)
    ring_col = (.25, .95, 1.0)
    B.torus('EMIT_portal_ring', 1.05, .035, (-.55, 12.2, 2.35), m_flat('portal_ring', ring_col, emit=ring_col, strength=40), axis='Y', seg=160, sides=10,
            **emit_props(ring_col, 9, 'portal'))
    B.torus('portal_frame', 1.12, .06, (-.55, 12.25, 2.35), stone, axis='Y', seg=96)
    for k in range(9):
        x = -.55 + (k - 4) * .12
        B.box(f'EMIT_portal_fall_{k}', (.012, .012, 2.0), (x, 12.2, .45 + rnd.uniform(-.1, .1)), m_flat('portal_ring', ring_col, emit=ring_col, strength=40),
              **emit_props(ring_col, 4, 'fall'))
    # moon
    B.sphere('EMIT_moon', 1.6, (-3.2, 42, 6.8), m_flat('moon', (.8, .86, 1), emit=(.75, .85, 1), strength=6), seg=24, **emit_props((.75, .85, 1.0), 3.2))

    # --- work table and the stand
    B.box('table_top', (2.3, 1.15, .07), (0, 0, .415), table, bevel=.008)
    for dx in (-1.02, 1.02):
        B.box(f'table_leg_{dx}', (.12, .95, .38), (dx, 0, .19), table, bevel=.01)
    katana_stand(B, supports, m_wood('stand_wood', (.02, .011, .007), (.075, .04, .022), scale=16, rough=.38, stretch=(14, 1, 1)))
    # indigo cloth, draped over the table front-left
    V, F = [], []
    nx, ny = 36, 26
    for j in range(ny + 1):
        for i2 in range(nx + 1):
            u, v = i2 / nx, j / ny
            x = -1.05 + u * .75
            yy = -.62 + v * .6
            z = .452 + .018 * math.sin(u * 9 + v * 4) * math.sin(v * 7) + .012 * math.sin(u * 23)
            if yy < -.56:
                z -= (-.56 - yy) * 6
                yy = -.56 - (-.56 - yy) * .2
            V.append(Vector((x, yy, z)))
    for j in range(ny):
        for i2 in range(nx):
            a = j * (nx + 1) + i2
            F.append((a, a + 1, a + nx + 2, a + nx + 1))
    o = B.poly('cloth', V, F, cloth)
    sol = o.modifiers.new('solid', 'SOLIDIFY')
    sol.thickness = .004
    # scroll (makimono), bowl, tools box, hammers
    B.cyl('makimono', .03, .5, (.78, -.3, .482), paper_scroll, rot=(0, math.pi / 2, .25))
    B.cyl('makimono_cap', .032, .03, (.52, -.37, .482), timber, rot=(0, math.pi / 2, .25))
    B.cyl('bowl', .09, .07, (.9, .25, .487), ceramic, r2=.075, seg=32)
    B.cyl('bowl_water', .082, .005, (.9, .25, .515), water, seg=32, nobake=1, mat='water')
    B.box('toolbox', (.5, .26, .1), (-.72, .32, .5), timber, bevel=.006)
    for k in range(4):
        B.cyl(f'tool_{k}', .012, .34, (-.85 + k * .09, .32, .56), iron, rot=(0, math.pi / 2 - .1, .3 + k * .05))
    B.cyl('hammer_handle', .016, .42, (-.55, -.42, .47), timber, rot=(0, math.pi / 2, -.5))
    B.box('hammer_head', (.06, .06, .15), (-.37, -.51, .48), iron, rot=(0, 0, -.5), bevel=.006)
    # petals on table/floor
    for k in range(60):
        x, yy = rnd.uniform(-1.1, 1.1), rnd.uniform(-.55, .55)
        z = .4535
        if rnd.random() < .45:
            x, yy, z = rnd.uniform(-2.5, 2.5), rnd.uniform(-2.2, 2.4), .002
        B.sphere(f'petal_{k}', .008, (x, yy, z), bloom, scale=(1, .6, .08), seg=6, nobake=1, mat='blossom')
    # --- vase with blossoms (left)
    B.box('vase_stand', (.36, .36, .12), (-1.95, .9, .06), timber, bevel=.01)
    rings = []
    prof = [(0, .08), (.03, .12), (.18, .16), (.34, .13), (.42, .065), (.46, .06), (.48, .075)]
    for z, r in prof:
        rings.append([Vector((-1.95 + r * math.cos(a / 24 * 2 * math.pi), .9 + r * math.sin(a / 24 * 2 * math.pi), .12 + z)) for a in range(24)])
    v, f, uv = loft(rings, cap0=True)
    B.poly('vase', v, f, ceramic)
    blossom_branch(B, Vector((-1.95, .9, .58)), Vector((.35, -.2, 1)), .9, 3, bark, bloom, name='vase_branch')
    blossom_branch(B, Vector((-1.95, .9, .58)), Vector((-.5, .1, .8)), .75, 5, bark, bloom, name='vase_branch2')
    # --- andon lanterns with mon
    andon_col = (1.0, .55, .22)
    for k, (x, y, s) in enumerate([(1.75, -.35, 1.0), (-3.2, 2.3, .9), (3.9, -.9, .9)]):
        B.box(f'andon_base_{k}', (.34 * s, .34 * s, .06), (x, y, .03), timber, bevel=.006)
        for dx in (-1, 1):
            for dy in (-1, 1):
                B.box(f'andon_post_{k}{dx}{dy}', (.03, .03, .62 * s), (x + dx * .15 * s, y + dy * .15 * s, .06 + .31 * s), timber)
        B.box(f'andon_top_{k}', (.36 * s, .36 * s, .03), (x, y, .06 + .62 * s), timber)
        B.box(f'EMIT_andon_{k}', (.27 * s, .27 * s, .5 * s), (x, y, .06 + .31 * s), m_paper('andon_paper', (.9, .72, .45), andon_col, 9),
              **emit_props(andon_col, 3.4, 'flicker'))
    # candles on the back rack shelf
    for k in range(5):
        x = 2.9 + k * .38
        B.cyl(f'candle_{k}', .018, .09, (x, 3.4, 2.36), m_flat('wax', (.8, .75, .6)), seg=10)
        B.sphere(f'EMIT_flame_{k}', .012, (x, 3.4, 2.43), m_flat('flame', (1, .6, .2), emit=(1, .55, .2), strength=30), scale=(1, 1, 2), seg=8,
                 **emit_props((1, .55, .2), 12, 'flicker'))
    B.box('candle_shelf', (2.2, .22, .04), (3.65, 3.42, 2.3), timber, bevel=.006)
    # --- forge (hodo)
    clay = m_noise('forge_clay', (.06, .04, .03), (.16, .11, .08), scale=12, rough=.95)
    B.box('forge_body', (1.3, .9, .6), (3.95, 1.9, .3), clay, bevel=.03)
    B.box('forge_hood', (1.2, .8, .9), (4.05, 2.2, 2.25), clay, bevel=.03)
    B.box('forge_flue', (.5, .5, 1.2), (4.2, 2.3, 3.0), clay)
    coal_col = (1.0, .32, .05)
    B.box('EMIT_forge_coals', (.62, .42, .05), (3.85, 1.85, .61), m_flat('coals', (.2, .05, .01), emit=coal_col, strength=40), **emit_props(coal_col, 10, 'forge'))
    for k in range(40):
        B.sphere(f'coal_{k}', rnd.uniform(.02, .04), (3.85 + rnd.uniform(-.28, .28), 1.85 + rnd.uniform(-.18, .18), .64), m_flat('coal_black', (.02, .015, .012), rough=.9), seg=6)
    B.box('fuigo', (.42, 1.0, .5), (4.72, 1.9, .25), timber, bevel=.01)
    B.box('anvil_block', (.34, .34, .42), (3.2, 1.0, .21), timber, bevel=.02)
    B.box('anvil', (.26, .14, .14), (3.2, 1.0, .49), iron, bevel=.01)
    B.cyl('quench_tub', .26, .35, (4.3, .6, .175), timber, seg=28)
    B.cyl('quench_water', .24, .01, (4.3, .6, .34), water, seg=28, nobake=1, mat='water')
    for k in range(3):
        B.cyl(f'tongs_{k}', .01, .8, (4.95, 1.2 + k * .12, 1.2), iron, rot=(.08 * k, 0, 0))
    return c


# ================================================================ INFINITE VAULT
def build_vault(supports):
    c = coll('ENV_VAULT')
    B = Builder(c)
    basalt = m_noise('basalt', (.012, .013, .016), (.05, .055, .06), scale=4, rough=.35)
    basalt_r = m_noise('basalt_rough', (.02, .021, .024), (.07, .07, .075), scale=16, rough=.8)
    floor = m_noise('vault_floor', (.006, .007, .009), (.03, .032, .036), scale=2.5, rough=.12)
    metal = m_flat('vault_metal', (.05, .055, .06), rough=.3, metal=1)
    cyan = (.18, .9, 1.0)
    amber = (1.0, .45, .12)
    m_cyan = m_flat('v_cyan', cyan, emit=cyan, strength=30)
    m_amber = m_flat('v_amber', amber, emit=amber, strength=30)
    # floor tiles with grooves
    for i in range(-6, 7):
        for j in range(-3, 12):
            B.box(f'vtile_{i}_{j}', (1.99, 1.99, .06), (i * 2, j * 2, -.03), floor)
    # central processional line
    B.box('EMIT_v_path', (.03, 22, .004), (0, 9, .002), m_cyan, **emit_props(cyan, 2.5, 'pulse'))
    # stepped plinth
    for k, (w, d, h, z) in enumerate([(3.4, 1.9, .12, .06), (2.7, 1.35, .12, .18), (1.9, .78, .2, .34)]):
        B.box(f'plinth_{k}', (w, d, h), (0, 0, z), basalt, bevel=.01)
        B.box(f'EMIT_plinth_line_{k}', (w - .1, .008, .008), (0, -d / 2 - .002, z + h / 2 - .02), m_cyan, **emit_props(cyan, 3))
    # the katana floats on two slim cradles above the plinth top (z=.44)
    for i, (p, s) in enumerate(supports):
        x = HOME.x + p.x
        zt = HOME.z + p.z
        B.box(f'v_cradle_{i}', (.018, .05, zt - .44 - .006), (x, 0, .44 + (zt - .44 - .006) / 2), metal, bevel=.003)
        B.box(f'EMIT_v_cradle_tip_{i}', (.022, .07, .006), (x, 0, zt - .003), m_cyan, **emit_props(cyan, 5))
    # monolith avenue: memories of past lives
    for side in (-1, 1):
        for k in range(9):
            y = -1.5 + k * 2.3
            h = 3.6 + (k % 3) * .9 + rnd.uniform(-.3, .3)
            x = side * (3.4 + (k % 2) * .25)
            B.box(f'mono_{side}_{k}', (.8, .26, h), (x, y, h / 2), basalt_r, rot=(0, 0, side * .06), bevel=.015)
            col, mm = (amber, m_amber) if (k + (side > 0)) % 4 == 0 else (cyan, m_cyan)
            B.box(f'EMIT_mono_slit_{side}_{k}', (.012, .012, h * .78), (x - side * .13, y - .14, h * .47), mm, **emit_props(col, 4, 'memory'))
            for g in range(4):
                B.box(f'mono_glyph_{side}_{k}_{g}', (.34, .02, .015), (x, y - .135, 1.0 + g * .22 + (k % 2) * .1), metal)
    # the monumental ring
    ring_z, ring_y = 4.1, 9.0
    for k in range(28):
        a = k / 28 * 2 * math.pi
        x, z = 3.9 * math.cos(a), ring_z + 3.9 * math.sin(a)
        if z < .3:
            continue
        B.box(f'ring_block_{k}', (.62, .8, .78), (x, ring_y, z), basalt, rot=(0, -a, 0), bevel=.02)
    B.torus('EMIT_v_ring', 3.45, .04, (0, ring_y - .2, ring_z), m_cyan, axis='Y', seg=200, sides=10, **emit_props(cyan, 7, 'ring'))
    B.torus('DYN_v_ring_inner', 3.05, .018, (0, ring_y - .15, ring_z), m_cyan, axis='Y', seg=200, sides=8, arc=.82, **emit_props(cyan, 5, 'spin'))
    B.torus('DYN_v_ring_amber', 2.7, .012, (0, ring_y - .1, ring_z), m_amber, axis='Y', seg=160, sides=8, arc=.55, **emit_props(amber, 5, 'spin2'))
    B.sphere('DYN_v_core', .55, (0, ring_y, ring_z), m_flat('v_core', (1, .6, .3), emit=amber, strength=12), seg=32, **emit_props(amber, 2.2, 'core'))
    # waterfalls of light under the ring
    for k in range(15):
        x = (k - 7) * .22
        B.box(f'EMIT_v_fall_{k}', (.01, .01, ring_z - 1.2), (x, ring_y - .3, (ring_z - 1.2) / 2 + .1), m_cyan, **emit_props(cyan, 2.2, 'fall'))
    # far wall of fins
    for k in range(40):
        x = -20 + k
        h = 12 + math.sin(k * 1.7) * 3
        B.box(f'fin_{k}', (.3, .8, h), (x, 20, h / 2), basalt_r)
    # overhead halo frame
    for k, (sx, sy, x, y) in enumerate([(5.2, .05, 0, -1.3), (5.2, .05, 0, 1.3), (.05, 2.6, -2.6, 0), (.05, 2.6, 2.6, 0)]):
        B.box(f'EMIT_halo_{k}', (sx, sy, .03), (x, y, 5.2), m_flat('v_white', (.8, .95, 1), emit=(.75, .92, 1), strength=25), **emit_props((.75, .92, 1.0), 4))
    return c
