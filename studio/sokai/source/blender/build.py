import sys, os, math, time
sys.path.insert(0, os.path.dirname(__file__))
import bpy
import numpy as np
from mathutils import Vector

STAGE = os.environ.get('STAGE', 'preview')
OUT = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '..', 'out'))
RES = {'ATELIER': int(os.environ.get('RES_A', 4096)), 'VAULT': int(os.environ.get('RES_V', 2048))}
SPP = int(os.environ.get('SPP', 512))
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
import katana, env
from env import HOME

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == 'METAL'
sc.cycles.device = 'GPU'
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'

root, blade_asm, saya_asm = katana.build_katana()
root.location = HOME
supports = katana.saya_support_points()
A = env.build_atelier(supports)
V = env.build_vault(supports)


def light(coll, name, kind, loc, energy, color, size=None, target=None, radius=None, size_y=None):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == 'AREA':
        ld.shape = 'RECTANGLE'
        ld.size = size
        ld.size_y = size_y or size
    if radius is not None:
        ld.shadow_soft_size = radius
    o = bpy.data.objects.new(name, ld)
    o.location = loc
    if target is not None:
        d = (Vector(target) - Vector(loc))
        o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    coll.objects.link(o)
    return o


# ---- atelier lights
moon_dir = Vector((.45, -1.0, -.55)).normalized()
sun = light(A, 'L_moon', 'SUN', (0, 6, 6), .75, (.5, .64, 1.0))
sun.rotation_euler = (-moon_dir).to_track_quat('Z', 'Y').to_euler()
sun.data.angle = math.radians(1.5)
light(A, 'L_key', 'AREA', (.05, -.55, 2.25), 95, (1.0, .9, .78), size=1.4, size_y=.45, target=(.0, 0, .66))
light(A, 'L_rimkey', 'AREA', (-.4, 1.4, 1.5), 30, (.55, .75, 1.0), size=1.0, size_y=.3, target=(0, 0, .66))
light(A, 'L_forge', 'POINT', (3.85, 1.7, .85), 260, (1.0, .42, .12), radius=.25)
for k, (x, y, s) in enumerate([(1.75, -.35, 1.0), (-3.2, 2.3, .9), (3.9, -.9, .9)]):
    light(A, f'L_andon_{k}', 'POINT', (x, y, .06 + .31 * s), 28, (1.0, .6, .28), radius=.1)
for k in range(5):
    light(A, f'L_candle_{k}', 'POINT', (2.9 + k * .38, 3.36, 2.45), 2.5, (1.0, .6, .25), radius=.02)
light(A, 'L_toro1', 'POINT', (1.6, 5.9, .75), 40, (1.0, .6, .25), radius=.1)
light(A, 'L_toro2', 'POINT', (-4.2, 9.2, .85), 45, (1.0, .6, .25), radius=.1)
light(A, 'L_toro3', 'POINT', (-1.6, 10.8, .65), 35, (1.0, .6, .25), radius=.1)
light(A, 'L_toro4', 'POINT', (2.9, 7.8, .55), 30, (1.0, .6, .25), radius=.1)
light(A, 'L_portal', 'POINT', (-.55, 11.9, 2.35), 500, (.25, .9, 1.0), radius=.9)
# ---- vault lights
light(V, 'LV_key', 'AREA', (0, -.2, 5.0), 420, (.8, .93, 1.0), size=3.0, size_y=1.4, target=(0, 0, .5))
light(V, 'LV_core', 'POINT', (0, 8.6, 4.1), 900, (1.0, .5, .18), radius=.5)
light(V, 'LV_front', 'AREA', (-1.8, -3.5, 1.6), 60, (1.0, .78, .6), size=1.5, target=(0, 0, .66))

