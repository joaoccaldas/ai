"""furniture.py - procedural generators (no external assets). See ../README.md"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise as _mn
from .market import to_obj
def _cyl(bm,p0,p1,r0,r1,n=10):
    t=p1-p0; a=Vector((0,0,1)) if abs(t.normalized().z)<0.9 else Vector((1,0,0)); u=t.cross(a).normalized(); v=t.cross(u).normalized()
    ring=lambda c,r:[bm.verts.new(c+(u*math.cos(2*math.pi*i/n)+v*math.sin(2*math.pi*i/n))*r) for i in range(n)]
    A=ring(p0,r0); B=ring(p1,r1)
    for i in range(n): bm.faces.new((A[i],A[(i+1)%n],B[(i+1)%n],B[i]))
    bm.faces.new(A); bm.faces.new(B[::-1])
def _box(bm,c,s,rotz=0.0):
    g=bmesh.ops.create_cube(bm,size=1.0)
    for v in g['verts']:
        q=Vector((v.co.x*s[0],v.co.y*s[1],v.co.z*s[2])); q=Matrix.Rotation(rotz,3,'Z')@q; v.co=q+c
def chair_parts(bm_wood,bm_iron,rotz=0.0):
    R=Matrix.Rotation(rotz,3,'Z')
    legs=[(0.19,0.18),(-0.19,0.18),(0.19,-0.18),(-0.19,-0.18)]
    for lx,ly in legs:
        top=R@Vector((lx*0.92,ly*0.92,0.44)); bot=R@Vector((lx*1.18,ly*1.18,0.0)); _cyl(bm_iron,bot,top,0.011,0.014,8)
    for sx_ in (1,-1):                                   # back uprights
        p0=R@Vector((sx_*0.17,-0.17,0.44)); p1=R@Vector((sx_*0.17,-0.21,0.88)); _cyl(bm_iron,p0,p1,0.012,0.012,8)
    _box(bm_wood,R@Vector((0,0,0.455)),(0.42,0.40,0.03),rotz)                       # seat
    for k,z in enumerate((0.62,0.76,0.86)):                                           # back slats
        _box(bm_wood,R@Vector((0,-0.2-0.01*k,z)),(0.36,0.018,0.06 if k<2 else 0.045),rotz)
    for z in (0.28,):                                                                 # rung
        _box(bm_iron,R@Vector((0,0,z)),(0.34,0.012,0.012),rotz)
def cafe_set_objs(origin_mw,wood,iron,name):
    bw=bmesh.new(); bi=bmesh.new()
    _cyl(bi,Vector((0,0,0.015)),Vector((0,0,0.70)),0.028,0.022,10); _cyl(bi,Vector((0,0,0)),Vector((0,0,0.02)),0.22,0.2,24)   # pedestal + base
    _cyl(bw,Vector((0,0,0.705)),Vector((0,0,0.73)),0.36,0.36,32)                                                           # round top
    for k in range(3):
        a=k*2*math.pi/3+0.4; c=Vector((math.cos(a)*0.62,math.sin(a)*0.62,0)); 
        b1=bmesh.new(); b2=bmesh.new(); chair_parts(b1,b2,a+math.pi/2*0+math.pi)   # face the table
        for src,dst in ((b1,bw),(b2,bi)):
            vm={}
            for v in src.verts: vm[v]=dst.verts.new(v.co+c)
            for f in src.faces: dst.faces.new([vm[v] for v in f.verts])
            src.free()
    ow=to_obj(bw,name+'_wood',[wood],Vector((0,0,0)),(0,0,0),(1,1,1)); oi=to_obj(bi,name+'_iron',[iron],Vector((0,0,0)),(0,0,0),(1,1,1))
    ow.matrix_world=origin_mw.copy(); oi.matrix_world=origin_mw.copy()
def bench_objs(origin_mw,wood,iron,name):
    bw=bmesh.new(); bi=bmesh.new(); L=1.8
    for k in range(5): _box(bw,Vector((0,-0.20+k*0.095,0.45)),(L,0.085,0.035))
    for k in range(3): _box(bw,Vector((0,0.28,0.62+k*0.11)),(L,0.03,0.09))
    for sx_ in (L/2-0.1,-L/2+0.1):
        for yy in (-0.2,0.2): _cyl(bi,Vector((sx_,yy,0.0)),Vector((sx_,yy*0.9,0.43)),0.022,0.018,8)       # front/back legs
        _box(bi,Vector((sx_,0,0.43)),(0.04,0.5,0.03)); _cyl(bi,Vector((sx_,0.26,0.43)),Vector((sx_,0.30,0.95)),0.02,0.02,8)
        _cyl(bi,Vector((sx_,-0.22,0.62)),Vector((sx_,0.24,0.66)),0.016,0.016,8)                             # arm rail
    ow=to_obj(bw,name+'_wood',[wood],Vector((0,0,0)),(0,0,0),(1,1,1)); oi=to_obj(bi,name+'_iron',[iron],Vector((0,0,0)),(0,0,0),(1,1,1))
    ow.matrix_world=origin_mw.copy(); oi.matrix_world=origin_mw.copy()
def lamp_obj(origin_mw,iron,name):
    bi=bmesh.new(); _cyl(bi,Vector((0,0,0)),Vector((0,0,0.35)),0.12,0.07,12); _cyl(bi,Vector((0,0,0.35)),Vector((0,0,3.8)),0.065,0.04,12)
    _cyl(bi,Vector((0,0,3.8)),Vector((0.5,0,3.95)),0.025,0.02,8); _cyl(bi,Vector((0.5,0,3.7)),Vector((0.5,0,3.95)),0.14,0.1,12); _cyl(bi,Vector((0.5,0,3.95)),Vector((0.5,0,4.05)),0.1,0.02,12)
    ob=to_obj(bi,name,[iron],Vector((0,0,0)),(0,0,0),(1,1,1)); ob.matrix_world=origin_mw.copy()
def replace_furniture():
    iron=bpy.data.materials.get('CastIron')
    if not iron:
        iron=bpy.data.materials.new('CastIron'); iron.use_nodes=True; p=iron.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value=(0.035,0.04,0.038,1); p.inputs['Roughness'].default_value=0.45; p.inputs['Metallic'].default_value=0.8
    wood=bpy.data.materials.get('Timber'); n=0
    for e in list(bpy.data.objects):
        if e.type!='EMPTY' or not e.name.startswith('CAT_'): continue
        ch=[c for c in e.children if c.type=='MESH']
        if not ch: continue
        mw=ch[0].matrix_world.copy(); mw.translation=Vector((e.matrix_world.translation.x,e.matrix_world.translation.y,0.0)); mw=Matrix.Translation(mw.translation)@Matrix.Rotation(e.matrix_world.to_euler().z,4,'Z')
        if e.name=='CAT_CafeTableChairs': cafe_set_objs(mw,wood,iron,'CafeSet'); [setattr(c,'hide_render',True) for c in ch]; n+=1
        elif e.name=='CAT_PlazaBench': bench_objs(mw,wood,iron,'Bench'); [setattr(c,'hide_render',True) for c in ch]; n+=1
        elif e.name=='CAT_StreetLamp': lamp_obj(mw,iron,'Lamp'); [setattr(c,'hide_render',True) for c in ch]; n+=1

    for o in list(bpy.data.objects):
        if o.type!='MESH' or o.hide_render: continue
        e_=o.matrix_world.to_euler(); mw=Matrix.Translation(Vector((o.matrix_world.translation.x,o.matrix_world.translation.y,0.0)))@Matrix.Rotation(e_.z,4,'Z')
        if o.name.startswith('RT_Cafe'): cafe_set_objs(mw,wood,iron,'CafeSet_'+o.name); o.hide_render=True; n+=1
        elif o.name.startswith('RT_Bench'): bench_objs(mw,wood,iron,'Bench_'+o.name); o.hide_render=True; n+=1
        elif o.name.startswith(('RT_Lamp','RT_Street')): lamp_obj(mw,iron,'Lamp_'+o.name); o.hide_render=True; n+=1
    print('FURNITURE replaced',n)
