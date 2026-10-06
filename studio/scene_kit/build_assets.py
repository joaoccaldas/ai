"""Compile independently reusable assets, without Gaudí source dependencies.

Blender -b --python studio/scene_kit/build_assets.py -- --output /path/to/assets
"""
import argparse
import json
import sys
from pathlib import Path
import bpy

sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from studio.scene_kit import VERSION
from studio.scene_kit import materials as M
from studio.scene_kit.vegetation import holm_oak
from studio.scene_kit.entourage import person
from studio.scene_kit.export import export_glb
from studio.scene_kit.market import stall,produce_display
from studio.scene_kit.landscape import planted_island


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);args.output.mkdir(parents=True,exist_ok=True)
    # New standalone scene: no user scene or asset is read or deleted.
    scene=bpy.data.scenes.new('SceneKitLibrary');bpy.context.window.scene=scene
    scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    coll=bpy.data.collections.new('SceneKitAssets');scene.collection.children.link(coll)
    anchor=bpy.data.objects.new('WorldCoordinates',None);coll.objects.link(anchor)
    bark=M.mineral('OakBark',anchor,(.15,.12,.085),32,.9)
    leaves=[M.foliage('OakLeaf'+str(i),c) for i,c in enumerate([(.055,.095,.025),(.10,.15,.045),(.16,.20,.07),(.23,.26,.10)])]
    registry={'kit_version':VERSION,'units':'metres','asset_origin':'ground contact','assets':[],'status':'agent-built; validate independently before production reuse'}
    for lod in ['hero','low']:
        for i in range(3):
            objs=holm_oak('Oak_'+lod+'_'+str(i),coll,bark,leaves,810+i,lod)
            fn=args.output/('holm-oak-'+lod+'-'+str(i)+'.glb')
            info=export_glb(fn,objs)
            registry['assets'].append({'asset_id':'vegetation/holm-oak/'+lod+'/'+str(810+i),'file':fn.name,'seed':810+i,'license':'original procedural; no third-party model','lod':lod,**info})
            for obj in objs:obj.hide_render=True;obj.hide_set(True)
    # Portable entourage samples illustrate parameters; project adapter retains occupancy.
    skin=M.surface('Skin',(.55,.33,.20),.6)[0];coat=M.fabric('Coat',anchor,(.1,.15,.18))
    pants=M.fabric('Pants',anchor,(.045,.064,.085));shoe=M.surface('Shoe',(.035,.026,.021),.48)[0]
    hair=M.surface('Hair',(.04,.025,.014),.68)[0];bag=M.fabric('Bag',anchor,(.43,.36,.24))
    for i in range(3):
        obj=person('CivicPerson'+str(i),coll,[skin,coat,pants,shoe,hair,bag],(0,0,0),seed=300+i)
        fn=args.output/('civic-person-'+str(i)+'.glb');info=export_glb(fn,[obj])
        registry['assets'].append({'asset_id':'entourage/civic-person/'+str(300+i),'file':fn.name,'seed':300+i,'license':'original procedural; no third-party model',**info})
        obj.hide_render=True;obj.hide_set(True)
    steel=M.surface('Steel',(.065,.075,.08),.36,.72)[0]
    wood=M.timber('Chestnut',anchor);stone=M.mineral('Worktop',anchor,(.54,.47,.36))
    obj=stall('OpenStall',coll,[steel,wood,stone,shoe]);fn=args.output/'open-stall-standard.glb'
    info=export_glb(fn,[obj]);registry['assets'].append({'asset_id':'market/open-stall/standard','file':fn.name,'license':'original procedural; no third-party model',**info})
    food=[wood,M.surface('Orange',(.66,.24,.025),.48)[0],M.surface('Tomato',(.45,.045,.022),.39)[0],M.surface('GreenProduce',(.16,.28,.035),.44)[0]]
    obj=produce_display('SupportedProduce',coll,food);fn=args.output/'supported-produce-crates.glb';info=export_glb(fn,[obj])
    registry['assets'].append({'asset_id':'market/supported-produce-crates','file':fn.name,'seed':1,'license':'original procedural; no third-party model',**info})
    herbs=[M.foliage('HerbGreen',(.12,.19,.055)),M.foliage('SilverHerb',(.25,.30,.18)),M.surface('Lavender',(.22,.12,.31),.72)[0]]
    obj=planted_island('MediterraneanIsland',coll,[stone,M.mineral('Soil',anchor,(.085,.073,.045)),wood,steel,*herbs])
    fn=args.output/'mediterranean-seating-island.glb';info=export_glb(fn,[obj])
    registry['assets'].append({'asset_id':'landscape/mediterranean-seating-island','file':fn.name,'seed':910,'license':'original procedural; no third-party model',**info})
    bpy.data.libraries.write(str(args.output/'scene-kit-materials.blend'),set(m for m in bpy.data.materials if not m.name.startswith('WEB_')))
    (args.output/'registry.json').write_text(json.dumps(registry,indent=2)+'\n')
    print('ASSET_LIBRARY '+json.dumps({'assets':len(registry['assets']),'output':str(args.output)}))