def dawn(on):
    """Switch the atelier between moonlit night and sunrise."""
    sun.data.color = (1.0, .66, .42) if on else (.5, .64, 1.0)
    sun.data.energy = 3.2 if on else .75
    d = Vector((.55, -1.0, -.16)).normalized() if on else moon_dir
    sun.rotation_euler = (-d).to_track_quat('Z', 'Y').to_euler()
    sun.data.angle = math.radians(3 if on else 1.5)
    for o in A.objects:
        if o.type == 'LIGHT' and (o.name.startswith('L_andon') or o.name.startswith('L_candle') or o.name.startswith('L_toro')):
            o.data.energy = o.get('e0', o.data.energy) * (.25 if on else 1)
            o['e0'] = o.get('e0', o.data.energy / (.25 if on else 1))
    moon = bpy.data.objects.get('EMIT_moon')
    if moon:
        moon.hide_render = on
    bg.inputs[0].default_value = (.20, .22, .30, 1) if on else (.004, .007, .016, 1)
    bg.inputs[1].default_value = 1.0


world = bpy.data.worlds.new('W')
sc.world = world
bg = world.node_tree.nodes['Background']


def set_env(name):
    A.hide_render = name != 'ATELIER'
    V.hide_render = name != 'VAULT'
    bg.inputs[0].default_value = (.004, .007, .016, 1) if name == 'ATELIER' else (.002, .003, .005, 1)


def camera(loc, target, lens=35, name='CAM'):
    cam = bpy.data.objects.get(name)
    if not cam:
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
        sc.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens
    sc.camera = cam
    return cam


def render(path, w, h, spp):
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.cycles.samples = spp
    sc.cycles.use_denoising = True
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def katana_visible(blade=True, saya=True):
    for o in blade_asm.children_recursive:
        o.hide_render = not blade
    for o in saya_asm.children_recursive:
        o.hide_render = not saya


t0 = time.time()
if STAGE == 'preview':
    sc.view_settings.view_transform = 'AgX'
    set_env('ATELIER')
    camera((.35, -2.05, 1.02), (.0, .6, .72), 30)
    render(f'{OUT}/prev_atelier.png', 960, 540, 64)
    camera((-.1, -.75, .82), (.0, .0, .66), 40)
    render(f'{OUT}/prev_atelier_close.png', 960, 540, 64)
    set_env('VAULT')
    camera((.4, -3.2, 1.25), (0, 2.0, 1.6), 26)
    render(f'{OUT}/prev_vault.png', 960, 540, 64)
    print('PREVIEW', time.time() - t0)
    sys.exit(0)

# ======================================================================= BAKE
import bmesh


