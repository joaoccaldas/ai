# CALDAS STUDIO — The Museum. A domed atrium (SŌKAI) and five themed rooms, one sculpture per project.
# Blender Z-up. Builds, lights, bakes, renders reflection panoramas, exports GLB + layout JSON.
import sys, os, math, time, random, json
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector, Matrix

OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out_museum'))
RES = int(os.environ.get('RES', 4096))
SPP = int(os.environ.get('SPP', 512))
STAGE = os.environ.get('STAGE', 'bake')
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

import katana
import env as E
from env import Builder, m_noise, m_flat, m_wood, emit_props, _n, ramp
from common import obj_from, loft, sweep, superellipse
import build_helpers as H

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == 'METAL'
sc.cycles.device = 'GPU'
rnd = random.Random(21)
C = bpy.data.collections.new('MUSEUM')
sc.collection.children.link(C)
B = Builder(C)

# ------------------------------------------------------------------ layout
R_ATR = 9.0            # atrium radius
H_ATR = 9.5
DOOR_W, DOOR_H = 4.0, 4.4
U0, U1 = 15.0, 31.0    # room extent along its axis
HALF_V = 5.5           # room half width
H_ROOM = 6.2
WINGS = [
    # key, title, angle (deg), palette
    ('luxury', 'Light & Luxury', 90),
    ('table', 'Table & Cellar', 45),
    ('body', 'Body & Mind', 135),
    ('culture', 'Culture & Code', 0),
    ('nature', 'Nature & Journeys', 180),
]
EXHIBITS = {
    'luxury': ['eclat', 'aurelia', 'lume'],
    'table': ['maison-lumen', 'vin-ra', 'ember-oak'],
    'body': ['den', 'pulse', 'inner-group'],
    'culture': ['studio-nord', 'flowstate', 'volt', 'belong'],
    'nature': ['laurie-hedges', 'wander', 'dunhaven', 'wild-stem'],
}
SLOTS3 = [(18.6, 0.0), (23.0, 0.0), (27.4, 0.0)]
SLOTS4 = [(18.2, -2.3), (21.8, 2.3), (25.4, -2.3), (29.0, 2.3)]


def to_world(angle_deg, u, v):
    a = math.radians(angle_deg)
    ax, ay = math.cos(a), math.sin(a)          # room axis
    px, py = -ay, ax                           # across
    return Vector((ax * u + px * v, ay * u + py * v, 0))


def rot_of(angle_deg):
    return math.radians(angle_deg)


# ------------------------------------------------------------------ materials
def fabric(name, c1, c2):
    return m_noise(name, c1, c2, scale=60, rough=.95, detail=4)


WING_MATS = {
    'luxury': dict(wall=fabric('wall_navy', (.006, .008, .02), (.02, .025, .05)), floor=m_noise('floor_black_marble', (.008, .008, .009), (.06, .06, .065), scale=2.5, rough=.12),
                   trim=m_flat('trim_gold', (.6, .45, .2), rough=.3, metal=1), light=(.85, .9, 1.0)),
    'table': dict(wall=m_noise('wall_terracotta', (.12, .04, .02), (.2, .08, .04), scale=5, rough=.9), floor=m_wood('floor_oak', (.06, .03, .014), (.16, .09, .045), scale=9, rough=.35),
                  trim=m_flat('trim_copper', (.5, .25, .15), rough=.35, metal=1), light=(1.0, .78, .55)),
    'body': dict(wall=m_noise('wall_sage', (.12, .14, .11), (.2, .22, .18), scale=4, rough=.9), floor=m_noise('floor_travertine', (.25, .22, .18), (.4, .36, .3), scale=6, rough=.5),
                 trim=m_flat('trim_brass', (.5, .4, .22), rough=.3, metal=1), light=(1.0, .92, .82)),
    'culture': dict(wall=m_noise('wall_concrete', (.18, .18, .18), (.3, .3, .3), scale=9, rough=.85, detail=8), floor=m_noise('floor_concrete', (.05, .05, .05), (.12, .12, .12), scale=5, rough=.25),
                    trim=m_flat('trim_steel', (.4, .4, .42), rough=.25, metal=1), light=(.95, .97, 1.0)),
    'nature': dict(wall=m_noise('wall_forest', (.012, .03, .02), (.03, .06, .04), scale=5, rough=.9), floor=m_noise('floor_slate', (.02, .022, .025), (.07, .075, .08), scale=4, rough=.4),
                   trim=m_wood('trim_walnut', (.03, .016, .009), (.1, .055, .03), scale=12, rough=.4, stretch=(1, 1, 10)), light=(1.0, .88, .72)),
}
basalt = m_noise('m_basalt', (.012, .012, .013), (.05, .048, .046), scale=5, rough=.35)
stone_light = m_noise('m_limestone', (.3, .28, .25), (.45, .42, .38), scale=5, rough=.7)
oak = m_wood('m_smoked_oak', (.018, .011, .007), (.06, .038, .022), scale=16, rough=.45, stretch=(1, 1, 10))
atr_floor = m_noise('atr_floor', (.01, .01, .011), (.08, .075, .07), scale=1.8, rough=.15)
plaster = m_noise('atr_plaster', (.05, .045, .04), (.1, .09, .08), scale=4, rough=.9)


