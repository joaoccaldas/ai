"""Deterministic static placement on visible support meshes, without a simulation.

Uses evaluated world-space geometry. A contact is one lowest vertex against an
upward-facing surface; this does not certify full footprint support or stability.
"""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def fit_footprint_on_box_top(obj,support,margin_m=.002,max_shift_m=.25):
    """Fit an evaluated asset's XY projection inside a horizontal box top.

    Intended for counters with rectangular local bounds, not arbitrary surfaces.
    Moves only the derived object's world XY, retaining its orientation.
    """
    bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
    if abs((support.matrix_world.to_3x3()@Vector((0,0,1))).normalized().z)<.999:
        raise ValueError('Box top must be horizontal')
    inv=support.matrix_world.inverted();ev=obj.evaluated_get(dg);mesh=ev.to_mesh()
    points=[inv@ev.matrix_world@v.co for v in mesh.vertices];ev.to_mesh_clear()
    delta=Vector((0,0,0))
    for k in range(2):
        lo=min(v.co[k] for v in support.data.vertices);hi=max(v.co[k] for v in support.data.vertices)
        axis=Vector((1 if k==0 else 0,1 if k==1 else 0,0))
        scale=(support.matrix_world.to_3x3()@axis).length
        lower=lo+margin_m/scale-min(p[k] for p in points)
        upper=hi-margin_m/scale-max(p[k] for p in points)
        if lower>upper:raise ValueError('Asset footprint exceeds counter top')
        delta[k]=max(lower,min(0,upper))
    world=support.matrix_world.to_3x3()@delta
    if world.length>max_shift_m:raise ValueError('Horizontal placement exceeds permitted correction')
    mw=obj.matrix_world.copy();mw.translation+=world;obj.matrix_world=mw
    return {'object':obj.name,'support':support.name,'horizontal_shift_m':round(world.length,6),'margin_m':margin_m}


def settle_on_supports(objects,supports,gap_m=.001,max_shift_m=.5):
    bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
    verts=[];faces=[];owners=[]
    for support in supports:
        if support.type!='MESH' or support.hide_render:continue
        ev=support.evaluated_get(dg);mesh=ev.to_mesh();start=len(verts)
        verts.extend(ev.matrix_world@v.co for v in mesh.vertices)
        faces.extend(tuple(start+i for i in p.vertices) for p in mesh.polygons)
        owners.extend([support.name]*len(mesh.polygons));ev.to_mesh_clear()
    if not faces:raise ValueError('No visible support meshes')
    tree=BVHTree.FromPolygons(verts,faces,all_triangles=False)
    records=[]
    for obj in objects:
        ev=obj.evaluated_get(dg);mesh=ev.to_mesh()
        bottom=min((ev.matrix_world@v.co for v in mesh.vertices),key=lambda p:p.z)
        ev.to_mesh_clear()
        origin=bottom+Vector((0,0,max_shift_m+1))
        hit,normal,index,distance=tree.ray_cast(origin,Vector((0,0,-1)),2*max_shift_m+1)
        if hit is None or normal.z<.9:
            records.append({'object':obj.name,'status':'UNSUPPORTED','lowest_vertex_m':list(bottom),'hit_m':list(hit) if hit is not None else None,'normal':list(normal) if normal is not None else None});continue
        dz=hit.z+gap_m-bottom.z
        if abs(dz)>max_shift_m:
            records.append({'object':obj.name,'status':'SHIFT_EXCEEDS_BOUND','shift_m':dz});continue
        mw=obj.matrix_world.copy();mw.translation.z+=dz;obj.matrix_world=mw
        obj['contact_support']=owners[index];obj['contact_gap_m']=gap_m
        obj['physics_status']='static vertex contact; no stability or rigid-body proof'
        records.append({'object':obj.name,'status':'SETTLED','support':owners[index],'shift_m':round(dz,6),'gap_m':gap_m})
    bpy.context.view_layer.update()
    return records
