"""Gaudi Nexus scene assembly + render (derived render copy only; never edits canonical geometry).

Usage: blender -b <rev17_aligned.blend> --python build.py -- <CAMERA> <HOUR_LOCAL_CEST> <W> <H> <SAMPLES> <OUT.png>
Sun is derived from declared inputs: Barcelona 41.4036N 2.1744E, 2026-09-21, UTC+2 (see LAT/LON/UTC_OFF/DOY).
ENRICH_SAGRADA toggles the disclosed, shader-only window/arch enrichment of the municipal Sagrada massing.
Assets come from studio/shared/procedural-assets (procassets).
"""
import os, sys, argparse, json, hashlib, time
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../studio/shared/procedural-assets')))
import bpy, math, mathutils, sys
from mathutils import Vector
# usage: -- CAM HOUR_LOCAL W H SAMPLES OUT
_parser=argparse.ArgumentParser()
for _name,_type in [('camera',str),('hour',float),('width',int),('height',int),('samples',int),('output',str)]:_parser.add_argument(_name,type=_type)
_parser.add_argument('--device',choices=['CPU','METAL'],default='CPU')
_parser.add_argument('--enrich-context',action='store_true',help='Experimental invented cathedral shader; not authoritative competition context')
_parser.add_argument('--save-blend')
_parser.add_argument('--prepare-only',action='store_true',help='Assemble/export a derived scene without invoking any renderer')
_parser.add_argument('--expected-source-sha256')
_args=_parser.parse_args(sys.argv[sys.argv.index('--')+1:])
if sys.platform=='darwin' and not _args.prepare_only:
    raise SystemExit('Local Mac rendering is disabled by user request. Use --prepare-only or the remote workflow.')
if _args.prepare_only and not _args.save_blend:
    raise SystemExit('--prepare-only requires --save-blend')
CAM,HOUR,W,H,S,OUT=_args.camera,_args.hour,_args.width,_args.height,_args.samples,_args.output
_input_path=bpy.data.filepath
_input_sha=hashlib.sha256(open(_input_path,'rb').read()).hexdigest()
if _args.expected_source_sha256 and _input_sha!=_args.expected_source_sha256:
    raise SystemExit('Source SHA-256 does not match the pinned municipal scene')
_started=time.perf_counter()
LAT,LON,UTC_OFF,DOY=41.4036,2.1744,2,264  # Barcelona, 2026-09-21, CEST
sc=bpy.context.scene; N=lambda m:m.node_tree.nodes; 
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'../scripts'))
from build_visual_world import snapshots as _snapshots
_source_objects=_snapshots()
_municipal=bpy.data.objects.get('geometry_0')
if not _municipal or _municipal.type!='MESH' or len(_municipal.data.polygons)!=113584:
    raise SystemExit('Expected 113,584-face municipal context is missing; refusing proxy-only candidate')
if 'HERO_F3' not in bpy.data.objects:
    _registered=bpy.data.objects.get('A_HERO_MUNICIPAL_F3')
    if not _registered:raise SystemExit('Registered F3 camera is missing')
    _f3=_registered.copy();_f3.data=_registered.data.copy();_f3.name='HERO_F3';sc.collection.objects.link(_f3)
if CAM=='TOP_MARKET':
    cd_=bpy.data.cameras.new('TM'); cd_.type='ORTHO'; cd_.ortho_scale=26; co=bpy.data.objects.new('TOP_MARKET',cd_); sc.collection.objects.link(co); co.location=(-56,9,60); co.rotation_euler=(0,0,0)
    for o in bpy.data.objects:
        if 'Roof' in o.name or o.name.startswith('Crown_'): o.hide_render=True
if CAM=='AERIAL':
    cd_=bpy.data.cameras.new('AE'); cd_.lens=32; co=bpy.data.objects.new('AERIAL',cd_); sc.collection.objects.link(co)
    co.location=Vector((-120,-70,95)); co.rotation_euler=(Vector((-20,48,6))-co.location).to_track_quat('-Z','Y').to_euler()
if CAM=='MARKET_WIDE':
    cd_=bpy.data.cameras.new('MW'); cd_.lens=26; co=bpy.data.objects.new('MARKET_WIDE',cd_); sc.collection.objects.link(co)
    co.location=Vector((-47.6,6.9,1.7)); co.rotation_euler=(Vector((-53.0,12.6,1.5))-co.location).to_track_quat('-Z','Y').to_euler()
if CAM=='MARKET_CLOSE':
    cd_=bpy.data.cameras.new('MC'); cd_.lens=40; co=bpy.data.objects.new('MARKET_CLOSE',cd_); sc.collection.objects.link(co)
    co.location=Vector((-49.8,8.9,1.5)); co.rotation_euler=(Vector((-53.2,12.4,1.0))-co.location).to_track_quat('-Z','Y').to_euler()
