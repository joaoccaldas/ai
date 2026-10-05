"""market.py - procedural generators (no external assets). See ../README.md"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise as _mn
import bmesh, random, math
from mathutils import Vector, Matrix, noise as _mn
def _sphere(bm,seg=26,rings=16):
    return bmesh.ops.create_uvsphere(bm,u_segments=seg,v_segments=rings,radius=0.5)['verts']
def fruit_mesh(kind,seed):
    r=random.Random(seed); bm=bmesh.new(); vs=_sphere(bm)
    sx,sy,sz={'orange':(1,1,0.94),'lemon':(0.82,0.82,1.18),'apple':(1,1,0.88),'tomato':(1.05,1.05,0.8),'aubergine':(0.48,0.48,1.7),'pear':(0.8,0.8,1.3)}[kind]
    for v in vs:
        c=v.co.copy(); n=c.normalized()
        d=_mn.noise(c*3.2+Vector((seed,seed*0.7,0)))*0.035+_mn.noise(c*11+Vector((seed,0,seed)))*0.008
        c=c+n*d
        z=c.z
        if kind in('apple','tomato'):                       # top/bottom dimples
            for sgn in (1,-1):
                if z*sgn>0.32*(1 if kind=='apple' else 0.9): c.z-=sgn*(z*sgn-0.32)*0.55*(1 if kind=='apple' else 0.8)
        if kind=='tomato':
            a=math.atan2(c.y,c.x); c*= (1+0.025*math.sin(5*a))
        if kind=='lemon' and abs(z)>0.4: c.x*=0.7+0.3*(1-(abs(z)-0.4)/0.1); c.y*=0.7+0.3*(1-(abs(z)-0.4)/0.1)
        if kind in('aubergine','pear') and z>0: k=1-0.45*(z/0.5); c.x*=k; c.y*=k
        v.co=Vector((c.x*sx,c.y*sy,c.z*sz))
    for f in bm.faces: f.material_index=0; f.smooth=True
    top=0.5*sz*(0.9 if kind in('apple','tomato') else 1.0)
    if kind in('apple','tomato','aubergine','pear','orange','lemon'):
        g=bmesh.ops.create_cone(bm,cap_ends=True,segments=7,radius1=0.022,radius2=0.014,depth=0.11 if kind!='orange' else 0.03)
        for v in g['verts']: v.co=v.co+Vector((r.uniform(-.01,.01),0,top-0.01))
        for f in {f for v in g['verts'] for f in v.link_faces}: f.material_index=1
        if kind in('tomato','aubergine'):
            for k in range(5):
                a=k*2*math.pi/5; g2=bmesh.ops.create_cone(bm,cap_ends=True,segments=4,radius1=0.012,radius2=0.002,depth=0.13)
                for v in g2['verts']:
                    v.co=Matrix.Rotation(math.radians(80),3,'Y')@v.co; v.co=Matrix.Rotation(a,3,'Z')@v.co+Vector((0,0,top-0.015))
                for f in {f for v in g2['verts'] for f in v.link_faces}: f.material_index=1
    return bm
def to_obj(bm,name,mats,loc,rot,scale):
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o=bpy.data.objects.new(name,me); o.location=loc; o.rotation_euler=rot; o.scale=scale; bpy.context.scene.collection.objects.link(o); return o
def crate_bm(w,d,h,seed):
    r=random.Random(seed); bm=bmesh.new()
    def box(cx,cy,cz,sx,sy,sz):
        g=bmesh.ops.create_cube(bm,size=1.0)
        for v in g['verts']: v.co=Vector((v.co.x*sx+cx,v.co.y*sy+cy,v.co.z*sz+cz))
        return g['verts']
    t=0.012; gap=0.014; ph=(h-2*gap)/3
    for k in range(3):
        z=-h/2+ph/2+k*(ph+gap)
        for (cx,cy,sx,sy) in ((0,d/2-t/2,w,t),(0,-d/2+t/2,w,t),(w/2-t/2,0,t,d-2*t),(-w/2+t/2,0,t,d-2*t)):
            box(cx,cy,z+r.uniform(-.002,.002),sx,sy,ph)
    for sx_ in (1,-1):
        for sy_ in (1,-1): box(sx_*(w/2-0.02),sy_*(d/2-0.02),0,0.04,0.04,h)
    for k in range(4): box(0,-d/2+0.06+k*(d-0.12)/3,-h/2+0.006,w-0.04,0.07,0.012)
    nails=[]
    for k in range(3):
        z=-h/2+ph/2+k*(ph+gap)
        for sx_ in (1,-1):
            g=bmesh.ops.create_cone(bm,cap_ends=True,segments=6,radius1=0.0045,radius2=0.0045,depth=0.004)
            for v in g['verts']: v.co=Matrix.Rotation(math.pi/2,3,'X')@v.co+Vector((sx_*(w/2-0.02),d/2+0.002,z))
    for f in bm.faces: f.material_index=0
    return bm
def basket_bm(rad,h):
    bm=bmesh.new(); n=28
    def ringp(z,rr): return [Vector((math.cos(2*math.pi*i/n)*rr,math.sin(2*math.pi*i/n)*rr,z)) for i in range(n)]
    zs=[-h/2+h*k/6 for k in range(7)]; rs=[rad*(0.78+0.22*k/6) for k in range(7)]
    for z,rr in zip(zs,rs):
        a=ringp(z,rr); b=ringp(z+0.012,rr+0.006)
        va=[bm.verts.new(v) for v in a]; vb=[bm.verts.new(v) for v in b]
        for i in range(n): bm.faces.new((va[i],va[(i+1)%n],vb[(i+1)%n],vb[i]))
    for i in range(n):                                                          # ribs
        a=2*math.pi*i/n; p0=Vector((math.cos(a)*rs[0],math.sin(a)*rs[0],zs[0])); p1=Vector((math.cos(a)*(rs[-1]+0.008),math.sin(a)*(rs[-1]+0.008),zs[-1]+0.02))
        t=p1-p0; u=Vector((-math.sin(a),math.cos(a),0)); 
        A=[bm.verts.new(p0+u*s_*0.008) for s_ in (-1,1)]; B=[bm.verts.new(p1+u*s_*0.008) for s_ in (-1,1)]
        bm.faces.new((A[0],A[1],B[1],B[0]))
    for f in bm.faces: f.material_index=0; f.smooth=False
    return bm
def bread_bm(L,W,H,seed):
    bm=bmesh.new(); vs=_sphere(bm,28,18)
    for v in vs:
        c=v.co.copy(); x=c.x*L*2; y=c.y*W*2; z=c.z*H*2
        if z<0: z*=0.35
        if z>0:
            cut=math.sin((x/L)*9+0.9)*0.5+0.5
            z-=0.012*math.exp(-((cut-0.5)*10)**2)
        z+=_mn.noise(c*5+Vector((seed,0,0)))*0.004
        v.co=Vector((x,y,z))
    for f in bm.faces: f.material_index=0; f.smooth=True
    return bm
def replace_market_assets():
    kmap={'ProduceOrange':'orange','ProduceRed':'tomato','ProduceApple':'apple','ProduceYellow':'lemon','ProduceLemon':'lemon','ProduceAubergine':'aubergine','ProduceGreen':'pear','ProduceGreen2':'pear'}
    herb=bpy.data.materials.get('Herb'); cache={}; rr=random.Random(11); nf=nc=nb=nbr=0
    for o in list(bpy.data.objects):
        if o.type!='MESH' or o.hide_render: continue
        nm=o.name; mat=o.material_slots[0].material if o.material_slots and o.material_slots[0].material else None
        if nm.startswith(('Produce_','BasketProduce_','HeroProduce_')) and mat and mat.name in kmap:
            k=kmap[mat.name]; v=rr.randint(0,3)
            if (k,v) not in cache: cache[(k,v)]=bpy.data.meshes.new(f'fruit_{k}_{v}'); b=fruit_mesh(k,v*13+7); b.to_mesh(cache[(k,v)]); b.free(); [cache[(k,v)].materials.append(m) for m in (mat,herb)]
            d=max(o.dimensions)*(1.0 if k not in('aubergine','pear','lemon') else 0.8)
            ob=bpy.data.objects.new('F_'+nm,cache[(k,v)]); ob.location=o.matrix_world.translation; ob.rotation_euler=(rr.uniform(-.4,.4),rr.uniform(-.4,.4),rr.uniform(0,6.28)); ob.scale=(d,d,d); bpy.context.scene.collection.objects.link(ob); o.hide_render=True; nf+=1
        elif nm.startswith(('Crate_','HeroCrate_')) and mat:
            w,dd,h=o.dimensions.x,o.dimensions.y,o.dimensions.z
            ob=to_obj(crate_bm(w,dd,h,rr.randint(0,99)),'C_'+nm,[mat],o.matrix_world.translation,o.rotation_euler,(1,1,1)); o.hide_render=True; nc+=1
        elif nm.startswith('Basket_') and mat and not nm.startswith('BasketProduce'):
            ob=to_obj(basket_bm(max(o.dimensions.x,o.dimensions.y)/2,o.dimensions.z),'B_'+nm,[mat],o.matrix_world.translation,o.rotation_euler,(1,1,1)); o.hide_render=True; nbr+=1
        elif nm.startswith('HeroBread_') and mat:
            ob=to_obj(bread_bm(o.dimensions.x/2,o.dimensions.y/2,o.dimensions.z/2,rr.randint(0,99)),'Br_'+nm,[mat],o.matrix_world.translation,o.rotation_euler,(1,1,1)); o.hide_render=True; nb+=1
    print('ASSETS fruit',nf,'crates',nc,'baskets',nbr,'bread',nb)

def stall_frame_bm(w,d,h):
    bm=bmesh.new()
    def box(cx,cy,cz,sx,sy,sz):
        g=bmesh.ops.create_cube(bm,size=1.0)
        for v in g['verts']: v.co=Vector((v.co.x*sx+cx,v.co.y*sy+cy,v.co.z*sz+cz))
    pw=0.06
    for sx_ in (1,-1):
        for sy_ in (1,-1):
            box(sx_*(w/2-pw/2),sy_*(d/2-pw/2),0.225,pw,pw,h+0.45)                 # posts, carry the canopy
            box(sx_*(w/2-pw/2),sy_*(d/2-pw/2),-h/2+0.01,pw+0.04,pw+0.04,0.02)   # foot plates
    for z in (h/2+0.41,h/2-0.03,0.0,-h/2+0.35):
        for sy_ in (1,-1): box(0,sy_*(d/2-pw/2),z,w-2*pw,0.04,0.04)            # long rails
        for sx_ in (1,-1): box(sx_*(w/2-pw/2),0,z,0.04,d-2*pw,0.04)            # cross rails
    box(0,0,-h/2+0.36,w-0.1,d-0.1,0.018)                                         # lower shelf
    for sx_ in (1,-1):
        for sy_ in (1,-1):
            for z in (h/2-0.03,0.0):
                g=bmesh.ops.create_cone(bm,cap_ends=True,segments=6,radius1=0.014,radius2=0.014,depth=0.01)
                for v in g['verts']: v.co=Matrix.Rotation(math.pi/2,3,'Y')@v.co+Vector((sx_*(w/2+0.001),sy_*(d/2-pw/2),z))   # bolt heads
    for f in bm.faces: f.material_index=0
    return bm
def herb_bm(seed,n=70):
    r=random.Random(seed); bm=bmesh.new()
    for i in range(n):
        a=r.uniform(0,6.28); L=r.uniform(0.12,0.24); tilt=r.uniform(0.15,0.75); wd=r.uniform(0.012,0.022)
        base=Vector((math.cos(a)*r.uniform(0,0.03),math.sin(a)*r.uniform(0,0.03),0))
        pts=[]
        for k in range(5):
            t=k/4; up=L*t; out=L*tilt*t*t
            pts.append(base+Vector((math.cos(a)*out,math.sin(a)*out,up*(1-0.3*tilt))))
        side=Vector((-math.sin(a),math.cos(a),0))
        left=[bm.verts.new(p+side*wd*(1-k/4)*(0.4 if k==0 else 1)) for k,p in enumerate(pts)]
        right=[bm.verts.new(p-side*wd*(1-k/4)*(0.4 if k==0 else 1)) for k,p in enumerate(pts)]
        for k in range(4): bm.faces.new((left[k],left[k+1],right[k+1],right[k]))
    for f in bm.faces: f.material_index=0; f.smooth=True
    return bm
def hanger_bm(top_z,obj):
    bm=bmesh.new(); w=obj.dimensions.x
    for sx_ in (-1,1):
        x=sx_*(w/2-0.08); zb=obj.dimensions.z/2
        g=bmesh.ops.create_cone(bm,cap_ends=True,segments=6,radius1=0.006,radius2=0.006,depth=max(0.05,top_z-obj.matrix_world.translation.z-zb))
        L=max(0.05,top_z-obj.matrix_world.translation.z-zb)
        for v in g['verts']: v.co=v.co+Vector((x,0,zb+L/2))
    for f in bm.faces: f.material_index=0
    return bm
def replace_stalls_and_herbs():
    rr=random.Random(5); ns=nh=0
    herb=bpy.data.materials.get('Herb')
    for o in list(bpy.data.objects):
        if o.type!='MESH' or o.hide_render: continue
        mat=o.material_slots[0].material if o.material_slots and o.material_slots[0].material else None
        if o.name.startswith('Stall_') and not o.name.startswith('StallCanopy') and mat and abs(o.dimensions.z-2.1)<0.05:
            ob=to_obj(stall_frame_bm(o.dimensions.x,o.dimensions.y,o.dimensions.z),'SF_'+o.name,[mat],Vector((0,0,0)),(0,0,0),(1,1,1)); ob.matrix_world=o.matrix_world.copy(); o.hide_render=True; ns+=1
        elif o.name.startswith('HeroHerb_') and not o.name.startswith('HeroHerbPot') and herb:
            ob=to_obj(herb_bm(rr.randint(0,99)),'H_'+o.name,[herb],o.matrix_world.translation-Vector((0,0,o.dimensions.z/2)),(0,0,rr.uniform(0,6.28)),(1,1,1)); o.hide_render=True; nh+=1
    steel=bpy.data.materials.get('Steel'); nh2=0
    for o in list(bpy.data.objects):
        if o.type=='MESH' and not o.hide_render and o.name.startswith(('ChalkBoard_','SignBlade_','HeroBanner')) and steel:
            ob=to_obj(hanger_bm(2.52,o),'HG_'+o.name,[steel],Vector((0,0,0)),(0,0,0),(1,1,1)); ob.matrix_world=o.matrix_world.copy(); nh2+=1
    print('STALLS',ns,'HERBS',nh,'HANGERS',nh2)
