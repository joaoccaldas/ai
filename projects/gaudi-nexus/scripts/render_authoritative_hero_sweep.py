import bpy, json, math, os
from mathutils import Vector

scene=bpy.context.scene
municipal=bpy.data.collections.get("00_SITE_MUNICIPAL_IMPORTED")
if municipal is None:
    raise RuntimeError("Authoritative municipal context missing")
proxy=bpy.data.collections.get("CONTEXT")
if proxy:
    proxy.hide_render=True

scene.render.engine="BLENDER_WORKBENCH"
scene.display.shading.light="STUDIO"
scene.display.shading.color_type="MATERIAL"
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.render.image_settings.file_format="PNG"
scene.render.resolution_percentage=100
scene.render.resolution_x=480
scene.render.resolution_y=270

candidates=[
    {"id":"C01","pos":(-28,32,1.56),"target":(96.1,100.4,24),"lens":32},
    {"id":"C02","pos":(-24,36,1.56),"target":(96.1,100.4,24),"lens":32},
    {"id":"C03","pos":(-20,38,1.56),"target":(96.1,100.4,24),"lens":32},
    {"id":"C04","pos":(-15,42,1.56),"target":(96.1,100.4,24),"lens":32},
    {"id":"C05","pos":(-10,46,1.56),"target":(96.1,100.4,24),"lens":32},
    {"id":"C06","pos":(-6,50,1.56),"target":(96.1,100.4,24),"lens":32},
    {"id":"C07","pos":(-24,36,1.56),"target":(96.1,100.4,20),"lens":28},
    {"id":"C08","pos":(-20,40,1.56),"target":(96.1,100.4,20),"lens":28},
    {"id":"C09","pos":(-15,44,1.56),"target":(96.1,100.4,20),"lens":28},
    {"id":"C10","pos":(-10,48,1.56),"target":(96.1,100.4,20),"lens":28},
    {"id":"C11","pos":(-20,38,1.56),"target":(96.1,100.4,28),"lens":35},
    {"id":"C12","pos":(-10,46,1.56),"target":(96.1,100.4,28),"lens":35},
]

cam_data=bpy.data.cameras.get("HERO_SWEEP") or bpy.data.cameras.new("HERO_SWEEP")
cam=bpy.data.objects.get("HERO_SWEEP")
if not cam:
    cam=bpy.data.objects.new("HERO_SWEEP",cam_data)
    scene.collection.objects.link(cam)
scene.camera=cam
cam.data.sensor_width=36

receipts=[]
for c in candidates:
    cam.location=c["pos"]
    target=Vector(c["target"])
    direction=target-cam.location
    cam.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    cam.data.lens=c["lens"]
    scene.render.filepath=os.path.abspath(f"hero_sweep_{c['id']}.png")
    bpy.ops.render.render(write_still=True)
    receipts.append({
        **c,
        "rotation_euler":[round(float(v),6) for v in cam.rotation_euler],
        "file":f"hero_sweep_{c['id']}.png"
    })

json.dump({
    "status":"AUTHORITATIVE_HERO_SWEEP_RENDERED",
    "scene_rule":"Rev18 site truth; no geometry changes; proxy context hidden",
    "eye_height_m":1.56,
    "candidate_count":len(receipts),
    "candidates":receipts,
    "selection_rule":"Prefer strongest civic-threshold/Sagrada dialogue, human scale and legibility. Do not optimize by hiding or moving architecture."
},open("hero_sweep_receipt.json","w"),indent=2)
print(json.dumps(receipts,indent=2))