for _name,_pos,_target,_lens in [('MARKET_WIDE',(-47.6,6.9,1.7),(-53.0,12.6,1.5),26),('AERIAL',(-120,-70,95),(-20,48,6),32)]:
    if _name in bpy.data.objects:continue
    _cd=bpy.data.cameras.new(_name);_cd.lens=_lens
    _co=bpy.data.objects.new(_name,_cd);sc.collection.objects.link(_co)
    _co.location=_pos;_co.rotation_euler=(Vector(_target)-_co.location).to_track_quat('-Z','Y').to_euler()

# ---------- solar position from declared inputs ----------
decl=math.radians(-23.44*math.cos(math.radians(360/365*(DOY+10))))
Bd=math.radians(360/365*(DOY-81)); eot=9.87*math.sin(2*Bd)-7.53*math.cos(Bd)-1.5*math.sin(Bd)
solar=HOUR-UTC_OFF+(LON*4+eot)/60
ha=math.radians(15*(solar-12)); ph=math.radians(LAT)
alt=math.asin(math.sin(ph)*math.sin(decl)+math.cos(ph)*math.cos(decl)*math.cos(ha))
az=math.atan2(math.sin(ha),math.cos(ha)*math.sin(ph)-math.tan(decl)*math.cos(ph))+math.pi  # from north, clockwise
print('SUN',HOUR,'alt',round(math.degrees(alt),1),'az',round(math.degrees(az)%360,1))
d=mathutils.Vector((math.cos(alt)*math.sin(az),math.cos(alt)*math.cos(az),math.sin(alt)))
_original_sun=bpy.data.objects['Sun'];sun=_original_sun.copy();sun.data=_original_sun.data.copy()
sun.name='VIS_Sun';sc.collection.objects.link(sun);_original_sun.hide_render=True
sun.location=d*200; sun.rotation_euler=(-d).to_track_quat('-Z','Y').to_euler()
sun.data.energy=8.0; sun.data.angle=math.radians(0.53)
# Cycles computes indirect light; no unshadowed opposite-side sun is added.
warm=max(0.0,min(1.0,(30-math.degrees(alt))/25)); sun.data.color=(1.0,0.97-0.12*warm,0.92-0.3*warm)
# ---------- geometry visibility: municipal context only ----------
for c in bpy.data.collections:
    if c.name=='CONTEXT': c.hide_render=True
    if c.name=='00_SITE_MUNICIPAL_IMPORTED': c.hide_render=False
# ---------- helpers ----------
def newmat(name):
    m=bpy.data.materials.new(name); m.use_nodes=True; return m
def mapping(nt,scale=(1,1,1)):
    tc=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=scale
    nt.links.new(tc.outputs['Object'],mp.inputs['Vector']); return mp
def noise(nt,mp,scale,detail=8,rough=0.6):
    n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=scale; n.inputs['Detail'].default_value=detail; n.inputs['Roughness'].default_value=rough
    nt.links.new(mp.outputs['Vector'],n.inputs['Vector']); return n
def ramp(nt,fac,stops):
    r=nt.nodes.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].position=stops[0][0]; r.color_ramp.elements[0].color=stops[0][1]
    r.color_ramp.elements[1].position=stops[-1][0]; r.color_ramp.elements[1].color=stops[-1][1]
    for p,c in stops[1:-1]:
        e=r.color_ramp.elements.new(p); e.color=c
    nt.links.new(fac,r.inputs['Fac']); return r
def mixrgb(nt,a,b,f,blend='MIX'):
    m=nt.nodes.new('ShaderNodeMix'); m.data_type='RGBA'; m.blend_type=blend
    nt.links.new(f,m.inputs[0]) if hasattr(f,'node') else None
    if not hasattr(f,'node'): m.inputs[0].default_value=f
    for i,x in ((6,a),(7,b)):
        if hasattr(x,'node'): nt.links.new(x,m.inputs[i])
        else: m.inputs[i].default_value=x
    return m.outputs[2]
def bsdf(m):
    return m.node_tree.nodes['Principled BSDF']
def bump(nt,height,strength,dist,bsdf_):
    b=nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value=strength; b.inputs['Distance'].default_value=dist
    nt.links.new(height,b.inputs['Height']); nt.links.new(b.outputs['Normal'],bsdf_.inputs['Normal'])
