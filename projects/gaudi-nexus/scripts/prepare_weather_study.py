"""Prepare a private, bounded derivative for the EXISTING Atlas inspector.

Geometry only. Open the verified realism candidate, pass a NEW output .blend.
Then use Atlas prepare_world.py --root-object GaudiWeatherStudy for GLB export.
No source save, new renderer, municipal-context replacement or structural claim.
"""
import hashlib,json,math,sys
from html import escape
from pathlib import Path
import bpy
from mathutils import Matrix
sys.path.insert(0,str(Path(__file__).resolve().parents[3]))
from studio.scene_kit.materials import surface
from studio.scene_kit.vegetation import holm_oak

source=Path(bpy.data.filepath);source_sha=hashlib.sha256(source.read_bytes()).hexdigest()
receipt=json.loads(Path(str(source)+'.receipt.json').read_text())
assert receipt['candidate_sha256']==source_sha
assert receipt['architecture_coordination']['realism_study']['status']=='REALISM_MATERIAL_STUDY_NOT_FINAL'
out=Path(sys.argv[sys.argv.index('--')+1]).resolve()
if out.exists() or out.suffix!='.blend' or out==source.resolve():raise ValueError('Choose a new private derivative')
out.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
coll=bpy.data.collections.new('WeatherDerivative');bpy.context.scene.collection.children.link(coll)
root=bpy.data.objects.new('GaudiWeatherStudy',None);coll.objects.link(root)
recipe={'version':1,'id':'gaudi-civic-weather-v1','roofAreaM2':810,
        'runoffCoefficient':.85,'tankLitres':2000,'roofs':[]}
for name in ('Hard_CoordRoof','Civic_CoordRoof'):
    o=bpy.data.objects[name]
    assert abs(max(v.co.x for v in o.data.vertices)-min(v.co.x for v in o.data.vertices)-45)<1e-5
    assert abs(max(v.co.y for v in o.data.vertices)-min(v.co.y for v in o.data.vertices)-9)<1e-5
    assert abs(max(v.co.z for v in o.data.vertices)-9.83)<1e-5
    recipe['roofs'].append(dict(cx=o.matrix_world.translation.x,cy=o.matrix_world.translation.y,
        angleRad=o.matrix_world.to_euler().z,length=45,span=9,spring=8.3,rise=1.35,thickness=.18))
assert abs(sum(r['length']*r['span'] for r in recipe['roofs'])-810)<1e-9
root['caldas_weather_study']=1;root['weather_recipe_json']=json.dumps(recipe,separators=(',',':'))
root['study_id']='gaudi-civic-weather-v1'
root['source_sha256']=source_sha
root['representation']='Bounded proposal derivative; synthetic weather; municipal context omitted'

# Portable base PBR preserves the explicit Scene Kit palette, not unsupported
# Cycles node graphs. Retain the reviewed roof images and UV/tangent basis.
palette={}
def portable(mat):
    if mat is None:return surface('WeatherFallback',(.45,.45,.4),.8)[0]
    if mat.name not in palette:
        if mat.name=='RealismReviewedRoof':
            result=mat.copy()
        elif mat.name=='RealismReviewedPavers':
            # V5 brown diffuse was rejected after actual render review. This is
            # explicitly a designed neutral finish, not a photographed product.
            result=mat.copy();bs=result.node_tree.nodes.get('Principled BSDF')
            for link in list(bs.inputs['Base Color'].links):result.node_tree.links.remove(link)
            bs.inputs['Base Color'].default_value=(.52,.50,.44,1)
        else:
            result=surface('Weather_'+mat.name,tuple(mat.diffuse_color[:3]),mat.roughness,mat.metallic)[0]
        for k in list(result.keys()):del result[k]
        palette[mat.name]=result
    return palette[mat.name]

