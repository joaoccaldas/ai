import bpy, json, time, os

scene=bpy.context.scene
cam=bpy.data.objects.get("A_HERO_MUNICIPAL_F3")
if cam is None:
    raise RuntimeError("A_HERO_MUNICIPAL_F3 not found")
scene.camera=cam

# Fail closed on site truth.
municipal=bpy.data.collections.get("00_SITE_MUNICIPAL_IMPORTED")
if municipal is None:
    raise RuntimeError("Authoritative municipal collection missing")
proxy=bpy.data.collections.get("CONTEXT")
if proxy is not None:
    proxy.hide_render=True

scene.render.engine="BLENDER_EEVEE"
scene.render.image_settings.file_format="PNG"
scene.render.resolution_percentage=100
scene.render.film_transparent=False

# Conservative fast-review settings. Only set Blender 5.2 properties that exist.
quality={}
if hasattr(scene, "eevee"):
    eevee=scene.eevee
    for name,value in [
        ("taa_render_samples",16),
        ("taa_samples",16),
        ("use_gtao",True),
        ("gtao_distance",3),
        ("gtao_factor",1.1),
    ]:
        if hasattr(eevee,name):
            try:
                setattr(eevee,name,value); quality[name]=value
            except Exception:
                pass

# Keep world/material truth unchanged; only preview resolution changes.
renders=[
    ("f3_hero_review_640.png",640,360),
    ("f3_hero_review_960.png",960,540),
]
timings=[]
for filename,w,h in renders:
    scene.render.resolution_x=w
    scene.render.resolution_y=h
    scene.render.filepath=os.path.abspath(filename)
    t0=time.perf_counter()
    bpy.ops.render.render(write_still=True)
    dt=time.perf_counter()-t0
    timings.append({"file":filename,"width":w,"height":h,"seconds":round(dt,3)})
    if not os.path.exists(filename) or os.path.getsize(filename)==0:
        raise RuntimeError(f"Render missing: {filename}")

receipt={
    "status":"F3_FAST_EEVEE_REVIEW_BUILT",
    "camera":"A_HERO_MUNICIPAL_F3",
    "engine":scene.render.engine,
    "municipal_collection_present":True,
    "proxy_context_hidden": bool(proxy is not None and proxy.hide_render),
    "quality_overrides":quality,
    "renders":timings,
    "rule":"Preview settings may change sampling/resolution only. Geometry, camera, transforms and materials remain unchanged.",
    "next_gate":"Inspect pixels, score composition/material truth, then tune only evidence-backed presentation variables."
}
json.dump(receipt,open("f3_hero_review_receipt.json","w"),indent=2)
print(json.dumps(receipt,indent=2))