def mathn(nt,op,a,b=None,clamp=False):
    m=nt.nodes.new('ShaderNodeMath'); m.operation=op; m.use_clamp=clamp
    for i,x in enumerate((a,b)):
        if x is None: continue
        if hasattr(x,'node'): nt.links.new(x,m.inputs[i])
        else: m.inputs[i].default_value=x
    return m.outputs['Value']
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'pbr.py')).read())
# ---------- municipal limestone: coursed ashlar, vertical weathering ----------
mm=newmat('MuniLimestone'); nt=mm.node_tree; p=bsdf(mm)
mp=mapping(nt); mp.inputs['Rotation'].default_value=(math.radians(90),0,0); br=nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mp.outputs['Vector'],br.inputs['Vector'])
br.inputs['Scale'].default_value=1.0; br.inputs['Brick Width'].default_value=2.2; br.inputs['Row Height'].default_value=0.9
br.inputs['Mortar Size'].default_value=0.03; br.inputs['Mortar Smooth'].default_value=0.2; br.offset=0.5
br.inputs['Color1'].default_value=(0.78,0.65,0.45,1); br.inputs['Color2'].default_value=(0.55,0.43,0.30,1); br.inputs['Mortar'].default_value=(0.36,0.31,0.25,1)
br.inputs['Color Variation' if 'Color Variation' in br.inputs else 'Bias'].default_value=0.0 if 'Color Variation' not in br.inputs else 0.5
mpB=mapping(nt); mpB.inputs['Rotation'].default_value=(math.radians(90),0,math.radians(90)); brB=nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mpB.outputs['Vector'],brB.inputs['Vector'])
for k_ in ('Scale','Brick Width','Row Height','Mortar Size','Mortar Smooth','Color1','Color2','Mortar'): brB.inputs[k_].default_value=br.inputs[k_].default_value
brB.offset=0.5
_gn=nt.nodes.new('ShaderNodeNewGeometry'); _sn=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(_gn.outputs['Normal'],_sn.inputs['Vector'])
_ay=mathn(nt,'GREATER_THAN',mathn(nt,'ABSOLUTE',_sn.outputs['Y']),0.5)
_bc=nt.nodes.new('ShaderNodeMix'); _bc.data_type='RGBA'; nt.links.new(_ay,_bc.inputs[0]); nt.links.new(br.outputs['Color'],_bc.inputs[6]); nt.links.new(brB.outputs['Color'],_bc.inputs[7])
_bf=nt.nodes.new('ShaderNodeMix'); _bf.data_type='FLOAT'; nt.links.new(_ay,_bf.inputs[0]); nt.links.new(br.outputs['Fac'],_bf.inputs[2]); nt.links.new(brB.outputs['Fac'],_bf.inputs[3])

mp2=mapping(nt,(0.28,0.28,0.28)); streak=noise(nt,mp2,1.0,6,0.6)   # tall vertical rain streaks
mp3=mapping(nt,(0.12,0.12,0.12)); patina=noise(nt,mp3,1.0,6,0.6)
dark=ramp(nt,streak.outputs['Fac'],[(0.35,(1,1,1,1)),(0.75,(0.52,0.48,0.42,1))])
_T=pbr_maps(nt,'sandstone_blocks_08',3.0)
col=mixrgb(nt,(_T['color'] if _T else _bc.outputs[2]),dark.outputs['Color'],0.18,'MULTIPLY')
col=mixrgb(nt,col,ramp(nt,patina.outputs['Fac'],[(0.4,(1,1,1,1)),(0.7,(0.72,0.68,0.6,1))]).outputs['Color'],0.6,'MULTIPLY')
_zs=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(nt.nodes.new('ShaderNodeTexCoord').outputs['Object'],_zs.inputs['Vector'])
_base=ramp(nt,mathn(nt,'DIVIDE',_zs.outputs['Z'],40.0,True),[(0.0,(0.62,0.55,0.48,1)),(0.25,(0.9,0.86,0.8,1)),(1.0,(1.08,1.06,1.02,1))])   # dirt toward the base, cleaner higher up
col=mixrgb(nt,col,_base.outputs['Color'],1.0,'MULTIPLY')
nt.links.new(col,p.inputs['Base Color']); p.inputs['Roughness'].default_value=0.88
if _T: nt.links.new(_T['rough'],p.inputs['Roughness'])
h=(mathn(nt,'MULTIPLY',_T['height'],1.0) if _T else mathn(nt,'SUBTRACT',1.0,_bf.outputs[0])); bump(nt,mathn(nt,'ADD',h,mathn(nt,'MULTIPLY',noise(nt,mapping(nt,(1,1,1)),40,8,0.55).outputs['Fac'],0.35)),0.8,0.05,p)
wv=nt.nodes.new('ShaderNodeTexWave'); wv.wave_type='BANDS'; wv.bands_direction='X'; wv.inputs['Scale'].default_value=0.22; wv.inputs['Distortion'].default_value=2.5; wv.inputs['Detail'].default_value=3
nt.links.new(mapping(nt).outputs['Vector'],wv.inputs['Vector'])
bl=noise(nt,mapping(nt,(0.035,0.035,0.05)),1.0,5,0.55)
blc=ramp(nt,bl.outputs['Fac'],[(0.35,(1.0,0.97,0.9,1)),(0.65,(0.62,0.55,0.46,1))])
col2=mixrgb(nt,col,blc.outputs['Color'],0.6,'MULTIPLY'); nt.links.new(col2,p.inputs['Base Color'])
b2=nt.nodes.new('ShaderNodeBump'); b2.inputs['Strength'].default_value=1.0; b2.inputs['Distance'].default_value=0.6
nt.links.new(wv.outputs['Fac'],b2.inputs['Height']); b2.inputs['Normal'].default_value=(0,0,1)
for l in list(nt.links):
    if l.to_socket==p.inputs['Normal']: nt.links.remove(l)
