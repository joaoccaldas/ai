# executed in build.py namespace
# --- plaza puddles: mirror-like patches in low spots, darker wet stone ---
pm=bpy.data.materials.get('PlazaSlabs'); nt=pm.node_tree; p=bsdf(pm)
damp=[n for n in nt.nodes if n.bl_idname=='ShaderNodeTexNoise' and abs(n.inputs['Scale'].default_value-0.22)<1e-6]
if damp:
    pud=ramp(nt,damp[0].outputs['Fac'],[(0.572,(0,0,0,1)),(0.588,(1,1,1,1))])
    rl=[l for l in nt.links if l.to_socket==p.inputs['Roughness']][0]
    rsrc=rl.from_socket; nt.links.remove(rl)
    pr=mathn(nt,'MULTIPLY',rsrc,mathn(nt,'SUBTRACT',1.0,mathn(nt,'MULTIPLY',pud.outputs['Color'],0.96)))
    nt.links.new(pr,p.inputs['Roughness'])
    cl=[l for l in nt.links if l.to_socket==p.inputs['Base Color']][0]; csrc=cl.from_socket; nt.links.remove(cl)
    nt.links.new(mixrgb(nt,csrc,(0.012,0.012,0.014,1),pud.outputs['Color']),p.inputs['Base Color'])
    nl=[l for l in nt.links if l.to_socket==p.inputs['Normal']]
    for l in nl:   # flatten normals inside puddles
        pass
# --- ceramic fins: per-fin tone, dirt toward the base, glossy glaze ---
cm=bpy.data.materials.get('Ceramic'); nt=cm.node_tree; p=bsdf(cm)
cl=[l for l in nt.links if l.to_socket==p.inputs['Base Color']]
if cl:
    src=cl[0].from_socket; nt.links.remove(cl[0])
    oi=nt.nodes.new('ShaderNodeObjectInfo'); tc=nt.nodes.new('ShaderNodeTexCoord'); sz=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'],sz.inputs['Vector'])
    grad=ramp(nt,mathn(nt,'ADD',mathn(nt,'MULTIPLY',sz.outputs['Z'],0.33),0.5,True),[(0.0,(0.45,0.38,0.30,1)),(0.45,(0.85,0.82,0.78,1)),(1.0,(1.0,1.0,1.0,1))])
    rnd=mathn(nt,'ADD',mathn(nt,'MULTIPLY',oi.outputs['Random'],0.35),0.8)
    rc=nt.nodes.new('ShaderNodeCombineColor'); [nt.links.new(rnd,rc.inputs[i]) for i in range(3)]
    c1=mixrgb(nt,src,grad.outputs['Color'],1.0,'MULTIPLY'); c2=mixrgb(nt,c1,rc.outputs['Color'],1.0,'MULTIPLY')
    hs=nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value=0.62; hs.inputs['Value'].default_value=1.08; nt.links.new(c2,hs.inputs['Color'])   # tame the flat saturated ochre
    nt.links.new(hs.outputs['Color'],p.inputs['Base Color'])
try: p.inputs['Coat Weight'].default_value=0.6; p.inputs['Coat Roughness'].default_value=0.08
except Exception: pass
for l in [l for l in nt.links if l.to_socket==p.inputs['Roughness']]: nt.links.remove(l)
p.inputs['Roughness'].default_value=0.22
