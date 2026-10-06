"""Portable glTF PBR approximation from evaluated copies; source objects untouched."""
import hashlib
import json
import bpy


def export_glb(path,objects):
    """Bake modifiers/curves to temporary copies; preserve shared meshes when possible.

    Procedural texture graphs are intentionally reduced to constant PBR factors.
    This is a geometry preview; faithful surfaces need a separate texture bake.
    """
    temp=bpy.data.collections.new('SK_TEMP_EXPORT')
    bpy.context.scene.collection.children.link(temp)
    deps=bpy.context.evaluated_depsgraph_get();copies=[];meshes={};materials={}
    try:
        for src in objects:
            if src.type not in ['MESH','CURVE','FONT','SURFACE']:continue
            modifier_key=tuple((m.type,getattr(m,'width',None),getattr(m,'segments',None)) for m in src.modifiers)
            key=(src.data.name,modifier_key)
            if key not in meshes:
                mesh=bpy.data.meshes.new_from_object(src.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
                for i,source_mat in enumerate(mesh.materials):
                    if not source_mat:continue
                    if source_mat.name not in materials:
                        mat=bpy.data.materials.new('WEB_'+source_mat.name);mat.use_nodes=True
                        mat.diffuse_color=source_mat.diffuse_color
                        bs=mat.node_tree.nodes.get('Principled BSDF')
                        bs.inputs['Base Color'].default_value=source_mat.diffuse_color
                        bs.inputs['Roughness'].default_value=source_mat.roughness
                        bs.inputs['Metallic'].default_value=source_mat.metallic
                        if source_mat.use_nodes:
                            source_bs=source_mat.node_tree.nodes.get('Principled BSDF')
                            if source_bs:
                                for attr in ['Base Color','Roughness','Metallic','Transmission Weight','Coat Weight','Coat Roughness','IOR']:
                                    if not source_bs.inputs[attr].is_linked:bs.inputs[attr].default_value=source_bs.inputs[attr].default_value
                        mat['material_status']='constant PBR approximation; procedural textures not baked'
                        materials[source_mat.name]=mat
                    mesh.materials[i]=materials[source_mat.name]
                meshes[key]=mesh
            obj=bpy.data.objects.new(src.name,meshes[key]);temp.objects.link(obj)
            obj.matrix_world=src.matrix_world.copy()
            for k in src.keys():obj[k]=src[k]
            copies.append(obj)
        bpy.ops.object.select_all(action='DESELECT')
        for obj in copies:obj.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,
                                  export_apply=False,export_cameras=False,export_lights=False,
                                  export_animations=False,export_extras=True)
        return {'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                'status':'PBR_APPROXIMATION_NOT_CYCLES_EQUIVALENT','nodes':len(copies),'unique_meshes':len(meshes),
                'curve_policy':'evaluated mesh copies','shared_meshes_preserved':True}
    finally:
        # Only new transient datablocks made in this function are removed.
        for obj in copies:bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.collections.remove(temp)
        for mesh in meshes.values():
            if mesh.users==0:bpy.data.meshes.remove(mesh)
        for mat in materials.values():
            if mat.users==0:bpy.data.materials.remove(mat)
