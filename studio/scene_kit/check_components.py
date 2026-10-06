"""Focused integration checks for component portability and geometric invariants."""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.lighting import sun_position
from studio.scene_kit.market import stall
from studio.scene_kit import materials as M
from studio.scene_kit.landscape import planted_island
from studio.scene_kit.collision import static_proxy


if __name__=='__main__':
    coll=bpy.data.collections.new('ComponentChecks');bpy.context.scene.collection.children.link(coll)
    mat=M.surface('CheckPBR',(.4,.4,.4))[0]
    m=MeshBuilder();m.ellipsoid((0,0,0),(1,.5,2));obj=m.object('CheckEllipsoid',coll,[mat])
    assert all(p.area>1e-8 for p in obj.data.polygons), 'Degenerate sphere poles'
    assert all(p.normal.dot(p.center)>0 for p in obj.data.polygons), 'Inward sphere winding'
    m=MeshBuilder();m.box((0,0,0),(1,2,3));box=m.object('CheckBox',coll,[mat],False)
    assert all(p.normal.dot(p.center)>0 for p in box.data.polygons),'Inward cabinet winding'
    kit=stall('CheckStall',coll,[mat]*4)
    bpy.context.view_layer.update()
    assert abs(kit.dimensions.x-2.7)<.01 and abs(kit.dimensions.y-2.2)<.01
    assert kit.get('customer_front_local_y')==1
    # Frame occupies the sides and rear; the serving face is open above the worktop.
    ray_origin=Vector((0,3,1.25));ray_dir=Vector((0,-1,0))
    hit,point,normal,index=kit.ray_cast(ray_origin,ray_dir)
    assert not hit or point.y<0, 'Serving side is blocked above the counter'
    island=planted_island('CheckIsland',coll,[mat]*7)
    assert all(p.area>1e-9 for p in island.data.polygons), 'Degenerate planting geometry'
    assert island.get('seat_height_m')==.46
    for front in [-1,1]:
        proxy=static_proxy('CheckCollision'+str(front),coll,mat,'stall',front)
        hit,point,normal,index=proxy.ray_cast(Vector((0,front*3,1.25)),Vector((0,-front,0)))
        assert not hit or point.y*front<0, 'Stall collision blocks its serving side'
    for hour,altitude in [(10,24.8),(14,48.3),(17,29.3)]:
        vec,alt,az=sun_position(41.4036,2.1744,'2026-09-21',hour,2)
        assert abs(vec.length-1)<1e-5
        assert abs(alt-altitude)<1.5, (hour,alt)
    print(json.dumps({'status':'PASS','checks':['nondegenerate ellipsoid poles','outward normals','metre stall dimensions','open serving face','solar altitude cross-check'],
                      'note':'geometric/rendering checks, not engineering certification'}))
