"""Read-only scene inventory; never infer GFA from roofs or programme labels.

blender -b SOURCE.blend --python-exit-code 1 --python inspect_program_geometry.py -- receipt.json
"""
import bpy,sys,json,hashlib,os,re
from mathutils import Vector

source=bpy.data.filepath
sha=hashlib.sha256(open(source,'rb').read()).hexdigest()
inventory=[]
for o in bpy.context.scene.objects:
    if o.type!='MESH':continue
    pts=[o.matrix_world@Vector(c) for c in o.bound_box]
    record={'name':o.name,'bbox_m':[[round(min(p[k] for p in pts),4) for k in range(3)],[round(max(p[k] for p in pts),4) for k in range(3)]],
        'dimensions_m':[round(float(v),4) for v in o.dimensions],
        'polygons':len(o.data.polygons),'collections':[c.name for c in o.users_collection],
        'programme_tags':{k:o[k] for k in o.keys() if k in ('capacity_people','area_m2','gfa_m2','floor','storey','level','program','programme')},
        'hidden_render':o.hide_render}
    inventory.append(record)
find=lambda pattern:[r for r in inventory if re.search(pattern,r['name'],re.I)]
roofs=find(r'^(Hard|Civic)_Roof$')
report={'status':'DESIGN_DEVELOPMENT_NOT_BRIEF_CLOSURE','source_sha256':sha,'units':{'system':bpy.context.scene.unit_settings.system,'scale_length':bpy.context.scene.unit_settings.scale_length},
    'official_gfa_range_m2':[1500,2000],'contract_gfa_m2':1736,
    'measured_gfa_m2':None,'gfa_reason':'No declared floor-area polygon schedule in this source; roof footprints and room boxes are not a measured GFA.',
    'primary_roofs':roofs,'named_floor_stair_lift_candidates':find(r'floor|storey|stair|lift|elevator'),
    'kitchen_candidates':find('TeachingKitchen'),'admin_candidates':find('AdminWorkstation'),
    'municipal_context':find(r'^geometry_0$'),
    'limits':['Naming inventory does not prove absence of unnamed floors or access geometry.','Capacity tags do not prove equipment clearances, occupancy or egress.','Municipal alignment remains a comparison artifact pending site reconciliation.'],
    'mesh_inventory':inventory,'render_invocations':0}
report['source_unchanged']=hashlib.sha256(open(source,'rb').read()).hexdigest()==sha
out=sys.argv[sys.argv.index('--')+1]
os.makedirs(os.path.dirname(os.path.abspath(out)),exist_ok=True)
with open(out,'w') as f:json.dump(report,f,indent=2)
print(json.dumps({k:v for k,v in report.items() if k!='mesh_inventory'},indent=2))
