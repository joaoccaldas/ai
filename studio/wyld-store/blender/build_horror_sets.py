"""Build the two horror movie sets for Bike Porn in Blender (bpy 4.2) and export them as GLB.

  The Lake House  -> bike-porn/sets/lakehouse.glb   (log cabin by a black lake, dock, dead trees, pines)
  Sanctuary       -> bike-porn/sets/chapel.glb      (gothic chapel nave, arcade, pews, altar, candles)

Assets are CC0 from Poly Haven (https://polyhaven.com): PBR textures, a few props and two HDRIs.
They are downloaded once into a cache folder, then the architecture is modelled here procedurally.

Run:  PH_CACHE=/tmp/ph python3 blender/build_horror_sets.py   (needs `pip install bpy==4.2.0`)
Then: npx @gltf-transform/cli optimize <in>.glb <out>.glb --compress meshopt --texture-compress webp --texture-size 1024
      (see bike-porn/README section in the store README for the exact commands)

Coordinates: Blender Z-up. The bike stands at the origin facing +X; the camera looks from -Y.
Objects named fx_* are hooks for the live effects in three.js (window glow, lantern, flames, glass).
"""
import bpy, bmesh, math, os, random, json, urllib.request
from mathutils import Vector, Matrix, noise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get('PH_CACHE', '/tmp/ph')
RAW = os.environ.get('RAW_DIR', os.path.join(CACHE, 'raw'))
SETS = os.path.join(ROOT, 'bike-porn', 'sets')
UA = {'User-Agent': 'wyld-bike-porn-build/1.0'}

MODELS = ['dead_tree_trunk', 'dead_tree_trunk_02', 'rock_moss_set_01', 'Rockingchair_01', 'Lantern_01', 'tree_stump_01',
          'modular_wooden_pier', 'wooden_axe', 'fern_02', 'grass_medium_01',
          'Chandelier_01', 'brass_candleholders', 'gothic_statue', 'GothicCabinet_01', 'vintage_oil_lamp']
TEXTURES = ['weathered_planks', 'roof_slates_02', 'stacked_stone_wall', 'brown_mud_leaves_01', 'bark_brown_02', 'pine_bark', 'wood_trunk_wall',
            'church_bricks_02', 'monastery_stone_floor', 'dark_wood', 'old_stone_wall', 'dark_wooden_planks', 'wood_table_worn']
HDRIS = [('lakeside_night', '2k'), ('small_cathedral', '1k')]


# ------------------------------------------------------------------ assets
def _get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA)))


def _dl(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(path, 'wb') as f:
        f.write(r.read())


def fetch_assets():
    for m in MODELS:
        f = _get(f'https://api.polyhaven.com/files/{m}')['gltf']['1k']['gltf']
        base = f'{CACHE}/models/{m}/'
        _dl(f['url'], base + os.path.basename(f['url']))
        for rel, v in f.get('include', {}).items():
            _dl(v['url'], base + rel)
    for t in TEXTURES:
        f = _get(f'https://api.polyhaven.com/files/{t}')
        for kind in ['Diffuse', 'nor_gl', 'Rough']:
            if kind in f and '1k' in f[kind]:
                _dl(f[kind]['1k']['jpg']['url'], f'{CACHE}/tex/{t}/{kind}.jpg')
    for h, res in HDRIS:
        f = _get(f'https://api.polyhaven.com/files/{h}')
        _dl(f['hdri'][res]['hdr']['url'], f'{CACHE}/hdri/{h}_{res}.hdr')


# ------------------------------------------------------------------ helpers
R = random.Random(7)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def mesh_obj(name, bm, mat=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me))
    if mat:
        me.materials.append(mat)
    return ob


def box_uv(ob, size=1.0):
    """World-scale box projection so tiled textures keep a real size on any shape."""
    me = ob.data
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    uv = me.uv_layers.active.data
    mw = ob.matrix_world
    for p in me.polygons:
        n = (mw.to_3x3() @ p.normal)
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in p.loop_indices:
            co = mw @ me.vertices[me.loops[li].vertex_index].co
            u, v = [(co.y, co.z), (co.x, co.z), (co.x, co.y)][ax]
            uv[li].uv = (u / size, v / size)


