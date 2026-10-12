# executed in build.py namespace: scanned CC0 PBR textures (see textures.json / fetch_textures.py), box-projected in object space (real-world scale)
import os
_TEXDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_tex')
def pbr_maps(nt, tid, size_m, blend=0.25):
    d = os.path.join(_TEXDIR, tid)
    if not os.path.exists(os.path.join(d, 'Diffuse.jpg')): return None
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); s = 1.0 / size_m; mp.inputs['Scale'].default_value = (s, s, s); nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    def img(name, cs):
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(os.path.join(d, name + '.jpg'), check_existing=True); n.image.colorspace_settings.name = cs
        n.projection = 'BOX'; n.projection_blend = blend; nt.links.new(mp.outputs['Vector'], n.inputs['Vector']); return n
    dn = img('Diffuse', 'sRGB'); rn = img('Rough', 'Non-Color')
    bw = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(dn.outputs['Color'], bw.inputs['Color'])
    return {'color': dn.outputs['Color'], 'rough': rn.outputs['Color'], 'height': bw.outputs['Val']}
