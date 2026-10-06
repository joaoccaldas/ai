"""Supported fabric sag as a visual membrane approximation, in real metres.

No load/stress claim. Existing objects and mesh data remain untouched.
"""
import math
import bpy
import bmesh
from mathutils import Vector


def sagged_copy(source, sag_m=.05, weave_m=.004, subdivisions=12):
    if source.type!='MESH' or not all(math.isfinite(v) for row in source.matrix_world for v in row) or min(abs(v) for v in source.scale)<1e-8:
        raise ValueError('Fabric requires a finite mesh transform')
    if not (0<=weave_m<=sag_m and math.isfinite(sag_m)) or not 0<=subdivisions<=64:
        raise ValueError('Require finite sag >= weave >= 0 and 0..64 subdivisions')
    if not source.data.vertices:
        raise ValueError('Fabric mesh is empty')
    bounds=[(min(v.co[k] for v in source.data.vertices),max(v.co[k] for v in source.data.vertices)) for k in range(2)]
    if any(hi-lo<1e-8 for lo,hi in bounds):
        raise ValueError('Fabric must span both local X and Y')
    world_down_local=source.matrix_world.inverted().to_3x3() @ Vector((0,0,-1))
    obj=source.copy();obj.data=source.data.copy();obj.name='Fabric_'+source.name
    for coll in source.users_collection:coll.objects.link(obj)
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=subdivisions,use_grid_fill=True)
    lo=[min(v.co[k] for v in bm.verts) for k in range(2)]
    hi=[max(v.co[k] for v in bm.verts) for k in range(2)]
    changed=0;max_drop=0
    for v in bm.verts:
        u=2*(v.co.x-lo[0])/(hi[0]-lo[0])-1
        t=2*(v.co.y-lo[1])/(hi[1]-lo[1])-1
        support=max(0,1-u*u)*max(0,1-t*t)
        drop=support*(sag_m+weave_m*math.sin(v.co.x*abs(source.scale.x)*11))
        v.co+=world_down_local*drop
        max_drop=max(max_drop,drop);changed+=drop>1e-9
    bm.normal_update();bm.to_mesh(obj.data);bm.free()
    obj['asset_id']='fabric/supported-membrane';obj['generator']='procassets/fabric/1'
    obj['units']='metres';obj['license']='original procedural; no third-party model'
    obj['source_object']=source.name;obj['sag_max_m']=max_drop
    obj['support_policy']='all local XY boundary vertices remain fixed; interior sag follows world gravity'
    obj['physics_status']='visual membrane approximation; no stress/load validation'
    source.hide_render=True;source.hide_set(True)
    return obj
