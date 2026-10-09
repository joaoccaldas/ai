"""Check shared geometry/material overrides and source preservation without rendering."""
import json
import struct
import sys
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.materials import surface
from studio.scene_kit.export import export_glb

out=Path(sys.argv[sys.argv.index('--')+1]).resolve()
out.parent.mkdir(parents=True,exist_ok=True)
coll=bpy.data.collections.new('ExportFixture');bpy.context.scene.collection.children.link(coll)
red=surface('RedSource',(.5,.02,.01))[0]
green=surface('GreenOverride',(.02,.4,.03))[0]
m=MeshBuilder();m.box((0,0,.5),(1,1,1));a=m.object('FixtureA',coll,[red],False)
b=bpy.data.objects.new('FixtureB',a.data);coll.objects.link(b);b.location.x=2
c=bpy.data.objects.new('FixtureC',a.data);coll.objects.link(c);c.location.x=4
for o in [b,c]:o.material_slots[0].link='OBJECT';o.material_slots[0].material=green
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT');a.select_set(True);bpy.context.view_layer.objects.active=a
coords=[tuple(v.co) for v in a.data.vertices];matrix=a.matrix_world.copy()
result=export_glb(out,[a,b,c])
blob=out.read_bytes();doc=json.loads(blob[20:20+struct.unpack_from('<I',blob,12)[0]])
nodes={n['extras']['source_object_name']:n for n in doc['nodes'] if 'mesh' in n}
assert nodes['FixtureB']['mesh']==nodes['FixtureC']['mesh']
assert nodes['FixtureA']['mesh']!=nodes['FixtureB']['mesh']
def color(name):
    p=doc['meshes'][nodes[name]['mesh']]['primitives'][0]
    return doc['materials'][p['material']]['pbrMetallicRoughness']['baseColorFactor'][:3]
assert max(abs(x-y) for x,y in zip(color('FixtureA'),(.5,.02,.01)))<1e-5
assert max(abs(x-y) for x,y in zip(color('FixtureB'),(.02,.4,.03)))<1e-5
assert [tuple(v.co) for v in a.data.vertices]==coords and a.matrix_world==matrix
assert a.data.materials[0]==red and b.material_slots[0].material==green
assert bpy.context.selected_objects==[a] and bpy.context.view_layer.objects.active==a
assert not any(o.name.startswith('SK_TEMP_EXPORT') for o in bpy.data.objects)
assert not any(c.name.startswith('SK_TEMP_EXPORT') for c in bpy.data.collections)
print(json.dumps({'status':'PASS','checks':['object_material_overrides','shared_mesh_reuse',
    'source_mesh_and_transform_preserved','source_materials_preserved','selection_restored',
    'temporary_collection_removed'],'render_invocations':0,'export':result}))
