"""figures.py - procedural generators (no external assets). See ../README.md"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise as _mn
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
_mc={}
def pmat(name,col,rough=0.8,sheen=False,sub=0.0):
    if name in _mc: return _mc[name]
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; p=nt.nodes['Principled BSDF']
    tc=nt.nodes.new('ShaderNodeTexCoord'); no=nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value=140; no.inputs['Detail'].default_value=4
    nt.links.new(tc.outputs['Object'],no.inputs['Vector'])
    mx=nt.nodes.new('ShaderNodeMix'); mx.data_type='RGBA'; mx.blend_type='MULTIPLY'; mx.inputs[0].default_value=0.35
    mx.inputs[6].default_value=col+(1,); nt.links.new(no.outputs['Color'],mx.inputs[7])
    nt.links.new(mx.outputs[2],p.inputs['Base Color']); p.inputs['Roughness'].default_value=rough
    if sub>0:
        p.inputs['Subsurface Weight'].default_value=sub; p.inputs['Subsurface Radius'].default_value=(1.0,0.35,0.25)
    b=nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value=0.25; b.inputs['Distance'].default_value=0.004
    nt.links.new(no.outputs['Fac'],b.inputs['Height']); nt.links.new(b.outputs['Normal'],p.inputs['Normal'])
    _mc[name]=m; return m
SKINS=[(0.55,0.36,0.27),(0.42,0.27,0.19),(0.70,0.50,0.38),(0.30,0.19,0.13)]
HAIR=[(0.03,0.025,0.02),(0.12,0.08,0.05),(0.55,0.5,0.45),(0.2,0.12,0.06)]
TOPS=[(0.05,0.11,0.2),(0.55,0.12,0.08),(0.72,0.66,0.52),(0.15,0.3,0.2),(0.8,0.78,0.72),(0.35,0.15,0.1),(0.12,0.12,0.14),(0.65,0.45,0.15)]
BOTS=[(0.06,0.09,0.17),(0.12,0.12,0.13),(0.45,0.38,0.28),(0.2,0.16,0.12),(0.62,0.58,0.5)]
def _ring(c,t,r,n=8):
    t=t.normalized(); a=Vector((0,0,1)) if abs(t.z)<0.9 else Vector((1,0,0)); u=t.cross(a).normalized(); v=t.cross(u).normalized()
    return [c+(u*math.cos(2*math.pi*i/n)+v*math.sin(2*math.pi*i/n))*r for i in range(n)]
def seg(bm,p0,p1,r0,r1,mi,n=8):
    t=p1-p0; A=[bm.verts.new(v) for v in _ring(p0,t,r0,n)]; B=[bm.verts.new(v) for v in _ring(p1,t,r1,n)]
    for i in range(n):
        f=bm.faces.new((A[i],A[(i+1)%n],B[(i+1)%n],B[i])); f.material_index=mi
    for R in (A,B[::-1]):
        f=bm.faces.new(R); f.material_index=mi
def ball(bm,c,r,mi,sx=1,sy=1,sz=1):
    g=bmesh.ops.create_uvsphere(bm,u_segments=10,v_segments=7,radius=r)
    vs=g['verts']
    for v in vs: v.co=Vector((v.co.x*sx,v.co.y*sy,v.co.z*sz))+c
    for f in {f for v in vs for f in v.link_faces}: f.material_index=mi
    return vs
def person(name,x,y,z,yaw,h=1.72,seed=0,pose='walk',child=False,carry=False):
    r=random.Random(seed); s=h/1.75; bm=bmesh.new()
    mats=[pmat(f's{seed}',r.choice(SKINS),0.55,sub=0.15),pmat(f'h{seed}',r.choice(HAIR),0.5),pmat(f't{seed}',r.choice(TOPS),0.85),pmat(f'b{seed}',r.choice(BOTS),0.8),pmat(f'sh{seed}',(0.05,0.045,0.04),0.6),pmat('bread',(0.55,0.32,0.12),0.75)]
    fem=(r.random()<0.45) and not child; skirt=fem and r.random()<0.5; ph=r.uniform(0,6.28) if pose=='walk' else 0.0; st=0.26*s if pose=='walk' else 0.02*s
    sw=math.sin(ph)
    hipz=0.93*s; sh_z=1.43*s; hw=(0.115 if fem else 0.105)*s; shw=(0.2 if fem else 0.235)*s
    def leg(side,k):
        hip=Vector((side*hw,0,hipz)); fx=k*st; ank=Vector((side*hw*1.1,fx,0.07*s)); kn=Vector((side*hw*1.05,fx*0.5+0.05*s*(1 if k>0 else 0.3),0.5*s))
        seg(bm,hip,kn,0.100*s,0.070*s,3); seg(bm,kn,ank,0.070*s,0.047*s,3)
        seg(bm,ank+Vector((0,-0.03*s,0)),ank+Vector((0,0.17*s,-0.04*s)),0.045*s,0.04*s,4)
    leg(-1,sw); leg(1,-sw)
    if skirt:
        seg(bm,Vector((0,0,hipz+0.05*s)),Vector((0,0,0.52*s)),0.17*s,0.27*s,2)
    seg(bm,Vector((0,0,hipz-0.03*s)),Vector((0,0,sh_z-0.1*s)),0.19*s,0.205*s,2); seg(bm,Vector((0,0,sh_z-0.1*s)),Vector((0,0,sh_z+0.02*s)),0.205*s,0.15*s,2)
    def arm(side,k,up=False):
        sho=Vector((side*shw,0,sh_z)); 
        if up: el=Vector((side*0.24*s,0.16*s,1.42*s)); wr=Vector((side*0.1*s,0.3*s,1.6*s))
        elif carry and side>0: el=Vector((side*0.24*s,0.12*s,1.12*s)); wr=Vector((side*0.1*s,0.28*s,1.2*s))
        else: el=Vector((side*0.25*s,k*0.05*s,1.15*s)); wr=Vector((side*0.24*s,k*0.14*s,0.9*s))
        seg(bm,sho,el,0.066*s,0.052*s,2); seg(bm,el,wr,0.052*s,0.04*s,2 if r.random()<0.5 else 0); ball(bm,wr,0.04*s,0)
    if pose=='photo': arm(-1,0,True); arm(1,0,True)
    else: arm(-1,-sw); arm(1,sw)
    seg(bm,Vector((0,0,sh_z+0.02*s)),Vector((0,0.01*s,sh_z+0.12*s)),0.056*s,0.05*s,0)
    hc=Vector((0,0.015*s,sh_z+0.2*s)); ball(bm,hc,0.112*s*(1.3 if child else 1.0),0,0.92,1.05,1.12)
    ball(bm,hc+Vector((0,0.1*s,-0.01*s)),0.022*s,0,0.8,1.2,1.0)
    for sx_ in (-1,1): ball(bm,hc+Vector((sx_*0.105*s,0,0)),0.02*s,0,0.5,1,1.3)
    hv=ball(bm,hc+Vector((0,-0.012*s,0.02*s)),0.119*s,1,0.96,1.08,1.12)
    if fem and r.random()<0.65:
        seg(bm,hc+Vector((0,-0.03*s,0.05*s)),hc+Vector((0,-0.09*s,-0.2*s)),0.115*s,0.09*s,1)
    kill=[f for f in {f for v in hv for f in v.link_faces} if (f.calc_center_median().z<hc.z+0.01*s) or (f.calc_center_median().y>hc.y+0.03*s and f.calc_center_median().z<hc.z+0.1*s)]
    bmesh.ops.delete(bm,geom=kill,context='FACES')
    if carry: seg(bm,Vector((0.12*s,0.22*s,1.2*s)),Vector((0.1*s,0.5*s,1.28*s)),0.05*s,0.045*s,5)   # bread loaf
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    for pl in me.polygons: pl.use_smooth=True
    o=bpy.data.objects.new(name,me); o.location=(x,y,z); o.rotation_euler=(0,0,yaw); bpy.context.scene.collection.objects.link(o); return o
def populate(cam_name,seed=7,dscale=1.0):
    sc=bpy.context.scene; dg=bpy.context.evaluated_depsgraph_get(); cam=bpy.data.objects[cam_name]; cx,cy=cam.location.x,cam.location.y
    fw=cam.matrix_world.to_3x3()@Vector((0,0,-1)); f=Vector((fw.x,fw.y)).normalized(); lf=Vector((-f.y,f.x)); r=random.Random(seed)
    for o in list(bpy.data.objects):
        if o.type!='MESH' or o.name.startswith(('Plaza','Street')): continue
        if any(c.name=='LANDSCAPE' for c in o.users_collection) and any((m and m.name in {'Skin','SkinMed','SkinReal','PersonA','PersonB','PersonC','PersonD','Denim','Denim2','JacketSand','JacketBlue','JacketRed','ClothBlue','ClothOchre','ClothGreen','ClothSand','ClothWine','DogCoat'}) for m in [s.material for s in o.material_slots]):
            wp=o.matrix_world.translation; dx,dy=wp.x-cx,wp.y-cy; d=math.hypot(dx,dy)
            ang=math.degrees(math.atan2(dx*f.y-dy*f.x,dx*f.x+dy*f.y))
            if abs(ang)<42 and d<70*dscale: o.hide_render=True
    def ok(x,y):
        hit,loc,n,idx,ob,mw=sc.ray_cast(dg,Vector((x,y,6)),Vector((0,0,-1)),distance=8)
        if not hit or n.z<0.9 or loc.z>0.6 or any(c.name in ('CONTEXT','00_SITE_MUNICIPAL_IMPORTED') for c in ob.users_collection) or ob.name.startswith(('Crate','Basket','Counter')): return None
        for k in range(8):
            a=k*math.pi/4; h2=sc.ray_cast(dg,Vector((x,y,1.0)),Vector((math.cos(a),math.sin(a),0)),distance=0.6)[0]
            if h2: return None
        return loc.z
    placed=[]
    def spot(dmin,dmax,lat_max):
        for _ in range(300):
            dmin2,dmax2=max(dmin*dscale,(5.5 if dscale<1 else 0)),max(dmax*dscale,(14 if dscale<1 else 0)); d=r.uniform(dmin2,dmax2); lat=r.uniform(-lat_max,lat_max)*d/(12*dscale)
            x=cx+f.x*d+lf.x*lat; y=cy+f.y*d+lf.y*lat
            if abs(math.degrees(math.atan2(lat,d)))>29: continue
            if any(math.hypot(x-px,y-py)<3.6*max(dscale,0.6) for px,py in placed): continue
            z=ok(x,y)
            if z is not None: placed.append((x,y)); return x,y,z
        return None
    tgt=Vector((96.1,100.4))
    n=0
    def add(kind,**kw): 
        nonlocal n; n+=1; return person(f'Citizen_{n:02d}',**kw)
    for i in range(7):                           # crossing walkers
        p=spot(12,48,14)
        if p: add('w',x=p[0],y=p[1],z=p[2],yaw=math.atan2(f.y,f.x)+r.choice([-1,1])*r.uniform(1.0,2.1)-math.pi/2,seed=r.randint(1,999),h=r.uniform(1.58,1.86))
    for i in range(3):                           # parent + child
        p=spot(14,40,12)
        if p:
            yaw=r.uniform(0,6.28); a=add('p',x=p[0],y=p[1],z=p[2],yaw=yaw,seed=r.randint(1,999),h=1.72)
            cx2=p[0]+math.cos(yaw)*0.55; cy2=p[1]+math.sin(yaw)*0.55
            add('c',x=cx2,y=cy2,z=p[2],yaw=yaw,seed=r.randint(1,999),h=1.05); placed.append((cx2,cy2))
    p=spot(18,36,10)                             # photographer toward the Sagrada
    if p: add('ph',x=p[0],y=p[1],z=p[2],yaw=math.atan2(tgt.y-p[1],tgt.x-p[0])-math.pi/2,seed=r.randint(1,999),pose='photo')
    p=spot(16,34,10)                             # chatting trio
    if p:
        for k in range(3):
            a=k*2.094; x2=p[0]+math.cos(a)*0.8; y2=p[1]+math.sin(a)*0.8
            add('t',x=x2,y=y2,z=p[2],yaw=a+math.pi-math.pi/2,seed=r.randint(1,999),pose='stand',h=r.uniform(1.6,1.82)); placed.append((x2,y2))
    for i in range(3):                           # standing / carrying
        p=spot(12,40,12)
        if p: add('s',x=p[0],y=p[1],z=p[2],yaw=r.uniform(0,6.28),seed=r.randint(1,999),pose='stand',carry=(i==0))
    print('PEOPLE',n)
