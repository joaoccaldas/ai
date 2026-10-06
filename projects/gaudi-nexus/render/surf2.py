# executed inside build.py namespace (helpers: mapping, noise, ramp, mixrgb, bsdf, bump, mathn)
def _objrand(nt):
    oi=nt.nodes.new('ShaderNodeObjectInfo'); return oi.outputs['Random']
# --- vault roof: clay tile coursing (0.42 x 0.2 m), glaze/roughness variation, weathering ---
tm=bpy.data.materials.get('Tile')
if tm and tm.use_nodes:
    nt=tm.node_tree; p=bsdf(tm)
    for l in list(p.inputs['Base Color'].links)+list(p.inputs['Roughness'].links)+list(p.inputs['Normal'].links): nt.links.remove(l)
    mp=mapping(nt); br=nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mp.outputs['Vector'],br.inputs['Vector'])
    br.inputs['Scale'].default_value=1.0; br.inputs['Brick Width'].default_value=0.42; br.inputs['Row Height'].default_value=0.2
    br.inputs['Mortar Size'].default_value=0.008; br.inputs['Mortar Smooth'].default_value=0.4; br.offset=0.5
    br.inputs['Color1'].default_value=(0.58,0.24,0.11,1); br.inputs['Color2'].default_value=(0.46,0.18,0.08,1); br.inputs['Mortar'].default_value=(0.2,0.15,0.11,1)
    wn=noise(nt,mapping(nt,(0.25,0.25,0.25)),1.0,6,0.55)
    wc=ramp(nt,wn.outputs['Fac'],[(0.35,(1,1,1,1)),(0.7,(0.7,0.62,0.55,1))])
    _R=pbr_maps(nt,'clay_roof_tiles_02',2.5)
    col=mixrgb(nt,(_R['color'] if _R else br.outputs['Color']),wc.outputs['Color'],0.7,'MULTIPLY'); nt.links.new(col,p.inputs['Base Color'])
    pn=noise(nt,mapping(nt,(60,60,60)),1.0,5,0.6)
    rr=nt.nodes.new('ShaderNodeMapRange'); nt.links.new(pn.outputs['Fac'],rr.inputs['Value']); rr.inputs['To Min'].default_value=0.38; rr.inputs['To Max'].default_value=0.72
    nt.links.new((mathn(nt,'ADD',mathn(nt,'MULTIPLY',rr.outputs['Result'],0.4),mathn(nt,'MULTIPLY',_R['rough'],0.6)) if _R else rr.outputs['Result']),p.inputs['Roughness'])
    bump(nt,mathn(nt,'ADD',mathn(nt,'SUBTRACT',1.0,br.outputs['Fac']),mathn(nt,'MULTIPLY',pn.outputs['Fac'],0.25)),0.8,0.012,p)
# --- produce / bread / herbs: per-item colour jitter, pores, subsurface, roughness spread ---
for m in list(bpy.data.materials):
    if m.use_nodes and m.name.startswith(('Produce','Bread','Herb','FlowerRed')) and bsdf(m) and not bsdf(m).inputs['Base Color'].is_linked:
        nt=m.node_tree; p=bsdf(m); base=tuple(p.inputs['Base Color'].default_value)[:3]
        rnd=_objrand(nt)
        jit=nt.nodes.new('ShaderNodeMath'); jit.operation='MULTIPLY_ADD'; nt.links.new(rnd,jit.inputs[0]); jit.inputs[1].default_value=0.5; jit.inputs[2].default_value=0.75
        v=nt.nodes.new('ShaderNodeMix'); v.data_type='RGBA'; v.blend_type='MULTIPLY'; v.inputs[0].default_value=1.0
        v.inputs[6].default_value=base+(1,)
        sep=nt.nodes.new('ShaderNodeCombineColor'); [nt.links.new(jit.outputs['Value'],sep.inputs[i]) for i in range(3)]
        nt.links.new(sep.outputs['Color'],v.inputs[7]); 
        mp=mapping(nt); pn=noise(nt,mp,220,4,0.6)
        spots=ramp(nt,noise(nt,mapping(nt),12,5,0.6).outputs['Fac'],[(0.45,(1,1,1,1)),(0.75,(0.75,0.68,0.55,1))])
        c2=mixrgb(nt,v.outputs[2],spots.outputs['Color'],0.5,'MULTIPLY'); nt.links.new(c2,p.inputs['Base Color'])
        try: p.inputs['Subsurface Weight'].default_value=0.25 if not m.name.startswith('Bread') else 0.0
        except Exception: pass
        bump(nt,pn.outputs['Fac'],0.3,0.002,p)
# --- awnings / fabrics: weave micro-structure + translucency ---
for name in ('MarketLinen','CanvasShade','HeroFabric','ToteFabric'):
    m=bpy.data.materials.get(name)
    if not m or not m.use_nodes: continue
    nt=m.node_tree; p=bsdf(m)
    ck=nt.nodes.new('ShaderNodeTexChecker'); ck.inputs['Scale'].default_value=900; nt.links.new(mapping(nt).outputs['Vector'],ck.inputs['Vector'])
    for l in list(p.inputs['Normal'].links): nt.links.remove(l)
    bump(nt,ck.outputs['Fac'],0.35,0.0008,p)
    try: p.inputs['Transmission Weight'].default_value=0.25 if name in('MarketLinen','CanvasShade') else 0.0
    except Exception: pass
    try: p.inputs['Sheen Weight'].default_value=0.5
    except Exception: pass
