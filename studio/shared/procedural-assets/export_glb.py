"""Export every asset in registry.json to GLB (metres, Z-up converted to glTF Y-up by the exporter).

  blender -b --python export_glb.py -- <out_dir> [asset_id ...]

Writes <out_dir>/<id>.glb and <out_dir>/exported_manifest.json (tris, bbox, sha256). Binaries are not meant to be committed.
"""
import bpy, sys, os, json, hashlib, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector, Matrix
import importlib
from procassets import market, vegetation, figures, furniture

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if sys.platform=='darwin' and '--sheet' in args:
    raise SystemExit('Mac rendering is disabled by user request; export GLBs without --sheet.')
out = args[0] if args else os.path.join(HERE, '_out'); only = set(args[1:])
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
os.makedirs(out, exist_ok=True)

def mat(name, col, rough=0.7, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes = True
    m.diffuse_color=col+(1,);m.roughness=rough;m.metallic=metal
    p = m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = col + (1,); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    return m

COL = {'orange': (0.85, 0.35, 0.05), 'tomato': (0.7, 0.07, 0.03), 'apple': (0.55, 0.06, 0.04), 'lemon': (0.85, 0.7, 0.07), 'aubergine': (0.22, 0.05, 0.2), 'pear': (0.5, 0.58, 0.15)}
wood = mat('Timber', (0.5, 0.33, 0.18), 0.6); iron = mat('CastIron', (0.035, 0.04, 0.038), 0.45, 0.8); steel = mat('Steel', (0.4, 0.42, 0.42), 0.35, 0.8)
green = mat('Herb', (0.1, 0.3, 0.08), 0.7); bread_m = mat('Bread', (0.62, 0.38, 0.14), 0.75)


CATALOG = {
 'Steel': ((0.4, 0.42, 0.42), 0.35, 0.8), 'CastIron': ((0.035, 0.04, 0.038), 0.45, 0.8), 'Reflective': ((0.85, 0.85, 0.75), 0.3, 0.0),
 'Concrete': ((0.55, 0.54, 0.52), 0.9, 0.0), 'Soil': ((0.12, 0.07, 0.04), 1.0, 0.0), 'Herb': ((0.1, 0.3, 0.08), 0.7, 0.0), 'Timber': ((0.5, 0.33, 0.18), 0.6, 0.0),
 'Ceramic': ((0.85, 0.82, 0.78), 0.3, 0.0), 'DarkChannel': ((0.03, 0.03, 0.03), 0.8, 0.0), 'SignPanel': ((0.05, 0.1, 0.2), 0.5, 0.0),
 'BinGreen': ((0.1, 0.35, 0.15), 0.6, 0.0), 'BinBlue': ((0.1, 0.2, 0.5), 0.6, 0.0), 'BinYellow': ((0.8, 0.65, 0.1), 0.6, 0.0),
 'Terracotta': ((0.55, 0.22, 0.1), 0.85, 0.0), 'Bark': ((0.25, 0.17, 0.1), 0.9, 0.0), 'LeafSilver': ((0.35, 0.42, 0.32), 0.6, 0.0), 'Stem': ((0.1, 0.3, 0.08), 0.7, 0.0),
 'Petal': ((0.85, 0.2, 0.3), 0.6, 0.0), 'FlowerCentre': ((0.8, 0.6, 0.05), 0.7, 0.0), 'Porcelain': ((0.92, 0.9, 0.86), 0.15, 0.0), 'Glass': ((0.9, 0.95, 1.0), 0.02, 0.0),
 'GlassDark': ((0.02, 0.08, 0.03), 0.05, 0.0), 'Label': ((0.9, 0.85, 0.7), 0.7, 0.0), 'Foil': ((0.7, 0.5, 0.1), 0.3, 1.0), 'Napkin': ((0.85, 0.85, 0.9), 0.9, 0.0),
 'Fabric': ((0.45, 0.4, 0.34), 0.95, 0.0), 'RugField': ((0.55, 0.38, 0.25), 1.0, 0.0), 'RugBorder': ((0.2, 0.18, 0.15), 1.0, 0.0), 'BookRed': ((0.5, 0.08, 0.07), 0.7, 0.0), 'BookBlue': ((0.08, 0.14, 0.4), 0.7, 0.0), 'BookGreen': ((0.1, 0.3, 0.15), 0.7, 0.0), 'Paper': ((0.9, 0.88, 0.8), 0.9, 0.0),
 'Canvas': ((0.7, 0.55, 0.35), 0.9, 0.0), 'LeafDark': ((0.06, 0.25, 0.1), 0.5, 0.0), 'Zinc': ((0.6, 0.62, 0.64), 0.35, 0.9), 'Rubber': ((0.04, 0.04, 0.04), 0.9, 0.0), 'PlinthBody': ((0.88, 0.87, 0.84), 0.6, 0.0), 'PlinthTop': ((0.95, 0.95, 0.93), 0.3, 0.0),
 'ShadeMetal': ((0.1, 0.1, 0.1), 0.35, 0.8), 'Cord': ((0.02, 0.02, 0.02), 0.8, 0.0), 'BulbEmissive': ((1.0, 0.85, 0.55), 0.3, 0.0),
}
def catmat(name):
    col, rough, metal = CATALOG[name]; m = mat('C_' + name, col, rough, metal); p = m.node_tree.nodes['Principled BSDF']
    if name == 'Glass': p.inputs['Transmission Weight'].default_value = 1.0
    if name == 'BulbEmissive': p.inputs['Emission Color'].default_value = col + (1,); p.inputs['Emission Strength'].default_value = 8.0
    return m

def build(a):
    b, p, i = a['builder'], a['params'], a['id']; objs = []
    if b == 'gen':
        bm = getattr(importlib.import_module('procassets.' + a['module']), a['func'])(**p)
        objs = [market.to_obj(bm, i, [catmat(n) for n in a['materials']], Vector((0, 0, 0)), (0, 0, 0), (1, 1, 1))]
    elif b == 'fruit':
        k = p['kind']; d = p['diameter']
        objs = [market.to_obj(market.fruit_mesh(k, 3), i, [mat('P_' + k, COL[k], 0.55), green], Vector((0, 0, 0)), (0, 0, 0), (d, d, d))]
    elif b == 'crate': objs = [market.to_obj(market.crate_bm(p['w'], p['d'], p['h'], 5), i, [wood], Vector((0, 0, p['h'] / 2)), (0, 0, 0), (1, 1, 1))]
    elif b == 'stall': objs = [market.to_obj(market.stall_frame_bm(p['w'], p['d'], p['h']), i, [steel], Vector((0, 0, p['h'] / 2)), (0, 0, 0), (1, 1, 1))]
    elif b == 'basket': objs = [market.to_obj(market.basket_bm(p['radius'], p['h']), i, [wood], Vector((0, 0, p['h'] / 2)), (0, 0, 0), (1, 1, 1))]
    elif b == 'bread': objs = [market.to_obj(market.bread_bm(p['L'], p['W'], p['H'], 4), i, [bread_m], Vector((0, 0, p['H'] * 0.4)), (0, 0, 0), (1, 1, 1))]
    elif b == 'herb': objs = [market.to_obj(market.herb_bm(2), i, [green], Vector((0, 0, 0)), (0, 0, 0), (1, 1, 1))]
    elif b == 'tree': vegetation.platane(i, (0, 0, 0), seed=7, height=p['height'], leaves=p['leaves']); objs = [o for o in bpy.data.objects if o.name.startswith(i)]
    elif b == 'person': objs = [figures.person(i, 0, 0, 0, 0.0, h=p['h'], seed=11, pose=p['pose'], child=p.get('child', False))]
    elif b == 'cafe_set': furniture.cafe_set_objs(Matrix.Identity(4), wood, iron, i); objs = [o for o in bpy.data.objects if o.name.startswith(i)]
    elif b == 'bench': furniture.bench_objs(Matrix.Identity(4), wood, iron, i); objs = [o for o in bpy.data.objects if o.name.startswith(i)]
    elif b == 'lamp': furniture.lamp_obj(Matrix.Identity(4), iron, i); objs = [o for o in bpy.data.objects if o.name.startswith(i)]
    return objs

SHEET = '--sheet' in args; args = [x for x in args if x != '--sheet']; only = set(args[1:]) if SHEET else only
reg = json.load(open(os.path.join(HERE, 'registry.json'))); manifest = []; sheet_items = []
for a in reg['assets']:
    if only and a['id'] not in only: continue
    before = set(bpy.data.objects)
    objs = build(a) or [o for o in bpy.data.objects if o not in before]
    for o in objs:
        o['asset_id']=a['id'];o['generator']='procassets/1';o['units']='metres'
        o['license']='original procedural; no third-party model';o['contract_id']=a.get('contract_id','')
        o['anchor']=a.get('anchor','base_centre')
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    path = os.path.join(out, a['id'] + '.glb')
    if not SHEET: bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, use_active_scene=True, export_apply=True, export_extras=True)
    bpy.context.view_layer.update()
    tris = sum(len(pl.vertices) - 2 for o in objs if o.type == 'MESH' for pl in o.data.polygons)
    cs = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    bb = [[round(min(c[k] for c in cs), 3) for k in range(3)], [round(max(c[k] for c in cs), 3) for k in range(3)]]
    if not SHEET: manifest.append({'id': a['id'], 'contract_id': a.get('contract_id'), 'anchor':a.get('anchor','base_centre'), 'file': os.path.basename(path), 'triangles': tris, 'bbox_m': bb, 'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(path)})
    if SHEET: sheet_items.append((a, objs))
    else:
        for o in objs: bpy.data.objects.remove(o, do_unlink=True)

if SHEET:
    cols = 8; cell = 1.6; sc = bpy.context.scene
    for n, (a, objs) in enumerate(sheet_items):
        pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
        lo = Vector((min(p[0] for p in pts), min(p[1] for p in pts), min(p[2] for p in pts))); hi = Vector((max(p[0] for p in pts), max(p[1] for p in pts), max(p[2] for p in pts)))
        size = max((hi - lo)[k] for k in range(3)); k_ = 1.0 / size if size > 0 else 1.0
        root = bpy.data.objects.new('slot_' + a['id'], None); sc.collection.objects.link(root)
        root.location = ((n % cols) * cell, -(n // cols) * cell, 0); root.scale = (k_, k_, k_)
        for o in objs: o.parent = root; o.location = o.location - Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    rows = (len(sheet_items) + cols - 1) // cols
    bpy.ops.mesh.primitive_plane_add(size=1, location=((cols - 1) * cell / 2, -(rows - 1) * cell / 2, -0.002)); fl = bpy.context.object; fl.scale = (cols * cell + 1, rows * cell + 1, 1)
    fm = bpy.data.materials.new('floor'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.7, 0.7, 0.68, 1); fl.data.materials.append(fm)
    sun = bpy.data.lights.new('s', 'SUN'); sun.energy = 3.5; so = bpy.data.objects.new('s', sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(50), 0, math.radians(30))
    w = sc.world or bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.85, 0.9, 1.0, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(cols * cell + 0.6, rows * cell * 1.5 + 1.0); co = bpy.data.objects.new('c', cd); sc.collection.objects.link(co)
    cy = -(rows - 1) * cell / 2; co.location = ((cols - 1) * cell / 2, cy - 8.0, 8.0); co.rotation_euler = (math.radians(45), 0, 0); sc.camera = co
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.render.resolution_x = 1800; sc.render.resolution_y = 1100 if rows <= 2 else 1500
    sc.view_settings.view_transform = 'AgX'; sc.render.filepath = os.path.join(out, 'contact_sheet.png'); bpy.ops.render.render(write_still=True); print('SHEET', len(sheet_items), 'assets ->', sc.render.filepath)
else:
    json.dump({'assets': manifest}, open(os.path.join(out, 'exported_manifest.json'), 'w'), indent=1)
    print('EXPORTED', len(manifest), 'assets ->', out)
