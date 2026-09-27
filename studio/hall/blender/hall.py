# CALDAS STUDIO — The Exposition hall. Blender Z-up; the visitor walks along +Y.
# Builds the nave, 18 niches, the SŌKAI dais (with the real katana), the apse; lights, bakes, exports.
import sys, os, math, time, random
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
import numpy as np
from mathutils import Vector

OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out_hall'))
RES = int(os.environ.get('RES', 4096))
SPP = int(os.environ.get('SPP', 512))
STAGE = os.environ.get('STAGE', 'bake')
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

import katana
import env as E
from env import Builder, m_noise, m_flat, m_wood, emit_props, _n, ramp
from common import obj_from, loft, sweep, superellipse

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == 'METAL'
sc.cycles.device = 'GPU'
rnd = random.Random(11)

NICHES = 9                       # per side
Y0, DY = 8.0, 6.0                # first niche centre, spacing
HALF = 4.0                       # nave half width
NX = 5.1                         # niche back wall
ZC = 9.0                         # ceiling
APSE_Y = Y0 + DY * (NICHES - 1) + 6.0
DAIS = Vector((0, 0, 0))
KHOME = Vector((.24, 0, 1.13))   # katana origin (habaki) on the dais

C = bpy.data.collections.new('HALL')
sc.collection.children.link(C)
B = Builder(C)


