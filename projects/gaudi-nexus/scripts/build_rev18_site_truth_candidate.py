import bpy, json, math, hashlib
from mathutils import Vector

REV15_SHA = "cc1179cd2c2b379f954cbc55eb995f88d0786e08b37abfaca7e71417c4b1d494"
MUNICIPAL_SHA = "f5c324141f1328666c528810b8212c3152f2b6970bd780c6bb4516ee8c3e3f1c"
ARCHIVE_SHA = "186ed46321b9ec3baf7f6dc14235a32a8dd7a3fa54d32e815cddc4d0a91d9ef9"
ALIGN_X = 13.359293125672881
ALIGN_Y = 108.63406337943947
F3_POS = (-15.0, 42.0, 1.56)
F3_ROT = (1.793622, 0.0, -1.086838)
F3_TARGET = (96.1, 100.4, 30.0)

def bbox_for(objects):
    pts=[]
    for o in objects:
        if o.type == "MESH":
            for c in o.bound_box:
                pts.append(o.matrix_world @ Vector(c))
    if not pts:
        return None
    mn=[min(p[i] for p in pts) for i in range(3)]
    mx=[max(p[i] for p in pts) for i in range(3)]
    return {
        "min":[round(float(x),3) for x in mn],
        "max":[round(float(x),3) for x in mx],
        "center":[round(float((mn[i]+mx[i])/2),3) for i in range(3)],
        "size":[round(float(mx[i]-mn[i]),3) for i in range(3)],
    }

before=set(o.name for o in bpy.data.objects)
bpy.ops.import_scene.gltf(filepath="municipal.glb")
imported=[o for o in bpy.data.objects if o.name not in before]

coll=bpy.data.collections.get("00_SITE_MUNICIPAL_IMPORTED")
if not coll:
    coll=bpy.data.collections.new("00_SITE_MUNICIPAL_IMPORTED")
    bpy.context.scene.collection.children.link(coll)

for o in imported:
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)

for o in imported:
    if o.type=="MESH":
        for v in o.data.vertices:
            x,y,z=v.co
            v.co=(x,z,-y)
        o.data.update()
    o.rotation_euler=(0,0,0)
    o.location.x += ALIGN_X
    o.location.y += ALIGN_Y

coll["source"]="Ajuntament de Barcelona Barri 06 3D model"
coll["source_crs"]="EPSG:25831"
coll["source_units"]="metres"
coll["source_archive_sha256"]=ARCHIVE_SHA
coll["source_glb_sha256"]=MUNICIPAL_SHA
coll["alignment_coordinate_map"]="imported (x,y,z) -> source axes (x,z,-y)"
coll["alignment_translation_x_m"]=ALIGN_X
coll["alignment_translation_y_m"]=ALIGN_Y
coll["alignment_anchor"]="municipal OSM plaza centroid -> Rev15 Plaza polygon area centroid"
coll["status"]="SITE_TRUTH_CANDIDATE_AUTHORITATIVE_CONTEXT"

scene=bpy.context.scene
proxy=bpy.data.collections.get("CONTEXT")
if proxy:
    proxy.hide_render=True
    proxy["competition_output_status"]="HIDDEN_PENDING_SITE_TRUTH_PROMOTION"
    proxy["audit_status"]="RETAINED_FOR_COMPARISON"

cam_data=bpy.data.cameras.get("A_HERO_MUNICIPAL_F3") or bpy.data.cameras.new("A_HERO_MUNICIPAL_F3")
cam=bpy.data.objects.get("A_HERO_MUNICIPAL_F3")
if not cam:
    cam=bpy.data.objects.new("A_HERO_MUNICIPAL_F3",cam_data)
    scene.collection.objects.link(cam)
cam.location=F3_POS
cam.rotation_euler=F3_ROT
cam.data.lens=32
cam.data.sensor_width=36
scene.camera=cam

scene["gaudi_revision_candidate"]=18
scene["site_truth_candidate_status"]="AUTHORITATIVE_CONTEXT_INTEGRATED_PROMOTION_PENDING"
scene["rev15_sha256"]=REV15_SHA
scene["municipal_glb_sha256"]=MUNICIPAL_SHA
scene["f3_position"]=list(F3_POS)
scene["f3_target"]=list(F3_TARGET)
scene["proxy_context_hidden_for_competition_diagnostics"]=True

bpy.context.view_layer.update()
municipal_bbox=bbox_for(imported)
proxy_objs=[o for o in bpy.data.objects if o.name.startswith("Sagrada_")]
proxy_bbox=bbox_for(proxy_objs)

scene.render.engine="BLENDER_WORKBENCH"
scene.display.shading.light="STUDIO"
scene.display.shading.color_type="MATERIAL"
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.render.image_settings.file_format="PNG"

diag_data=bpy.data.cameras.get("DIAG_TOP_SITE_TRUTH") or bpy.data.cameras.new("DIAG_TOP_SITE_TRUTH")
diag=bpy.data.objects.get("DIAG_TOP_SITE_TRUTH")
if not diag:
    diag=bpy.data.objects.new("DIAG_TOP_SITE_TRUTH",diag_data)
    scene.collection.objects.link(diag)
diag.data.type="ORTHO"
diag.data.ortho_scale=650
diag.location=(30,110,500)
diag.rotation_euler=(0,0,0)
scene.camera=diag
scene.render.resolution_x=900
scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.filepath="//site_truth_top.png"
bpy.ops.render.render(write_still=True)

scene.camera=cam
scene.render.resolution_x=960
scene.render.resolution_y=540
scene.render.filepath="//f3_site_truth_workbench.png"
bpy.ops.render.render(write_still=True)

scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath="rev18_site_truth_candidate.blend")

report={
    "status":"REV18_SITE_TRUTH_CANDIDATE_BUILT_NOT_PROMOTED",
    "base_rev15_sha256":REV15_SHA,
    "municipal_glb_sha256":MUNICIPAL_SHA,
    "municipal_archive_sha256":ARCHIVE_SHA,
    "imported_objects":len(imported),
    "total_objects":len(bpy.data.objects),
    "municipal_collection":"00_SITE_MUNICIPAL_IMPORTED",
    "municipal_bbox":municipal_bbox,
    "proxy_bbox":proxy_bbox,
    "alignment":{
        "coordinate_map":"imported (x,y,z) -> source axes (x,z,-y)",
        "translation_m":[ALIGN_X,ALIGN_Y,0],
        "plan_rotation_deg":0,
        "anchor":"municipal OSM plaza centroid -> Rev15 Plaza polygon area centroid"
    },
    "hero":{
        "camera":"A_HERO_MUNICIPAL_F3",
        "position":list(F3_POS),
        "rotation_euler":list(F3_ROT),
        "lens_mm":32,
        "target":list(F3_TARGET)
    },
    "proxy_context":{
        "retained":True,
        "hidden_from_competition_diagnostics":True
    },
    "promotion_gates_remaining":[
        "municipal topography/levels cross-check",
        "tree/street-furniture cross-check",
        "Passion facade sightline recomputation",
        "shadow recomputation against authoritative context",
        "visual pixel review of F3",
        "canonical binary hash registration"
    ]
}
with open("rev18_site_truth_report.json","w") as f:
    json.dump(report,f,indent=2)
print(json.dumps(report,indent=2))
