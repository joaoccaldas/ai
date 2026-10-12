# executed in build.py namespace
# 1) plaza paving: square slab grid (not stretcher-bond), stronger tonal variation, light joints
pm=bpy.data.materials.get('PlazaSlabs')
for n in pm.node_tree.nodes:
    if n.bl_idname=='ShaderNodeTexBrick':
        n.inputs['Brick Width'].default_value=0.6; n.inputs['Row Height'].default_value=0.6; n.offset=0.0; n.inputs['Mortar Size'].default_value=0.012
        n.inputs['Color1'].default_value=(0.50,0.47,0.42,1); n.inputs['Color2'].default_value=(0.34,0.32,0.29,1); n.inputs['Mortar'].default_value=(0.16,0.14,0.12,1)
        for k in n.inputs:
            if k.name=='Bias': k.default_value=0.0
# 2) tiled ceramic inlay material
im=newmat('PlazaInlay'); nt=im.node_tree; p=bsdf(im)
mp=mapping(nt); br=nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mp.outputs['Vector'],br.inputs['Vector'])
br.inputs['Scale'].default_value=1.0; br.inputs['Brick Width'].default_value=0.14; br.inputs['Row Height'].default_value=0.07; br.inputs['Mortar Size'].default_value=0.006; br.offset=0.5
br.inputs['Color1'].default_value=(0.72,0.38,0.12,1); br.inputs['Color2'].default_value=(0.60,0.28,0.09,1); br.inputs['Mortar'].default_value=(0.24,0.2,0.16,1)
nt.links.new(br.outputs['Color'],p.inputs['Base Color']); p.inputs['Roughness'].default_value=0.28
try: p.inputs['Coat Weight'].default_value=0.4
except Exception: pass
bump(nt,mathn(nt,'SUBTRACT',1.0,br.outputs['Fac']),0.7,0.004,p)
for o in bpy.data.objects:
    if o.name.startswith(('MarketThresholdInlay','QueueMarker')) and o.type=='MESH': o.data.materials.clear(); o.data.materials.append(im)
# 3) fin pivot pins + clamp brackets
steel=bpy.data.materials.get('Steel'); nf=0
def fin_hw(o):
    w=o.dimensions.x; d=o.dimensions.y; h=o.dimensions.z; bm=bmesh.new()
    def box(cx,cy,cz,sx,sy,sz):
        g=bmesh.ops.create_cube(bm,size=1.0)
        for v in g['verts']: v.co=Vector((v.co.x*sx+cx,v.co.y*sy+cy,v.co.z*sz+cz))
    def pin(z,L):
        g=bmesh.ops.create_cone(bm,cap_ends=True,segments=8,radius1=0.013,radius2=0.013,depth=L)
        for v in g['verts']: v.co=v.co+Vector((0,0,z))
    box(0,0,h/2+0.012,w+0.05,d+0.05,0.024); pin(h/2+0.1,0.16); pin(-h/2-0.06,0.12)
    for sy_ in (1,-1):
        box(0,sy_*(d/2+0.012),h/2-0.04,w+0.03,0.016,0.08)
        box(0,sy_*(d/2+0.012),-h/2+0.04,w+0.03,0.016,0.08)
    for f in bm.faces: f.material_index=0
    return bm
for o in list(bpy.data.objects):
    if o.type=='MESH' and o.name.startswith(('Hard_ResponsiveFin','Civic_ResponsiveFin')) and steel:
        ob=to_obj(fin_hw(o),'FH_'+o.name,[steel],Vector((0,0,0)),(0,0,0),(1,1,1)); ob.matrix_world=o.matrix_world.copy(); nf+=1
print('SURF3 fin hardware',nf)

_pm=bpy.data.materials.get('PlazaSlabs')
if _pm:
    for n in _pm.node_tree.nodes:
        if n.bl_idname=='ShaderNodeValToRGB':
            ins=[l.from_node for l in _pm.node_tree.links if l.to_node==n and l.to_socket.name=='Fac']
            if ins and ins[0].bl_idname=='ShaderNodeTexNoise' and abs(ins[0].inputs['Scale'].default_value-0.22)<1e-6 and len(n.color_ramp.elements)==2:
                if n.color_ramp.elements[0].position<0.55: n.color_ramp.elements[0].position=0.60; n.color_ramp.elements[1].position=0.72