b3=nt.nodes.new('ShaderNodeBump'); b3.inputs['Strength'].default_value=0.5; b3.inputs['Distance'].default_value=0.05
# STRING_COURSES: horizontal ledges every 4.2 m with a shadow groove below (shader-only relief)
_tcz=nt.nodes.new('ShaderNodeTexCoord'); _sz=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(_tcz.outputs['Object'],_sz.inputs['Vector'])
_fz=mathn(nt,'FRACT',mathn(nt,'DIVIDE',_sz.outputs['Z'],4.2))
_ledge=mathn(nt,'MULTIPLY',mathn(nt,'LESS_THAN',_fz,0.09),mathn(nt,'GREATER_THAN',_sz.outputs['Z'],3.0))
_groove=mathn(nt,'MULTIPLY',mathn(nt,'GREATER_THAN',_fz,0.09),mathn(nt,'LESS_THAN',_fz,0.15))
nt.links.new(mathn(nt,'SUBTRACT',mathn(nt,'ADD',h,mathn(nt,'MULTIPLY',wv.outputs['Fac'],2.0)),mathn(nt,'MULTIPLY',_ledge,-4.0)),b3.inputs['Height'])
_gcol=mixrgb(nt,col2,(0.55,0.50,0.43,1),mathn(nt,'MULTIPLY',_groove,0.8))
nt.links.new(_gcol if _args.enrich_context else col2,p.inputs['Base Color'])
# ---- VISUAL ENRICHMENT (non-authoritative): window recesses above street level, derived render copy only ----
ENRICH_SAGRADA=_args.enrich_context
if ENRICH_SAGRADA:
    tcw=nt.nodes.new('ShaderNodeTexCoord'); sx=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tcw.outputs['Object'],sx.inputs['Vector'])
    gn=nt.nodes.new('ShaderNodeNewGeometry'); sn=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(gn.outputs['Normal'],sn.inputs['Vector'])
    def fr(axis,den): return mathn(nt,'FRACT',mathn(nt,'DIVIDE',sx.outputs[axis],den))
    def band(f,lo,hi): return mathn(nt,'MULTIPLY',mathn(nt,'GREATER_THAN',f,lo),mathn(nt,'LESS_THAN',f,hi))
    fzv=fr('Z',8.0)
    tz=mathn(nt,'MINIMUM',mathn(nt,'MAXIMUM',mathn(nt,'DIVIDE',mathn(nt,'SUBTRACT',fzv,0.45),0.35),0.0),1.0)
    hw=mathn(nt,'MULTIPLY',mathn(nt,'SUBTRACT',1.0,mathn(nt,'MULTIPLY',tz,tz)),0.11)          # parabolic taper toward the top
    def arch(f): return mathn(nt,'LESS_THAN',mathn(nt,'ABSOLUTE',mathn(nt,'SUBTRACT',f,0.5)),hw)
    colX=arch(fr('X',3.4)); colY=arch(fr('Y',3.4))
    row=mathn(nt,'MULTIPLY',band(fr('Z',8.0),0.20,0.80),mathn(nt,'GREATER_THAN',sx.outputs['Z'],14.0))
    ay=mathn(nt,'GREATER_THAN',mathn(nt,'ABSOLUTE',sn.outputs['Y']),0.6); ax=mathn(nt,'GREATER_THAN',mathn(nt,'ABSOLUTE',sn.outputs['X']),0.6)
    flat=mathn(nt,'SUBTRACT',1.0,mathn(nt,'GREATER_THAN',mathn(nt,'ABSOLUTE',sn.outputs['Z']),0.5))   # vertical faces only
    win=mathn(nt,'MULTIPLY',row,mathn(nt,'MULTIPLY',flat,mathn(nt,'ADD',mathn(nt,'MULTIPLY',colX,ay),mathn(nt,'MULTIPLY',colY,ax)),True),True)
    cx=mathn(nt,'FLOOR',mathn(nt,'DIVIDE',sx.outputs['X'],3.4)); cy=mathn(nt,'FLOOR',mathn(nt,'DIVIDE',sx.outputs['Y'],3.4)); cz=mathn(nt,'FLOOR',mathn(nt,'DIVIDE',sx.outputs['Z'],8.0))
    cc=nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(cx,cc.inputs['X']); nt.links.new(cy,cc.inputs['Y']); nt.links.new(cz,cc.inputs['Z'])
    wn_=nt.nodes.new('ShaderNodeTexWhiteNoise'); wn_.noise_dimensions='3D'; nt.links.new(cc.outputs['Vector'],wn_.inputs['Vector'])
    win=mathn(nt,'MULTIPLY',win,mathn(nt,'GREATER_THAN',wn_.outputs['Value'],0.3))
    darkc=mixrgb(nt,_gcol,(0.07,0.06,0.05,1),win)
    nt.links.new(darkc,p.inputs['Base Color'])
    b4=nt.nodes.new('ShaderNodeBump'); b4.inputs['Strength'].default_value=1.0; b4.inputs['Distance'].default_value=0.9; b4.invert=True
    nt.links.new(win,b4.inputs['Height']); nt.links.new(b3.outputs['Normal'],b4.inputs['Normal']); nt.links.new(b4.outputs['Normal'],p.inputs['Normal'])
    dd=nt.nodes.new('ShaderNodeBsdfDiffuse'); dd.inputs['Color'].default_value=(0.015,0.013,0.012,1)
    msh=nt.nodes.new('ShaderNodeMixShader'); out=nt.nodes['Material Output']
    nt.links.new(win,msh.inputs[0]); nt.links.new(p.outputs['BSDF'],msh.inputs[1]); nt.links.new(dd.outputs['BSDF'],msh.inputs[2]); nt.links.new(msh.outputs['Shader'],out.inputs['Surface'])

