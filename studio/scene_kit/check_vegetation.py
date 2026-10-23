"""Bounded research reproduction: canopy coverage, not a render/FPS benchmark.

Blender --background --factory-startup --disable-autoexec --python-exit-code 1
--python studio/scene_kit/check_vegetation.py -- NEW_OUTPUT_DIRECTORY
"""
import hashlib,json,math,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from studio.scene_kit.vegetation import holm_oak
from studio.scene_kit.materials import surface
from studio.scene_kit.export import export_glb

out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(parents=True,exist_ok=False)
coll=bpy.data.collections.new('CanopyResearch');bpy.context.scene.collection.children.link(coll)
bark=surface('Bark',(.13,.085,.045),.9)[0]
leaves=[surface('Leaf'+str(i),c,.82)[0] for i,c in enumerate(
    ((.055,.095,.025),(.1,.15,.045),(.16,.20,.07),(.23,.26,.1)))]
report={'hypothesis':'Stable-subset foliage scaled by sqrt(original/retained) preserves canopy cover better than simple leaf removal.',
 'threshold_before_measurement':{'max_absolute_sky_share_change':.05,'min_leaf_triangle_reduction':.70},
 'method':'160 x 160 orthographic geometry rays per view; top, front, diagonal; identical expanded reference bounds.',
 'seeds':[810,811,812],'render_invocations':0,'results':[],
 'limits':['Ray hits are binary geometry coverage, not transparency, illumination, perceived equivalence or FPS.',
 'One static tree family. No moving LOD transitions or target-device acceptance. No production substitution.']}
started=time.perf_counter()
def digest(obj):
    return hashlib.sha256(str([tuple(v.co) for v in obj.data.vertices]).encode()).hexdigest()
def bvh(obj):return BVHTree.FromPolygons([v.co for v in obj.data.vertices],[list(f.vertices) for f in obj.data.polygons])
for seed in report['seeds']:
    variants={}
    for kind,params in [('hero',{}),('thin',{'leaf_budget':36}),
                         ('compensated',{'leaf_budget':36,'coverage_compensation':True})]:
        variants[kind]=holm_oak(f'{kind}_{seed}',coll,bark,leaves,seed=seed,**params)
    assert len({digest(pair[0]) for pair in variants.values()})==1
    entry={'seed':seed,'branch_mesh_identical':True,'variants':{}}
    views=[('top',Vector((0,0,-1)),Vector((1,0,0)),Vector((0,1,0))),
           ('front',Vector((0,1,0)),Vector((1,0,0)),Vector((0,0,1))),
           ('diagonal',Vector((1,1,0)).normalized(),Vector((1,-1,0)).normalized(),Vector((0,0,1)))]
    for kind,pair in variants.items():
        leaf=pair[1];tree=bvh(leaf);values={}
        for name,d,u,v in views:
            points=[p.co for p in variants['hero'][1].data.vertices]
            lo=[min(p.dot(axis) for p in points)-.4 for axis in (u,v)]
            hi=[max(p.dot(axis) for p in points)+.4 for axis in (u,v)]
            depth=min(p.dot(d) for p in points)-5
            hits=0
            for i in range(160):
                for j in range(160):
                    p=u*(lo[0]+(hi[0]-lo[0])*(i+.5)/160)+v*(lo[1]+(hi[1]-lo[1])*(j+.5)/160)+d*depth
                    hits+=tree.ray_cast(p,d,30)[0] is not None
            values[name]=1-hits/(160*160)
        entry['variants'][kind]={'leaf_triangles':len(leaf.data.polygons),'sky_share':values}
    base=entry['variants']['hero'];candidate=entry['variants']['compensated']
    entry['max_absolute_sky_share_change']=max(abs(candidate['sky_share'][view]-base['sky_share'][view]) for view,_,_,_ in views)
    entry['thin_max_absolute_sky_share_change']=max(abs(entry['variants']['thin']['sky_share'][view]-base['sky_share'][view]) for view,_,_,_ in views)
    entry['leaf_triangle_reduction']=1-candidate['leaf_triangles']/base['leaf_triangles']
    entry['passes_predeclared_geometry_threshold']=entry['max_absolute_sky_share_change']<=.05 and entry['leaf_triangle_reduction']>=.70
    report['results'].append(entry)
    if seed==810:
        report['derivatives']={k:export_glb(out/(k+'.glb'),list(variants[k])) for k in ('hero','compensated')}
    print(json.dumps(entry),flush=True)
for bad in (0,146,-1,2.5):
    try:holm_oak('Invalid',coll,bark,leaves,leaf_budget=bad)
    except ValueError:pass
    else:raise AssertionError('Invalid leaf budget accepted')
report['invalid_budgets_rejected']=True
report['seconds']=time.perf_counter()-started
report['all_geometry_thresholds_pass']=all(x['passes_predeclared_geometry_threshold'] for x in report['results'])
report['decision']='REVIEW_STATIC_DESTINATION_BEFORE_ANY_LOD_USE' if report['all_geometry_thresholds_pass'] else 'REJECT_FOR_NOW_RETAIN_HERO'
report['source_sha256']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in
    (Path(__file__),Path(__file__).with_name('vegetation.py'))}
(out/'research-receipt.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'}))
