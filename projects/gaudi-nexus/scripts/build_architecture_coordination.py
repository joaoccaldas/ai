"""Build a measurable A+ two-level coordination prototype, without rendering.

Separate design-development geometry: it does not change the hero scene or
promote canonical architecture. Extends the existing A+ / OpenSCAD dimensions.
"""
import sys,math,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT.parents[1]))
import bpy
from mathutils import Vector,Matrix
from studio.scene_kit.architecture import floor_plate,projected_top_area,switchback_stair,switchback_parameters,parabolic_vault,partition_floor_areas
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.materials import surface
from studio.scene_kit.export import export_glb

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
out=Path(args[0]) if args else ROOT/'output/architecture-coordination-v1'
out.mkdir(parents=True,exist_ok=True)
# Hide only the factory startup scene. No source world is opened or modified.
for obj in bpy.context.scene.objects:obj.hide_render=True;obj.hide_set(True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
coll=bpy.data.collections.new('70_ARCHITECTURE_COORDINATION_NOT_CANONICAL');scene.collection.children.link(coll)
mats=[surface('CoordStone',(.65,.60,.50),.78)[0],surface('CoordSteel',(.055,.065,.065),.4,.75)[0]]
floors=[];objects=[];cores=[];quantities=[];placements={};programme=[];roofs=[];angle=math.radians(44.14)
ground=(-22.5,-5,22.5,5);upper=(-20.9,-5,20.9,5)
for bar,centre,width in [('Hard',(-50,20),1.5),('Civic',(-15,50),2.4)]:
    transform=Matrix.Translation(Vector((*centre,0)))@Matrix.Rotation(angle,4,'Z')
    params=switchback_parameters(clear_width=width)
    core_y=-4.8;core_width=params['width_m'];run=params['run_m'];L=params['landing_m']
    left_anchor=-20.9+L;right_anchor=20.9-L
    holes=[(left_anchor,core_y,left_anchor+run+L,core_y+core_width),
           (right_anchor-run-L,core_y,right_anchor,core_y+core_width),
           (-19.4,2.25,-16.9,4.65)]
    for level,bounds,elevation,voids in [(0,ground,0,[]),(1,upper,4.5,holes)]:
        obj=floor_plate(f'{bar}_CoordFloor_L{level}',coll,mats,bounds,elevation,voids=voids)
        obj.matrix_world=transform;obj['level']=level;obj['programme_status']='UNALLOCATED_COORDINATION_PROTOTYPE'
        floors.append(obj);objects.append(obj)
        if bar=='Hard' and level==0:
            zones={'services':(-22.5,-5,-11.1,5),'market':(-11.1,-5,22.5,5)}
        elif bar=='Hard':
            zones={'interpretation':(-20.9,-5,8,5),'services':(8,-5,20.9,5)}
        elif level==0:
            zones={'neighborhood_west':(-22.5,-5,-9,5),'cooking':(-9,-5,9,5),'neighborhood_east':(9,-5,22.5,5)}
        else:
            zones={'services':(-20.9,-5,-16.7,5),'interpretation':(-16.7,-5,-1.12,5),'meeting':(-1.12,-5,5.6,5),'neighborhood':(5.6,-5,20.9,5)}
        allocations=partition_floor_areas(bounds,voids,zones)
        for zone,area in allocations.items():
            category=('market_and_neighborhood' if zone=='market' or zone.startswith('neighborhood') else
                      'meeting_point' if zone in ('cooking','meeting') else
                      'interpretation_and_viewpoint' if zone=='interpretation' else 'administration_logistics_services')
            programme.append({'bar':bar,'level':level,'zone':zone,'category':category,'bounds_local_m':zones[zone],'slab_zone_area_m2':area})
        bpy.context.view_layer.update()
        quantities.append({'object':obj.name,'bar':bar,'level':level,'envelope_area_m2':(bounds[2]-bounds[0])*(bounds[3]-bounds[1]),
            'measured_slab_top_area_m2':round(projected_top_area(obj),6),'voids_local_xy_m':voids})
    for side,x,y,yaw in [('West',left_anchor,core_y,0),('East',right_anchor,core_y+core_width,math.pi)]:
        obj,p,samples=switchback_stair(f'{bar}_CoordStair_{side}',coll,mats,clear_width=width)
        local=Matrix.Translation(Vector((x,y,0)))@Matrix.Rotation(yaw,4,'Z');obj.matrix_world=transform@local
        objects.append(obj);cores.append({'object':obj.name,**p,'placement_local_m':[x,y],'rotation_deg':math.degrees(yaw)})
    # An explicit hollow shaft reservation, with an entry opening. No installed
    # lift, step-free certification, pit/headroom or manufacturer specification.
    builder=MeshBuilder();x0,y0,x1,y1=holes[-1]
    builder.box(((x0+x1)/2,y0-.06,4.2),(x1-x0,.12,8.4))
    builder.box(((x0+x1)/2,y1+.06,4.2),(x1-x0,.12,8.4))
    builder.box((x0-.06,(y0+y1)/2,4.2),(.12,y1-y0,8.4))
    shaft=builder.object(bar+'_CoordLiftReservation',coll,mats,smooth=False);shaft.matrix_world=transform
    shaft['asset_id']='architecture/lift-reservation';shaft['quantity_status']='RESERVATION_NOT_INSTALLED_LIFT';objects.append(shaft)
    roof=parabolic_vault(bar+'_CoordRoof',coll,[mats[0]])
    roof.matrix_world=transform;objects.append(roof);roofs.append(roof)
    frame=MeshBuilder()
    for x in range(-20,21,5):
        for y in (-4.5,4.5):
            frame.box((x,y,4.15),(.38,.38,8.3),0)
            frame.box((x,y,8.25),(.64,.64,.10),0)
        pts=[(x,-4.5+j*.25,8.3+1.35*(1-((-4.5+j*.25)/4.5)**2)) for j in range(37)]
        frame.tube(pts,[.075]*len(pts),0,sides=8)
    for y in (-4.5,4.5):
        frame.box((0,y,4.35),(45,.30,.30),0)
        frame.box((0,y,8.20),(45,.30,.20),0)
        # Upper guard rails and vertical infill; schematic detail, not code approval.
        frame.tube([(-20.9,y,5.60),(20.9,y,5.60)],[.025,.025],1)
        for j in range(419):
            frame.box((-20.9+j*.1,y,5.02),(.012,.024,1.04),1)
    obj=frame.object(bar+'_CoordFrame',coll,mats,smooth=False);obj.matrix_world=transform;objects.append(obj)
    placements[bar]={'centre_m':centre,'grid_rotation_deg':44.14,'upper_elevation_m':4.5,'proposed_ceiling_underside_m':8.3}

# Check the known collision between a full-width three-metre stall schedule,
# the eleven-metre support head and the new end core. Dimension the fit explicitly.
support_end=-11.5;field_start=support_end+.4
right_core_start=right_anchor-run-L
available=right_core_start-.19-field_start
gap=.05;count=10;frontage=2.5;required=count*frontage+(count-1)*gap
assert required<=available+1e-8
footprints=[]
tf=Matrix.Translation(Vector((-50,20,0)))@Matrix.Rotation(angle,4,'Z')
for row,y in enumerate((-2.8,2.8)):
    for n in range(count):
        x=field_start+frontage/2+n*(frontage+gap)
        b=(x-frontage/2,y-1.2,x+frontage/2,y+1.2)
        obj=floor_plate(f'CoordStallFootprint_{row}_{n:02}',coll,mats,b,.006,thickness=.002)
        obj.matrix_world=tf;obj['quantity_status']='TRADER_FOOTPRINT_ONLY_NOT_FITTED_STALL';objects.append(obj)
        footprints.append({'object':obj.name,'local_xy_m':b})

bpy.context.view_layer.update()
# Gross programme zones measured against the real slab, excluding all upper voids.
category_areas={key:sum(r['slab_zone_area_m2'] for r in programme if r['category']==key) for key in
    ('market_and_neighborhood','interpretation_and_viewpoint','meeting_point','administration_logistics_services')}
total_area=sum(category_areas.values())
assert abs(total_area-sum(r['measured_slab_top_area_m2'] for r in quantities))<.002
receipt={'status':'A_PLUS_COORDINATED_CANDIDATE_NOT_CANONICAL','basis':['config/primary_scheme_dimensions_v0_1.json','models/a_plus_v0_4.scad','docs/FINALIST_GATE_V0_5.md'],
    'placements':placements,'programme_zones':programme,'programme_category_areas_m2':category_areas,'programme_split_pct':{k:100*v/total_area for k,v in category_areas.items()},'floors':quantities,'cores':cores,'stall_footprints':footprints,
    'envelope_area_m2':sum(r['envelope_area_m2'] for r in quantities),
    'measured_horizontal_slab_area_m2':round(sum(r['measured_slab_top_area_m2'] for r in quantities),6),
    'certified_gfa_m2':None,'stall_fit':{'stalls':20,'frontage_m':frontage,'depth_m':2.4,'central_aisle_m':3.2,
        'available_longitudinal_m':round(available,6),'required_longitudinal_m':required,
        '3m_contract_frontage_fits':10*3+9*gap<=available,'2_7m_source_frontage_fits':10*2.7+9*gap<=available},
    'resolved_design_conflicts':['New roof springing 8.3m above 4.5m upper floor; actual stair/landing headroom checked during intake.','Stall frontage reduced to 2.5m in this proposed candidate; original contract preserved.'],
    'limits':['Programme split is gross slab-zone allocation, not certified GFA or net usable area.','Stair geometry is not regulatory or structural certification.','Lift shafts are reservations only.','Topography, fire egress, engineering and sightlines still need independent validation.','Envelope area is not certified GFA; void accounting must be agreed.'],
    'render_invocations':0}
assert abs(receipt['envelope_area_m2']-1736)<1e-6
path=out/'architecture-coordination.blend';bpy.ops.wm.save_as_mainfile(filepath=str(path.resolve()))
receipt['blend_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
receipt['glb']=export_glb(out/'architecture-coordination.glb',objects)
(out/'coordination-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:receipt[k] for k in ['status','envelope_area_m2','measured_horizontal_slab_area_m2','stall_fit','render_invocations']}))