# Substitute only this derivative's leaf data with the previously measured
# stable subset. The unchanged source and its hero foliage remain preserved.
prototypes=[]
for i in range(3):
    old=bpy.data.objects[f'VIS_OakPrototype_{i}_leaves']
    bark=bpy.data.objects[f'VIS_OakPrototype_{i}_wood'].data.materials[0]
    pair=holm_oak(f'WeatherLOD_{i}',coll,portable(bark),[portable(m) for m in old.data.materials],
                  seed=810+i,leaf_budget=36,coverage_compensation=True)
    # Temporary prototype objects remain private and outside selected hierarchy.
    for o in pair:o.hide_render=True;o.hide_set(True)
    prototypes.append(pair[1].data)

selected=[];leaf_count=0;unused_uv=[]
for o in list(bpy.context.scene.objects):
    if o.hide_render or o.type not in {'MESH','FONT'}:continue
    include=o.name=='Plaza' or o.name=='CivicFlushRouteStudy' or o.name.startswith(
        ('Hard_Coord','Civic_Coord','Coord','CivicGarden_','CivicShade_','CivicTable_','CivicChair_'))
    if not include:continue
    n=o.copy();n.data=o.data.copy();coll.objects.link(n);n.parent=root;n.matrix_world=o.matrix_world.copy()
    for k in list(n.keys()):del n[k]
    for index,slot in enumerate(n.material_slots):
        # Bake the reviewed override into private mesh DATA. Object-only slots
        # were ignored by the evaluated-mesh export in the first derivative.
        slot.link='DATA';slot.material=portable(o.material_slots[index].material)
    if o.name.startswith('CivicShade_') and o.name.endswith('_leaves'):
        _,i,j,_=o.name.split('_');n.data=prototypes[(int(i)+int(j))%3]
        n['weather_role']='canopy';leaf_count+=1
    elif o.name in ('Plaza','CivicFlushRouteStudy'):n['weather_role']='exposed_paving'
    if o.name=='Plaza':
        paving=surface('WeatherNeutralPlaza',(.39,.375,.33),.82)[0]
        for slot in n.material_slots:slot.link='DATA';slot.material=paving
    # Uniform portable materials do not consume source procedural-member UVs.
    # On those meshes Blender can emit zero unused tangents. Drop only UNUSED
    # UV layers on private mesh copies; roof and mapped floor bases stay intact.
    if n.type=='MESH' and n.data.uv_layers and not ('_CoordRoof' in o.name or '_CoordFloor_L0' in o.name):
        for uv in list(n.data.uv_layers):n.data.uv_layers.remove(uv)
        unused_uv.append(o.name)
    selected.append(o.name)
assert leaf_count==12 and 'Plaza' in selected and len(selected)>100
cam=bpy.data.objects['PLAZA_OBLIQUE'].copy();cam.data=cam.data.copy();cam.name='WeatherOverview'
coll.objects.link(cam);cam.parent=root;cam.matrix_world=bpy.data.objects['PLAZA_OBLIQUE'].matrix_world.copy()
from mathutils import Vector
corners=[o.matrix_world@Vector(p) for o in root.children if o.type=='MESH' for p in o.bound_box]
lo=Vector([min(p[k] for p in corners) for k in range(3)]);hi=Vector([max(p[k] for p in corners) for k in range(3)])
target=(lo+hi)/2;direction=Vector((1,-1,.95)).normalized();right=direction.cross(Vector((0,0,1))).normalized();up=right.cross(direction)
cam.data.lens=45
vertical=math.tan(cam.data.angle/2)/1.7
distance=max((max(abs((p-target).dot(up))/vertical,abs((p-target).dot(right))/(vertical*1.7))+(p-target).dot(direction)) for p in corners)*1.08
cam.location=target+direction*distance;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
for k in list(cam.keys()):del cam[k]
market=bpy.data.objects['MARKET_AISLE'].copy();market.data=market.data.copy();market.name='WeatherMarket'
coll.objects.link(market);market.parent=root;market.matrix_world=bpy.data.objects['MARKET_AISLE'].matrix_world.copy()
for k in list(market.keys()):del market[k]
garden=bpy.data.objects.new('WeatherGarden',bpy.data.cameras.new('WeatherGarden'));coll.objects.link(garden);garden.parent=root
garden.data.lens=34;garden.data.clip_end=1000;garden.location=(-11,-41,2.4)
garden.rotation_euler=(Vector((-22,-22,3))-garden.location).to_track_quat('-Z','Y').to_euler()
# Only safe scalar metadata above is exported; no paths, hidden source or private
# material/image properties. The underlying source file is never saved.
for block in [*(o.data for o in root.children if o.data),*palette.values(),*bpy.data.images]:
    for k in list(block.keys()):del block[k]
