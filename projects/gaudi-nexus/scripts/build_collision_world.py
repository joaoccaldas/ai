"""Emit separate static collider layer for a saved visual candidate.

Never changes the candidate .blend. Runtime simulation is not claimed.
"""
import sys
import json
from pathlib import Path
import bpy
sys.path.insert(0,str(Path(__file__).resolve().parents[3]))
from studio.scene_kit.collision import static_proxy
from studio.scene_kit.materials import surface
from studio.scene_kit.export import export_glb

output=Path(sys.argv[sys.argv.index('--')+1]);coll=bpy.data.collections.new('StaticColliderExport');bpy.context.scene.collection.children.link(coll)
mat=surface('ColliderDebug',(.2,.6,.3))[0];objs=[]
for source in list(bpy.data.objects):
    kind=None
    if source.name.startswith('SK_PlantedOak') and source.name.endswith('_wood'):kind='tree'
    elif source.name.startswith('SK_PlantingIsland'):kind='island'
    elif source.name.startswith('SK_OpenStall'):kind='stall'
    if kind:
        obj=static_proxy('COL_'+source.name,coll,mat,kind,source.get('customer_front_local_y',1))
        obj.matrix_world=source.matrix_world.copy();obj['visual_source']=source.name
        objs.append(obj)
if len(objs)!=39:raise ValueError('Expected 13 trees, 6 islands and 20 stalls: '+str(len(objs)))
info=export_glb(output/'physics-colliders.glb',objs)
(output/'physics-colliders.json').write_text(json.dumps({'status':'STATIC_GEOMETRY_ONLY_RUNTIME_NOT_VALIDATED','objects':len(objs),'parameters':'suggested friction .65, restitution .05','scope':'new kit components; source building/site colliders not provided','export':info},indent=2)+'\n')
