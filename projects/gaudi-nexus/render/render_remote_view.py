"""Render an already prepared scene on a remote host; never assemble per camera."""
import sys,os,json,hashlib,time,argparse
if sys.platform=='darwin':
    raise SystemExit('Mac rendering is disabled by user request. Run this on the remote runner.')
import bpy
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('camera',choices=['HERO_F3','MARKET_WIDE','AERIAL'])
p.add_argument('output')
p.add_argument('--samples',type=int,default=32)
p.add_argument('--width',type=int,default=960)
p.add_argument('--height',type=int,default=540)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
if not (1<=a.samples<=256 and 1<=a.width<=3200 and 1<=a.height<=3200):raise SystemExit('Render budget exceeded')
source=Path(bpy.data.filepath)
sha=hashlib.sha256(source.read_bytes()).hexdigest()
prep=json.loads(Path(str(source)+'.receipt.json').read_text())
if sha!=prep['candidate_sha256'] or not prep['source_unchanged'] or prep['invented_cathedral_shader']:
    raise SystemExit('Unverified prepared scene')
sc=bpy.context.scene;sc.camera=bpy.data.objects[a.camera]
if a.camera=='HERO_F3' and not (abs(sc.camera.location.z-1.56)<.001 and 28<=sc.camera.data.lens<=35):
    raise SystemExit('F3 camera violates the hero contract')
sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=a.samples
sc.cycles.use_adaptive_sampling=True;sc.cycles.adaptive_threshold=.035
sc.cycles.use_denoising=True;sc.cycles.max_bounces=8;sc.cycles.use_light_tree=True
sc.render.resolution_x=a.width;sc.render.resolution_y=a.height;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_depth='16'
out=Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True);sc.render.filepath=str(out)
start=time.perf_counter();bpy.ops.render.render(write_still=True)
receipt={'status':'REMOTE_PILOT_NOT_COMPETITION_APPROVED','source_sha256':prep['source_sha256'],
    'candidate_sha256':sha,'candidate_unchanged':hashlib.sha256(source.read_bytes()).hexdigest()==sha,
    'camera':a.camera,'position_m':list(sc.camera.location),'lens_mm':sc.camera.data.lens,
    'focus_distance_m':sc.camera.data.dof.focus_distance,'fstop':sc.camera.data.dof.aperture_fstop,
    'hour_CEST':prep['hour_CEST'],'date':prep['date'],'solar_altitude_deg':prep['solar_altitude_deg'],
    'solar_azimuth_deg':prep['solar_azimuth_deg'],'width':a.width,'height':a.height,'max_samples':a.samples,
    'blender_version':bpy.app.version_string,'device':'CPU','view_transform':sc.view_settings.view_transform,
    'seconds_render':round(time.perf_counter()-start,2),'render_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
    'postprocess':'none','invented_cathedral_shader':False,'weather':'design-development haze, no observed-weather claim',
    'limits':['Procedural people are illustrative.','Programme GFA and accessibility remain unverified.','Municipal site alignment is not yet promoted.']}
Path(str(out)+'.receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