def pbr(name, tex, scale=1.0, color=None, rough=None, emissive=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    b = nt.nodes['Principled BSDF']
    if color:
        b.inputs['Base Color'].default_value = (*color, 1)
    if rough is not None:
        b.inputs['Roughness'].default_value = rough
    if emissive:
        b.inputs['Emission Color'].default_value = (*emissive, 1)
        b.inputs['Emission Strength'].default_value = 1.0
    if not tex:
        return mat
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (scale, scale, 1)
    nt.links.new(tc.outputs['UV'], mp.inputs['Vector'])

    def img(kind, noncolor):
        p = f'{CACHE}/tex/{tex}/{kind}.jpg'
        if not os.path.exists(p):
            return None
        n = nt.nodes.new('ShaderNodeTexImage')
        n.image = bpy.data.images.load(p, check_existing=True)
        if noncolor:
            n.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
        return n
    d = img('Diffuse', False)
    if d:
        nt.links.new(d.outputs['Color'], b.inputs['Base Color'])
    r = img('Rough', True)
    if r:
        nt.links.new(r.outputs['Color'], b.inputs['Roughness'])
    n = img('nor_gl', True)
    if n:
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nt.links.new(n.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return mat


def cube(name, size, loc, mat=None, rot=(0, 0, 0), uv=1.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    ob = mesh_obj(name, bm, mat)
    ob.location = loc; ob.rotation_euler = rot
    bpy.context.view_layer.update()
    box_uv(ob, uv)
    return ob


def cylinder(name, r, depth, loc, mat=None, rot=(0, 0, 0), seg=12, r2=None, uv=None):
    bm = bmesh.new()
    bm.loops.layers.uv.new('UVMap')
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth, calc_uvs=True)
    ob = mesh_obj(name, bm, mat)
    ob.location = loc; ob.rotation_euler = rot
    bpy.context.view_layer.update()
    if uv:
        box_uv(ob, uv)
    return ob


def import_model(name, loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0, decimate=None, keep=None):
    before = set(bpy.data.objects)
    path = [f for f in os.listdir(f'{CACHE}/models/{name}') if f.endswith('.gltf')][0]
    bpy.ops.import_scene.gltf(filepath=f'{CACHE}/models/{name}/{path}')
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    holder = link(bpy.data.objects.new(f'{name}_{len(bpy.data.objects)}', None))
    for o in roots:
        o.parent = holder
    for o in new:
        if keep and o.type == 'MESH' and not any(k in o.name for k in keep):
            bpy.data.objects.remove(o)
            continue
        if decimate and o.type == 'MESH':
            m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = decimate
    holder.location = loc; holder.rotation_euler = rot; holder.scale = (scale,) * 3
    return holder


def empty(name, loc):
    e = link(bpy.data.objects.new(name, None))
    e.location = loc
    return e


def dump_fx(path):
    """Positions of the fx_* hooks in three.js space (Y-up), saved next to the GLB (empties get pruned when optimising)."""
    bpy.context.view_layer.update()
    fx = {}
    for o in bpy.data.objects:
        if o.type == 'EMPTY' and o.name.startswith('fx_'):
            p = o.matrix_world.translation
            fx.setdefault(o.name.split('.')[0], []).append([round(p.x, 3), round(p.z, 3), round(-p.y, 3)])
    with open(path, 'w') as f:
        json.dump(fx, f, separators=(',', ':'))
    print('fx', path, {k: len(v) for k, v in fx.items()})


def export(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True,
                              export_image_format='JPEG', export_extras=False, export_lights=False, export_cameras=False)
    print('exported', path)


def hdri_to_jpg(src, dst, width, exposure=0.0):
    """Tone-map an HDRI into a small equirect JPEG used for the sky and reflections."""
    img = bpy.data.images.load(src)
    img.scale(width, width // 2)
    sc = bpy.context.scene
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.exposure = exposure
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 88
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    img.save_render(dst, scene=sc)
    print('hdri', dst)


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def gothic_arch(w, h, n=12):
    """Outline of an equilateral pointed-arch window (2D points, base at 0, apex at h)."""
    s = h - w * math.sin(math.radians(60))
    pts = [(-w / 2, 0), (w / 2, 0)]
    for i in range(n + 1):                      # right side: arc centred on the left springing point
        a = math.radians(60 * i / n)
        pts.append((-w / 2 + w * math.cos(a), s + w * math.sin(a)))
    for i in range(1, n + 1):                   # left side: arc centred on the right springing point
        a = math.radians(120 + 60 * i / n)
        pts.append((w / 2 + w * math.cos(a), s + w * math.sin(a)))
    return pts


def prism(name, pts2d, depth, mat=None):
    """Extrude a 2D outline (x, z) along Y into a solid; used for window cutters and glass."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, -depth / 2, z)) for x, z in pts2d]
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    moved = [v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, depth, 0), verts=moved)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, mat)


def glass_plane(name, pts2d, mat):
    """Flat glass pane in the XZ plane with 0-1 UVs across its bounds."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, 0, z)) for x, z in pts2d]
    bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    ob = mesh_obj(name, bm, mat)
    me = ob.data; me.uv_layers.new(name='UVMap')
    xs = [p[0] for p in pts2d]; zs = [p[1] for p in pts2d]
    for p in me.polygons:
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            me.uv_layers.active.data[li].uv = ((co.x - min(xs)) / (max(xs) - min(xs)), (co.z - min(zs)) / (max(zs) - min(zs)))
    return ob


def cut(target, cutter):
    m = target.modifiers.new('cut_' + cutter.name, 'BOOLEAN')
    m.operation = 'DIFFERENCE'; m.object = cutter; m.solver = 'EXACT'
    cutter.hide_render = True
    cutter.display_type = 'WIRE'


def drop_cutters():
    for o in list(bpy.data.objects):
        if o.name.startswith('cutter_'):
            bpy.data.objects.remove(o)


def apply_booleans():
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        for m in list(o.modifiers):
            if m.type == 'BOOLEAN':
                with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
                    bpy.ops.object.modifier_apply(modifier=m.name)
    drop_cutters()


def join(objs, name):
    objs = [o for o in objs if o.type == 'MESH']
    if not objs:
        return None
    with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
        bpy.ops.object.join()
    objs[0].name = name
    return objs[0]


# ------------------------------------------------------------------ The Lake House
def shore_y(x):
    return 1.9 + 0.1 * x * x


def terrain_z(x, y):
    d = math.hypot(x, y)
    z = 0.09 * noise.noise(Vector((x * .35, y * .35, 0))) * smooth(1.2, 3.0, d)
    z -= 0.75 * smooth(0, 2.0, y - shore_y(x))                       # the lake bed
    z += max(0.0, y - 13) * 0.32 + max(0.0, abs(x) - 9) * 0.28        # far shore and side hills
    z += max(0.0, -y - 4) * 0.06                                      # gentle rise behind the camera
    if d < 1.3:
        z *= smooth(0.8, 1.3, d)                                      # flat pad for the bike
    return z


def dead_tree(name, loc, h, mat, seed):
    """Gnarled dead tree: a branching skeleton skinned into a trunk."""
    rr = random.Random(seed)
    bm = bmesh.new()

    def grow(p0, d, length, r, depth):
        steps = max(2, int(length / .35))
        prev = p0
        for i in range(1, steps + 1):
            d = (d + Vector((rr.uniform(-.25, .25), rr.uniform(-.25, .25), rr.uniform(-.05, .15)))).normalized()
            p = bm.verts.new(prev.co + d * (length / steps))
            bm.edges.new((prev, p))
            if depth < 3 and i > steps * .35 and rr.random() < .45:
                side = Vector((rr.uniform(-1, 1), rr.uniform(-1, 1), rr.uniform(.2, .9))).normalized()
                grow(p, side, length * rr.uniform(.35, .6), r * .7, depth + 1)
            prev = p
    root = bm.verts.new((0, 0, -.2))
    grow(root, Vector((0, 0, 1)), h, .2 * h / 5, 0)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me))
    sk = ob.modifiers.new('skin', 'SKIN')
    ob.data.skin_vertices[0].data[0].use_root = True
    # radii by height and distance from the trunk line
    for i, v in enumerate(me.vertices):
        t = max(0.0, min(1.0, v.co.z / h))
        r0 = .19 * h / 5 * (1 - .8 * t) * (1.0 if math.hypot(v.co.x, v.co.y) < .6 + t else .45)
        ob.data.skin_vertices[0].data[i].radius = (max(.018, r0), max(.018, r0))
    sk.use_smooth_shade = True
    ob.location = loc
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
        bpy.ops.object.modifier_apply(modifier='skin')
    ob.data.materials.append(mat)
    bpy.context.view_layer.update()
    box_uv(ob, 1.2)
    return ob


def pine(bm, x, y, z, h, rr):
    """Low-poly fir silhouette: stacked, jittered cones on a thin trunk (added into one bmesh)."""
    tiers = 6
    for i in range(tiers):
        t = i / tiers
        rad = (1 - t) * h * .22 + .15
        zz = z + h * (.18 + t * .75)
        ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=rad, radius2=0.02, depth=h * .28)
        for v in ret['verts']:
            v.co.x += rr.uniform(-.05, .05) * rad; v.co.y += rr.uniform(-.05, .05) * rad
            v.co += Vector((x, y, zz))


