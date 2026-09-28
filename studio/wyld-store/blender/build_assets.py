import bpy, math, os, json
from mathutils import Vector

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,"assets","blender")
os.makedirs(OUT,exist_ok=True)

PALETTE={
"raspberry":(0.63,0.012,0.145,1),"blueberry":(0.025,0.085,1.0,1),"grape":(0.145,0.055,0.66,1),
"olive":(0.22,0.26,0.025,1),"tiffany":(0.023,0.66,0.64,1),"black":(0.006,0.006,0.008,1),
"white":(0.91,0.88,0.82,1),"skin":(0.50,0.28,0.20,1),"hair":(0.035,0.022,0.018,1)
}

def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.cameras,bpy.data.lights):
        pass

def mat(name,color,rough=.58,metal=.0):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color=color
    m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    if bs:
        bs.inputs["Base Color"].default_value=color
        bs.inputs["Roughness"].default_value=rough
        bs.inputs["Metallic"].default_value=metal
        for key in ("Sheen Weight","Sheen"):
            if key in bs.inputs:
                bs.inputs[key].default_value=.18
                break
    return m

def smooth(obj):
    if obj.type=='MESH':
        for p in obj.data.polygons:p.use_smooth=True

def loft(name,rings,material,segments=64,solid=.006,bevel=.004):
    verts=[];faces=[]
    for z,rx,ry,xoff,yoff in rings:
        for i in range(segments):
            a=2*math.pi*i/segments
            verts.append((xoff+rx*math.cos(a),yoff+ry*math.sin(a),z))
    for r in range(len(rings)-1):
        for i in range(segments):
            j=(i+1)%segments;a=r*segments+i;b=r*segments+j;c=(r+1)*segments+j;d=(r+1)*segments+i
            faces.extend(((a,b,c),(a,c,d)))
    # caps
    verts.extend([(rings[0][3],rings[0][4],rings[0][0]),(rings[-1][3],rings[-1][4],rings[-1][0])])
    bi=len(verts)-2;ti=len(verts)-1
    for i in range(segments):
        j=(i+1)%segments;faces.append((bi,j,i));o=(len(rings)-1)*segments;faces.append((ti,o+i,o+j))
    me=bpy.data.meshes.new(name+"_MESH");me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(material);smooth(ob)
    if solid:
        mod=ob.modifiers.new("Cloth thickness","SOLIDIFY");mod.thickness=solid;mod.offset=0
    if bevel:
        mod=ob.modifiers.new("Soft edge","BEVEL");mod.width=bevel;mod.segments=3
    return ob

def cylinder_between(name,a,b,r,material,r2=None,verts=48):
    a,b=Vector(a),Vector(b);d=b-a;mid=(a+b)/2
    bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r if r2 is None else r2,radius2=r,depth=d.length,location=mid)
    ob=bpy.context.object;ob.name=name;ob.data.materials.append(material);smooth(ob)
    ob.rotation_mode='QUATERNION';ob.rotation_quaternion=d.to_track_quat('Z','Y')
    bev=ob.modifiers.new("Soft edge","BEVEL");bev.width=min(.006,r*.10);bev.segments=3
    return ob

def cube(name,loc,scale,material,bevel=.003):
    bpy.ops.mesh.primitive_cube_add(location=loc);ob=bpy.context.object;ob.name=name;ob.scale=scale;ob.data.materials.append(material)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=ob.modifiers.new("Soft edge","BEVEL");mod.width=bevel;mod.segments=3
    return ob

def sphere(name,loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=loc);ob=bpy.context.object;ob.name=name;ob.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(material);smooth(ob);return ob

