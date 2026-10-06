"""Non-destructive Gaudí visual development, backed by reusable studio.scene_kit.

Run with Blender 5.2:
  Blender -b --python scripts/build_visual_world.py -- --width 1280 --samples 64
All inputs remain untouched. This produces a candidate, never promotes canonical gates.
"""
import argparse
import array
import hashlib
import json
import math
import sys
import time
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
sys.path.insert(0,str(REPO))
from studio.scene_kit import VERSION
from studio.scene_kit import materials as M
from studio.scene_kit.vegetation import holm_oak,instance_tree
from studio.scene_kit.entourage import person
from studio.scene_kit.lighting import daylight,render_preset
from studio.scene_kit.export import export_glb
from studio.scene_kit.market import stall,produce_display
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.landscape import planted_island

PINNED='78cd3253881f07178e7878711a6dc11efced02d7e45e0e5ee5f7ae655ac10fd5'
LATEST='fbe674a0573bac16e8ca0ae8f4b0546e802b354ff171530685d3135cca9270ce'


def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for c in iter(lambda:f.read(1048576),b''):h.update(c)
    return h.hexdigest()


def collection(name):
    c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);return c


def signature(obj):
    """Geometry and world transform, independent of visual materials/modifiers."""
    h=hashlib.sha256()
    h.update(str([round(float(v),7) for row in obj.matrix_world for v in row]).encode())
    if obj.type=='MESH':
        coords=array.array('f',[0])*len(obj.data.vertices)*3
        obj.data.vertices.foreach_get('co',coords);h.update(coords.tobytes())
        indices=array.array('i',[0])*len(obj.data.loops)
        obj.data.loops.foreach_get('vertex_index',indices);h.update(indices.tobytes())
    elif obj.type=='CURVE':
        for spline in obj.data.splines:
            for p in spline.points:h.update(str(tuple(p.co)).encode())
            for p in spline.bezier_points:h.update(str((tuple(p.co),tuple(p.handle_left),tuple(p.handle_right))).encode())
    return h.hexdigest()


def snapshots():
    bpy.context.view_layer.update()
    return {o.name:signature(o) for o in bpy.data.objects if o.type!='CAMERA'}


def hide(obj):
    obj.hide_render=True;obj.hide_set(True)


