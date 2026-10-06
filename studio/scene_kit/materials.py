"""Procedural Cycles PBR surfaces; all spatial frequencies are per metre.

Object coordinates use an unscaled world-space Empty supplied by the caller.
glTF exports the base PBR approximation, not Blender procedural node graphs.
"""
import bpy


def surface(name, color, roughness=.6, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1)
    mat.roughness = roughness
    mat.metallic = metallic
    bs = mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    mat['scene_kit_version'] = '1.0.0'
    mat['coordinate_units'] = 'metres'
    mat['web_material_status'] = 'PBR_APPROXIMATION_PROCEDURAL_TEXTURES_NOT_BAKED'
    return mat, bs


def coordinates(mat, anchor):
    n = mat.node_tree.nodes.new('ShaderNodeTexCoord')
    n.object = anchor
    return n.outputs['Object']


def noise(mat, vector, scale, detail=3):
    n = mat.node_tree.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    mat.node_tree.links.new(vector, n.inputs['Vector'])
    return n.outputs['Fac']


def ramp(mat, value, lo, hi):
    n = mat.node_tree.nodes.new('ShaderNodeValToRGB')
    n.color_ramp.elements[0].color = (*lo, 1)
    n.color_ramp.elements[1].color = (*hi, 1)
    mat.node_tree.links.new(value, n.inputs[0])
    return n.outputs['Color']


def bump(mat, bs, height, distance=.001, strength=.25):
    n = mat.node_tree.nodes.new('ShaderNodeBump')
    n.inputs['Distance'].default_value = distance
    n.inputs['Strength'].default_value = strength
    mat.node_tree.links.new(height, n.inputs['Height'])
    mat.node_tree.links.new(n.outputs['Normal'], bs.inputs['Normal'])


def mineral(name, anchor, color=(.52,.43,.31), scale=1.8, roughness=.72):
    mat, bs = surface(name, color, roughness)
    vec = coordinates(mat, anchor)
    grain = noise(mat, vec, scale)
    mat.node_tree.links.new(ramp(mat, grain, tuple(c*.78 for c in color),
                                   tuple(min(1,c*1.13) for c in color)), bs.inputs['Base Color'])
    bump(mat, bs, noise(mat, vec, 160), .0014, .3)
    return mat


def limestone(name, anchor):
    mat, bs = surface(name, (.58,.47,.32), .76)
    vec = coordinates(mat, anchor)
    # Courses follow world Z, never generated bbox coordinates or vertical curtains.
    sep = mat.node_tree.nodes.new('ShaderNodeSeparateXYZ')
    mat.node_tree.links.new(vec, sep.inputs[0])
    comb = mat.node_tree.nodes.new('ShaderNodeCombineXYZ')
    mat.node_tree.links.new(sep.outputs['X'], comb.inputs['X'])
    mat.node_tree.links.new(sep.outputs['Z'], comb.inputs['Y'])
    mat.node_tree.links.new(sep.outputs['Y'], comb.inputs['Z'])
    brick = mat.node_tree.nodes.new('ShaderNodeTexBrick')
    mat.node_tree.links.new(comb.outputs[0], brick.inputs['Vector'])
    for k,v in {'Scale':1.,'Mortar Size':.012,'Mortar Smooth':.008,'Brick Width':1.2,'Row Height':.55}.items():
        brick.inputs[k].default_value=v
    brick.inputs['Color1'].default_value=(.64,.52,.37,1)
    brick.inputs['Color2'].default_value=(.48,.40,.29,1)
    brick.inputs['Mortar'].default_value=(.37,.32,.25,1)
    mat.node_tree.links.new(brick.outputs['Color'],bs.inputs['Base Color'])
    bump(mat,bs,brick.outputs['Fac'],.004,.35)
    return mat


def paving(name, anchor):
    mat, bs=surface(name,(.40,.38,.32),.7)
    vec=coordinates(mat,anchor)
    brick=mat.node_tree.nodes.new('ShaderNodeTexBrick')
    mat.node_tree.links.new(vec,brick.inputs['Vector'])
    for k,v in {'Scale':1.,'Mortar Size':.005,'Mortar Smooth':.002,'Brick Width':.6,'Row Height':.3}.items():
        brick.inputs[k].default_value=v
    brick.inputs['Color1'].default_value=(.48,.46,.40,1)
    brick.inputs['Color2'].default_value=(.32,.34,.32,1)
    brick.inputs['Mortar'].default_value=(.15,.16,.14,1)
    mat.node_tree.links.new(brick.outputs['Color'],bs.inputs['Base Color'])
    bump(mat,bs,brick.outputs['Fac'],.003,.4)
    return mat


def glaze(name, anchor):
    mat,bs=surface(name,(.36,.17,.055),.24)
    bs.inputs['Coat Weight'].default_value=.55
    bs.inputs['Coat Roughness'].default_value=.16
    vec=coordinates(mat,anchor)
    mat.node_tree.links.new(ramp(mat,noise(mat,vec,3),(.23,.075,.022),(.56,.30,.095)),bs.inputs['Base Color'])
    mat.node_tree.links.new(ramp(mat,noise(mat,vec,28),(.15,.15,.15),(.3,.3,.3)),bs.inputs['Roughness'])
    bump(mat,bs,noise(mat,vec,240),.00035,.22)
    return mat


def timber(name, anchor):
    mat,bs=surface(name,(.28,.16,.075),.5)
    vec=coordinates(mat,anchor)
    m=mat.node_tree.nodes.new('ShaderNodeVectorMath');m.operation='MULTIPLY'
    mat.node_tree.links.new(vec,m.inputs[0]);m.inputs[1].default_value=(2,34,34)
    mat.node_tree.links.new(ramp(mat,noise(mat,m.outputs[0],1),(.16,.075,.03),(.39,.24,.11)),bs.inputs['Base Color'])
    bump(mat,bs,noise(mat,m.outputs[0],4),.0007,.25)
    return mat


def fabric(name, anchor, color=(.58,.51,.39)):
    mat,bs=surface(name,color,.85)
    bs.inputs['Sheen Weight'].default_value=.25
    vec=coordinates(mat,anchor)
    bump(mat,bs,noise(mat,vec,650,2),.00025,.2)
    return mat


def foliage(name, color):
    mat,bs=surface(name,color,.48)
    bs.inputs['Subsurface Weight'].default_value=.08
    bs.inputs['Subsurface Radius'].default_value=(.03,.06,.015)
    # Thin-leaf transmission for backlit canopy; no alpha sorting or cutout textures.
    trans=mat.node_tree.nodes.new('ShaderNodeBsdfTranslucent')
    trans.inputs[0].default_value=(*color,1)
    mix=mat.node_tree.nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.22
    mat.node_tree.links.new(bs.outputs[0],mix.inputs[1])
    mat.node_tree.links.new(trans.outputs[0],mix.inputs[2])
    mat.node_tree.links.new(mix.outputs[0],mat.node_tree.nodes.get('Material Output').inputs[0])
    return mat
