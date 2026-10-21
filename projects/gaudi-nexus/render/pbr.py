# executed in build.py namespace: scanned CC0 PBR textures (see textures.json / fetch_textures.py), box-projected in object space (real-world scale)
import os, json, hashlib
import bpy
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


def reviewed_uv_material(name,tid):
    """Actual reviewed colour/roughness/GL normal maps on authored UVs.

    Unlike the historical box-projected colour-as-height helper, this path uses
    the downloaded tangent-space normal image with an actual UV tangent basis.
    The caller owns UV metre/repeat scale. It does not modify municipal context.
    """
    lock=json.load(open(os.path.join(os.path.dirname(__file__),'textures-reviewed-20261021.json')))
    records=[f for f in lock['files'] if f['id']==tid]
    if {r['map'] for r in records}!={'Diffuse','Rough','nor_gl'}:
        raise ValueError('Incomplete reviewed map set: '+tid)
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF')
    uv=nt.nodes.new('ShaderNodeTexCoord');tex={}
    for r in records:
        path=os.path.join(_TEXDIR,tid,r['map']+'.jpg')
        raw=open(path,'rb').read()
        if hashlib.sha256(raw).hexdigest()!=r['sha256'] or len(raw)!=r['bytes']:
            raise ValueError('Reviewed map identity changed: '+path)
        im=bpy.data.images.load(path,check_existing=True)
        im['reviewed_map_sha256']=r['sha256']
        im.colorspace_settings.name='sRGB' if r['map']=='Diffuse' else 'Non-Color'
        n=nt.nodes.new('ShaderNodeTexImage');n.image=im;n.extension='REPEAT'
        nt.links.new(uv.outputs['UV'],n.inputs['Vector']);tex[r['map']]=n
    nt.links.new(tex['Diffuse'].outputs['Color'],bs.inputs['Base Color'])
    nt.links.new(tex['Rough'].outputs['Color'],bs.inputs['Roughness'])
    normal=nt.nodes.new('ShaderNodeNormalMap');normal.space='TANGENT'
    normal.inputs['Strength'].default_value=.6
    nt.links.new(tex['nor_gl'].outputs['Color'],normal.inputs['Color'])
    nt.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    mat['source']='Poly Haven / CC0-1.0 / Amal Kumar'
    mat['reviewed_texture_id']=tid
    mat['normal_basis']='OpenGL tangent normal through authored UVs'
    return mat,records