def camera(name,pos,target,lens):
    data=bpy.data.cameras.new(name);obj=bpy.data.objects.new(name,data)
    bpy.context.scene.collection.children['50_CAMERAS_VISUAL_CANDIDATE'].objects.link(obj)
    obj.location=pos;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.lens=lens;data.sensor_width=36;data.clip_end=1500
    obj['camera_status']='VISUAL_DEVELOPMENT_NOT_APPROVED';return obj


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source',type=Path,default=ROOT/'output/source-latest-survey/rev17_aligned.blend')
    p.add_argument('--reference',type=Path,default=ROOT/'output/source-rev17/rev17_aligned.blend')
    p.add_argument('--output',type=Path,default=ROOT/'output/visual-candidate-v1')
    p.add_argument('--width',type=int,default=1280);p.add_argument('--samples',type=int,default=64)
    p.add_argument('--hour',type=float,default=17)
    p.add_argument('--views',nargs='+',default=['F3','CIVIC','MARKET'])
    p.add_argument('--skip-render',action='store_true');p.add_argument('--export-glb',action='store_true')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    if sys.platform=='darwin' and not args.skip_render:
        raise SystemExit('Mac rendering is disabled by user request. Use --skip-render or the remote workflow.')
    args.output.mkdir(parents=True,exist_ok=True)
    if sha(args.reference)!=PINNED:raise ValueError('Pinned municipal Rev17 checksum mismatch')
    if sha(args.source) not in [PINNED,LATEST]:raise ValueError('Unregistered input scene; reconcile it first')
    bpy.ops.wm.open_mainfile(filepath=str(args.reference));reference=snapshots()
    bpy.ops.wm.open_mainfile(filepath=str(args.source));before=snapshots()
    changed=[k for k,v in reference.items() if before.get(k)!=v]
    if changed:raise ValueError('Survey geometry differs from pinned Rev17: '+str(changed[:20]))
    source_objects=list(bpy.data.objects)
    municipal=bpy.data.objects['geometry_0'];municipal_hash=signature(municipal)
    municipal_faces=len(municipal.data.polygons)
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    scene['scene_kit_version']=VERSION;scene['visual_candidate']='v1'
    scene['canonical_promotion']='NONE';scene['source_sha256']=sha(args.source)
    scene['world_axes']='X east; Y north; Z up'
    scene['environmental_status']='visual solar approximation; engineering gates remain open'
    bpy.data.collections['CONTEXT'].hide_render=True
    bpy.data.collections['CONTEXT'].hide_viewport=True
    bpy.data.collections['00_SITE_MUNICIPAL_IMPORTED'].hide_render=False
    bpy.data.collections['00_SITE_MUNICIPAL_IMPORTED'].hide_viewport=False
    tree_coll=collection('01_LANDSCAPE_VISUAL_CANDIDATE')
    market_coll=collection('20_MARKET_KIT_VISUAL_CANDIDATE')
    people_coll=collection('30_PEOPLE_VISUAL_CANDIDATE')
    light_coll=collection('40_LIGHTING_VISUAL_CANDIDATE')
    collection('50_CAMERAS_VISUAL_CANDIDATE')
    prototypes=collection('99_ASSET_PROTOTYPES');prototypes.hide_render=True;prototypes.hide_viewport=True
    anchor=bpy.data.objects.new('SK_WorldMetreCoordinates',None)
    light_coll.objects.link(anchor);anchor['units']='metres';anchor['purpose']='world-scale PBR coordinates'
    palette={
        'Stone':M.mineral('SK_Travertine',anchor,(.54,.47,.36)),
        'Ceramic':M.glaze('SK_HoneyCeramic',anchor),
        'Tile':M.mineral('SK_TerracottaRoof',anchor,(.30,.13,.06),6,.62),
        'Timber':M.timber('SK_Chestnut',anchor),
        'Steel':M.mineral('SK_GraphiteSteel',anchor,(.07,.085,.09),20,.36),
        'CanvasShade':M.fabric('SK_LinenShade',anchor),
        'MarketLinen':M.fabric('SK_MarketLinen',anchor,(.67,.60,.47)),
        'Plaza':M.paving('SK_PlazaSlabs',anchor),
        'Trunk':M.mineral('SK_OakBark',anchor,(.15,.12,.085),32,.9),
        'Soil':M.mineral('SK_Soil',anchor,(.085,.073,.045),75,.95),
        'Street':M.mineral('SK_Asphalt',anchor,(.055,.065,.073),100,.83),
        'Asphalt':M.mineral('SK_Road',anchor,(.07,.075,.08),100,.8),
        'CurbStone':M.mineral('SK_GraniteCurb',anchor,(.44,.43,.39),65,.78),
    }
    palette['Steel'].node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.72
    for name in ['BrassDetail','BrassInlay','HeroBrass','SunInlay']:
        mat,bs=M.surface('SK_'+name,(.42,.27,.10),.29,.82)
        bs.inputs['Anisotropic'].default_value=.35;palette[name]=mat
    for name in ['HeroWetStone','WetPaving']:
        mat,bs=M.surface('SK_'+name,(.22,.23,.21),.19)
        bs.inputs['Coat Weight'].default_value=.7;palette[name]=mat
    stone=M.limestone('SK_MunicipalLimestone',anchor)
    municipal.data.materials.append(stone)
    municipal['material_status']='hypothetical limestone; municipal geometry unchanged'
    material_assignments=0;bevels=0
    for obj in source_objects:
        if obj.type in ['MESH','CURVE','FONT']:
            for i,mat in enumerate(obj.data.materials):
                if mat and mat.name in palette:
                    obj.data.materials[i]=palette[mat.name];material_assignments+=1
            if obj.type=='CURVE' and not obj.data.materials and ('Rib' in obj.name or 'Arch' in obj.name):obj.data.materials.append(palette['Stone'])
        if obj.type=='MESH' and any(c.name in ['ARCHITECTURE','MARKET','21_PROGRAM_REQUIRED'] for c in obj.users_collection):
            if len(obj.data.polygons)<100 and min(obj.dimensions)>.025 and not any(x in obj.name for x in ['Produce','Fruit','Bread','Herb']):
                b=obj.modifiers.new('SK_ManufacturingEdge','BEVEL');b.width=.004;b.segments=2;b.limit_method='ANGLE';bevels+=1
        if obj.type=='MESH' and any(obj.name.startswith(x) for x in ['Produce_','HeroProduce_','HeroFruit_','HeroBread_']):
            for poly in obj.data.polygons:poly.use_smooth=True
            if len(obj.data.polygons)<100:
                sub=obj.modifiers.new('SK_FoodSilhouette','SUBSURF');sub.levels=1;sub.render_levels=1
    # Preserve and hide the overlapping earlier tree representations.
    replacements=[]
    kit_fittings=M.surface('SK_KitFittings',(.025,.03,.028),.45,.6)[0]
    food=[palette['Timber'],M.surface('SK_Orange',(.66,.24,.025),.48)[0],M.surface('SK_Tomato',(.45,.045,.022),.39)[0],M.surface('SK_GreenProduce',(.16,.28,.035),.44)[0]]
    for source in source_objects:
        if source.name.startswith(('Produce_','Counter_')) and source.type=='MESH':hide(source);replacements.append(source.name)
        if source.name.startswith('Stall_') and source.type=='MESH':
            hide(source);replacements.append(source.name)
            item=stall('SK_Open'+source.name,market_coll,[palette['Steel'],palette['Timber'],palette['Stone'],kit_fittings],front=1 if source.name.endswith('_0') else -1)
            item.location=(source.location.x,source.location.y,0)
            item.rotation_euler=source.rotation_euler.copy()
            item['replaces_preserved_source']=source.name
            display=produce_display('SK_CrateDisplay_'+source.name,market_coll,food,front=item['customer_front_local_y'],seed=400+len(replacements))
            display.location=item.location;display.rotation_euler=item.rotation_euler.copy()
    tree_positions=[tuple(o.location) for o in source_objects if o.name.startswith('RT_Oak_')]
    cat=bpy.data.objects.get('CAT_OakTree')
    if cat:tree_positions.append((float(cat.location.x),float(cat.location.y),0))
    for obj in source_objects:
        if obj.name.startswith(('Crown_','Trunk_','RT_Oak_')) or obj.name in ['CAT_OakTree','tree_oak_01']:
            hide(obj);replacements.append(obj.name)
    leaves=[M.foliage('SK_OakLeaf_'+str(i),c) for i,c in enumerate([(.055,.095,.025),(.10,.15,.045),(.16,.20,.07),(.23,.26,.10)])]
    tree_assets=[holm_oak('SK_Oak_'+str(i),prototypes,palette['Trunk'],leaves,seed=810+i) for i in range(3)]
    island_positions=[(-35,-8),(-15,-28),(15,-18),(34,4),(32,32),(22,40)]
    herbs=[M.foliage('SK_HerbGreen',(.12,.19,.055)),M.foliage('SK_SilverHerb',(.25,.30,.18)),M.surface('SK_Lavender',(.22,.12,.31),.72)[0]]
    landscape_evidence=[]
    plaza=bpy.data.objects['Plaza'];inverse=plaza.matrix_world.inverted()
    sight_start=Vector((-15,42));sight_end=Vector((96.1,100.4));direction=(sight_end-sight_start).normalized()
    for i,(x,y) in enumerate(island_positions):
        bed=planted_island('SK_PlantingIsland_%02d'%i,tree_coll,[palette['Stone'],palette['Soil'],palette['Timber'],palette['Steel'],*herbs],seed=910+i)
        bed.location=(x,y,.005);bed.rotation_euler.z=math.radians(44)
        bpy.context.view_layer.update()
        # Every footprint vertex must sit over existing plaza geometry.
        for vertex in bed.data.vertices:
            world=bed.matrix_world@vertex.co
            hit,point,normal,index=plaza.ray_cast(inverse@Vector((world.x,world.y,5)),Vector((0,0,-1)))
            if not hit:raise ValueError('Proposed planting extends beyond existing plaza: '+bed.name)
        distance=abs(direction.x*(y-sight_start.y)-direction.y*(x-sight_start.x))
        if distance<7:raise ValueError('Planting intrudes into protected F3 view corridor')
        landscape_evidence.append({'asset':bed.name,'position_m':[x,y],'footprint_on_plaza':True,'center_distance_from_F3_axis_m':round(distance,2),'seat_height_m':.46,'seat_depth_m':.55})
    tree_positions.extend((x,y,0) for x,y in island_positions)
    for i,pos in enumerate(tree_positions):
        instance_tree(tree_assets[i%3],'SK_PlantedOak_%02d'%i,(pos[0],pos[1],.02),tree_coll,rotation=i*2.39996,scale=.85+(i%3)*.08)
    # Replacement people keep the existing occupancy distribution and footprints.
    heads=[]
    for obj in source_objects:
        if obj.name.startswith('Head_') or obj.name.endswith('_Head') or obj.name=='HeroVendorHead':
            if obj.name=='DogHead':continue
            if obj.name.startswith('Head_'):
                key='Person_'+obj.name.split('_')[-1];parts=[bpy.data.objects[key],obj]
            elif obj.name=='HeroVendorHead':parts=[o for o in source_objects if o.name.startswith('HeroVendor')]
            else:
                key=obj.name[:-5];parts=[o for o in source_objects if o.name.startswith(key+'_')]
            heads.append((obj,parts))
    skins=[M.surface('SK_Skin_'+str(i),c,.58)[0] for i,c in enumerate([(.42,.24,.15),(.63,.39,.25),(.25,.13,.075)])]
    coats=[M.fabric('SK_CivicCoat_'+str(i),anchor,c) for i,c in enumerate([(.08,.13,.17),(.23,.25,.17),(.43,.34,.22),(.20,.10,.085),(.56,.52,.43)])]
    pants=M.fabric('SK_Trousers',anchor,(.045,.064,.085))
    shoe=M.surface('SK_LeatherShoes',(.035,.026,.021),.48)[0]
    hair=M.surface('SK_Hair',(.04,.025,.014),.68)[0]
    bag=M.fabric('SK_CanvasBag',anchor,(.43,.36,.24))
    occupied=[];visible_people=0
    for i,(head,parts) in enumerate(heads):
        for part in parts:hide(part);replacements.append(part.name)
        pos=(float(head.location.x),float(head.location.y),.025)
        height=min(1.85,max(1.12,float(head.location.z)+.12))
        heading=math.radians(30+(i*71)%360)
        resident=person('SK_Resident_%02d'%i,people_coll,[skins[i%3],coats[i%5],pants,shoe,hair,bag],pos,height,heading,300+i)
        near_camera=math.hypot(pos[0]+15,pos[1]-42)<6
        overlaps=any(math.hypot(pos[0]-q[0],pos[1]-q[1])<1.2 for q in occupied)
        if near_camera or overlaps:
            hide(resident);resident['choreography']='retained; hidden to avoid foreground crop or duplicate occupancy'
        else:occupied.append(pos);visible_people+=1
    # Lamps retain their physical placement; broad legacy art-direction fills retire.
    for obj in source_objects:
        if obj.type=='LIGHT':
            if obj.data.type=='SUN' or obj.name in ['Fill','MarketWarm'] or obj.name.startswith(('HeroMarketGlow','MarketRibGlow')):hide(obj)
            else:
                obj.data.energy=min(obj.data.energy,180 if obj.data.type=='POINT' else 220)
                obj.data.color=(1,.76,.49)
                if 'Pendant' in obj.name:
                    m=MeshBuilder();m.ellipsoid((0,0,0),(.105,.105,.055),0,8,16)
                    luminous=M.surface('SK_LampLens_'+obj.name,(.72,.51,.24),.3)[0]
                    bs=luminous.node_tree.nodes.get('Principled BSDF')
                    bs.inputs['Emission Color'].default_value=(1,.72,.38,1);bs.inputs['Emission Strength'].default_value=3
                    lens=m.object('SK_LampLens_'+obj.name,light_coll,[luminous]);lens.location=obj.location
                    lens['asset_id']='lighting/pendant-lens'
    solar=daylight(scene,light_coll,41.4036,2.1744,'2026-09-21',args.hour,2)
    preset=render_preset(scene,args.width,args.samples)
    cams={
        'F3':camera('SK_F3_REGISTERED',(-15,42,1.56),(96.1,100.4,30),32),
        'CIVIC':camera('SK_CivicPlaza',(-18,28,1.56),(96.1,100.4,26),28),
        'MARKET':camera('SK_OpenMarketLife',(-56.5,12.5,1.56),(-40,28,1.8),32),
        'CONTEXT':camera('SK_WideContext',(-40,8,1.56),(60,70,33),24),
        'AERIAL':camera('SK_Aerial',(-100,-65,80),(3,50,8),40),
        'DESIGN':camera('SK_ArchitectureCraft',(-69,-19,3.4),(-14,39,7),32),
    }
    after=snapshots()
    preservation=[k for k,v in before.items() if after.get(k)!=v]
    if preservation:raise ValueError('Original geometry/transform changed: '+str(preservation[:20]))
    if signature(municipal)!=municipal_hash:raise ValueError('Municipal geometry changed')
    report={
        'status':'VISUAL_CANDIDATE_NOT_CANONICAL_NOT_COMPETITION_APPROVED',
        'scene_kit_version':VERSION,'source':str(args.source),'source_sha256':sha(args.source),
        'reference_sha256':PINNED,'reference_objects_matched':len(reference),'original_objects_preserved':len(before),
        'municipal_geometry_unchanged':True,'municipal_faces':municipal_faces,
        'material_assignments':material_assignments,'non_destructive_bevel_modifiers':bevels,
        'trees':len(tree_positions),'tree_variants':3,'people_generated':len(heads),'people':visible_people,'open_stall_kits':20,
        'planting_islands':len(island_positions),'landscape_checks':landscape_evidence,
        'retired_objects_preserved':sorted(set(replacements)),
        'solar':solar,'render':preset,'renders':[],
        'standards':{'units':'metres','axes':'east,north,up','asset_origin':'ground contact','source_geometry':'immutable','materials':'linear PBR','export':'glTF 2.0 PBR approximation','instancing':'shared Blender mesh datablocks','determinism':'local seeded RNG','license':'new geometry original procedural'},
        'limitations':['Municipal cathedral is massing, not a sculptural reconstruction.','Planting combines retained scene positions and six proposed islands; not municipal survey or hydraulic design.','People are architectural entourage, not scans.','Procedural Cycles textures require baking for faithful web export.','NOAA solar direction is an approximate visual model; no engineering/annual/CFD validation.','Canonical, hero>=9/10, site-truth and competition gates remain open.'],
    }
    report['generator_sources']={str(f.relative_to(REPO)):sha(f) for f in sorted((REPO/'studio/scene_kit').glob('*.py'))}
    report['generator_sources'][str(Path(__file__).resolve().relative_to(REPO))]=sha(Path(__file__))
    scene.camera=cams['F3']
    blend=args.output/'living-threshold-visual-v1.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    report['blend_sha256']=sha(blend);report['blend_bytes']=blend.stat().st_size
    if args.export_glb:
        glb=args.output/'living-threshold-visual-v1.glb'
        report['glb']=export_glb(glb,[o for o in bpy.data.objects if o.visible_get() and not o.hide_render])
    for view in [] if args.skip_render else args.views:
        scene.camera=cams[view];scene.render.filepath=str(args.output/(view.lower()+'.png'))
        start=time.perf_counter();bpy.ops.render.render(write_still=True)
        report['renders'].append({'view':view,'path':scene.render.filepath,'seconds':round(time.perf_counter()-start,2),'sha256':sha(scene.render.filepath),'camera_position':list(scene.camera.location),'lens_mm':scene.camera.data.lens})
        (args.output/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    # Report exists even when only building/exporting; saved scene defaults to F3.
    (args.output/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print('SCENE_KIT_RESULT '+json.dumps({k:report[k] for k in ['status','reference_objects_matched','trees','people','renders']}))


if __name__=='__main__':main()
