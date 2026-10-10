"""Emit separate static collider layer for a saved visual candidate.

Never changes the candidate .blend. Runtime simulation is not claimed.
"""
import sys
import json
import hashlib
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parents[3]))
from studio.scene_kit.collision import static_proxy
from studio.scene_kit.materials import surface
from studio.scene_kit.export import export_glb
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

source=Path(bpy.data.filepath);source_sha=hashlib.sha256(source.read_bytes()).hexdigest()
output=Path(sys.argv[sys.argv.index('--')+1]);output.mkdir(parents=True,exist_ok=True)
coll=bpy.data.collections.new('StaticColliderExport');bpy.context.scene.collection.children.link(coll)
mat=surface('ColliderDebug',(.2,.6,.3))[0];objs=[]
coordinated=bpy.data.objects.get('CoordTrader_01') is not None
for source in list(bpy.data.objects):
    kind=None
    if source.name.startswith('SK_PlantedOak') and source.name.endswith('_wood'):kind='tree'
    elif source.name.startswith('SK_PlantingIsland'):kind='island'
    elif source.name.startswith('SK_OpenStall'):kind='stall'
    if coordinated:
        if source.name.startswith(('VIS_GardenOak_','VIS_ExistingLayoutOak_')) and source.name.endswith('_wood'):kind='tree'
        elif source.name.startswith('VIS_SeatingGarden_'):kind='island'
        elif source.name.startswith('CoordTrader_'):kind='stall'
        elif source.name.startswith(('SK_PlantedOak','SK_PlantingIsland','SK_OpenStall')):kind=None
    if kind:
        dims=source.get('footprint_m',[2.7,2.2])
        obj=static_proxy('COL_'+source.name,coll,mat,kind,source.get('customer_front_local_y',1),
                         width=dims[0],depth=dims[1],height=source.get('height_m',2.1))
        obj.matrix_world=source.matrix_world.copy();obj['visual_source']=source.name
        objs.append(obj)
if len(objs)!=39:raise ValueError('Expected 13 trees, 6 islands and 20 stalls: '+str(len(objs)))
route_checks=[]
if coordinated:
    # Preserve actual slab openings and stair treads instead of sealing with AABBs.
    for src in list(bpy.data.objects):
        if '_CoordFloor_' in src.name or '_CoordStair_' in src.name:
            obj=bpy.data.objects.new('COL_'+src.name,src.data.copy());coll.objects.link(obj)
            obj.matrix_world=src.matrix_world.copy();obj.hide_render=True
            obj['collision_role']='static';obj['visual_source']=src.name
            obj['collision_shape']='mesh';obj['units']='metres'
            obj['asset_id']='collision/coordinated/'+('floor' if '_CoordFloor_' in src.name else 'stair')
            obj['generator']='scene-kit/coordinated-collision/1'
            obj['license']='original-procedural-no-third-party-model'
            obj['friction']=.65;obj['restitution']=.05
            obj['physics_status']='geometry only; runtime navigation unverified';objs.append(obj)
    vertices=[];faces=[]
    for obj in objs:
        if not obj.name.startswith('COL_CoordTrader_'):continue
        offset=len(vertices);vertices.extend(obj.matrix_world@v.co for v in obj.data.vertices)
        faces.extend(tuple(offset+j for j in f.vertices) for f in obj.data.polygons)
    bvh=BVHTree.FromPolygons(vertices,faces)
    tf=Matrix.Translation(Vector((-50,20,0)))@Matrix.Rotation(__import__('math').radians(44.14),4,'Z')
    for y in (-1.59,0,1.59):
        start=tf@Vector((-11.1,y,1.0));end=tf@Vector((14.35,y,1.0));delta=end-start
        hit=bvh.ray_cast(start,delta.normalized(),delta.length)[0]
        assert hit is None, ('Aisle collider intrusion',y,hit)
        route_checks.append({'aisle_local_y_m':y,'height_m':1,'length_m':delta.length,'status':'CLEAR_OF_STALL_COLLIDERS'})
info=export_glb(output/'physics-colliders.glb',objs)
assert hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()==source_sha
(output/'physics-colliders.json').write_text(json.dumps({'status':'STATIC_GEOMETRY_ONLY_RUNTIME_NOT_VALIDATED','source_sha256':source_sha,'source_unchanged':True,'objects':len(objs),'parameters':'suggested friction .65, restitution .05','scope':'kit components and coordinated floor/stair meshes when present; remaining buildings/site/rails not covered','aisle_ray_checks':route_checks,'render_invocations':0,'export':info},indent=2)+'\n')
