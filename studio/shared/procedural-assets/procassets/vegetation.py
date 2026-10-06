"""vegetation.py - procedural generators (no external assets). See ../README.md"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise as _mn
import bpy, bmesh, math, random, mathutils
from mathutils import Vector, Matrix
def _ring(c,t,r,n=7,rot=0.0):
    t=t.normalized(); a=Vector((0,0,1)) if abs(t.z)<0.9 else Vector((1,0,0))
    u=t.cross(a).normalized(); v=t.cross(u).normalized()
    return [c+(u*math.cos(rot+2*math.pi*i/n)+v*math.sin(rot+2*math.pi*i/n))*r for i in range(n)]
def _bark_mat():
    m=bpy.data.materials.get('PlataneBark')
    if m: return m
    m=bpy.data.materials.new('PlataneBark'); m.use_nodes=True; nt=m.node_tree; p=nt.nodes['Principled BSDF']
    tc=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(1,1,0.55); nt.links.new(tc.outputs['Object'],mp.inputs['Vector'])
    vo=nt.nodes.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value=2.2; nt.links.new(mp.outputs['Vector'],vo.inputs['Vector'])  # camouflage plates ~45cm
    no=nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value=9; no.inputs['Detail'].default_value=8; nt.links.new(mp.outputs['Vector'],no.inputs['Vector'])
    ad=nt.nodes.new('ShaderNodeMath'); ad.operation='ADD'; nt.links.new(vo.outputs['Distance'],ad.inputs[0]); nt.links.new(no.outputs['Fac'],ad.inputs[1])
    r=nt.nodes.new('ShaderNodeValToRGB'); nt.links.new(ad.outputs['Value'],r.inputs['Fac'])
    r.color_ramp.elements[0].position=0.45; r.color_ramp.elements[0].color=(0.64,0.60,0.47,1)
    e=r.color_ramp.elements.new(0.85); e.color=(0.34,0.32,0.24,1)
    r.color_ramp.elements[2].position=1.1 if False else 0.99; r.color_ramp.elements[2].color=(0.16,0.13,0.10,1)
    nt.links.new(r.outputs['Color'],p.inputs['Base Color']); p.inputs['Roughness'].default_value=0.88
    b=nt.nodes.new('ShaderNodeBump'); b.inputs['Strength'].default_value=0.9; b.inputs['Distance'].default_value=0.02
    n2=nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value=60; n2.inputs['Detail'].default_value=6; nt.links.new(mp.outputs['Vector'],n2.inputs['Vector'])
    ad2=nt.nodes.new('ShaderNodeMath'); ad2.operation='ADD'; nt.links.new(n2.outputs['Fac'],ad2.inputs[0]); nt.links.new(vo.outputs['Distance'],ad2.inputs[1])
    nt.links.new(ad2.outputs['Value'],b.inputs['Height']); nt.links.new(b.outputs['Normal'],p.inputs['Normal'])
    return m
def _leaf_mat():
    m=bpy.data.materials.get('PlataneLeaf')
    if m: return m
    m=bpy.data.materials.new('PlataneLeaf'); m.use_nodes=True; nt=m.node_tree; p=nt.nodes['Principled BSDF']
    ca=nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name='Col'
    nt.links.new(ca.outputs['Color'],p.inputs['Base Color']); p.inputs['Roughness'].default_value=0.5
    tr=nt.nodes.new('ShaderNodeBsdfTranslucent'); nt.links.new(ca.outputs['Color'],tr.inputs['Color'])
    mx=nt.nodes.new('ShaderNodeMixShader'); mx.inputs[0].default_value=0.35
    out=nt.nodes['Material Output']; nt.links.new(p.outputs['BSDF'],mx.inputs[1]); nt.links.new(tr.outputs['BSDF'],mx.inputs[2]); nt.links.new(mx.outputs['Shader'],out.inputs['Surface'])
    return m
def platane(name,loc,seed,height=9.0,spread=5.2,leaves=9000):
    rnd=random.Random(seed); bm=bmesh.new(); lbm=bmesh.new(); tips=[]
    def branch(p,d,L,r0,depth):
        steps=max(3,int(L/0.9)); rings=[]; pos=p.copy(); dd=d.copy(); rot=rnd.random()
        for i in range(steps+1):
            f=i/steps; r=max(0.012,r0*(1-0.85*f))
            rings.append(_ring(pos,dd,r,7,rot))
            dd=(dd+Vector((rnd.uniform(-.18,.18),rnd.uniform(-.18,.18),rnd.uniform(-.04,.12)))*(1+depth*0.4)).normalized()
            pos=pos+dd*(L/steps)
        vs=[[bm.verts.new(v) for v in rg] for rg in rings]
        for i in range(len(vs)-1):
            for j in range(7): bm.faces.new((vs[i][j],vs[i][(j+1)%7],vs[i+1][(j+1)%7],vs[i+1][j]))
        end=pos
        if depth>=3 or L<1.1: tips.append((end,dd)); return
        nk=rnd.randint(2,3) if depth>0 else 4
        for k in range(nk):
            t=rnd.uniform(0.45,1.0); idx=int(t*steps); base=sum((v for v in rings[idx]),Vector())/7
            ang=rnd.uniform(0,6.283); sp=rnd.uniform(0.45,0.9)
            nd=(dd*0.5+Vector((math.cos(ang)*sp,math.sin(ang)*sp,rnd.uniform(0.1,0.55)))).normalized()
            branch(base,nd,L*rnd.uniform(0.55,0.72),r0*0.55*(1-0.5*t),depth+1)
        tips.append((end,dd))
    trunkH=height*0.38
    branch(Vector((0,0,0)),Vector((rnd.uniform(-.05,.05),rnd.uniform(-.05,.05),1)),trunkH,0.26,0)
    # leaves: clustered at twig tips + random fill within crown ellipsoid
    cols=bpy.context.object  # unused
    lcol=lbm.loops.layers.color.new('Col')
    pts=[t[0] for t in tips]
    for i in range(leaves):
        c=rnd.choice(pts)+Vector((rnd.gauss(0,0.55),rnd.gauss(0,0.55),rnd.gauss(0,0.4)))
        s=rnd.uniform(0.11,0.19); nrm=Vector((rnd.gauss(0,.5),rnd.gauss(0,.5),rnd.uniform(0.3,1))).normalized()
        a=Vector((0,0,1)) if abs(nrm.z)<0.95 else Vector((1,0,0)); u=nrm.cross(a).normalized(); v=nrm.cross(u).normalized()
        rr=rnd.random()
        if rr<0.88: col=(rnd.uniform(.10,.17),rnd.uniform(.22,.33),rnd.uniform(.03,.07),1)
        elif rr<0.97: col=(rnd.uniform(.30,.42),rnd.uniform(.30,.38),rnd.uniform(.04,.08),1)
        else: col=(rnd.uniform(.35,.5),rnd.uniform(.18,.26),rnd.uniform(.03,.06),1)
        a0=c; a1=c+u*s*0.55+v*s*0.45+nrm*s*0.08; a2=c+v*s*1.0+nrm*s*0.18; a3=c-u*s*0.55+v*s*0.45+nrm*s*0.08
        vv=[lbm.verts.new(x) for x in (a0,a1,a2,a3)]
        f=lbm.faces.new(vv)
        for lp in f.loops: lp[lcol]=col
    for tag,b in (('trunk',bm),('leaves',lbm)):
        me=bpy.data.meshes.new(f'{name}_{tag}'); b.to_mesh(me); b.free()
        o=bpy.data.objects.new(f'{name}_{tag}',me); o.location=loc; bpy.context.scene.collection.objects.link(o)
        me.materials.append(_bark_mat() if tag=='trunk' else _leaf_mat())
        for pl in me.polygons: pl.use_smooth=True
    return
def replace_trees():
    for o in bpy.data.objects:
        if o.name.startswith(('Crown_','Trunk_','tree_oak_01','CAT_OakTree')): o.hide_render=True; o.hide_viewport=True
    sites=[(-33,44,0.0),(-56,46,0.0),(-40,62,0.0),(-7,18,0.0),(6,38,0.0),(-18,70,0.0),(9,58,0.0)]
    for i,(x,y,z) in enumerate(sites):
        platane(f'Platane_{i}',(x,y,z),seed=100+i*17,height=8.5+i%3*0.9,leaves=8000)