def build_lake():
    reset()
    mud = pbr('lake_ground', 'brown_mud_leaves_01', 24)
    bark = pbr('dead_bark', 'bark_brown_02', 1.0)
    logs = pbr('cabin_logs', 'bark_brown_02', 1.0)
    wall = pbr('cabin_gable', 'wood_trunk_wall', 1.0)
    planks = pbr('porch_planks', 'weathered_planks', 1.0)
    slate = pbr('roof_slate', 'roof_slates_02', 1.0)
    stone = pbr('chimney_stone', 'stacked_stone_wall', 1.0)
    chink = pbr('cabin_chinking', None, color=(0.05, 0.045, 0.04), rough=.95)
    glow = pbr('fx_window_glow', None, color=(1, .55, .2), emissive=(1, .5, .18))
    void = pbr('cabin_void', None, color=(0.005, 0.004, 0.004), rough=1)
    needles = pbr('pine_needles', None, color=(0.018, 0.032, 0.024), rough=.95)

    # terrain
    bm = bmesh.new()
    bm.loops.layers.uv.new('UVMap')
    bmesh.ops.create_grid(bm, x_segments=150, y_segments=150, size=22, calc_uvs=True)
    for v in bm.verts:
        v.co.z = terrain_z(v.co.x, v.co.y)
    ground = mesh_obj('lake_ground', bm, mud)
    for p in ground.data.polygons:
        p.use_smooth = True

    # cabin (built in local space, then placed)
    cab = []
    W, D, lr = 3.2, 2.6, .11
    for i in range(10):
        z = lr + i * .2
        for s in (-1, 1):
            cab.append(cylinder('log', lr, W + .5, (0, s * D / 2, z), logs, rot=(0, math.pi / 2, 0), seg=14))
            cab.append(cylinder('log', lr, D + .5, (s * W / 2, 0, z + .1), logs, rot=(math.pi / 2, 0, 0), seg=14))
    cab.append(cube('chinking', (W - .1, D - .1, 2.05), (0, 0, 1.03), chink, uv=1))
    # gables
    for s in (-1, 1):
        bm = bmesh.new()
        vs = [bm.verts.new((s * W / 2, -D / 2 - .05, 2.05)), bm.verts.new((s * W / 2, D / 2 + .05, 2.05)), bm.verts.new((s * W / 2, 0, 3.05))]
        bm.faces.new(vs)
        ob = mesh_obj('gable', bm, wall); box_uv(ob, 1.4); cab.append(ob)
    # roof
    pitch = math.atan2(1.0, D / 2)
    for s in (-1, 1):
        cab.append(cube('roof', (W + .9, D / 2 / math.cos(pitch) + .55, .1), (0, s * (D / 4 + .12), 2.62), slate, rot=(-s * pitch, 0, 0), uv=1.2))
    cab.append(cube('chimney', (.55, .55, 3.7), (-1.05, .55, 1.85), stone, uv=1))
    # front: windows, door, porch
    fy = -D / 2 - lr - .02
    for x in (-.95, .95):
        cab.append(cube('fx_window_glow', (.62, .02, .72), (x, fy, 1.15), glow))
        for dx, dz, sx, sz in ((0, .38, .72, .07), (0, -.38, .72, .07), (-.34, 0, .07, .8), (.34, 0, .07, .8), (0, 0, .04, .72), (0, 0, .62, .04)):
            cab.append(cube('window_frame', (sx, .07, sz), (x + dx, fy - .03, 1.15 + dz), planks, uv=.8))
    cab.append(cube('doorway', (.9, .03, 1.85), (0, fy + .005, .95), void))
    door = cube('cabin_door', (.86, .06, 1.82), (.4, fy - .38, .95), planks, rot=(0, 0, math.radians(62)), uv=.9)
    cab.append(door)
    cab.append(cube('porch', (W + .6, 1.4, .08), (0, -D / 2 - .9, .28), planks, uv=1))
    for x in (-W / 2 - .2, W / 2 + .2):
        cab.append(cylinder('porch_post', .07, 2.3, (x, -D / 2 - 1.5, 1.4), bark, seg=10, uv=1))
    cab.append(cube('porch_roof', (W + .8, 1.8, .07), (0, -D / 2 - .9, 2.45), slate, rot=(math.radians(-14), 0, 0), uv=1.2))
    for i in range(2):
        cab.append(cube('step', (1.2, .35, .1), (0, -D / 2 - 1.75 - i * .3, .18 - i * .09), planks, uv=1))
    cabin = link(bpy.data.objects.new('cabin', None))
    for o in cab:
        o.parent = cabin
    cabin.location = (4.4, 3.4, terrain_z(4.4, 3.4) - .02)
    cabin.rotation_euler = (0, 0, math.radians(-24))
    bpy.context.view_layer.update()
    for o in cab:
        if o.data and o.data.materials and o.data.materials[0] in (planks, slate, stone, wall, chink):
            box_uv(o, {planks: .9, slate: 1.2, stone: 1.0, wall: 1.4, chink: 1}[o.data.materials[0]])
    # porch props: the rocking chair and a lantern on the post
    import_model('Rockingchair_01', loc=cabin.matrix_world @ Vector((.9, -D / 2 - .85, .32)), rot=(0, 0, math.radians(-24 + 200)))
    lp = cabin.matrix_world @ Vector((-W / 2 - .12, -D / 2 - 1.62, 1.55))
    import_model('Lantern_01', loc=lp, decimate=.3)
    empty('fx_lantern', lp + Vector((0, 0, .14)))
    empty('fx_rocker', cabin.matrix_world @ Vector((.9, -D / 2 - .85, .32)))

    # stump with an axe, logs and rocks along the shore
    import_model('tree_stump_01', loc=(2.2, 1.9, terrain_z(2.2, 1.9) - .05), rot=(0, 0, 1.1), decimate=.35)
    import_model('wooden_axe', loc=(2.2, 1.95, terrain_z(2.2, 1.9) + .55), rot=(math.radians(28), 0, math.radians(20)))
    import_model('dead_tree_trunk_02', loc=(-4.2, 2.9, terrain_z(-4.2, 2.9) + .08), rot=(0, 0, math.radians(18)), decimate=.2)
    import_model('dead_tree_trunk', loc=(6.4, 5.8, terrain_z(6.4, 5.8) + .1), rot=(0, 0, math.radians(-50)), decimate=.2)
    import_model('rock_moss_set_01', loc=(-2.8, 5.2, -.35), rot=(0, 0, .6), scale=.8, decimate=.35)

    # the dock, walking out into the black water
    pier = import_model('modular_wooden_pier', rot=(0, 0, 0), scale=1.0, decimate=.35)
    bpy.context.view_layer.update()
    top = max((o.matrix_world @ Vector(c)).z for o in pier.children_recursive if o.type == 'MESH' and 'plank' in o.name for c in o.bound_box)
    ymin = min((o.matrix_world @ Vector(c)).y for o in pier.children_recursive if o.type == 'MESH' for c in o.bound_box)
    pier.location = (-1.9, 1.7 - ymin, .32 - top)

    # dead trees and grass on the near shore
    for i, (x, y, h) in enumerate([(-3.3, 1.2, 5.5), (6.8, 2.4, 6.5), (-6.5, -.6, 6), (3.0, -2.6, 5), (-2.2, -3.4, 4.5), (8.5, -1.5, 7)]):
        dead_tree(f'dead_tree_{i}', (x, y, terrain_z(x, y)), h, bark, 30 + i)
    for i in range(34):
        a = R.uniform(0, math.tau); d = R.uniform(1.6, 7.5)
        x, y = math.cos(a) * d, math.sin(a) * d * .7 - .5
        if y > shore_y(x) - .3 or (abs(x - 4.4) < 2.4 and abs(y - 2.6) < 2.4):
            continue
        import_model('grass_medium_01' if i % 3 else 'fern_02', loc=(x, y, terrain_z(x, y) - .02), rot=(0, 0, R.uniform(0, 6)), scale=R.uniform(.6, 1.0), keep=None if i % 3 == 0 else ['small', 'mid'])

    # pine forest: far shore and hills, one merged mesh
    bm = bmesh.new()
    rr = random.Random(3)
    for i in range(170):
        if i < 110:
            x = rr.uniform(-20, 20); y = rr.uniform(12.5, 21)
        else:
            s = rr.choice((-1, 1)); x = s * rr.uniform(9.5, 19); y = rr.uniform(-10, 13)
        pine(bm, x, y, terrain_z(x, y), rr.uniform(6, 11), rr)
    trees = mesh_obj('pines', bm, needles)

    hdri_to_jpg(f'{CACHE}/hdri/lakeside_night_2k.hdr', os.path.join(SETS, 'lake_env.jpg'), 1024, exposure=-2.5)
    dump_fx(os.path.join(SETS, 'lakehouse.fx.json'))
    export(os.path.join(RAW, 'lakehouse.glb'))


