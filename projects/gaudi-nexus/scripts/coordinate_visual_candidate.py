"""Append the measured two-level design to a prepared candidate; never render.

Original meshes/transforms remain intact and separately hidden where superseded.
The municipal massing, site and registered cameras are retained.
"""
import argparse, hashlib, json, math, sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parents[1]))
sys.path.insert(0,str(ROOT/'scripts'))
from build_visual_world import snapshots
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.materials import surface
from studio.scene_kit.market import stall,produce_display
from studio.scene_kit.entourage import person
from studio.scene_kit.visibility import render_geometry,camera_clearance

p=argparse.ArgumentParser()
p.add_argument('prototype');p.add_argument('output')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
source=Path(bpy.data.filepath);before=snapshots()
prep=json.loads(Path(str(source)+'.receipt.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==prep['candidate_sha256']
prototype=Path(a.prototype);coord=json.loads((prototype.parent/'coordination-receipt.json').read_text())
assert hashlib.sha256(prototype.read_bytes()).hexdigest()==coord['blend_sha256']
hidden=[]
for name in ('ARCHITECTURE','MARKET','21_PROGRAM_REQUIRED'):
    bpy.data.collections[name].hide_render=True
prefixes=('F_','C_Crate','B_Basket','Br_','SF_','FH_','HG_','H_','PendantLamp_',
          'PendantLight_','Citizen_','VIS_MarketCitizen_','SunMarker_','HeroWashLine_',
          'MarketThresholdInlay_','PaveX_','PaveY_','TraderA_','BuyerA_','ResidentOlder_',
          'Parent_','Child_','Cyclist_','VisitorA_','VisitorB_','HeroVendor')
for obj in bpy.context.scene.objects:
    if obj.name.startswith(prefixes):obj.hide_render=True;hidden.append(obj.name)
with bpy.data.libraries.load(str(prototype),link=False) as (src,dst):
    dst.collections=[n for n in src.collections if n=='70_ARCHITECTURE_COORDINATION_NOT_CANONICAL']
coll=dst.collections[0];bpy.context.scene.collection.children.link(coll)
# Separate the finished slab from the existing plaza top by 5 mm. Coincident
# surfaces produced black self-shadowing in the V4 interior. Datum is explicit;
# no municipal terrain survey or accessible threshold certification is implied.
plaza=bpy.data.objects['Plaza']
ground_datum=max((plaza.matrix_world@v.co).z for v in plaza.data.vertices)+.005
for obj in coll.objects:
    obj.matrix_world.translation.z+=ground_datum
stone=surface('CoordWarmMineral',(.50,.45,.36),.75)[0]
wood=surface('CoordOak',(.25,.15,.075),.60)[0]
steel=surface('CoordBrushedSteel',(.24,.26,.26),.30,.8)[0]
dark=surface('CoordDarkFittings',(.045,.05,.04),.63)[0]
tile=surface('CoordTerracottaRoof',(.38,.17,.075),.66)[0]
for obj in coll.objects:
    if 'CoordRoof' in obj.name:
        obj.material_slots[0].link='OBJECT';obj.material_slots[0].material=tile
    elif obj.material_slots:
        obj.material_slots[0].link='OBJECT';obj.material_slots[0].material=stone
    if 'CoordStallFootprint' in obj.name:obj.hide_render=True
angle=math.radians(44.14)
transforms={bar:Matrix.Translation(Vector((*centre,ground_datum)))@Matrix.Rotation(angle,4,'Z')
            for bar,centre in [('Hard',(-50,20)),('Civic',(-15,50))]}
def box(name,bar,center,size,materials=(stone,),material=0):
    b=MeshBuilder();b.box(center,size,material);o=b.object(name,coll,list(materials),False)
    o.matrix_world=transforms[bar];return o

# Independent kitchens, with twenty bounded participant reservations per room.
kitchens=[]
for k,cx in enumerate((-4.5,4.5)):
    stations=[];counter=MeshBuilder()
    for x in (cx-2,cx+2):
        counter.box((x,0,.45),(1.1,8,.9),0)
        counter.box((x,0,.95),(1.15,8,.10),1)
        for y in (-3.2,-1.6,0,1.6,3.2):
            counter.box((x,y,.998),(.6,.45,.012),2)
            for dx in (-.95,.95):
                stations.append((x+dx,y))
    o=counter.object(f'CoordKitchen_{k+1}_TeachingIslands',coll,[wood,steel,dark],False);o.matrix_world=transforms['Civic']
    assert len(stations)==20
    for x,y in stations:
        assert cx-4.5+.3<=x<=cx+4.5-.3 and -4.7<=y<=4.7
    assert all(math.dist(a,b)>=.6 for i,a in enumerate(stations) for b in stations[:i])
    kitchens.append({'room':k+1,'bounds_local_m':[cx-4.5,-5,cx+4.5,5],
                     'participant_reservations_local_xy_m':stations,'capacity_certified':False})
box('CoordKitchenSeparatingWall','Civic',(0,0,2),(.12,10,4))
for cx in (-4.5,4.5):
    # Two separate 1.4 m entrances. Walls stop either side of each opening.
    for side in (-1,1):box(f'CoordKitchenEntry_{cx}_{side}','Civic',
        (cx+side*2.6,5,2),(3.8,.12,4))
    box(f'CoordKitchenEntryLintel_{cx}','Civic',(cx,5,3.6),(1.4,.12,.8))
    box(f'CoordKitchenBack_{cx}','Civic',(cx,-5,2),(9,.12,4))

desks=[]
for y in (-.2,2.4):
    for x in (9.4,12.2,15,17.8):
        box(f'CoordAdminDesk_{len(desks)+1}','Hard',(x,y,5.24),(2.2,1.1,.08),(wood,))
        box(f'CoordAdminScreen_{len(desks)+1}','Hard',(x,y+.35,5.56),(.55,.05,.35),(dark,))
        for dx in (-.95,.95):box(f'CoordAdminLeg_{len(desks)}_{dx}','Hard',(x+dx,y,4.86),(.04,.85,.72),(steel,))
        desks.append({'center_local_m':[x,y,4.5],'desk_footprint_m':[2.2,1.1]})

# Twenty fitted stalls reuse the shared kit; a 3.2 m aisle stays clear of fittings.
fruit=[wood,*[surface('CoordFruit_'+str(i),c,.55)[0] for i,c in enumerate(
    ((.55,.15,.02),(.45,.04,.02),(.15,.25,.055)))]]
for n,fp in enumerate(coord['stall_footprints']):
    x0,y0,x1,y1=fp['local_xy_m'];x=(x0+x1)/2;y=(y0+y1)/2
    front=1 if y<0 else -1
    o=stall(f'CoordTrader_{n+1:02}',coll,[steel,wood,stone,dark],width=2.5,depth=2.4,front=front)
    o.matrix_world=transforms['Hard']@Matrix.Translation(Vector((x,y,0)))
    produce=produce_display(f'CoordProduce_{n+1:02}',coll,fruit,front=front,seed=600+n)
    produce.matrix_world=o.matrix_world.copy()

# Shared, restrained entourage; foreground aisle is kept free of close-up faces.
skin=surface('CoordSkin',(.45,.30,.22),.65)[0]
hair=surface('CoordHair',(.055,.04,.028),.70)[0]
shoes=surface('CoordShoes',(.04,.04,.045),.65)[0]
people=[]
for i,(x,y) in enumerate([(x,y) for x in (-4,2,8,12) for y in (-1.15,1.15)]):
    coat=surface('CoordCoat_'+str(i),[(.12,.16,.17),(.35,.30,.23),(.22,.27,.20)][i%3],.8)[0]
    o=person(f'CoordMarketPerson_{i}',coll,[skin,coat,dark,shoes,hair,wood],(0,0,0),seed=800+i)
    o.matrix_world=transforms['Hard']@Matrix.Translation(Vector((x,y,-.004)))@Matrix.Rotation(0 if y<0 else math.pi,4,'Z')
    people.append(o)

# Pendant mounts reference the real upper slab underside, rather than old roof.
bulb=surface('CoordLampDiffuser',(1,.73,.40),.4)[0]
bsdf=bulb.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Emission Color'].default_value=(1,.73,.4,1);bsdf.inputs['Emission Strength'].default_value=4
for i,x in enumerate((-8,-3,2,7,12)):
    m=MeshBuilder();m.tube([(x,0,4.22),(x,0,3.20)],[.008,.008],0)
    m.ellipsoid((x,0,3.15),(.16,.16,.055),1)
    o=m.object(f'CoordPendant_{i}',coll,[dark,bulb]);o.matrix_world=transforms['Hard']
    ld=bpy.data.lights.new(f'CoordPendantLight_{i}','POINT');ld.energy=110;ld.color=(1,.76,.51);ld.shadow_soft_size=.12
    light=bpy.data.objects.new(ld.name,ld);coll.objects.link(light);light.location=transforms['Hard']@Vector((x,0,3.07))

# Replaceable ceramic shading on upper edges; a separate service gutter/pipe kit.
ceramics=[surface('CoordCeramic_'+str(i),c,.30)[0] for i,c in enumerate(
    ((.32,.16,.065),(.40,.22,.10),(.28,.14,.06),(.46,.27,.13)))]
for bar in ('Hard','Civic'):
    fins=MeshBuilder();services=MeshBuilder()
    for side in (-1,1):
        for j in range(59):
            x=-20.3+j*.7
            start=len(fins.vertices);fins.box((0,0,6.42),(.09,.36,2.8),j%4)
            q=Matrix.Rotation(math.radians(side*25),3,'Z')
            for k in range(start,len(fins.vertices)):
                fins.vertices[k]=tuple(q@Vector(fins.vertices[k])+Vector((x,side*4.88,0)))
        # Open U-section gutter, with bottom and two upstands.
        services.box((0,side*4.55,8.27),(45,.24,.04),0)
        for dy in (-.12,.12):services.box((0,side*4.55+dy,8.34),(45,.025,.12),0)
        for x in (-20,20):services.tube([(x,side*4.65,.15),(x,side*4.65,8.3)],[.04,.04],0,8)
    o=fins.object(bar+'_CoordCeramicScreens',coll,ceramics,False);o.matrix_world=transforms[bar]
    o=services.object(bar+'_CoordGutters',coll,[steel],False);o.matrix_world=transforms[bar]

# Actual stair sample headroom against imported slabs and roof, including landings.
bpy.context.view_layer.update();headroom=[]
for core in coord['cores']:
    bar=core['object'].split('_')[0];x,y=core['placement_local_m'];rotation=math.radians(core['rotation_deg'])
    tf=transforms[bar]@Matrix.Translation(Vector((x,y,0)))@Matrix.Rotation(rotation,4,'Z')
    surfaces=[o for o in coll.objects if o.name.startswith(bar+'_CoordFloor_L1') or o.name.startswith(bar+'_CoordRoof')]
    verts=[];faces=[]
    for o in surfaces:
        offset=len(verts);verts.extend(o.matrix_world@v.co for v in o.data.vertices)
        faces.extend(tuple(offset+j for j in f.vertices) for f in o.data.polygons)
    tree=BVHTree.FromPolygons(verts,faces)
    h=core['riser_m'];n=core['risers_per_flight'];w=core['clear_width_m'];run=core['run_m']
    samples=[((k-.5)*core['going_m'],w/2,k*h) for k in range(1,n)]
    samples += [(run-(k-.5)*core['going_m'],w+core['gap_m']+w/2,core['rise_m']/2+k*h) for k in range(1,n)]
    samples += [(run+core['landing_m']/2,core['width_m']/2,2.25),(-.75,core['width_m']/2,4.5)]
    for sample in samples:
        pos=tf@Vector(sample);hit=tree.ray_cast(pos+Vector((0,0,.002)),Vector((0,0,1)),20)[0]
        assert hit is not None and hit.z-pos.z>=2.2, (core['object'],sample,hit)
        headroom.append(hit.z-pos.z)
with render_geometry(bpy.context.scene) as dg:
    clearance=[camera_clearance(bpy.context.scene,bpy.data.objects[n],dg) for n in
               ('HERO_ARRIVAL','MARKET_AISLE','PLAZA_OBLIQUE')]
assert all(r['status']=='PASS_SAMPLED_CLEARANCE' for r in clearance),clearance
after=snapshots();assert all(after.get(n)==h for n,h in before.items())
out=Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out))
prep.update(candidate_sha256=hashlib.sha256(out.read_bytes()).hexdigest())
prep['architecture_coordination']={'status':'COORDINATED_DESIGN_CANDIDATE_NOT_CANONICAL',
    'finished_ground_datum_m':ground_datum,'ground_separation_from_plaza_m':.005,
    'prototype_sha256':coord['blend_sha256'],'programme_category_areas_m2':coord['programme_category_areas_m2'],
    'programme_split_pct':coord['programme_split_pct'],'measured_slab_surface_m2':coord['measured_horizontal_slab_area_m2'],
    'certified_gfa_m2':None,'kitchens':kitchens,'administration_desks':desks,'fitted_stalls':20,
    'minimum_sampled_stair_headroom_m':min(headroom),'camera_clearance':clearance,
    'prepared_source_signatures_preserved':len(before),'hidden_superseded_objects':hidden,
    'render_invocations':0,'limits':['Gross programme allocation includes circulation; net areas pending.',
    'Kitchen positions are spatial reservations, not certified occupancy or equipment/fire/exhaust compliance.',
    'Lift shafts remain reservations, not installed lifts.','Structure, access, egress and municipal sightline promotion remain unverified.']}
Path(str(out)+'.receipt.json').write_text(json.dumps(prep,indent=2)+'\n')
print(json.dumps(prep['architecture_coordination'],indent=2))
