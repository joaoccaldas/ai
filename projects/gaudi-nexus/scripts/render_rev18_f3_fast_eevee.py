import bpy, json, math, time
from mathutils import Vector

CAMERA="A_HERO_MUNICIPAL_F3"
PROXY="CONTEXT"
AZ_DEG=223.0
ALT_DEG=67.0
RES=(320,180)

scene=bpy.context.scene
cam=bpy.data.objects.get(CAMERA)
if cam is None:
    raise SystemExit("Missing F3 camera")
scene.camera=cam

proxy=bpy.data.collections.get(PROXY)
if proxy:
    proxy.hide_render=True
    proxy.hide_viewport=True

# Preserve state in report, then simplify only the review rig.
light_state=[]
for o in bpy.data.objects:
    if o.type=="LIGHT":
        light_state.append({
            "name":o.name,
            "type":o.data.type,
            "energy":float(o.data.energy),
            "hide_render":bool(o.hide_render)
        })
        o.hide_render=True

# Real Barcelona representative sun vector from SOLAR_BASELINE_001.
az=math.radians(AZ_DEG)
alt=math.radians(ALT_DEG)
toward_sun=Vector((
    math.sin(az)*math.cos(alt),
    math.cos(az)*math.cos(alt),
    math.sin(alt)
)).normalized()
ray_dir=-toward_sun

sun_data=bpy.data.lights.get("F3_REVIEW_SUN") or bpy.data.lights.new("F3_REVIEW_SUN","SUN")
sun=bpy.data.objects.get("F3_REVIEW_SUN")
if sun is None:
    sun=bpy.data.objects.new("F3_REVIEW_SUN",sun_data)
    scene.collection.objects.link(sun)
sun.hide_render=False
sun.data.energy=2.2
sun.rotation_mode='QUATERNION'
sun.rotation_quaternion=ray_dir.to_track_quat('-Z','Y')

# Soft camera-side fill for review legibility, explicitly non-solar.
fill_data=bpy.data.lights.get("F3_REVIEW_FILL") or bpy.data.lights.new("F3_REVIEW_FILL","AREA")
fill=bpy.data.objects.get("F3_REVIEW_FILL")
if fill is None:
    fill=bpy.data.objects.new("F3_REVIEW_FILL",fill_data)
    scene.collection.objects.link(fill)
fill.hide_render=False
fill.data.energy=280.0
fill.data.shape='DISK'
fill.data.size=12.0
fill.location=(-23.0,30.0,16.0)
# Aim at intervention / plaza midground.
target=Vector((15.0,62.0,6.0))
fill.rotation_mode='QUATERNION'
fill.rotation_quaternion=(target-fill.location).to_track_quat('-Z','Y')

scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=RES[0]
scene.render.resolution_y=RES[1]
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False

# Disable DOF for the speed/clarity baseline only.
dof_before=bool(cam.data.dof.use_dof)
cam.data.dof.use_dof=False

# Keep world nodes/materials as authored; reduce only rendering overhead we can prove.
# Blender 5.2 properties differ across versions, so modify optional properties only when present.
optional_changes={}
for owner, attr, value in [
    (scene.render,'use_motion_blur',False),
]:
    if hasattr(owner,attr):
        optional_changes[attr]={"before":getattr(owner,attr),"after":value}
        setattr(owner,attr,value)

scene.render.filepath='//f3_fast_eevee.png'
t0=time.time()
bpy.ops.render.render(write_still=True)
elapsed=time.time()-t0

report={
    "status":"REV18_F3_FAST_EEVEE_REVIEW",
    "camera":CAMERA,
    "resolution":list(RES),
    "engine":scene.render.engine,
    "render_seconds":round(elapsed,3),
    "authoritative_municipal_present":bpy.data.collections.get("00_SITE_MUNICIPAL_IMPORTED") is not None,
    "proxy_hidden":bool(proxy.hide_render) if proxy else True,
    "sun":{
        "basis":"SOLAR_BASELINE_001",
        "case":"summer_1500",
        "azimuth_deg":AZ_DEG,
        "altitude_deg":ALT_DEG,
        "energy":sun.data.energy
    },
    "review_fill":{
        "explicitly_non_solar":True,
        "energy":fill.data.energy,
        "size_m":fill.data.size
    },
    "existing_lights_disabled_count":len(light_state),
    "existing_lights":light_state,
    "camera_dof_before":dof_before,
    "camera_dof_review":False,
    "optional_changes":optional_changes,
    "claim_boundary":"Fast material/geometry review rig only. The solar direction is evidence-based; the fill is an explicit review aid. This is not final jury lighting, annual simulation, or hero approval."
}
with open("f3_fast_eevee_report.json","w") as f:
    json.dump(report,f,indent=2)
print(json.dumps(report,indent=2))