def curve_seam(name,pts,material,bevel=.0025):
    cu=bpy.data.curves.new(name+"_CURVE","CURVE");cu.dimensions='3D';cu.bevel_depth=bevel;cu.bevel_resolution=3
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
    for p,co in zip(sp.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(material);return ob

def base_materials(primary):
    return {
      "fabric":mat("FABRIC_PRIMARY",PALETTE[primary],.66,0),
      "accent":mat("FABRIC_ACCENT",PALETTE["white"],.52,0),
      "dark":mat("FABRIC_DARK",PALETTE["black"],.72,0),
      "skin":mat("BODY_SKIN",PALETTE["skin"],.82,0),
      "hair":mat("BODY_HAIR",PALETTE["hair"],.76,0),
      "metal":mat("METAL",(.04,.04,.045,1),.28,.72)
    }

def build_jersey(primary="raspberry",men=False,singlet=False):
    M=base_materials(primary);w=.42 if men else .38;wa=.31 if men else .285
    torso=loft("GARMENT_TORSO",[(0,wa,.16,0,0),(.18,wa*.99,.17,0,0),(.46,wa*1.02,.185,0,0),(.76,w*.92,.20,0,0),(.98,w,.205,0,0),(1.09,w*.90,.19,0,0)],M["fabric"])
    if not singlet:
        for s in (-1,1):
            cylinder_between("GARMENT_SLEEVE_L" if s<0 else "GARMENT_SLEEVE_R",(s*w*.86,0,.96),(s*(w+.22),.015,.78),.105,M["fabric"],.085)
            cylinder_between("GARMENT_CUFF_L" if s<0 else "GARMENT_CUFF_R",(s*(w+.205),.015,.80),(s*(w+.245),.015,.755),.09,M["dark"],.087)
    # low-profile collar
    bpy.ops.mesh.primitive_torus_add(major_radius=.165,minor_radius=.018,major_segments=64,minor_segments=12,location=(0,0,1.085))
    collar=bpy.context.object;collar.name="GARMENT_DARK_COLLAR";collar.scale.y=.72;collar.data.materials.append(M["dark"]);smooth(collar)
    cube("GARMENT_ZIP",(0,.205,.66),(.008,.006,.34),M["dark"],.0015)
    cube("GARMENT_CHEST_MARK",(0,.207,.86),(.14,.005,.018),M["accent"],.001)
    # rear pockets
    for x in (-.19,0,.19): cube("GARMENT_REAR_POCKET",(x,-.19,.18),(.085,.008,.105),M["fabric"],.003)
    # seams
    for s in (-1,1): curve_seam("GARMENT_SEAM",[ (s*wa,.165,.08),(s*(wa+.015),.188,.48),(s*(w-.035),.19,.90) ],M["accent"],.002)
    return torso

def build_bibs(primary="tiffany"):
    M=base_materials(primary)
    loft("GARMENT_BIB_HIPS",[(0,.22,.15,0,0),(.18,.24,.165,0,0),(.38,.27,.175,0,0),(.55,.265,.17,0,0)],M["fabric"])
    for s in (-1,1):
        cylinder_between("GARMENT_BIB_LEG_L" if s<0 else "GARMENT_BIB_LEG_R",(s*.145,0,.28),(s*.145,0,-.22),.13,M["fabric"],.115)
        curve_seam("GARMENT_STRAP_L" if s<0 else "GARMENT_STRAP_R",[(s*.15,0,.48),(s*.18,0,.86),(s*.13,0,1.18)],M["dark"],.026)
        cylinder_between("GARMENT_GRIP_L" if s<0 else "GARMENT_GRIP_R",(s*.145,0,-.17),(s*.145,0,-.225),.12,M["dark"],.118)
    cube("GARMENT_MARK",(0,.18,.42),(.105,.006,.018),M["accent"],.001)

def build_cap():
    M=base_materials("black")
    # crown loft, closed at top
    loft("GARMENT_CAP_CROWN",[(0,.36,.31,0,0),(.13,.37,.32,0,0),(.28,.31,.28,0,0),(.40,.18,.16,0,0),(.46,.03,.025,0,0)],M["fabric"],64,.005,.004)
    cube("GARMENT_CAP_BRIM",(0,.23,-.05),(.34,.24,.025),M["dark"],.02)
    cube("GARMENT_CAP_MARK",(0,.305,.20),(.09,.008,.035),M["accent"],.001)

def build_athlete(pose="stand",primary="raspberry"):
    M=base_materials(primary)
    P={
      "stand":{"sh":((-.35,0,1.88),(.35,0,1.88)),"el":((-.48,.01,1.48),(.48,.01,1.48)),"wr":((-.49,.02,1.08),(.49,.02,1.08)),"hip":((-.15,0,.98),(.15,0,.98)),"kn":((-.15,.02,.46),(.15,.02,.46)),"an":((-.15,.03,-.08),(.15,.03,-.08))},
      "aero":{"sh":((-.34,.12,1.70),(.34,.12,1.70)),"el":((-.27,.48,1.30),(.27,.48,1.30)),"wr":((-.15,.86,1.21),(.15,.86,1.21)),"hip":((-.15,-.07,.98),(.15,-.07,.98)),"kn":((-.15,.25,.46),(.15,-.20,.40)),"an":((-.15,.02,-.08),(.15,.02,-.08))},
      "run":{"sh":((-.35,0,1.88),(.35,0,1.88)),"el":((-.34,.32,1.48),(.34,-.28,1.48)),"wr":((-.18,.51,1.27),(.18,-.46,1.28)),"hip":((-.15,0,.98),(.15,0,.98)),"kn":((-.15,-.28,.42),(.15,.30,.55)),"an":((-.15,-.12,-.08),(.15,.58,.00))}
    }[pose]
    sphere("BODY_HEAD",(0,.28 if pose=="aero" else 0,2.22 if pose=="aero" else 2.35),(.16,.155,.20),M["skin"])
    sphere("BODY_HAIR",(0,.25 if pose=="aero" else -.015,2.30 if pose=="aero" else 2.43),(.165,.16,.12),M["hair"])
    loft("GARMENT_TORSO",[(.92,.25,.16,0,0),(1.2,.30,.19,0,0),(1.55,.36,.205,0,.04 if pose=="aero" else 0),(1.85,.38,.20,0,.08 if pose=="aero" else 0),(1.98,.32,.18,0,.10 if pose=="aero" else 0)],M["fabric"],64,.007,.004)
    for idx,side in enumerate(("L","R")):
        sh=P["sh"][idx];el=P["el"][idx];wr=P["wr"][idx];hp=P["hip"][idx];kn=P["kn"][idx];an=P["an"][idx]
        cylinder_between("GARMENT_SLEEVE_"+side,sh,el,.09,M["fabric"],.075);cylinder_between("BODY_FOREARM_"+side,el,wr,.065,M["skin"],.055)
        cylinder_between("GARMENT_BIB_LEG_"+side,hp,kn,.135,M["dark"],.10);cylinder_between("BODY_CALF_"+side,kn,an,.085,M["skin"],.065)
        sphere("SHOE_"+side,(an[0],an[1]+.10,an[2]-.05),(.10,.21,.065),M["accent"])
    cube("GARMENT_MARK",(0,.205 if pose!="aero" else .28,1.70),(.13,.006,.018),M["accent"],.001)
    if pose=="aero":
        for x in (-.42,.42):
            bpy.ops.mesh.primitive_torus_add(major_radius=.34,minor_radius=.017,major_segments=64,minor_segments=10,location=(x,.20,.29),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name="BIKE_WHEEL";o.data.materials.append(M["dark"])
        cylinder_between("BIKE_FRAME",(-.42,.20,.29),(.07,.20,.71),.021,M["metal"]);cylinder_between("BIKE_TOP",(.07,.20,.71),(.42,.20,.29),.021,M["metal"]);cylinder_between("BIKE_BAR",(.18,.20,.70),(.28,.50,.77),.017,M["metal"])

def camera_lights():
    bpy.ops.object.camera_add(location=(3.6,-5.1,2.4));cam=bpy.context.object;cam.name="CAMERA_HERO";bpy.context.scene.camera=cam
    direction=Vector((0,0,1.0))-cam.location;cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();cam.data.lens=62
    for name,loc,energy,size,color in [
      ("KEY",(3,-3,5),1000,3.0,(1,.93,.88)),("FILL",(-3,-2,2),520,2.2,(.65,.88,1)),("RIM",(0,3,3),650,2.0,(1,.25,.55))]:
        bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.name=name;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.data.color=color
        l.rotation_euler=(Vector((0,0,1.0))-l.location).to_track_quat('-Z','Y').to_euler()
    bpy.context.scene.world.color=(.025,.02,.03)
    bpy.context.scene.render.engine='BLENDER_EEVEE'
    bpy.context.scene.render.resolution_x=700;bpy.context.scene.render.resolution_y=900;bpy.context.scene.render.resolution_percentage=100
    bpy.context.scene.render.image_settings.file_format='PNG'

def export(name):
    path=os.path.join(OUT,name)
    bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',export_apply=True,export_yup=True,export_materials='EXPORT')
    return os.path.getsize(path)

manifest={}
for filename,builder in [
 ("jersey-women.glb",lambda:build_jersey("raspberry",False,False)),
 ("jersey-men.glb",lambda:build_jersey("grape",True,False)),
 ("singlet.glb",lambda:build_jersey("raspberry",False,True)),
 ("bib-tiffany.glb",lambda:build_bibs("tiffany")),
 ("bib-black.glb",lambda:build_bibs("black")),
 ("cap.glb",build_cap),
 ("athlete-stand.glb",lambda:build_athlete("stand","raspberry")),
 ("athlete-aero.glb",lambda:build_athlete("aero","raspberry")),
 ("athlete-run.glb",lambda:build_athlete("run","raspberry"))
]:
    clear();builder();manifest[filename]=export(filename)

clear();build_jersey("raspberry",False,False);camera_lights()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,"wyld-garment-studio.blend"))
manifest["wyld-garment-studio.blend"]=os.path.getsize(os.path.join(OUT,"wyld-garment-studio.blend"))
with open(os.path.join(OUT,"manifest.json"),"w") as f: json.dump({"pipeline":"Blender","version":1,"assets":manifest},f,indent=2)
print(json.dumps(manifest,indent=2))
