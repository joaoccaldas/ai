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

# Optional vector drawings from the loaded scene, not a Blender image render.
# These are review projections/sections; final annotation and site promotion
# remain separate. Existing inventory-only callers keep their original behavior.
if '--drawings' in sys.argv:
    from pathlib import Path
    from collections import Counter
    folder=Path(sys.argv[sys.argv.index('--drawings')+1]);folder.mkdir(parents=True,exist_ok=True)
    files=[]
    def top_faces(obj):
        result=[]
        for face in obj.data.polygons:
            pts=[obj.matrix_world@obj.data.vertices[i].co for i in face.vertices]
            normal=obj.matrix_world.to_3x3()@face.normal
            if normal.z>.99:result.append(pts)
        return result
    plaza=bpy.data.objects['Plaza']
    extent=[plaza.matrix_world@Vector(c) for c in plaza.bound_box]
    xmin,xmax=min(p.x for p in extent)-5,max(p.x for p in extent)+5
    ymin,ymax=min(p.y for p in extent)-5,max(p.y for p in extent)+5
    scale=min(1040/(xmax-xmin),760/(ymax-ymin))
    def xy(p):return (80+(p.x-xmin)*scale,110+(ymax-p.y)*scale)
    def path(points,fill,stroke='none'):
        return '<polygon points="'+' '.join(f'{x:.3f},{y:.3f}' for x,y in points)+f'" fill="{fill}" stroke="{stroke}"/>'
    def header(title,subtitle):
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1000" viewBox="0 0 1200 1000"><rect width="1200" height="1000" fill="#f4f2ea"/><g font-family="sans-serif" fill="#263b32"><text x="60" y="43" font-size="27">'+title+'</text><text x="60" y="73" font-size="14">'+subtitle+'</text></g>'
    for level in (0,1):
        page=header('Living Threshold / '+('ground level' if level==0 else 'upper level'),
            'Actual scene slab projections · design-development · flat-site assumption · not certified GFA')
        for face in top_faces(plaza):page+=path([xy(p) for p in face],'#e0dfd4')
        for bar,color in [('Hard','#638c79'),('Civic','#b87c56')]:
            obj=bpy.data.objects[f'{bar}_CoordFloor_L{level}'];faces=top_faces(obj);edges=Counter()
            for face in faces:
                page+=path([xy(p) for p in face],color)
                for a,b in zip(face,face[1:]+face[:1]):
                    key=tuple(sorted((tuple(round(v,4) for v in a),tuple(round(v,4) for v in b))))
                    edges[key]+=1
            for (a,b),count in edges.items():
                if count==1:
                    x1,y1=xy(Vector(a));x2,y2=xy(Vector(b))
                    page+=f'<path d="M{x1:.3f},{y1:.3f}L{x2:.3f},{y2:.3f}" fill="none" stroke="#263b32" stroke-width="1.5"/>'
        for obj in bpy.context.scene.objects:
            if obj.type!='MESH' or obj.hide_render:continue
            if (level==0 and obj.name.startswith(('CoordTrader_','CoordKitchen_'))) or (level==1 and obj.name.startswith(('CoordAdminDesk_','CoordInterpretationFunicular'))):
                for face in top_faces(obj):page+=path([xy(p) for p in face],'#f1e7ce','#40594c')
            if level==0 and obj.name.startswith('VIS_SeatingGarden_'):
                pts=[obj.matrix_world@Vector(c) for c in obj.bound_box]
                center=sum(pts,Vector())/len(pts);x,y=xy(center)
                page+=f'<ellipse cx="{x:.3f}" cy="{y:.3f}" rx="{4.6*scale:.3f}" ry="{2.3*scale:.3f}" fill="none" stroke="#7b8b55" stroke-width="1.5"/>'
        # Seats are shown as schematic envelope symbols, labelled below.
        page+=f'<path d="M80,930h{20*scale:.3f}" stroke="#263b32" stroke-width="3"/><text x="80" y="954" font-family="sans-serif" font-size="14">20 m</text>'
        page+='<path d="M1110,170v-55m-6,10 6,-10 6,10" fill="none" stroke="#263b32" stroke-width="2"/><text x="1070" y="193" font-family="sans-serif" font-size="12">Source +Y</text>'
        page+='<text x="320" y="932" font-family="sans-serif" font-size="14">Green: market bar · Clay: civic bar · Planting: schematic envelope symbols</text><text x="320" y="955" font-family="sans-serif" font-size="12">Municipal context is outside this plaza-only projection; see the source-bound context render.</text></svg>'
        target=folder/f'plan-level-{level}.svg';target.write_text(page);files.append(target)
    # Slice the actual floor/frame/vault mesh at local market X=0.
    inverse=bpy.data.objects['Hard_CoordFloor_L0'].matrix_world.inverted()
    page=header('Living Threshold / market cross-section',
        'Actual mesh intersection at market local X = 0 m · not a structural or regulatory certification')
    section_names=['Hard_CoordFloor_L0','Hard_CoordFloor_L1','Hard_CoordRoof','Hard_CoordFrame','Hard_CoordCeramicScreens','CoordMarketSoffitBaffles']
    section_names.extend(o.name for o in bpy.context.scene.objects if o.name.startswith(('CoordTrader_','CoordIdentity_','CoordProduce_')))
    for name in section_names:
        obj=bpy.data.objects[name]
        for face in obj.data.polygons:
            pts=[inverse@(obj.matrix_world@obj.data.vertices[i].co) for i in face.vertices];hits=[]
            for a,b in zip(pts,pts[1:]+pts[:1]):
                if abs(a.x)<1e-7:hits.append(a)
                if a.x*b.x<0:hits.append(a+(b-a)*(-a.x/(b.x-a.x)))
            unique={tuple(round(v,6) for v in p):p for p in hits}
            if len(unique)==2:
                a,b=list(unique.values());x1,y1=600+a.y*70,850-a.z*70;x2,y2=600+b.y*70,850-b.z*70
                page+=f'<path d="M{x1:.3f},{y1:.3f}L{x2:.3f},{y2:.3f}" stroke="#334d40" fill="none" stroke-width="2"/>'
    page+='<g font-family="sans-serif" font-size="15" fill="#465e50"><text x="965" y="530">Upper floor 4.50 m</text><text x="965" y="264">Springing 8.30 m</text><text x="480" y="895">9.00 m vault span</text></g><path d="M920,535h35M920,269h35M285,875h630m-630,-6v12m630,-12v12" stroke="#465e50" fill="none"/><text x="60" y="955" font-family="sans-serif" font-size="13">Geometry-derived review section; material layers, connections and measured performance need separate detail.</text></svg>'
    target=folder/'section-market.svg';target.write_text(page);files.append(target)
    support=[];plaza_inverse=plaza.matrix_world.inverted()
    for bar in ('Hard','Civic'):
        slab=bpy.data.objects[bar+'_CoordFloor_L0'];outside=[];inside=0
        for ix in range(10):
            for iy in range(5):
                p=slab.matrix_world@Vector((-22.5+45*ix/9,-5+10*iy/4,0))
                hit,_,_,_=plaza.ray_cast(plaza_inverse@Vector((p.x,p.y,5)),Vector((0,0,-1)))
                if hit:inside+=1
                else:outside.append([round(v,4) for v in p])
        support.append({'bar':bar,'inside_samples':inside,'outside_samples_m':outside,
            'status':'REVIEW_EDGE_FIT' if outside else 'PASS_SAMPLED_SURFACE_SUPPORT'})
    (folder/'drawings-receipt.json').write_text(json.dumps({'status':'GEOMETRY_DERIVED_REVIEW_DRAWINGS_NOT_FINAL_BOARD',
        'source_sha256':sha,'source_unchanged':hashlib.sha256(open(source,'rb').read()).hexdigest()==sha,
        'files':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in files},
        'plaza_surface_support':support,
        'render_invocations':0,'limits':['Planting symbols are schematic envelopes.','Final annotation, municipal site promotion and independent review remain open.']},indent=2)+'\n')