def P(color, **k):   # placeholder material for dynamic exhibit objects (only its colour matters for bounce light)
    return m_flat('x_' + '_'.join(f'{c:.2f}' for c in color), color, **k)


# ------------------------------------------------------------------ helpers
def lathe(name, prof, center, material, seg=48, phase=None, flat=False, cap_top=True, cap_bot=True, **props):
    rings = []
    for k, (r, z) in enumerate(prof):
        ph = (phase[k] if phase else 0) * math.pi * 2 / seg
        rings.append([Vector((center[0] + r * math.cos(i / seg * 6.2832 + ph), center[1] + r * math.sin(i / seg * 6.2832 + ph), center[2] + z)) for i in range(seg)])
    v, f, uv = loft(rings, closed=True, cap0=cap_bot and prof[0][0] > 0, cap1=cap_top and prof[-1][0] > 0)
    o = B.poly(name, v, f, material, smooth=not flat, **props)
    if flat:
        bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.triangulate(bm, faces=bm.faces[:])
        for fc in bm.faces:
            fc.smooth = False
        bm.to_mesh(o.data); bm.free()
    return o


def ex(slug, **k):
    d = {'exh': slug, 'nobake': 1}
    d.update(k)
    return d


# ------------------------------------------------------------------ atrium
SEG = 32
for s in range(SEG):
    a = 2 * math.pi * (s + .5) / SEG
    deg = math.degrees(a)
    # leave openings for the five corridors and the entrance (south)
    openings = [w[2] for w in WINGS] + [270]
    if any(abs(((deg - o + 180) % 360) - 180) < 11 for o in openings):
        # lintel above the doorway
        B.box(f'atr_lintel_{s}', (.6, 2 * R_ATR * math.sin(math.pi / SEG) + .05, H_ATR - DOOR_H), (math.cos(a) * (R_ATR + .3), math.sin(a) * (R_ATR + .3), DOOR_H + (H_ATR - DOOR_H) / 2), plaster, rot=(0, 0, a))
        continue
    B.box(f'atr_wall_{s}', (.6, 2 * R_ATR * math.sin(math.pi / SEG) + .05, H_ATR), (math.cos(a) * (R_ATR + .3), math.sin(a) * (R_ATR + .3), H_ATR / 2), plaster, rot=(0, 0, a))
    # fluted oak between openings
    for q in range(3):
        aq = a + (q - 1) * (2 * math.pi / SEG) / 3.2
        B.box(f'atr_flute_{s}_{q}', (.08, .13, 6.2), (math.cos(aq) * (R_ATR - .02), math.sin(aq) * (R_ATR - .02), 3.2), oak, rot=(0, 0, aq), bevel=.01)