# ------------------------------------------------------------------ Sanctuary
def pew(x, y, length, wood):
    parts = [cube('pew_seat', (.46, length, .05), (x, y, .46), wood, uv=.8),
             cube('pew_back', (.05, length, .6), (x + .24, y, .78), wood, rot=(0, math.radians(8), 0), uv=.8),
             cube('pew_kneeler', (.14, length - .1, .06), (x - .38, y, .16), wood, uv=.8)]
    for s in (-1, 1):
        parts.append(cube('pew_end', (.56, .06, 1.0), (x + .02, y + s * length / 2, .5), wood, uv=.8))
        parts.append(cube('pew_cap', (.6, .1, .05), (x + .02, y + s * length / 2, 1.02), wood, uv=.8))
    return join(parts, 'pew')


def build_chapel():
    reset()
    floor_m = pbr('chapel_floor', 'monastery_stone_floor', 1.0)
    brick = pbr('chapel_brick', 'church_bricks_02', 1.0)
    pier_m = pbr('chapel_stone', 'old_stone_wall', 1.0)
    wood = pbr('pew_wood', 'dark_wood', 1.0)
    ceil = pbr('chapel_ceiling', 'dark_wooden_planks', 1.0)
    cloth = pbr('altar_cloth', None, color=(.78, .74, .66), rough=.9)
    runner = pbr('aisle_runner', None, color=(.16, .015, .02), rough=.95)
    glass = pbr('fx_glass', None, color=(1, 1, 1), emissive=(1, 1, 1))
    wax = pbr('candle_wax', None, color=(.85, .8, .7), rough=.6)
    night = pbr('night_outside', None, color=(0.004, 0.006, 0.012), rough=1)

    X0, X1, Y0, Y1, H = -10.5, 8.0, -5.5, 6.0, 8.5
    fl = cube('chapel_floor', (X1 - X0, Y1 - Y0, .2), ((X0 + X1) / 2, (Y0 + Y1) / 2, -.1), floor_m, uv=1.6)
    cube('aisle_runner', (15.5, 1.25, .012), (-2.2, 0, .006), runner)
    # outer walls
    back = cube('wall_back', (X1 - X0, .6, H), ((X0 + X1) / 2, Y1 + .3, H / 2), brick, uv=2.0)
    front = cube('wall_front', (X1 - X0, .6, H), ((X0 + X1) / 2, Y0 - .3, H / 2), brick, uv=2.0)
    end = cube('wall_altar', (.6, Y1 - Y0 + 1.2, H), (X0 - .3, (Y0 + Y1) / 2, H / 2), brick, uv=2.0)
    cube('wall_door', (.6, Y1 - Y0 + 1.2, H), (X1 + .3, (Y0 + Y1) / 2, H / 2), brick, uv=2.0)
    ceilo = cube('ceiling', (X1 - X0 + 1, Y1 - Y0 + 1, .2), ((X0 + X1) / 2, (Y0 + Y1) / 2, H + .1), ceil, uv=2.0)
    for x in [X0 + 1 + i * 1.8 for i in range(11)]:
        cube('beam', (.26, Y1 - Y0, .34), (x, (Y0 + Y1) / 2, H - .17), wood, uv=1)

    # lancet windows in the side aisle wall (behind the arcade) and a rose window above the altar
    glass_i = 0
    for x in (-6.5, -2.5, 1.5, 5.5):
        pts = gothic_arch(1.1, 3.6)
        c = prism('cutter_l', pts, 1.2); c.location = (x, Y1 + .3, 2.4); cut(back, c)
        g = glass_plane(f'fx_glass_lancet_{glass_i}', pts, glass); g.location = (x, Y1 + .12, 2.4); glass_i += 1
        o = cube('outside', (1.4, .05, 4.0), (x, Y1 + .62, 4.2), night)
    rose_pts = [(math.cos(a) * 1.5, math.sin(a) * 1.5) for a in [i / 48 * math.tau for i in range(48)]]
    c = prism('cutter_rose', rose_pts, 1.2); c.rotation_euler = (0, 0, math.pi / 2); c.location = (X0 - .3, 0, 5.6); cut(end, c)
    g = glass_plane('fx_glass_rose', rose_pts, glass); g.rotation_euler = (0, 0, math.pi / 2); g.location = (X0 - .12, 0, 5.6)
    cube('outside', (.05, 3.4, 3.4), (X0 - .62, 0, 5.6), night)
    for y in (-2.4, 2.4):
        pts = gothic_arch(.9, 3.2)
        c = prism('cutter_l', pts, 1.2); c.rotation_euler = (0, 0, math.pi / 2); c.location = (X0 - .3, y, 1.6); cut(end, c)
        g = glass_plane(f'fx_glass_lancet_{glass_i}', pts, glass); g.rotation_euler = (0, 0, math.pi / 2); g.location = (X0 - .12, y, 1.6); glass_i += 1
        cube('outside', (.05, 1.2, 3.4), (X0 - .62, y, 3.2), night)

    # arcade: a thick wall with pointed arches between clustered stone piers, splitting nave from the side aisle
    AY = 3.1
    arc = cube('arcade', (X1 - X0, .5, H), ((X0 + X1) / 2, AY, H / 2), brick, uv=2.0)
    xs = [-8.2, -5.2, -2.2, .8, 3.8, 6.8]
    for a, b in zip(xs, xs[1:]):
        pts = gothic_arch(b - a - .9, 5.4)
        c = prism('cutter_a', pts, 1.0); c.location = ((a + b) / 2, AY, 0); cut(arc, c)
    for x in xs:
        cylinder('pier', .34, 5.6, (x, AY, 2.8), pier_m, seg=16, uv=1.2)
        for dx, dy in ((.3, 0), (-.3, 0), (0, .3), (0, -.3)):
            cylinder('shaft', .1, 5.6, (x + dx, AY + dy, 2.8), pier_m, seg=10, uv=1.2)
        cube('pier_base', (.95, .95, .35), (x, AY, .17), pier_m, uv=1)
        cube('pier_capital', (.9, .9, .3), (x, AY, 5.5), pier_m, uv=1)

    # pews: full rows on the far side of the aisle, a few on the near side towards the altar
    for x in [-6.6 + i * 1.0 for i in range(11)]:
        pew(x, 1.75, 2.1, wood)
    for x in [-6.6 + i * 1.0 for i in range(4)]:
        pew(x, -1.75, 2.1, wood)

    # altar
    for i in range(3):
        cube('altar_step', (2.2 - i * .45, 5.0 - i * .6, .16), (X0 + 1.4 - i * .2, 0, .08 + i * .16), pier_m, uv=1)
    cube('altar', (.8, 2.2, 1.0), (X0 + 1.1, 0, .98), pier_m, uv=1)
    cube('altar_cloth', (.84, 2.3, .03), (X0 + 1.1, 0, 1.5), cloth)
    cube('altar_cloth_front', (.02, 1.6, .7), (X0 + 1.53, 0, 1.2), cloth)
    import_model('brass_candleholders', loc=(X0 + 1.1, 0, 1.515), rot=(0, 0, math.pi / 2), decimate=.5)
    import_model('gothic_statue', loc=(X0 + 1.3, 2.3, .48), rot=(0, 0, -math.pi / 2), decimate=.6)
    import_model('GothicCabinet_01', loc=(5.2, Y1 - .6, 0), rot=(0, 0, math.pi), decimate=.6)
    import_model('Chandelier_01', loc=(.2, -.2, 4.4), decimate=.5)
    import_model('vintage_oil_lamp', loc=(-4.4, -.72, 1.04), decimate=.6)
    empty('fx_oil_lamp', (-4.4, -.72, 1.42))
    empty('fx_chandelier', (.2, -.2, 3.9))

    # candles: clusters on the floor and the altar steps, each with an fx_flame hook
    wax_parts = []
    rr = random.Random(11)
    clusters = [(-7.8, 1.9, .48, 9), (-7.8, -1.9, .48, 9), (-3.4, 2.55, 0, 7), (2.4, 2.6, 0, 8), (6.2, -2.8, 0, 7), (-5.2, -2.8, 0, 6), (X0 + 1.1, 0, 1.53, 0)]
    for cx, cy, cz, n in clusters:
        for i in range(n):
            h = rr.uniform(.08, .42); x = cx + rr.uniform(-.35, .35); y = cy + rr.uniform(-.3, .3); r = rr.uniform(.025, .045)
            wax_parts.append(cylinder('candle', r, h, (x, y, cz + h / 2), wax, seg=10))
            empty('fx_flame', (x, y, cz + h + .03))
    join(wax_parts, 'candles')

    apply_booleans()
    hdri_to_jpg(f'{CACHE}/hdri/small_cathedral_1k.hdr', os.path.join(SETS, 'chapel_env.jpg'), 1024, exposure=-1.0)
    dump_fx(os.path.join(SETS, 'chapel.fx.json'))
    export(os.path.join(RAW, 'chapel.glb'))


if __name__ == '__main__':
    fetch_assets()
    build_lake()
    build_chapel()
