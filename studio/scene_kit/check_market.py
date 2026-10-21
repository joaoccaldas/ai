"""Check the actual new market meshes, then export review assets. Never render."""
import hashlib,json,math,sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT))
from studio.scene_kit.market import stall,stall_identity,funicular_table
from studio.scene_kit.materials import surface
from studio.scene_kit.export import export_glb

out=Path(sys.argv[sys.argv.index('--')+1]).resolve();out.mkdir(parents=True,exist_ok=True)
coll=bpy.data.collections.new('MarketReviewChecks');bpy.context.scene.collection.children.link(coll)
mats=[surface('Check_'+str(i),c,.6)[0] for i,c in enumerate(
    ((.7,.65,.5),(.3,.15,.07),(.04,.05,.04),(.05,.11,.095)))]
checks=[];assets=[]
for front in (-1,1):
    obj=stall_identity('Shade_'+str(front),coll,mats,front=front)
    xyz=[v.co for v in obj.data.vertices]
    assert max(abs(v.x) for v in xyz)<=1.25 and max(abs(v.y) for v in xyz)<=1.2
    assert min(v.z for v in xyz)>=0 and max(v.z for v in xyz)<=2.10
    assets.append(obj)
checks.append('both_customer_orientations_remain_inside_existing_stall_footprint')
model=funicular_table('EqualLoadTable',coll,mats);assets.append(model)
start,end=model['funicular_cable_vertex_range'];ring=model['funicular_ring_vertices']
centres=[sum((v.co for v in model.data.vertices[k:k+ring]),Vector())/ring for k in range(start,end,ring)]
dx=[b.x-a.x for a,b in zip(centres,centres[1:])]
assert max(dx)-min(dx)<1e-6 and min(dx)>0
slopes=[(b.z-a.z)/(b.x-a.x) for a,b in zip(centres,centres[1:])]
loads=[b-a for a,b in zip(slopes,slopes[1:])]
assert min(loads)>0 and max(loads)-min(loads)<2e-5
assert abs(centres[0].z-centres[-1].z)<1e-6
checks.append('emitted_cable_centres_equilibrate_equal_vertical_loads_at_equal_horizontal_spacing')
for obj in assets:
    assert all(math.isfinite(n) for v in obj.data.vertices for n in v.co)
    assert all(p.area>1e-12 for p in obj.data.polygons),(obj.name,'collapsed face')
checks.append('finite_vertices_and_positive_polygon_areas')
copy=stall_identity('SameShade',coll,mats,front=1)
assert [tuple(v.co) for v in assets[1].data.vertices]==[tuple(v.co) for v in copy.data.vertices]
checks.append('deterministic_shade_geometry')
for width,front in ((.5,1),(2.5,0)):
    try:stall_identity('Rejected',coll,mats,width=width,front=front)
    except ValueError:pass
    else:raise AssertionError('Invalid footprint accepted')
checks.append('invalid_dimensions_and_orientation_rejected')
records=[]
for name,objects in [('stall-identity',[assets[1]]),('funicular-table',[model])]:
    record=export_glb(out/(name+'.glb'),objects)
    record.update(id=objects[0]['asset_id'],anchor='floor_centre',units='metres',source_axes='Z up',export_axes='Y up')
    records.append(record)
report={'status':'GEOMETRY_CHECKS_PASS_VISUAL_REVIEW_PENDING','checks':checks,'assets':records,
    'source_sha256':hashlib.sha256((Path(__file__).parent/'market.py').read_bytes()).hexdigest(),
    'blender':bpy.app.version_string,'render_invocations':0,
    'limits':['Portable surfaces are constant PBR approximations.',
              'No human/device, construction or competition acceptance.']}
(out/'market-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
