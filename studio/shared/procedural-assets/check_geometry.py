"""Headless geometry checks only. This script never invokes a renderer."""
import sys, os, json, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy, bmesh
from mathutils import Vector
from procassets.fabric import sagged_copy
from procassets.geom import cyl
from procassets.figures import seg
from procassets.furniture import _cyl
from procassets.contacts import settle_on_supports,fit_footprint_on_box_top

checks=[]
for name,builder in [('frustum',cyl),('figure_segment',seg),('furniture_segment',_cyl)]:
    bm=bmesh.new()
    builder(bm,Vector((0,0,0)),Vector((0,0,2)),.4,.4,**({'mi':0,'n':12} if name=='figure_segment' else {'n':12}))
    bm.normal_update()
    assert all(f.normal.dot(f.calc_center_median()-Vector((0,0,1)))>0 for f in bm.faces),name
    bm.free();checks.append(name+'_outward_normals')

bpy.ops.mesh.primitive_plane_add(size=2)
source=bpy.context.object;source.scale=(2,3,.2);source.rotation_euler=(.12,.08,.6)
bpy.context.view_layer.update()
original=[tuple(v.co) for v in source.data.vertices]
copy=sagged_copy(source,.05,0,11)
bpy.context.view_layer.update()
inv=source.matrix_world.inverted();drops=[]
for v in copy.data.vertices:
    # World displacement can move local XY on a tilted membrane. Recover
    # the unsagged plane by intersecting the world vertical through each vertex.
    local_up=inv.to_3x3() @ Vector((0,0,1))
    drop=-v.co.z/local_up.z
    rest=v.co+local_up*drop
    assert abs(rest.x)<=1+1e-6 and abs(rest.y)<=1+1e-6
    if abs(abs(rest.x)-1)<1e-6 or abs(abs(rest.y)-1)<1e-6:assert abs(drop)<1e-6
    displacement=copy.matrix_world@v.co-source.matrix_world@rest
    assert abs(displacement.x)<1e-6 and abs(displacement.y)<1e-6
    drops.append(drop)
assert abs(max(drops)-.05)<1e-6,max(drops)
assert [tuple(v.co) for v in source.data.vertices]==original
assert source.data!=copy.data
checks.extend(['fabric_fixed_edges','fabric_world_gravity','fabric_sag_in_metres','fabric_preserves_source_mesh'])
bpy.ops.mesh.primitive_cube_add(size=1,location=(20,0,.5))
support=bpy.context.object;support.scale=(3,2,1)
bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.12,location=(20,0,1.38))
fruit=bpy.context.object
rows=settle_on_supports([fruit],[support])
assert rows[0]['status']=='SETTLED'
bottom=min((fruit.matrix_world@v.co).z for v in fruit.data.vertices)
assert abs(bottom-1.001)<1e-6,bottom
checks.append('static_produce_contact_1mm')
fruit.location.y=1.08
fit_footprint_on_box_top(fruit,support,max_shift_m=.25)
bpy.context.view_layer.update()
assert max((support.matrix_world.inverted()@fruit.matrix_world@v.co).y for v in fruit.data.vertices)<.5
checks.append('produce_footprint_inside_counter')
out={'status':'PASS','checks':checks,'max_sag_m':max(drops),'render_invocations':0}
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if args:
    os.makedirs(os.path.dirname(os.path.abspath(args[0])),exist_ok=True)
    with open(args[0],'w') as f:json.dump(out,f,indent=2)
print(json.dumps(out))