bpy.context.view_layer.update()
detail=None
if '--landscape-detail' in sys.argv:
    import os
    _scripts_dir = os.path.dirname(os.path.abspath(__file__))
    if _scripts_dir not in sys.path:
        sys.path.insert(0, _scripts_dir)
    from coordinate_civic_landscape import detail_weather_landscape
    detail=detail_weather_landscape(root)
# A real geometry plan is the light default. Fit the entire selected plaza and
# roof envelopes below the heading; retain earlier reviewed drawings unchanged.
from mathutils import Vector
from mathutils.geometry import convex_hull_2d
draw=[]
for o in root.children:
    if o.type!='MESH':continue
    color=('#e0ddd0' if o.name.startswith('Plaza.') else '#b47e5a' if '_CoordRoof' in o.name else
           '#8d9f79' if o.name.startswith('CivicGarden_') else None)
    if color:
        points=list({tuple((o.matrix_world@v.co)[:2]) for v in o.data.vertices})
        hull=convex_hull_2d([Vector(p) for p in points]);draw.append((color,[points[i] for i in hull]))
flat=[p for _,points in draw for p in points];lo=[min(p[k] for p in flat) for k in range(2)];hi=[max(p[k] for p in flat) for k in range(2)]
scale=min(860/(hi[0]-lo[0]),520/(hi[1]-lo[1]))
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 740"><rect width="960" height="740" fill="#f1efe5"/>',
 '<g fill="#294137" font-family="system-ui"><text x="35" y="43" font-size="26">Living Threshold / weather study</text><text x="35" y="70" font-size="15">Geometry plan · two roofs · four gardens · synthetic weather</text></g>']
for color,points in draw:
    projected=[(50+(p[0]-lo[0])*scale,100+(hi[1]-p[1])*scale) for p in points]
    svg.append('<polygon fill="'+color+'" points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in projected)+'"/>')
svg.append('<g fill="#294137" font-family="system-ui" font-size="14"><text x="35" y="683">810 m² projected roof catchment · wind response · surface wetness</text><text x="35" y="711">Proposal only. Municipal context omitted. No structural or drainage validation.</text></g></svg>')
(out.parent/'plan.svg').write_text(''.join(svg)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(out))
assert hashlib.sha256(source.read_bytes()).hexdigest()==source_sha
record={'schemaVersion':1,'status':'WEATHER_DESIGN_STUDY_NOT_FINAL','sourceSha256':source_sha,
 'derivativeSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'selectedObjects':selected,
 'canopies':leaf_count,'leafTrianglesPerTree':15120,'recipe':recipe,'sourceSaved':False,'renderInvocations':0,
 'planSha256':hashlib.sha256((out.parent/'plan.svg').read_bytes()).hexdigest(),
 'unusedProceduralUvLayersOmittedOnCopies':unused_uv,'landscapeDetail':detail,
 'limits':['No surveyed municipal context in this derivative.','Neutral paving is a proposed design variant, not exact product imagery.',
 'Source procedural detail becomes base PBR; reviewed roof maps retain UVs.','Coverage-compensated leaves need destination visual review.',
 'Illustrative foliage motion and wet appearance; assumed physical properties, no CFD, drainage or safety certification.']}
out.with_suffix('.weather.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k!='selectedObjects'}))
