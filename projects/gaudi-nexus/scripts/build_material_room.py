"""Compose original props into a private room candidate; geometry preparation only.

Uses Scene Kit geometry/materials and the existing Atlas prepare_world.py exporter.
The manifest owns dimensions, placements, exact input identities and variants.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.materials import surface
sys.path.insert(0, str(ROOT/'studio/shared/procedural-assets'))
from procassets import surface as portable_surface

parser = argparse.ArgumentParser()
parser.add_argument('--manifest', type=Path, required=True)
parser.add_argument('--variant', choices=['daylight', 'nocturne'], required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
if args.output.exists() or args.output.suffix != '.blend':
    raise ValueError('Choose a fresh derived BLEND path')
manifest = json.loads(args.manifest.read_text())
assert manifest['schemaVersion'] == 1 and manifest['units'] == 'metres'
sources = {}
for asset_id, record in manifest['assets'].items():
    source = (ROOT / record['path']).resolve()
    if ROOT not in source.parents or source.is_symlink() or hashlib.sha256(source.read_bytes()).hexdigest() != record['sha256']:
        raise ValueError('Missing or changed exact source: ' + asset_id)
    sources[asset_id] = source

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
collection = bpy.data.collections.new('MaterialRoomStudy')
scene.collection.children.link(collection)
variant = manifest['variants'][args.variant]
wall = surface('Study_LimeWall', tuple(variant['wall']), .91)[0]
stone = surface('Study_Stone', (.40,.38,.32), .7)[0]
bronze = surface('Study_Bronze', (.33,.22,.10), .32, .7)[0]
wood = [surface('Study_Timber_'+str(i), tuple(c*(.90+i*.05) for c in variant['floor']), .62)[0] for i in range(4)]

def boxes(name, parts, materials):
    builder = MeshBuilder()
    for center, size, slot in parts:
        builder.box(center, size, slot)
    return builder.object(name, collection, materials, smooth=False)

# One batched plank mesh, with narrow real gaps and a solid support underneath.
floor_parts = []
for x in range(30):
    for y in range(8):
        floor_parts.append(((-2.9+x*.2, -3.275+y*.94, -.035),(.194,.932,.07),(x*3+y)%4))
floor = boxes('Study_PlankFloor', floor_parts, wood)
# Reuse one generated tile rather than embed one image pair for every plank.
portable_surface.apply(wood[0], 'oak', seed=93, size=512)
for slot in range(len(floor.data.materials)): floor.data.materials[slot] = wood[0]
portable_surface.box_uv(floor, metres=.9)
uv = floor.data.uv_layers.active.data
for polygon in floor.data.polygons:
    plank = polygon.index//6
    for index in polygon.loop_indices:
        u,v = uv[index].uv
        # Oak grain follows the long plank axis; local offsets break repetition.
        uv[index].uv = (v+plank*.173,u+(plank%7)*.013)
wood[0]['web_material_status'] = 'generated portable color/normal tiles; not Cycles equivalence'
floor['caldas_room_study'] = 1
floor['study_id'] = manifest['id'] + '-' + args.variant
floor['representation'] = 'room-assembly-candidate'
floor['asset_id'] = manifest['id'] + '-floor'
boxes('Study_Support', [((0,0,-.105),(6.2,7.6,.14),0)], [stone])
walls = boxes('Study_Walls', [((-3.08,0,1.7),(.16,7.6,3.4),0),((0,3.8,1.7),(6.3,.16,3.4),0)], [wall])
portable_surface.apply(wall, 'stone', seed=12, size=512)
# Keep each finish's authored pigment; only the generated micro-normal is used.
base = wall.node_tree.nodes.get('Principled BSDF').inputs['Base Color']
for link in list(base.links): wall.node_tree.links.remove(link)
portable_surface.box_uv(walls, metres=1.1)
wall['web_material_status'] = 'constant pigment plus generated micro-normal; not a physical material measurement'
# East openings and an open skylight are actual geometry, not painted shadows.
parts = [((3.08,0,.35),(.16,7.6,.7),0),((3.08,0,3.24),(.16,7.6,.32),0)]
parts += [((3.08,-3.4+i*1.15,1.9),(.16,.10,2.5),0) for i in range(7)]
parts += [((0,-3.2+i*1.1,3.35),(6.3,.12,.18),0) for i in range(7)]
boxes('Study_WindowAndRoof', parts, [wall])
boxes('Study_Bench', [((1.25,1,.83),(.75,3.4,.14),0),((1.25,-.3,.39),(.65,.14,.78),0),((1.25,2.3,.39),(.65,.14,.78),0)], wood)
plinths = boxes('Study_Plinths', [((x,.2,.425),(.66,.66,.85),0) for x in [-.6,.5]], [stone])
bevel = plinths.modifiers.new('Small edge highlight', 'BEVEL')
bevel.width = .008; bevel.segments = 3
boxes('Study_BronzeTrim', [((x,.2,.853),(.67,.67,.006),0) for x in [-.6,.5]], [bronze])

prototypes = {}
for asset_id, source in sources.items():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = set(bpy.data.objects)-before
    roots = [o for o in imported if o.parent not in imported]
    prototypes[asset_id] = (imported, roots)

placed = []
used = set()
for n, entry in enumerate(manifest['placements']):
    asset_id = entry['asset']
    original, roots = prototypes[asset_id]
    # Later placements link mesh data, preserving original material/UV choices.
    if asset_id in used:
        copies = {o:o.copy() for o in original}
        for src, obj in copies.items():
            collection.objects.link(obj)
            obj.parent = copies.get(src.parent)
        children = [copies[r] for r in roots]
    else:
        children = roots
        used.add(asset_id)
    parent = bpy.data.objects.new('StudySlot_'+str(n)+'_'+asset_id, None)
    collection.objects.link(parent)
    parent['reuse_source_sha256'] = manifest['assets'][asset_id]['sha256']
    parent['asset_id'] = asset_id
    for child in children:
        child.parent = parent
    parent.location = entry['at']
    parent.rotation_euler.z = math.radians(entry.get('rotationZ',0))
    parent.scale = (entry.get('scale',1),)*3
    placed.append(parent)

def camera(name, point, target, lens):
    data = bpy.data.cameras.new(name)
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = point
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.lens = lens
    data.clip_start = .04
    data.clip_end = 100
    return obj

scene.camera = camera('StudyArrival', (0,-3.3,1.75),(-.15,2,1.4),24)
camera('StudyObjects', (1.7,-1.8,1.65),(-.05,.3,1.15),36)
camera('StudyOverview', (-1.8,-3.45,2.8),(.35,1.15,1.2),21)
bpy.context.view_layer.update()
meshes = [o for o in scene.objects if o.type=='MESH']
for obj in meshes:
    # A mapped material may be shared by floor/bench or wall/window geometry.
    # Every user needs UVs; one unmapped user produced glTF texCoord=-1.
    if obj.name.startswith('Study_') and any(s.material and s.material.use_nodes and any(n.type=='TEX_IMAGE' for n in s.material.node_tree.nodes) for s in obj.material_slots):
        if not obj.data.uv_layers: portable_surface.box_uv(obj, metres=.9)
        obj.data.uv_layers.active.name = 'UVMap'
        obj.data.uv_layers.active.active_render = True
    assert all(math.isfinite(c) for v in obj.data.vertices for c in v.co)
    assert all(p.area > 1e-12 for p in obj.data.polygons), obj.name
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    try:
        assert all(math.isfinite(c) for v in mesh.vertices for c in v.co)
        assert all(p.area > 1e-12 for p in mesh.polygons), obj.name
    finally: evaluated.to_mesh_clear()
contact = []
for entry, obj in zip(manifest['placements'], placed):
    if entry['asset']=='mirror': continue
    points = [child.matrix_world @ Vector(corner) for child in obj.children_recursive if child.type=='MESH' for corner in child.bound_box]
    lowest = min(p.z for p in points)
    assert abs(lowest-entry['at'][2]) < .002, (obj.name,lowest,entry['at'][2])
    contact.append({'slot':obj.name,'lowestZ':lowest,'supportZ':entry['at'][2]})
args.output.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
bpy.ops.wm.save_as_mainfile(filepath=str(args.output))
assert all(hashlib.sha256(p.read_bytes()).hexdigest()==manifest['assets'][i]['sha256'] for i,p in sources.items())
receipt={'schemaVersion':1,'variant':args.variant,'representation':'candidate-room-assembly','manifestSha256':hashlib.sha256(args.manifest.read_bytes()).hexdigest(),'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'sources':manifest['assets'],'placements':manifest['placements'],'contactChecks':contact,'meshObjects':len(meshes),'uniqueMeshDatablocks':len({o.data.as_pointer() for o in meshes}),'blenderVersion':bpy.app.version_string,'sourcePreserved':True,'rendered':False,'productionAccepted':False,'outputSha256':hashlib.sha256(args.output.read_bytes()).hexdigest()}
args.output.with_suffix('.assembly.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('ROOM_ASSEMBLY',json.dumps({'variant':args.variant,'contacts':len(contact),'meshes':len(meshes),'rendered':False}))
