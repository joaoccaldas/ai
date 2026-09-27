import bpy, math, os, time, random
import numpy as np
from mathutils import Vector


def select_only(objs, active=None):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def apply_modifiers(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        if o.type == 'MESH' and len(o.modifiers):
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
            o.modifiers.clear()
            o.data = me


def tonemap_save(img, path, gain, quality=90):
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    rgb = np.clip(px[:, :3] * gain, 0, None)
    rgb = rgb / (1 + rgb * .18)
    rgb = np.where(rgb <= .0031308, 12.92 * rgb, 1.055 * np.power(np.clip(rgb, 1e-8, None), 1 / 2.4) - .055)
    out = bpy.data.images.new(os.path.basename(path), w, h, alpha=False)
    out.colorspace_settings.name = 'sRGB'
    o = np.ones((w * h, 4), dtype=np.float32)
    o[:, :3] = np.clip(rgb, 0, 1)
    out.pixels.foreach_set(o.ravel())
    out.filepath_raw = path
    out.file_format = 'JPEG'
    bpy.context.scene.render.image_settings.quality = quality
    out.save()


def bake(sc, static, res, spp, path, name, gain=1.6):
    rr = random.Random(3)
    for o in static:
        a = o.data.attributes.get('rnd') or o.data.attributes.new('rnd', 'FLOAT', 'POINT')
        a.data.foreach_set('value', [rr.random()] * len(o.data.vertices))
    select_only(static)
    bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.001, area_weight=0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=.001, rotate=True, shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new('LM_' + name, res, res, float_buffer=True, alpha=False)
    mats = {m for m in j.data.materials if m}
    for m in mats:
        n = m.node_tree.nodes.new('ShaderNodeTexImage')
        n.image = img
        m.node_tree.nodes.active = n
    sc.cycles.samples = spp
    sc.cycles.use_denoising = False
    sc.render.bake.margin = 6
    t = time.time()
    bpy.ops.object.bake(type='COMBINED', pass_filter={'EMIT', 'DIRECT', 'INDIRECT', 'DIFFUSE', 'TRANSMISSION'}, margin=6, use_clear=True)
    print('BAKED', name, round(time.time() - t, 1), 's')
    tonemap_save(img, path, gain)
    j.name = 'BAKED_' + name.upper()
    j.data.materials.clear()
    j.data.materials.append(bpy.data.materials.new('baked_' + name))
    j['baked'] = name
    return j


def group_nonbaked(coll, baked):
    """Merge nobake meshes by material tag and emissives by (dyn, colour, strength). Artworks stay separate."""
    groups = {}
    for o in list(coll.objects):
        if o.type != 'MESH' or o == baked or o.name.startswith('DYN') or o.get('art') is not None or o.parent is not None:
            continue
        if o.get('nobake'):
            key = ('nb', o['mat'])
        elif o.get('emit'):
            key = ('em', o.get('dyn', ''), tuple(round(x, 2) for x in o['emit']), round(o['strength'], 2))
        else:
            continue
        groups.setdefault(key, []).append(o)
    for n, (key, lst) in enumerate(groups.items()):
        props = {k: lst[0][k] for k in lst[0].keys() if k in ('emit', 'strength', 'dyn', 'mat', 'nobake')}
        if len(lst) > 1:
            select_only(lst)
            bpy.ops.object.join()
            o = bpy.context.view_layer.objects.active
        else:
            o = lst[0]
        o.name = f"G_{'_'.join(str(x) for x in key[:2])}_{n}"
        for k, v in props.items():
            o[k] = v


def panorama(sc, loc, path, hide=()):
    for o in hide:
        o.hide_render = True
    cam = bpy.data.objects.new('PANO', bpy.data.cameras.new('PANO'))
    sc.collection.objects.link(cam)
    cam.location = loc
    cam.data.type = 'PANO'
    cam.data.panorama_type = 'EQUIRECTANGULAR'
    cam.rotation_euler = (math.pi / 2, 0, 0)
    sc.camera = cam
    sc.render.image_settings.file_format = 'HDR'
    sc.render.resolution_x, sc.render.resolution_y = 768, 384
    sc.cycles.samples = 256
    sc.cycles.use_denoising = True
    vt = sc.view_settings.view_transform
    sc.view_settings.view_transform = 'Standard'
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.view_settings.view_transform = vt
    sc.render.image_settings.file_format = 'PNG'
    for o in hide:
        o.hide_render = False
    bpy.data.objects.remove(cam)