B.cyl('atr_floor', R_ATR + .6, .1, (0, 0, -.05), atr_floor, seg=96)
# dome: stepped coffered rings closing to an oculus
for k in range(7):
    r0 = R_ATR * math.cos(k / 7 * math.pi / 2 * .88) + .3
    z = H_ATR + R_ATR * .62 * math.sin(k / 7 * math.pi / 2 * .88)
    B.torus(f'dome_ring_{k}', r0, .32, (0, 0, z), plaster, axis='Z', seg=96, sides=8)
    B.cyl(f'dome_band_{k}', r0 + .1, .5, (0, 0, z + .25), plaster, seg=96, r2=max(r0 - .9, 1.6))
B.torus('EMIT_oculus', 1.55, .06, (0, 0, H_ATR + R_ATR * .62 + .1), m_flat('oculus', (.7, .8, 1), emit=(.7, .82, 1), strength=18), axis='Z', seg=96, **emit_props((.7, .82, 1), 3))
B.cyl('EMIT_oculus_sky', 1.5, .02, (0, 0, H_ATR + R_ATR * .62 + .3), m_flat('oculus_sky', (.15, .2, .35), emit=(.18, .24, .42), strength=3), seg=64, **emit_props((.18, .24, .42), .6))
# SŌKAI dais + ring
for k2, (r, h, z) in enumerate(((2.4, .08, .04), (1.9, .1, .13))):
    B.cyl(f'dais_{k2}', r, h, (0, 0, z), basalt, seg=96)
B.box('dais_plinth', (1.5, .5, .84), (0, 0, .6), basalt, bevel=.012)
ring_col = (.25, .95, 1.0)
B.torus('EMIT_sokai_ring', 1.35, .03, (0, 1.9, 1.9), m_flat('sokai_ring', ring_col, emit=ring_col, strength=22), axis='Y', seg=160, sides=10, **emit_props(ring_col, 3.2, 'portal'), exh='sokai')
B.torus('sokai_ring_frame', 1.43, .055, (0, 1.95, 1.9), basalt, axis='Y', seg=120)
KHOME = Vector((.24, 0, 1.13))
root, blade_asm, saya_asm = katana.build_katana()
root.location = KHOME
for o in [root] + list(root.children_recursive):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    C.objects.link(o)
for n in ('tsuba_sakura', 'tsuba_nami'):
    ob = bpy.data.objects.get(n)
    if ob:
        for o in [ob] + list(ob.children_recursive):
            o.hide_render = True
for p, s in katana.saya_support_points():
    x, zt = KHOME.x + p.x, KHOME.z + p.z
    B.box(f'cradle_{s}', (.02, .06, zt - 1.02 - .004), (x, 0, 1.02 + (zt - 1.02) / 2), P((.08, .06, .045), rough=.35, metal=1), **ex('sokai', mat='bronze'))
# entrance vestibule (south)
B.box('vest_floor', (5.4, 7, .1), (0, -R_ATR - 3.2, -.05), atr_floor)
for sx in (-1, 1):
    B.box(f'vest_wall_{sx}', (.4, 7, 5.5), (sx * 2.9, -R_ATR - 3.2, 2.75), plaster)
B.box('vest_ceiling', (6.2, 7, .3), (0, -R_ATR - 3.2, 5.6), plaster)
B.box('vest_door', (5.4, .3, 5.5), (0, -R_ATR - 6.8, 2.75), oak, bevel=.02)
B.box('EMIT_vest_line', (.06, 6.4, .02), (0, -R_ATR - 3.2, 5.43), m_flat('lightline', (1, .8, .6), emit=(1, .8, .6), strength=14), **emit_props((1, .8, .6), 3))
B.box('atr_ceiling_cap', (1, 1, .1), (0, 0, 40), plaster)   # keeps UV packer happy