mg=bpy.data.objects['geometry_0']; mg.data.materials.clear(); mg.data.materials.append(mm)
# ---------- plaza paving: stone slabs, dirty joints, damp patches, puddles ----------
pm=newmat('PlazaSlabs'); nt=pm.node_tree; p=bsdf(pm)
mp=mapping(nt); br=nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mp.outputs['Vector'],br.inputs['Vector'])
br.inputs['Scale'].default_value=1.0; br.inputs['Brick Width'].default_value=0.6; br.inputs['Row Height'].default_value=0.3
br.inputs['Mortar Size'].default_value=0.010; br.inputs['Mortar Smooth'].default_value=0.3; br.offset=0.5
br.inputs['Color1'].default_value=(0.47,0.44,0.40,1); br.inputs['Color2'].default_value=(0.40,0.38,0.35,1); br.inputs['Mortar'].default_value=(0.10,0.09,0.08,1)
mpd=mapping(nt); damp=noise(nt,mpd,0.22,5,0.5)       # metre-scale damp/puddle breakup
mpf=mapping(nt); fine=noise(nt,mpf,70,6,0.6)          # aggregate
dampmask=ramp(nt,damp.outputs['Fac'],[(0.50,(0,0,0,1)),(0.62,(1,1,1,1))])
_P=pbr_maps(nt,'concrete_pavers_02',2.0)
col=mixrgb(nt,(_P['color'] if _P else br.outputs['Color']),ramp(nt,fine.outputs['Fac'],[(0.3,(0.88,0.88,0.88,1)),(0.7,(1.1,1.08,1.05,1))]).outputs['Color'],0.5,'MULTIPLY')
col=mixrgb(nt,col,(0.45,0.43,0.41,1),dampmask.outputs['Color'],'MULTIPLY')
nt.links.new(col,p.inputs['Base Color'])
rough=mathn(nt,'ADD',0.78,mathn(nt,'MULTIPLY',fine.outputs['Fac'],-0.25))
rough=mathn(nt,'SUBTRACT',rough,mathn(nt,'MULTIPLY',dampmask.outputs['Color'],0.0)) if False else rough
rd=nt.nodes.new('ShaderNodeMapRange'); rd.inputs['From Min'].default_value=0.0; rd.inputs['From Max'].default_value=1.0
nt.links.new(dampmask.outputs['Color'],rd.inputs['Value']); rd.inputs['To Min'].default_value=0.85; rd.inputs['To Max'].default_value=0.12
rmix=nt.nodes.new('ShaderNodeMath'); rmix.operation='MULTIPLY'; nt.links.new(rd.outputs['Result'],rmix.inputs[0]); nt.links.new(fine.outputs['Fac'],rmix.inputs[1])
rm=nt.nodes.new('ShaderNodeMapRange'); nt.links.new(rmix.outputs['Value'],rm.inputs['Value']); rm.inputs['From Min'].default_value=0.0; rm.inputs['From Max'].default_value=0.85; rm.inputs['To Min'].default_value=0.05; rm.inputs['To Max'].default_value=0.9
nt.links.new((mathn(nt,'ADD',mathn(nt,'MULTIPLY',rm.outputs['Result'],0.5),mathn(nt,'MULTIPLY',_P['rough'],0.5)) if _P else rm.outputs['Result']),p.inputs['Roughness'])
bump(nt,mathn(nt,'ADD',mathn(nt,'SUBTRACT',1.0,br.outputs['Fac']),mathn(nt,'MULTIPLY',fine.outputs['Fac'],0.2)),0.6,0.01,p)
for nm in ('Plaza','Street_Base'):
    o=bpy.data.objects.get(nm)
    if o: o.data.materials.clear(); o.data.materials.append(pm)
