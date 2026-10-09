"""Meaningful mesh/clearance checks; never invokes a renderer."""
import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
import bpy,bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from studio.scene_kit.architecture import floor_plate,projected_top_area,switchback_stair
from studio.scene_kit.materials import surface

coll=bpy.data.collections.new('ArchitectureChecks');bpy.context.scene.collection.children.link(coll)
mats=[surface('CheckStone',(.6,.6,.6),.8)[0],surface('CheckSteel',(.1,.1,.1),.3,.8)[0]]
checks=[]
slab=floor_plate('UnionVoidFloor',coll,mats,(-5,-5,5,5),0,voids=[(-2,-2,2,2),(0,0,3,3)])
slab.rotation_euler.z=.71;slab.location=(15,12,0);bpy.context.view_layer.update()
assert abs(projected_top_area(slab)-79)<.0002
bm=bmesh.new();bm.from_mesh(slab.data)
assert all(len(e.link_faces)==2 for e in bm.edges)
bm.normal_update();assert bm.calc_volume()>0;bm.free()
checks.extend(['overlapping_voids_count_once','floor_area_from_rotated_mesh','watertight_floor_with_voids','outward_floor_winding'])
stair,p,samples=switchback_stair('AccessCore',coll,mats)
assert p['risers']*p['riser_m']==4.5 and p['riser_m']<=.18
assert p['risers']==26 and abs(p['run_m']-3.36)<1e-9
checks.append('stair_exact_rise_and_two_flights')
upper=floor_plate('Upper',coll,mats,(-1.5,-.1,5,3.3),4.5,voids=[tuple(p['floor_void_local_m'])])
roof=floor_plate('CeilingFixture',coll,mats,(-2,-1,6,4),8.5,thickness=.2)
bpy.context.view_layer.update()
def tree(objects):
    verts=[];faces=[]
    for obj in objects:
        start=len(verts);verts.extend(obj.matrix_world@v.co for v in obj.data.vertices)
        faces.extend(tuple(start+i for i in f.vertices) for f in obj.data.polygons)
    return BVHTree.FromPolygons(verts,faces)
bvh=tree([upper,roof]);clear=[]
samples+=[[p['run_m']+.75,p['width_m']/2,2.25],[-.75,p['width_m']/2,4.5]]
for sample in samples:
    pt=Vector(sample)
    hit,normal,index,distance=bvh.ray_cast(pt+Vector((0,0,.001)),Vector((0,0,1)),20)
    assert hit is not None
    clear.append(hit.z-pt.z)
assert min(clear)>=3.7999
checks.append('stairs_and_landings_clear_through_floor_void')
# Deliberately lower the ceiling to the single-level source datum. A proposed
# upper landing at 4.5 m then has only 0.5 m clearance; the screen must reject it.
roof.location.z=-3.3;bpy.context.view_layer.update();bvh=tree([upper,roof])
pt=Vector((-.75,p['width_m']/2,4.5));hit=bvh.ray_cast(pt+Vector((0,0,.001)),Vector((0,0,1)),20)[0]
assert hit is not None and abs(hit.z-pt.z-.5)<1e-5
checks.append('detects_low_roof_upper_landing_conflict')
result={'status':'PASS','checks':checks,'prototype_min_clear_height_m':min(clear),'source_height_fixture_clearance_m':hit.z-pt.z,'render_invocations':0,'limits':'Geometry fixture checks; no code or engineering certification'}
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if args:
    path=Path(args[0]);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,indent=2))
print(json.dumps(result))
