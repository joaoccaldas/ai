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
    nt.links.remove(cl[0])
    # --- trencadis: broken-ceramic mosaic (Gaudi): random shards in a palette, dark grout, glossy glaze ---
    _tcm=nt.nodes.new('ShaderNodeTexCoord'); _mpm=nt.nodes.new('ShaderNodeMapping'); _mpm.inputs['Scale'].default_value=(1,1,1); nt.links.new(_tcm.outputs['Object'],_mpm.inputs['Vector'])
    _vc=nt.nodes.new('ShaderNodeTexVoronoi'); _vc.feature='F1'; _vc.inputs['Scale'].default_value=16.0; _vc.inputs['Randomness'].default_value=1.0; nt.links.new(_mpm.outputs['Vector'],_vc.inputs['Vector'])
    _ve=nt.nodes.new('ShaderNodeTexVoronoi'); _ve.feature='DISTANCE_TO_EDGE'; _ve.inputs['Scale'].default_value=16.0; nt.links.new(_mpm.outputs['Vector'],_ve.inputs['Vector'])
    _sep=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(_vc.outputs['Color'],_sep.inputs['Color'])
    _pal=nt.nodes.new('ShaderNodeValToRGB'); _pal.color_ramp.interpolation='CONSTANT'
    _stops=[(0.0,(0.80,0.70,0.45,1)),(0.2,(0.93,0.90,0.82,1)),(0.4,(0.10,0.28,0.55,1)),(0.6,(0.12,0.55,0.55,1)),(0.8,(0.72,0.32,0.12,1))]
    _pal.color_ramp.elements[0].position=_stops[0][0]; _pal.color_ramp.elements[0].color=_stops[0][1]
    _pal.color_ramp.elements[1].position=_stops[1][0]; _pal.color_ramp.elements[1].color=_stops[1][1]
    for _pp,_cc in _stops[2:]:
        _el=_pal.color_ramp.elements.new(_pp); _el.color=_cc
    nt.links.new(_sep.outputs['Red'],_pal.inputs['Fac'])
    _gm=nt.nodes.new('ShaderNodeMath'); _gm.operation='GREATER_THAN'; _gm.inputs[1].default_value=0.035; nt.links.new(_ve.outputs['Distance'],_gm.inputs[0])
    _mos=nt.nodes.new('ShaderNodeMix'); _mos.data_type='RGBA'; nt.links.new(_gm.outputs['Value'],_mos.inputs[0]); _mos.inputs[6].default_value=(0.06,0.055,0.05,1); nt.links.new(_pal.outputs['Color'],_mos.inputs[7])
    src=_mos.outputs[2]
    _grb=nt.nodes.new('ShaderNodeBump'); _grb.inputs['Strength'].default_value=0.8; _grb.inputs['Distance'].default_value=0.004; nt.links.new(_gm.outputs['Value'],_grb.inputs['Height'])
    for _l in [l for l in nt.links if l.to_socket==p.inputs['Normal']]: nt.links.remove(_l)
    nt.links.new(_grb.outputs['Normal'],p.inputs['Normal'])
    oi=nt.nodes.new('ShaderNodeObjectInfo'); tc=nt.nodes.new('ShaderNodeTexCoord'); sz=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'],sz.inputs['Vector'])
    grad=ramp(nt,mathn(nt,'ADD',mathn(nt,'MULTIPLY',sz.outputs['Z'],0.33),0.5,True),[(0.0,(0.45,0.38,0.30,1)),(0.45,(0.85,0.82,0.78,1)),(1.0,(1.0,1.0,1.0,1))])
    rnd=mathn(nt,'ADD',mathn(nt,'MULTIPLY',oi.outputs['Random'],0.35),0.8)
    rc=nt.nodes.new('ShaderNodeCombineColor'); [nt.links.new(rnd,rc.inputs[i]) for i in range(3)]
    c1=mixrgb(nt,src,grad.outputs['Color'],1.0,'MULTIPLY'); c2=mixrgb(nt,c1,rc.outputs['Color'],1.0,'MULTIPLY')
    hs=nt.nodes.new('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value=1.0; hs.inputs['Value'].default_value=1.08; nt.links.new(c2,hs.inputs['Color'])   # tame the flat saturated ochre
    nt.links.new(hs.outputs['Color'],p.inputs['Base Color'])
try: p.inputs['Coat Weight'].default_value=0.6; p.inputs['Coat Roughness'].default_value=0.08
except Exception: pass
for l in [l for l in nt.links if l.to_socket==p.inputs['Roughness']]: nt.links.remove(l)
p.inputs['Roughness'].default_value=0.22