# ---------- surface variation on existing flat materials (physical scale) ----------
def upgrade(name,sca,var,bmp,rv,dk):
    m=bpy.data.materials.get(name)
    if not m or not m.use_nodes: return
    nt=m.node_tree; p=bsdf(m)
    if p.inputs['Base Color'].is_linked: return
    base=tuple(p.inputs['Base Color'].default_value)[:3]; r0=p.inputs['Roughness'].default_value
    mp=mapping(nt,(sca,sca,sca)); n=noise(nt,mp,1.0,10,0.65); v=nt.nodes.new('ShaderNodeTexVoronoi'); nt.links.new(mp.outputs['Vector'],v.inputs['Vector'])
    fac=mathn(nt,'MULTIPLY',n.outputs['Fac'],var,True)
    nt.links.new(mixrgb(nt,base+(1,),tuple(x*dk for x in base)+(1,),fac),p.inputs['Base Color'])
    rr=nt.nodes.new('ShaderNodeMapRange'); nt.links.new(n.outputs['Fac'],rr.inputs['Value']); rr.inputs['To Min'].default_value=max(0.02,r0-rv); rr.inputs['To Max'].default_value=min(1,r0+rv)
    nt.links.new(rr.outputs['Result'],p.inputs['Roughness'])
    bump(nt,n.outputs['Fac'],bmp*0.5,0.004,p)
for a in [('Tile',6,1.1,0.4,0.2,0.7),('Ceramic',1.6,1.5,0.1,0.14,0.55),('Timber',20,1.0,0.5,0.15,0.7),('Steel',9,0.6,0.15,0.12,0.8),('CanvasShade',90,0.5,0.6,0.1,0.85),('Trunk',14,1.1,0.8,0.1,0.6),('Soil',16,1.0,0.7,0.1,0.6),('Stone',8,1.1,0.5,0.15,0.75),('RoadWhite',6,0.9,0.2,0.1,0.75),('HeroWetStone',6,1.0,0.3,0.1,0.8),('Sagrada',3,1.0,0.5,0.1,0.8)]: upgrade(*a)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'surf2.py')).read())
from procassets.market import *
replace_market_assets(); replace_stalls_and_herbs()
from procassets.contacts import settle_on_supports,fit_footprint_on_box_top
_counter_produce=[o for o in bpy.context.scene.objects if o.name.startswith('F_Produce_')]
_produce_footprints=[]
for _fruit in _counter_produce:
    _parts=_fruit.name.split('_');_counter=bpy.data.objects['Counter_'+_parts[2]+'_'+_parts[3]]
    _produce_footprints.append(fit_footprint_on_box_top(_fruit,_counter))
_produce_contacts=settle_on_supports(_counter_produce,
    [o for o in bpy.context.scene.objects if o.name.startswith('Counter_')])
if any(r['status']!='SETTLED' for r in _produce_contacts):
    raise RuntimeError('Counter produce has unresolved supports: '+repr([r for r in _produce_contacts if r['status']!='SETTLED']))

# GRAVITY: fabric canopies/awnings sag between supports (catenary-like) with a slight weave wave
from procassets.fabric import sagged_copy
for _o in list(bpy.data.objects):
    if _o.type=='MESH' and _o.name.startswith(('StallCanopy','HeroAwning')) and 'Rail' not in _o.name and _o.dimensions.z<0.12:
        sagged_copy(_o)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'surf3.py')).read())
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'surf4.py')).read())
from procassets.furniture import *
replace_furniture()
bm=bpy.data.materials.get('HeroBrass')
if bm and bm.use_nodes:
    p=bsdf(bm)
    try: p.inputs['Anisotropic'].default_value=0.5
    except Exception: pass
from procassets.vegetation import *
replace_trees()
from procassets.figures import *
populate('HERO_F3',seed=7,dscale=1.0)  # one frozen scene for all submission cameras

# VIBE: warm pendant lamps hung from the vault roof along the market aisle, with real lights; street trees on the plaza edge
from procassets import props as _props
_dg=bpy.context.evaluated_depsgraph_get()
_shade=bpy.data.materials.new('LampShade'); _shade.use_nodes=True; _sp=_shade.node_tree.nodes['Principled BSDF']; _sp.inputs['Base Color'].default_value=(0.05,0.045,0.04,1); _sp.inputs['Metallic'].default_value=0.8; _sp.inputs['Roughness'].default_value=0.35
_cord=bpy.data.materials.new('LampCord'); _cord.use_nodes=True; _cord.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.02,0.02,0.02,1)
_bulb=bpy.data.materials.new('LampBulb'); _bulb.use_nodes=True; _bp=_bulb.node_tree.nodes['Principled BSDF']; _bp.inputs['Base Color'].default_value=(1,0.8,0.5,1); _bp.inputs['Emission Color'].default_value=(1.0,0.72,0.42,1); _bp.inputs['Emission Strength'].default_value=30.0
_nl=0
for _i in range(8):
    for _h in (0.0,1.1):
        _x=-59.5+2.2*_i+_h*0.7; _y=10.7+2.2*_i+_h*0.7
        _hit,_loc,_n,_idx,_ob,_mw=sc.ray_cast(_dg,Vector((_x,_y,2.2)),Vector((0,0,1)),distance=9)
        if not _hit or _n.z>-0.3: continue
        _drop=min(1.1,max(0.6,_loc.z-2.7))
        _o=bpy.data.objects.new(f'PendantLamp_{_nl}',bpy.data.meshes.new(f'PendantLamp_{_nl}')); _bm=_props.pendant_lamp(drop=_drop,d=0.36); _bm.to_mesh(_o.data); _bm.free()
        for _m in (_shade,_cord,_bulb): _o.data.materials.append(_m)
        _o.location=(_x,_y,_loc.z-0.005); sc.collection.objects.link(_o)
        _ld=bpy.data.lights.new(f'PendantLight_{_nl}','POINT'); _ld.energy=90.0; _ld.color=(1.0,0.72,0.42); _ld.shadow_soft_size=0.05
        _lo=bpy.data.objects.new(f'PendantLight_{_nl}',_ld); _lo.location=(_x,_y,_loc.z-_drop-0.03); sc.collection.objects.link(_lo); _nl+=1
