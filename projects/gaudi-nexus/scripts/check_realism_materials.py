"""Inspect actual packed images, UVs and shader basis without rendering."""
import bpy,json,hashlib,math,sys
from pathlib import Path

source=Path(bpy.data.filepath);receipt=json.loads(Path(str(source)+'.receipt.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==receipt['candidate_sha256']
r=receipt['architecture_coordination']['realism_study'];assert r
checks=[];images=[im for im in bpy.data.images if im.get('reviewed_map_sha256')]
assert len(images)==6
for im in images:
    assert im.packed_file and hashlib.sha256(bytes(im.packed_file.data)).hexdigest()==im['reviewed_map_sha256']
    assert list(im.size)==[2048,2048]
checks.append('six_reviewed_2k_images_packed_with_exact_source_bytes')
uv_faces=0;meshes=set()
for name in r['mapped_objects']+r['member_grain_objects']:
    obj=bpy.data.objects[name];mesh=obj.data
    if mesh.name in meshes:continue
    meshes.add(mesh.name)
    assert len(mesh.uv_layers)==1,(name,len(mesh.uv_layers))
    uv=mesh.uv_layers.active
    for f in mesh.polygons:
        coords=[uv.data[i].uv for i in f.loop_indices]
        assert all(math.isfinite(float(c)) for p in coords for c in p)
        area=abs(sum(p.x*q.y-q.x*p.y for p,q in zip(coords,coords[1:]+coords[:1])))/2
        assert area>1e-12,(name,f.index,area)
        uv_faces+=1
checks.extend(['finite_noncollapsed_uvs_including_roof_caps','shared_chair_mesh_has_one_uv_layer'])
for name in ('RealismReviewedPavers','RealismReviewedRoof'):
    mat=bpy.data.materials[name];nt=mat.node_tree
    normal=next(n for n in nt.nodes if n.type=='NORMAL_MAP');assert normal.space=='TANGENT'
    assert nt.nodes.get('Principled BSDF').inputs['Normal'].is_linked
    for n in nt.nodes:
        if n.type=='TEX_IMAGE':
            expected='sRGB' if 'Diffuse' in n.image.name else 'Non-Color'
            assert n.image.colorspace_settings.name==expected
checks.append('actual_tangent_normal_and_data_colour_spaces')
assert bpy.data.objects['HAZE'].hide_render
assert receipt['architecture_coordination']['prepared_source_signatures_preserved']==2090
checks.append('haze_hidden_and_prepared_source_preservation_receipt_present')
assert hashlib.sha256(source.read_bytes()).hexdigest()==receipt['candidate_sha256']
result={'status':'PASS_MATERIAL_GEOMETRY_ONLY','checks':checks,'unique_uv_meshes':len(meshes),
        'noncollapsed_uv_faces':uv_faces,'candidate_sha256':receipt['candidate_sha256'],
        'render_invocations':0,'limits':'No rendered appearance, speed, portable fidelity or independent acceptance.'}
out=Path(sys.argv[sys.argv.index('--')+1]);out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