# ------------------------------------------------------------------ rooms
def room(key, title, ang):
    M = WING_MATS[key]
    rz = rot_of(ang)

    def box(name, size_uvz, cu, cv, cz, material, bevel=0.0, **props):
        w = to_world(ang, cu, cv)
        return B.box(name, size_uvz, (w.x, w.y, cz), material, rot=(0, 0, rz), bevel=bevel, **props)

    # corridor from atrium to room
    L = U0 - R_ATR + .2
    box(f'{key}_cor_floor', (L + .4, DOOR_W + .4, .1), R_ATR - .2 + L / 2, 0, -.05, M['floor'])
    for sv in (-1, 1):
        box(f'{key}_cor_wall_{sv}', (L, .4, DOOR_H + .6), R_ATR + L / 2 - .1, sv * (DOOR_W / 2 + .2), (DOOR_H + .6) / 2, plaster)
    box(f'{key}_cor_ceiling', (L, DOOR_W + .8, .3), R_ATR + L / 2 - .1, 0, DOOR_H + .6, plaster)
    box(f'EMIT_{key}_cor_line', (L - .6, .05, .02), R_ATR + L / 2 - .1, 0, DOOR_H + .44, m_flat('lightline', (1, .8, .6), emit=(1, .8, .6), strength=14), **emit_props((1, .8, .6), 3))
    # room shell
    Lr = U1 - U0
    box(f'{key}_floor', (Lr + .4, 2 * HALF_V + .4, .1), (U0 + U1) / 2, 0, -.05, M['floor'])
    box(f'{key}_ceiling', (Lr + .8, 2 * HALF_V + .8, .3), (U0 + U1) / 2, 0, H_ROOM + .15, plaster)
    box(f'{key}_back', (.4, 2 * HALF_V + .8, H_ROOM), U1 + .2, 0, H_ROOM / 2, M['wall'])
    for sv in (-1, 1):
        box(f'{key}_side_{sv}', (Lr + .8, .4, H_ROOM), (U0 + U1) / 2, sv * (HALF_V + .2), H_ROOM / 2, M['wall'])
        # front wall pieces beside the doorway
        wv = HALF_V - DOOR_W / 2
        box(f'{key}_front_{sv}', (.4, wv, H_ROOM), U0 - .2, sv * (DOOR_W / 2 + wv / 2), H_ROOM / 2, M['wall'])
        # skirting trim
        box(f'{key}_skirt_{sv}', (Lr, .06, .18), (U0 + U1) / 2, sv * (HALF_V - .03), .09, M['trim'], nobake=1, mat='trim_' + key)
    box(f'{key}_front_top', (.4, DOOR_W, H_ROOM - DOOR_H), U0 - .2, 0, DOOR_H + (H_ROOM - DOOR_H) / 2, M['wall'])
    # coffered ceiling with two long light troughs
    for q in range(int(Lr / 2) + 1):
        box(f'{key}_beam_{q}', (.18, 2 * HALF_V, .35), U0 + q * 2, 0, H_ROOM - .17, plaster)
    for sv in (-1, 1):
        box(f'EMIT_{key}_trough_{sv}', (Lr - 1, .12, .02), (U0 + U1) / 2, sv * 2.6, H_ROOM - .36, m_flat('trough', M['light'], emit=M['light'], strength=5), **emit_props(M['light'], 1.1))
    # a bench at the back of the room
    box(f'{key}_bench', (.5, 2.4, .08), U1 - 1.4, 0, .46, oak, bevel=.01)
    for sv in (-1, 1):
        box(f'{key}_bench_leg_{sv}', (.46, .1, .42), U1 - 1.4, sv * .95, .21, basalt)
    return M


LAYOUT = {'wings': [], 'exhibits': [], 'atrium': {'r': R_ATR}, 'rooms': {'u0': U0, 'u1': U1, 'half': HALF_V, 'door': DOOR_W}, 'start': [0, -R_ATR - 4.5, 1.65]}
SCULPT = {}


def sculpt(slug):
    def deco(fn):
        SCULPT[slug] = fn
        return fn
    return deco