print('PENDANTS',_nl)
# SURROUNDINGS: plane trees along the plaza edge for wide/aerial views (the hero keeps its designed composition)
if CAM!='HERO_F3':
    from procassets.vegetation import platane as _platane
    _pl=bpy.data.objects.get('Plaza'); _c=_pl.matrix_world.translation; _hx=_pl.dimensions.x/2-5.0; _hy=_pl.dimensions.y/2-5.0; _nt=0
    _edge=[]
    for _k in range(0,int(2*_hx),16): _edge+= [(_c.x-_hx+_k,_c.y-_hy),(_c.x-_hx+_k,_c.y+_hy)]
    for _k in range(16,int(2*_hy)-8,16): _edge+= [(_c.x-_hx,_c.y-_hy+_k),(_c.x+_hx,_c.y-_hy+_k)]
    for _x,_y in _edge:
        if abs((_y-_x)-70.2)<10: continue                      # keep the market strip clear
        _hit,_loc,_n,_i,_ob,_mw=sc.ray_cast(_dg,Vector((_x,_y,40)),Vector((0,0,-1)),distance=60)
        if not _hit or _ob.name not in ('Plaza','Street_Base') or _n.z<0.9: continue
        if any(sc.ray_cast(_dg,Vector((_x,_y,1.0)),Vector((math.cos(a_),math.sin(a_),0)),distance=3.0)[0] for a_ in (0,1.57,3.14,4.71)): continue
        _platane(f'StreetPlane_{_nt}',(_x,_y,_loc.z),seed=300+_nt*13,height=8.0+(_nt%4)*0.8,leaves=2600); _nt+=1
    print('STREET TREES',_nt)

# Pixel-reviewed refinement uses the same scene for all cameras.
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from refine_scene import refine as _refine
_refinement=_refine()

# ---------- sky, exposure ----------
w=sc.world or bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True; wt=w.node_tree; wt.nodes.clear()
sky=wt.nodes.new('ShaderNodeTexSky')
for t in ('MULTIPLE_SCATTERING','NISHITA'):
    try: sky.sky_type=t; break
    except Exception: pass