def apply_modifiers(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        if o.type == 'MESH' and len(o.modifiers):
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
            o.modifiers.clear()
            o.data = me


def tonemap_save(img, path, gain):
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    rgb = np.clip(px[:, :3] * gain, 0, None)
    # soft shoulder: linear in the shadows, rolls off highlights toward 1
    rgb = rgb / (1 + rgb * .18)
    rgb = np.where(rgb <= .0031308, 12.92 * rgb, 1.055 * np.power(np.clip(rgb, 1e-8, None), 1 / 2.4) - .055)
    out = bpy.data.images.new(os.path.basename(path), w, h, alpha=False)
    out.colorspace_settings.name = 'sRGB'
    o = np.ones((w * h, 4), dtype=np.float32)
    o[:, :3] = np.clip(rgb, 0, 1)
    out.pixels.foreach_set(o.ravel())
    out.filepath_raw = path
    out.file_format = 'JPEG'
    sc.render.image_settings.quality = 90
    out.save()
    np.save(path + '.npy', px[:, :3].astype(np.float16).reshape(h, w, 3)) if os.environ.get('KEEP_HDR') else None
    return out


def select_only(objs, active=None):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def bake_env(name, coll):
    set_env(name)
    katana_visible(blade=False, saya=True)
    objs = [o for o in coll.objects if o.type == 'MESH']
    apply_modifiers(objs)
    static = [o for o in objs if not (o.get('emit') or o.get('nobake') or o.name.startswith('DYN'))]
    print(name, 'static', len(static), 'total', len(objs))
    import random
    rr = random.Random(3)
    for o in static:
        a = o.data.attributes.get('rnd') or o.data.attributes.new('rnd', 'FLOAT', 'POINT')
        v = rr.random()
        a.data.foreach_set('value', [v] * len(o.data.vertices))
    select_only(static)
    bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active
    static = [j]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.0012, area_weight=0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=.0012, rotate=True, shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    res = RES[name]
    img = bpy.data.images.new('LM_' + name, res, res, float_buffer=True, alpha=False)
    mats = {m for o in static for m in o.data.materials if m}
    for m in mats:
        n = m.node_tree.nodes.new('ShaderNodeTexImage')
        n.image = img
        m.node_tree.nodes.active = n
    sc.cycles.samples = SPP
    sc.cycles.use_denoising = False
    sc.render.bake.margin = 6
    sc.render.bake.use_clear = True
    variants = [('', False), ('_dawn', True)] if name == 'ATELIER' else [('', False)]
    for suffix, isdawn in variants:
        if name == 'ATELIER':
            dawn(isdawn)
        t = time.time()
        bpy.ops.object.bake(type='COMBINED', pass_filter={'EMIT', 'DIRECT', 'INDIRECT', 'DIFFUSE', 'TRANSMISSION'}, margin=6, use_clear=True)
        print('BAKED', name + suffix, round(time.time() - t, 1), 's')
        tonemap_save(img, f'{OUT}/lightmap_{name.lower()}{suffix}.jpg', float(os.environ.get('GAIN_' + name, 1.6)))
    if name == 'ATELIER':
        dawn(False)
    for m in mats:
        nt = m.node_tree
        for n in [n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image == img]:
            nt.nodes.remove(n)
    j.name = 'BAKED_' + name
    j.data.materials.clear()
    j.data.materials.append(bpy.data.materials.new('baked_' + name.lower()))
    j['baked'] = name.lower()
    # merge nobake objects by material tag, emissives by (dyn, colour)
    groups = {}
    for o in list(coll.objects):
        if o.type != 'MESH' or o == j or o.name.startswith('DYN'):
            continue
        if o.get('nobake'):
            key = ('nb', o['mat'])
        elif o.get('emit'):
            key = ('em', o.get('dyn', ''), tuple(round(x, 2) for x in o['emit']), round(o['strength'], 2))
        else:
            continue
        groups.setdefault(key, []).append(o)
    for key, lst in groups.items():
        props = {k: lst[0][k] for k in lst[0].keys() if k in ('emit', 'strength', 'dyn', 'mat', 'nobake')}
        if len(lst) > 1:
            select_only(lst)
            bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active if len(lst) > 1 else lst[0]
        o.name = f"{name}_{'_'.join(str(x) for x in key[:2])}_{len(groups)}"
        for k, v in props.items():
            o[k] = v
    return j


def panorama(name, path):
    set_env(name)
    katana_visible(False, False)
    cam = camera(HOME + Vector((-.23, -.02, .06)), HOME + Vector((-.23, 1, .06)), name='PANO')
    cam.data.type = 'PANO'
    cam.data.panorama_type = 'EQUIRECTANGULAR'
    cam.rotation_euler = (math.pi / 2, 0, 0)  # look along +Y, Z up
    sc.render.image_settings.file_format = 'HDR'
    sc.render.resolution_x, sc.render.resolution_y = 1024, 512
    sc.cycles.samples = 256
    sc.cycles.use_denoising = True
    vt = sc.view_settings.view_transform
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.view_settings.view_transform = vt
    sc.render.image_settings.file_format = 'PNG'


if STAGE in ('bake', 'all'):
    dawn(True)
    panorama('ATELIER', f'{OUT}/env_atelier_dawn.hdr')
    dawn(False)
    panorama('ATELIER', f'{OUT}/env_atelier.hdr')
    panorama('VAULT', f'{OUT}/env_vault.hdr')
    ja = bake_env('ATELIER', A)
    jv = bake_env('VAULT', V)
    A.hide_render = V.hide_render = False
    katana_visible(True, True)
    # remove lights / cameras before export
    export = [o for o in bpy.data.objects if o.type in ('MESH', 'EMPTY') and not o.get('cutter')]
    select_only(export)
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/sokai.glb', export_format='GLB', use_selection=True, export_apply=True,
                              export_extras=True, export_yup=True, export_texcoords=True, export_normals=True,
                              export_materials='EXPORT', export_image_format='NONE', export_lights=False, export_cameras=False,
                              export_meshopt_compression_enable=bool(int(os.environ.get('MESHOPT', 1))))
    bpy.ops.wm.save_as_mainfile(filepath=f'{OUT}/sokai_master.blend')
    print('DONE', round(time.time() - t0, 1))