exec(open(os.path.join(os.path.dirname(__file__), 'museum_sculpt.py')).read())
LIGHTS = []
for key, title, ang in WINGS:
    M = room(key, title, ang)
    slots = SLOTS3 if len(EXHIBITS[key]) == 3 else SLOTS4
    wing = {'key': key, 'title': title, 'angle': ang, 'exhibits': []}
    for i, slug in enumerate(EXHIBITS[key]):
        u, v = slots[i]
        c = to_world(ang, u, v)
        low = slug in ('dunhaven', 'wild-stem', 'belong', 'volt')
        ph = .45 if low else .9
        B.box(f'plinth_{slug}', (1.25, 1.25, ph), (c.x, c.y, ph / 2), basalt if key in ('luxury', 'nature') else stone_light if key == 'body' else basalt, rot=(0, 0, rot_of(ang)), bevel=.015)
        B.box(f'plinth_trim_{slug}', (1.27, 1.27, .02), (c.x, c.y, ph - .01), M['trim'], rot=(0, 0, rot_of(ang)), nobake=1, mat='trim_' + key)
        top = Vector((c.x, c.y, ph))
        SCULPT[slug](top, ang)
        # site panel on the nearest side wall
        side = (1 if v >= 0 else -1) if v != 0 else (1 if i % 2 == 0 else -1)
        pw = to_world(ang, u, side * (HALF_V - .03))
        panel = B.box(f'PANEL_{slug}', (1.5, .02, 2.0), (pw.x, pw.y, 2.15), P((.35, .33, .3)), rot=(0, 0, rot_of(ang)), nobake=1, mat='panel', exh=slug)
        panel['panel'] = 1
        # frame for the panel
        B.box(f'PANEL_frame_{slug}', (1.62, .03, 2.12), (pw.x, pw.y, 2.15), M['trim'], rot=(0, 0, rot_of(ang)), nobake=1, mat='trim_' + key)
        n = to_world(ang, 0, -side)
        LAYOUT['exhibits'].append({'slug': slug, 'wing': key, 'pos': [c.x, c.y, ph], 'panel': [pw.x, pw.y, 2.15], 'panelNormal': [n.x, n.y, 0], 'angle': ang})
        wing['exhibits'].append(slug)
        # lights: a tight spot on the sculpture and a wash on the panel
        sp = to_world(ang, u - 1.2, v * .3)
        LIGHTS.append((f'L_{slug}', (sp.x, sp.y, H_ROOM - .5), (c.x, c.y, ph + .5), M['light']))
        pwl = to_world(ang, u, side * (HALF_V - 1.6))
        LIGHTS.append((f'LP_{slug}', (pwl.x, pwl.y, H_ROOM - .6), (pw.x, pw.y, 2.1), M['light']))
    wc = to_world(ang, (U0 + U1) / 2, 0)
    wing['center'] = [wc.x, wc.y]
    door = to_world(ang, U0, 0)
    wing['door'] = [door.x, door.y]
    LAYOUT['wings'].append(wing)


# ------------------------------------------------------------------ lights
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


for name, loc, tgt, col in LIGHTS:
    if name.startswith('LP_'):
        light(name, 'AREA', loc, 140, col, size=1.8, size_y=.3, target=tgt)
    else:
        light(name, 'SPOT', loc, 900, col, target=tgt, radius=.15).data.spot_size = math.radians(24)
for key, title, ang in WINGS:
    for u in (U0 + 4, U1 - 4):
        w = to_world(ang, u, 0)
        light(f'L_fill_{key}_{u}', 'AREA', (w.x, w.y, H_ROOM - .45), 160, WING_MATS[key]['light'], size=3, size_y=3, target=(w.x, w.y, 0))
    w = to_world(ang, (R_ATR + U0) / 2, 0)
    light(f'L_cor_{key}', 'AREA', (w.x, w.y, DOOR_H + .3), 60, (1, .85, .7), size=1.5, target=(w.x, w.y, 0))
