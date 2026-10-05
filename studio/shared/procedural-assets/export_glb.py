"""Export every asset in registry.json to GLB (metres, Z-up converted to glTF Y-up by the exporter).

  blender -b --python export_glb.py -- <out_dir> [asset_id ...]

Writes <out_dir>/<id>.glb and <out_dir>/exported_manifest.json (tris, bbox, sha256). Binaries are not meant to be committed.
"""
import bpy, sys, os, json, hashlib, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector, Matrix
from procassets import market, vegetation, figures, furniture

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = args[0] if args else os.path.join(HERE, '_out'); only = set(args[1:])
os.makedirs(out, exist_ok=True)

def mat(name, col, rough=0.7, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = col + (1,); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    return m

COL = {'orange': (0.85, 0.35, 0.05), 'tomato': (0.7, 0.07, 0.03), 'apple': (0.55, 0.06, 0.04), 'lemon': (0.85, 0.7, 0.07), 'aubergine': (0.22, 0.05, 0.2), 'pear': (0.5, 0.58, 0.15)}
wood = mat('Timber', (0.5, 0.33, 0.18), 0.6); iron = mat('CastIron', (0.035, 0.04, 0.038), 0.45, 0.8); steel = mat('Steel', (0.4, 0.42, 0.42), 0.35, 0.8)
green = mat('Herb', (0.1, 0.3, 0.08), 0.7); bread_m = mat('Bread', (0.62, 0.38, 0.14), 0.75)

def build(a):
    b, p, i = a['builder'], a['params'], a['id']; objs = []
    if b == 'fruit':
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

reg = json.load(open(os.path.join(HERE, 'registry.json'))); manifest = []
for a in reg['assets']:
    if only and a['id'] not in only: continue
    before = set(bpy.data.objects)
    objs = build(a) or [o for o in bpy.data.objects if o not in before]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    path = os.path.join(out, a['id'] + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True)
    tris = sum(len(pl.vertices) - 2 for o in objs if o.type == 'MESH' for pl in o.data.polygons)
    cs = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    bb = [[round(min(c[k] for c in cs), 3) for k in range(3)], [round(max(c[k] for c in cs), 3) for k in range(3)]]
    manifest.append({'id': a['id'], 'contract_id': a.get('contract_id'), 'file': os.path.basename(path), 'triangles': tris, 'bbox_m': bb, 'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(path)})
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
json.dump({'assets': manifest}, open(os.path.join(out, 'exported_manifest.json'), 'w'), indent=1)
print('EXPORTED', len(manifest), 'assets ->', out)