sky.sun_disc=False; sky.sun_elevation=alt; sky.sun_rotation=az
bg=wt.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value=0.4; wo=wt.nodes.new('ShaderNodeOutputWorld')
hz=bpy.data.meshes.new('HazeMesh'); import bmesh as _bm
_b=_bm.new(); _bm.ops.create_cube(_b,size=1.0); _b.to_mesh(hz); _b.free()
hzo=bpy.data.objects.new('HAZE',hz); hzo.scale=(900,900,160); hzo.location=(30,110,70); sc.collection.objects.link(hzo)
hm=bpy.data.materials.new('HazeMat'); hm.use_nodes=True; hn=hm.node_tree; hn.nodes.clear()
hs=hn.nodes.new('ShaderNodeVolumeScatter'); hs.inputs['Density'].default_value=0.00018+0.00025*warm; hs.inputs['Anisotropy'].default_value=0.35; hs.inputs['Color'].default_value=(0.85,0.9,1.0,1)
ho=hn.nodes.new('ShaderNodeOutputMaterial'); hn.links.new(hs.outputs[0],ho.inputs['Volume']); hz.materials.append(hm)
hzo.visible_shadow=False
tcg=wt.nodes.new('ShaderNodeTexCoord'); mpg=wt.nodes.new('ShaderNodeMapping'); mpg.inputs['Scale'].default_value=(2.6,2.6,7.0); wt.links.new(tcg.outputs['Generated'],mpg.inputs['Vector'])
cn=wt.nodes.new('ShaderNodeTexNoise'); cn.inputs['Scale'].default_value=1.2; cn.inputs['Detail'].default_value=9; cn.inputs['Roughness'].default_value=0.62; wt.links.new(mpg.outputs['Vector'],cn.inputs['Vector'])
cr=wt.nodes.new('ShaderNodeMapRange'); cr.inputs['From Min'].default_value=0.46; cr.inputs['From Max'].default_value=0.70; wt.links.new(cn.outputs['Fac'],cr.inputs['Value'])
sepz=wt.nodes.new('ShaderNodeSeparateXYZ'); wt.links.new(tcg.outputs['Generated'],sepz.inputs['Vector'])
hz_=wt.nodes.new('ShaderNodeMapRange'); hz_.inputs['From Min'].default_value=0.05; hz_.inputs['From Max'].default_value=0.35; wt.links.new(sepz.outputs['Z'],hz_.inputs['Value'])
cm_=wt.nodes.new('ShaderNodeMath'); cm_.operation='MULTIPLY'; wt.links.new(cr.outputs['Result'],cm_.inputs[0]); wt.links.new(hz_.outputs['Result'],cm_.inputs[1])
cmix=wt.nodes.new('ShaderNodeMix'); cmix.data_type='RGBA'; wt.links.new(cm_.outputs['Value'],cmix.inputs[0]); wt.links.new(sky.outputs[0],cmix.inputs[6]); cmix.inputs[7].default_value=(1.9,1.55,1.2,1)
wt.links.new(sky.outputs[0],bg.inputs['Color']); wt.links.new(bg.outputs[0],wo.inputs['Surface'])
sc.view_settings.view_transform='AgX'; sc.view_settings.exposure=-0.8
# ---------- camera/render ----------
sc.camera=bpy.data.objects[CAM]
sc.camera.data.dof.use_dof=(CAM=='HERO_F3')
sc.camera.data.dof.focus_distance=18.0; sc.camera.data.dof.aperture_fstop=8.0
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=S; sc.cycles.use_denoising=True; sc.cycles.max_bounces=6
_devices=[]
if _args.device=='METAL':
    _pref=bpy.context.preferences.addons['cycles'].preferences
    _pref.compute_device_type='METAL'; _pref.get_devices()
    for _dev in _pref.devices:
        _dev.use=_dev.type=='METAL'
        if _dev.use:_devices.append(_dev.name)
    if _devices:sc.cycles.device='GPU'
sc.cycles.use_adaptive_sampling=True;sc.cycles.adaptive_threshold=.025;sc.cycles.use_light_tree=True
sc.render.resolution_x=W; sc.render.resolution_y=H; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.filepath=OUT
sc.render.image_settings.color_depth='16'
os.makedirs(os.path.dirname(os.path.abspath(OUT)),exist_ok=True)
_after=_snapshots()
_changed=[n for n,h in _source_objects.items() if _after.get(n)!=h]
if _changed:raise RuntimeError('Source geometry/transforms changed: '+repr(_changed))
if _args.save_blend:bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(_args.save_blend))
if _args.prepare_only:
    _prepared={'status':'DERIVED_SCENE_PREPARED_NO_RENDER','source_sha256':_input_sha,'source_unchanged':hashlib.sha256(open(_input_path,'rb').read()).hexdigest()==_input_sha,'candidate_sha256':hashlib.sha256(open(_args.save_blend,'rb').read()).hexdigest(),'municipal_faces':len(_municipal.data.polygons),'choreography_camera':'HERO_F3','choreography_seed':7,'hour_CEST':HOUR,'date':'2026-09-21','solar_altitude_deg':math.degrees(alt),'solar_azimuth_deg':math.degrees(az)%360,'invented_cathedral_shader':ENRICH_SAGRADA,'render_invocations':0,'seconds_build':round(time.perf_counter()-_started,2)}
    _prepared['source_geometry_transform_signatures_preserved']=len(_source_objects)
    _prepared['refinement']=_refinement
    _prepared['produce_contacts']=_produce_contacts
    _prepared['produce_footprints']=_produce_footprints
    open(_args.save_blend+'.receipt.json','w').write(json.dumps(_prepared,indent=2)+'\n')
    raise SystemExit(0)
bpy.ops.render.render(write_still=True)
_receipt={'status':'DERIVED_VISUAL_CANDIDATE_NOT_COMPETITION_APPROVED','upstream_renderer':'e783204','source':_input_path,'source_sha256':_input_sha,'source_unchanged':hashlib.sha256(open(_input_path,'rb').read()).hexdigest()==_input_sha,'camera':CAM,'hour_CEST':HOUR,'date':'2026-09-21','latitude':LAT,'longitude':LON,'solar_altitude_deg':math.degrees(alt),'solar_azimuth_deg':math.degrees(az)%360,'width':W,'height':H,'samples':S,'device':sc.cycles.device,'devices':_devices,'invented_cathedral_shader':ENRICH_SAGRADA,'illustrative_figures':True,'weather':'design-development haze; no observed-weather claim','postprocess':'none','seconds_build_and_render':round(time.perf_counter()-_started,2),'render_sha256':hashlib.sha256(open(OUT,'rb').read()).hexdigest()}
open(OUT+'.receipt.json','w').write(json.dumps(_receipt,indent=2)+'\n')