light('L_oculus', 'AREA', (0, 0, H_ATR + 5), 2400, (.75, .82, 1.0), size=3, target=(0, 0, 0))
light('L_dais', 'AREA', (0, -.8, 4.4), 220, (1, .93, .85), size=1.6, size_y=.5, target=(0, 0, 1))
light('L_dais_back', 'POINT', (0, 1.8, 1.9), 40, (.3, .9, 1.0), radius=.6)
for k in range(8):
    a = k / 8 * 6.2832 + .2
    light(f'L_atr_{k}', 'AREA', (math.cos(a) * 7, math.sin(a) * 7, 7.5), 90, (1, .88, .72), size=1.2, target=(math.cos(a) * 9, math.sin(a) * 9, 3))
light('L_vest', 'AREA', (0, -R_ATR - 3.2, 5.3), 120, (1, .88, .72), size=2, size_y=5, target=(0, -R_ATR - 3.2, 0))
world = bpy.data.worlds.new('W')
sc.world = world
world.node_tree.nodes['Background'].inputs[0].default_value = (.003, .004, .007, 1)


def camera(loc, target, lens=22):
    cam = bpy.data.objects.get('CAM') or bpy.data.objects.new('CAM', bpy.data.cameras.new('CAM'))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens
    sc.camera = cam


t0 = time.time()
json.dump(LAYOUT, open(f'{OUT}/museum_layout.json', 'w'), indent=1)
if STAGE == 'preview':
    sc.view_settings.view_transform = 'AgX'
    views = {'entry': ((0, -R_ATR - 5, 1.7), (0, 3, 1.8)), 'luxury': (tuple(to_world(90, 16, 3.5)) , tuple(to_world(90, 23, 0) + Vector((0, 0, 1.2)))),
             'table': (tuple(to_world(45, 16, -3.5)), tuple(to_world(45, 23, 0) + Vector((0, 0, 1.0)))), 'culture': (tuple(to_world(0, 16, 3.5)), tuple(to_world(0, 24, 0) + Vector((0, 0, 1.0)))),
             'nature': (tuple(to_world(180, 16, -3.5)), tuple(to_world(180, 24, 0) + Vector((0, 0, 1.0))))}
    for n, (loc, tgt) in views.items():
        loc = (loc[0], loc[1], 1.7) if len(loc) == 3 and loc[2] == 0 else loc
        camera(loc, tgt)
        sc.render.resolution_x, sc.render.resolution_y = 960, 540
        sc.cycles.samples = int(os.environ.get('PSPP', 48))
        sc.cycles.use_denoising = True
        sc.render.filepath = f'{OUT}/prev_{n}.png'
        bpy.ops.render.render(write_still=True)
    print('PREVIEW', round(time.time() - t0))
    sys.exit(0)

objs = [o for o in C.objects if o.type == 'MESH']
katana_objs = set(root.children_recursive)
H.apply_modifiers(objs)
static = [o for o in objs if o not in katana_objs and not (o.get('emit') or o.get('nobake') or o.name.startswith('DYN'))]
# reflection panoramas: the atrium and each room
H.panorama(sc, (0, -.8, 1.6), f'{OUT}/env_atrium.hdr', hide=katana_objs, size=(512, 256))
for key, title, ang in WINGS:
    w = to_world(ang, (U0 + U1) / 2, 0)
    H.panorama(sc, (w.x, w.y, 1.6), f'{OUT}/env_{key}.hdr', size=(512, 256))
j = H.bake(sc, static, RES, SPP, f'{OUT}/museum_lightmap.jpg', 'museum', gain=float(os.environ.get('GAIN', 1.6)))
H.group_nonbaked(C, j)
export = [o for o in bpy.data.objects if o.type in ('MESH', 'EMPTY') and not o.get('cutter')]
H.select_only(export)
bpy.ops.export_scene.gltf(filepath=f'{OUT}/museum.glb', export_format='GLB', use_selection=True, export_apply=True, export_extras=True, export_yup=True,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='NONE', export_lights=False,
                          export_cameras=False, export_meshopt_compression_enable=True)
if os.environ.get('SAVE_BLEND'):
    bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/museum_master.blend')
print('DONE', round(time.time() - t0))