# ---------------------------------------------------------------- materials
def m_stone_floor():
    def b(nt, bs):
        tc = nt.nodes.new('ShaderNodeTexCoord')
        vor = _n(nt, 'ShaderNodeTexVoronoi')
        vor.inputs['Scale'].default_value = .45
        nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
        nz = _n(nt, 'ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = 3.5
        nz.inputs['Detail'].default_value = 10
        nz.inputs['Distortion'].default_value = 2.5
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        wv = _n(nt, 'ShaderNodeTexWave')
        wv.inputs['Scale'].default_value = 1.2
        wv.inputs['Distortion'].default_value = 14
        wv.inputs['Detail'].default_value = 8
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        mx = _n(nt, 'ShaderNodeMix', data_type='FLOAT')
        mx.inputs[0].default_value = .35
        nt.links.new(nz.outputs['Fac'], mx.inputs[2])
        nt.links.new(wv.outputs['Fac'], mx.inputs[3])
        rp = ramp(nt, mx.outputs[0], [(.3, (.006, .006, .006)), (.6, (.016, .015, .014)), (.93, (.05, .045, .04)), (.97, (.14, .12, .1))])
        nt.links.new(rp.outputs[0], bs.inputs['Base Color'])
        bs.inputs['Roughness'].default_value = .2
    return E.nodes_mat('hall_floor', b)


travertine = m_noise('travertine', (.035, .03, .026), (.07, .06, .05), scale=7, rough=.8, detail=9)
oak = m_wood('smoked_oak', (.018, .011, .007), (.06, .038, .022), scale=16, rough=.45, stretch=(1, 1, 10))
plaster = m_noise('hall_plaster', (.03, .027, .024), (.06, .054, .047), scale=4, rough=.9)
niche_back = m_noise('niche_back', (.025, .022, .02), (.05, .045, .04), scale=6, rough=.85)
basalt = m_noise('hall_basalt', (.012, .012, .013), (.05, .048, .046), scale=5, rough=.35)
walnut = m_wood('walnut', (.03, .016, .009), (.1, .055, .03), scale=12, rough=.4, stretch=(14, 1, 1))
floor = m_stone_floor()
brass_flat = m_flat('brass_bake', (.55, .4, .2), rough=.3, metal=1)
art_grey = m_flat('art_grey', (.35, .33, .3), rough=.8)


def brass(name, bm_obj_maker):
    o = bm_obj_maker()
    o['nobake'] = 1
    o['mat'] = 'brass'
    return o


# ---------------------------------------------------------------- floor & structure
L0, L1 = -9.0, APSE_Y + 4.5
# floor slabs (1.5 m tiles with 4 mm joints)
y = L0
i = 0
while y < L1:
    x = -HALF - 1.2
    while x < HALF + 1.2:
        B.box(f'tile_{i}', (1.496, 1.496, .06), (x + .75, y + .75, -.03 + rnd.uniform(-.0008, .0008)), floor)
        x += 1.5
        i += 1
    y += 1.5
# brass inlay along the nave and across at each niche pair
B.box('inlay_axis', (.03, L1 - L0, .004), (0, (L0 + L1) / 2, .0021), brass_flat, nobake=1, mat='brass')
for j in range(NICHES):
    yy = Y0 + DY * j
    B.box(f'inlay_x_{j}', (2 * HALF + 2.2, .03, .004), (0, yy, .0021), brass_flat, nobake=1, mat='brass')

# long walls with niches
for side in (-1, 1):
    # plinth / skirting
    B.box(f'skirt_{side}', (.1, L1 - L0, .25), (side * (HALF + .05), (L0 + L1) / 2, .125), basalt)
    yprev = L0
    for j in range(NICHES + 1):
        yc = Y0 + DY * j if j < NICHES else L1 + 1.7
        a, b = yprev, yc - 1.7
        if b > a:
            B.box(f'wall_{side}_{j}', (.4, b - a, ZC), (side * (HALF + .2), (a + b) / 2, ZC / 2), travertine)
            nsl = int((b - a) / .11)
            for q in range(nsl):
                yq = a + (q + .5) * (b - a) / nsl
                B.box(f'slat_{side}_{j}_{q}', (.05 + .015 * (q % 2), .075, 6.4), (side * (HALF - .02), yq, .25 + 3.2), oak, bevel=.008)
            B.box(f'slat_cap_{side}_{j}', (.1, b - a, .06), (side * (HALF - .03), (a + b) / 2, 6.68), m_flat('brass_bake', (.55, .4, .2), rough=.3, metal=1), nobake=1, mat='brass')
            # pilaster pair framing each niche
            if j < NICHES:
                for py in (yc - 1.72, yc + 1.72):
                    B.box(f'edge_{side}_{j}_{py}', (.03, .03, 5.4), (side * (HALF + .01), py, 2.7), m_flat('brass_bake', (.55, .4, .2), rough=.3, metal=1), nobake=1, mat='brass')
        yprev = yc + 1.7
        if j >= NICHES:
            break
        # the niche itself: floor, back, sides, top (lintel above 5.4 m)
        B.box(f'niche_floor_{side}_{j}', (NX - HALF, 3.4, .1), (side * (HALF + (NX - HALF) / 2), yc, .05), basalt)
        B.box(f'niche_back_{side}_{j}', (.2, 3.4, 5.4), (side * (NX + .1), yc, 2.7), niche_back)
        for sy in (-1, 1):
            B.box(f'niche_side_{side}_{j}_{sy}', (NX - HALF + .4, .2, 5.4), (side * (HALF + (NX - HALF) / 2), yc + sy * 1.8, 2.7), plaster)
        B.box(f'lintel_{side}_{j}', (.4, 3.8, ZC - 5.4), (side * (HALF + .2), yc, 5.4 + (ZC - 5.4) / 2), travertine)
        B.box(f'niche_top_{side}_{j}', (NX - HALF + .4, 3.6, .2), (side * (HALF + (NX - HALF) / 2), yc, 5.5), plaster)
        # artwork: mat (dark), brass frame (nobake), art plane (dynamic texture)
        k = 2 * j + (0 if side < 0 else 1)
        B.box(f'mat_{k}', (.04, 2.72, 3.52), (side * (NX - .02), yc, 2.45), basalt)
        fr = []
        for (w, h, dy, dz) in ((2.9, .09, 0, 1.805), (2.9, .09, 0, -1.805), (.09, 3.7, 1.405, 0), (.09, 3.7, -1.405, 0)):
            B.box(f'frame_{k}_{dy}_{dz}', (.07, w if h < .5 else .09, h if h < .5 else 3.7), (side * (NX - .06), yc + dy, 2.45 + dz), brass_flat, nobake=1, mat='brass')
        art = B.box(f'ART_{k:02d}', (.01, 2.4, 3.2), (side * (NX - .045), yc, 2.45), art_grey, nobake=1, mat='art')
        art['art'] = k
        art['side'] = side
        # small brass plaque
        B.box(f'plaque_{k}', (.02, .42, .12), (side * (NX - .03), yc + 1.0, .85), brass_flat, nobake=1, mat='brass')
        # cove light strip inside the niche head
        B.box(f'EMIT_cove_{k}', (.5, 3.0, .03), (side * (NX - .55), yc, 5.36), m_flat('cove', (1, .8, .6), emit=(1, .78, .55), strength=6),
              **emit_props((1, .78, .55), 2.2))

# entrance wall with tall doors
B.box('entry_wall', (2 * HALF + 1, .4, ZC), (0, L0 - .2, ZC / 2), travertine)
for sx in (-1, 1):
    B.box(f'door_{sx}', (1.2, .12, 4.2), (sx * .62, L0 + .02, 2.1), walnut, bevel=.01)
# apse: half-drum wall and the empty commission frame
seg = 24
for s in range(seg):
    a0 = math.pi * s / seg
    a = a0 + math.pi / seg / 2
    B.box(f'apse_{s}', (.4, 2 * 4.3 * math.sin(math.pi / seg / 2) + .06, ZC), (math.cos(a) * 4.5, APSE_Y + math.sin(a) * 4.5, ZC / 2), travertine,
          rot=(0, 0, a))
B.box('apse_floor_step', (7.0, 3.0, .16), (0, APSE_Y + 1.2, .08), basalt, bevel=.01)
B.box('cta_mat', (3.2, .04, 4.2), (0, APSE_Y + 4.25, 2.8), basalt)
for (w, h, dx, dz) in ((3.5, .1, 0, 2.15), (3.5, .1, 0, -2.15), (.1, 4.4, 1.7, 0), (.1, 4.4, -1.7, 0)):
    B.box(f'cta_frame_{dx}_{dz}', (w, .08, h), (dx, APSE_Y + 4.18, 2.8 + dz), brass_flat, nobake=1, mat='brass')
B.box('EMIT_cta_glow', (2.9, .02, 3.8), (0, APSE_Y + 4.22, 2.8), m_flat('cta_glow', (.9, .7, .4), emit=(1, .76, .45), strength=1.2),
      **emit_props((1, .76, .45), .35, 'breathe'))
art = B.box('ART_CTA', (2.9, .01, 3.8), (0, APSE_Y + 4.2, 2.8), art_grey, nobake=1, mat='art')
art['art'] = 99

# ceiling: coffers + skylight slot
B.box('ceiling', (2 * HALF + 1.4, L1 - L0 + 2, .3), (0, (L0 + L1) / 2, ZC + .15), plaster)
for j in range(int((L1 - L0) / 3) + 1):
    yy = L0 + j * 3
    B.box(f'beam_{j}', (2 * HALF + .8, .35, .6), (0, yy, ZC - .3), travertine, bevel=.02)
for sx in (-1, 1):
    B.box(f'beamL_{sx}', (.35, L1 - L0, .6), (sx * 1.3, (L0 + L1) / 2, ZC - .3), travertine)
B.box('EMIT_lightline', (.08, L1 - L0 - 4, .02), (0, (L0 + L1) / 2, ZC - .62), m_flat('lightline', (1, .8, .6), emit=(1, .8, .6), strength=14),
      **emit_props((1, .8, .6), 3))

# benches
for yy in (Y0 + DY * 1 + 3, Y0 + DY * 3 + 3, Y0 + DY * 5 + 3, Y0 + DY * 7 + 3):
    B.box(f'bench_top_{yy}', (.55, 2.4, .08), (0, yy, .46), walnut, bevel=.01)
    for dy in (-.95, .95):
        B.box(f'bench_leg_{yy}_{dy}', (.5, .1, .42), (0, yy + dy, .21), basalt, bevel=.01)

# ---------------------------------------------------------------- SŌKAI dais
for k2, (r, h, z) in enumerate(((2.3, .08, .04), (1.8, .1, .13))):
    B.cyl(f'dais_{k2}', r, h, (0, 0, z), basalt, seg=96)
B.box('dais_plinth', (1.5, .5, .84), (0, 0, .18 + .42), basalt, bevel=.012)
B.box('EMIT_dais_line', (1.46, .006, .006), (0, -.253, .96), m_flat('cyan_line', (.2, .9, 1), emit=(.2, .9, 1), strength=20), **emit_props((.2, .9, 1), 3.5))
ring_col = (.25, .95, 1.0)
B.torus('EMIT_sokai_ring', 1.35, .03, (0, 1.9, 1.9), m_flat('sokai_ring', ring_col, emit=ring_col, strength=22), axis='Y', seg=160, sides=10, **emit_props(ring_col, 3.2, 'portal'))
B.torus('sokai_ring_frame', 1.43, .055, (0, 1.95, 1.9), basalt, axis='Y', seg=120)
for k2 in range(0):
    x = (k2 - 4) * .12
    B.box(f'EMIT_sokai_fall_{k2}', (.01, .01, 1.1), (x, 1.88, .95), m_flat('sokai_ring', ring_col, emit=ring_col, strength=35), **emit_props(ring_col, 2.5, 'fall'))

# the katana itself, built by the same Blender script as SŌKAI
root, blade_asm, saya_asm = katana.build_katana()
root.location = KHOME
for o in [root] + list(root.children_recursive):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    C.objects.link(o)
# hide the alternate tsuba designs; the hall shows the ∞ guard
for n in ('tsuba_sakura', 'tsuba_nami'):
    ob = bpy.data.objects.get(n)
    if ob:
        for o in [ob] + list(ob.children_recursive):
            o.hide_render = True
# cradle arms under the saya
for p, s in katana.saya_support_points():
    x, zt = KHOME.x + p.x, KHOME.z + p.z
    B.box(f'cradle_{s}', (.02, .06, zt - 1.02 - .004), (x, 0, 1.02 + (zt - 1.02) / 2), m_flat('bronze', (.08, .06, .045), rough=.35, metal=1), nobake=1, mat='bronze')
    B.box(f'EMIT_cradle_{s}', (.024, .08, .006), (x, 0, zt - .003), m_flat('cyan_line', (.2, .9, 1), emit=(.2, .9, 1), strength=20), **emit_props((.2, .9, 1), 4))


# ---------------------------------------------------------------- lights
def light(name, kind, loc, energy, color, size=None, size_y=None, target=None, radius=None):
    ld = bpy.data.lights.new(name, kind)
    ld.energy, ld.color = energy, color
    if kind == 'AREA':
        ld.shape = 'RECTANGLE'
        ld.size, ld.size_y = size, size_y or size
    if radius is not None:
        ld.shadow_soft_size = radius
    o = bpy.data.objects.new(name, ld)
    o.location = loc
    if target is not None:
        o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    C.objects.link(o)
    return o


for side in (-1, 1):
    for j in range(NICHES):
        yc = Y0 + DY * j
        light(f'L_art_{side}_{j}', 'AREA', (side * (HALF - .2), yc, 5.6), 340, (1, .87, .72), size=.35, size_y=2.6, target=(side * NX, yc, 2.2))
        light(f'L_wash_{side}_{j}', 'AREA', (side * (HALF - .4), yc + 3, 8.4), 22, (1, .9, .78), size=1.2, size_y=.6, target=(side * (HALF + .2), yc + 3, 0))
light('L_dais', 'AREA', (0, -.6, 4.2), 180, (1, .93, .85), size=1.6, size_y=.5, target=(0, 0, 1))
light('L_dais_back', 'POINT', (0, 1.8, 1.9), 40, (.3, .9, 1.0), radius=.6)
light('L_cta', 'AREA', (0, APSE_Y - .5, 7.5), 400, (1, .85, .65), size=3.0, size_y=1.0, target=(0, APSE_Y + 4.2, 2.8))
light('L_entry', 'AREA', (0, L0 + 1.5, 7), 60, (.8, .85, 1.0), size=3, size_y=1.5, target=(0, L0 + 4, 0))
world = bpy.data.worlds.new('W')
sc.world = world
world.node_tree.nodes['Background'].inputs[0].default_value = (.004, .005, .008, 1)


def camera(loc, target, lens=24):
    cam = bpy.data.objects.get('CAM') or bpy.data.objects.new('CAM', bpy.data.cameras.new('CAM'))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens
    sc.camera = cam
    return cam


t0 = time.time()
if STAGE == 'preview':
    sc.view_settings.view_transform = 'AgX'
    for n, (loc, tgt) in {'hall_entry': ((0, -7.5, 1.8), (0, 4, 1.6)), 'hall_niche': ((.3, Y0 + DY - .6, 1.75), (-NX, Y0 + DY, 2.4)),
                           'hall_long': ((0, Y0 + 20, 1.7), (0, APSE_Y, 2.5))}.items():
        camera(loc, tgt)
        sc.render.resolution_x, sc.render.resolution_y = 960, 540
        sc.cycles.samples = 64
        sc.cycles.use_denoising = True
        sc.render.filepath = f'{OUT}/prev_{n}.png'
        bpy.ops.render.render(write_still=True)
    print('PREVIEW', round(time.time() - t0))
    sys.exit(0)

# ---------------------------------------------------------------- bake
import build_helpers as H
objs = [o for o in C.objects if o.type == 'MESH']
katana_objs = set(root.children_recursive)
H.apply_modifiers(objs)
static = [o for o in objs if o not in katana_objs and not (o.get('emit') or o.get('nobake') or o.name.startswith('DYN'))]
H.panorama(sc, (KHOME.x - .23, -.05, KHOME.z + .06), f'{OUT}/hall_env.hdr', hide=katana_objs)
j = H.bake(sc, static, RES, SPP, f'{OUT}/hall_lightmap.jpg', 'hall', gain=float(os.environ.get('GAIN', 1.6)))
H.group_nonbaked(C, j)
export = [o for o in bpy.data.objects if o.type in ('MESH', 'EMPTY') and not o.get('cutter')]
H.select_only(export)
bpy.ops.export_scene.gltf(filepath=f'{OUT}/hall.glb', export_format='GLB', use_selection=True, export_apply=True, export_extras=True, export_yup=True,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='NONE', export_lights=False,
                          export_cameras=False, export_meshopt_compression_enable=True)
bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/hall_master.blend')
print('DONE', round(time.time() - t0))
