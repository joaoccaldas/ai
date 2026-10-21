"""Optional material/edge/contact study inside the existing source coordinator.

No rendering, no new engine, no municipal geometry or material replacement.
"""
import hashlib,json,math,sys
from pathlib import Path
import bpy
from mathutils import Vector
from studio.scene_kit import materials as M


def member_uv(obj,repeat=1):
    """Metre UVs; the longest edge on each face defines grain direction."""
    mesh=obj.data
    if mesh.uv_layers.get('MemberMetres'):
        if mesh.get('member_uv_repeat_m')!=repeat:raise ValueError('Conflicting shared-mesh UV scale')
        return len(mesh.loops)
    uv=mesh.uv_layers.new(name='MemberMetres')
    mesh['member_uv_repeat_m']=repeat
    for f in mesh.polygons:
        ids=list(f.vertices);edges=[mesh.vertices[ids[(i+1)%len(ids)]].co-mesh.vertices[j].co for i,j in enumerate(ids)]
        u=max(edges,key=lambda e:e.length_squared).normalized()
        v=f.normal.cross(u).normalized()
        for li in f.loop_indices:
            p=mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv=(p.dot(u)/repeat,p.dot(v)/repeat)
    return len(mesh.loops)


def apply(collection,anchor):
    render=Path(__file__).resolve().parents[1]/'render';sys.path.insert(0,str(render))
    from pbr import reviewed_uv_material
    floor,pavers=reviewed_uv_material('RealismReviewedPavers','concrete_pavers_02')
    roof,tiles=reviewed_uv_material('RealismReviewedRoof','clay_roof_tiles_02')
    wood=M.timber('RealismMemberOak',anchor,use_uv=True)
    mapped=[];bevels=[];grain=[]
    for obj in collection.objects:
        if obj.type!='MESH':continue
        if '_CoordFloor_L0' in obj.name:
            member_uv(obj,2.)
            obj.material_slots[0].link='OBJECT';obj.material_slots[0].material=floor
            mapped.append(obj.name)
        elif '_CoordRoof' in obj.name:
            # Keep tile length consistent across the actual parabolic roof arc.
            uv=obj.data.uv_layers.new(name='RoofArcMetres');k=8*1.35/(9*9)
            for face in obj.data.polygons:
                ids=list(face.vertices)
                edges=[obj.data.vertices[ids[(i+1)%len(ids)]].co-obj.data.vertices[j].co for i,j in enumerate(ids)]
                u=max(edges,key=lambda e:e.length_squared).normalized();v=face.normal.cross(u).normalized()
                for li in face.loop_indices:
                    p=obj.data.vertices[obj.data.loops[li].vertex_index].co;y=p.y
                    arc=.5*(y*math.sqrt(1+(k*y)**2)+math.asinh(k*y)/k)
                    uv.data[li].uv=((p.x/2.5,arc/2.5) if abs(face.normal.z)>.3 else (p.dot(u)/2.5,p.dot(v)/2.5))
            obj.material_slots[0].link='OBJECT';obj.material_slots[0].material=roof
            mapped.append(obj.name)
        if any(s.material and s.material.name=='CoordOak' for s in obj.material_slots):
            member_uv(obj)
            for s in obj.material_slots:
                if s.material and s.material.name=='CoordOak':s.link='OBJECT';s.material=wood
            grain.append(obj.name)
        if obj.name.endswith('_CoordFrame') or '_CoordCeramicScreens' in obj.name:
            mod=obj.modifiers.new('RealismEdgeContact','BEVEL');mod.width=.004;mod.segments=2
            mod.limit_method='ANGLE';bevels.append(obj.name)
    # The full-scene volume was a design haze, not measured weather. A clear
    # material study makes joints and reflected light easier to judge and avoids
    # spending every path sample inside a 900 m scattering box.
    haze=bpy.data.objects.get('HAZE')
    if haze:haze.hide_render=True
    # Retain illustrative figures, but remove them from this unoccupied material
    # study: their schematic hands/faces cannot support close-up realism.
    figures=[]
    for obj in collection.objects:
        if obj.name.startswith('CoordMarketPerson_'):obj.hide_render=True;figures.append(obj.name)
    for obj in collection.objects:
        if obj.type=='LIGHT' and obj.name.startswith('CoordPendantLight_'):
            obj.data.color=(1,.93,.82);obj.data.energy=70
    packed=[]
    for im in bpy.data.images:
        if im.source=='FILE' and im.get('reviewed_map_sha256'):
            # Blender loads image pixels lazily; has_data=False is not evidence
            # that a reviewed on-disk image is missing. Pack from the file.
            im.pack()
            if not im.packed_file:raise ValueError('Reviewed texture was not packed: '+im.name)
            packed.append({'name':im.name,'width':im.size[0],'height':im.size[1],
                           'sha256':im['reviewed_map_sha256']})
    if len(packed)!=6:raise ValueError('Expected six reviewed packed texture images')
    return {'status':'REALISM_MATERIAL_STUDY_NOT_FINAL','mapped_objects':mapped,
        'member_grain_objects':grain,'bevel_objects':bevels,'hidden_illustrative_figures':figures,
        'weather':'Clear design study; unmeasured weather','haze_hidden':bool(haze),'packed_images':packed,
        'texture_files':pavers+tiles,'sun_camera_exposure_unchanged':True,
        'limits':['PBR imagery does not create missing geometry or resolve the whole programme.',
        'Member longest-edge UVs are an approximation; end grain and each joint still need review.',
        'No portable material equivalence or engineering/visual acceptance.','Unoccupied material study; daily coexistence still needs a separate convincing occupied view.']}
