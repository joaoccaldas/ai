"""Read-only validation of a saved scene. Run through Blender --python.

This checks provenance/geometry/render readiness, not aesthetic approval.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy


def inspect_scene():
    checks=[]
    def check(name,passed,detail):checks.append({'check':name,'pass':bool(passed),'detail':detail})
    scene=bpy.context.scene
    check('metre_units',scene.unit_settings.scale_length==1 and scene.unit_settings.system=='METRIC',str(scene.unit_settings.scale_length))
    check('render_authority',scene.render.engine=='CYCLES',scene.render.engine)
    check('color_management',scene.view_settings.view_transform=='AgX',scene.view_settings.view_transform)
    check('canonical_not_promoted',scene.get('canonical_promotion')=='NONE',scene.get('canonical_promotion'))
    check('proxy_hidden',bpy.data.collections['CONTEXT'].hide_render,'proxy context excluded from candidate rendering')
    generated=[o for o in bpy.data.objects if o.name.startswith('SK_') and o.type=='MESH']
    missing=[o.name for o in generated if any(not o.get(k) for k in ['asset_id','generator','units','license'])]
    check('component_metadata',not missing,missing)
    nonfinite=[];unique={}
    for obj in bpy.data.objects:
        if obj.type=='MESH':unique[obj.data.name]=obj.data
    for mesh in unique.values():
        if any(not math.isfinite(c) for v in mesh.vertices for c in v.co):nonfinite.append(mesh.name)
    check('finite_coordinates',not nonfinite,nonfinite)
    tree_objs=[o for o in generated if o.name.startswith('SK_PlantedOak')]
    check('tree_mesh_reuse',len({o.data.name for o in tree_objs})<len(tree_objs),{'instances':len(tree_objs),'unique_meshes':len({o.data.name for o in tree_objs})})
    cameras=[o for o in bpy.data.objects if o.name.startswith('SK_') and o.type=='CAMERA']
    check('camera_clip',all(o.data.clip_end>=1000 and o.data.clip_start>0 for o in cameras),len(cameras))
    leaf_prototypes=[o for o in generated if o.name.startswith('SK_Oak_') and o.name.endswith('_leaves')]
    check('batched_foliage',len(leaf_prototypes)==3,len(leaf_prototypes))
    check('sun_above_horizon',bpy.data.objects['SK_Daylight'].data.type=='SUN','explicit geographic daylight source')
    return {'status':'PASS' if all(c['pass'] for c in checks) else 'FAIL','checks':checks,
            'unique_meshes':len(unique),'unique_vertices':sum(len(m.vertices) for m in unique.values()),
            'unique_triangles':sum(sum(max(0,len(p.vertices)-2) for p in m.polygons) for m in unique.values()),
            'note':'saved scene checks; aesthetic, municipal survey and engineering approval remain separate'}


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--report',type=Path,required=True)
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:]);report=inspect_scene()
    args.report.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
    if report['status']!='PASS':raise RuntimeError('Scene contract validation failed')
