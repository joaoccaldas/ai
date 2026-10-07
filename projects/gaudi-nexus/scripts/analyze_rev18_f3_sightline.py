import bpy, json, math
from mathutils import Vector

CAMERA_NAME="A_HERO_MUNICIPAL_F3"
TARGET=Vector((96.1,100.4,30.0))
MUNICIPAL_COLLECTION="00_SITE_MUNICIPAL_IMPORTED"

scene=bpy.context.scene
deps=bpy.context.evaluated_depsgraph_get()
cam=bpy.data.objects.get(CAMERA_NAME)
if cam is None:
    raise SystemExit(f"Missing camera {CAMERA_NAME}")

origin=cam.matrix_world.translation.copy()
vec=TARGET-origin
target_distance=vec.length
direction=vec.normalized()

# Stop just before the target point. Any hit here is an obstruction between eye and intended target.
epsilon=0.05
hit, location, normal, face_index, obj, matrix = scene.ray_cast(
    deps, origin, direction, distance=max(0.0,target_distance-epsilon)
)

def collections(o):
    return sorted(c.name for c in o.users_collection) if o else []

pre_target = {
    "hit": bool(hit),
    "object": obj.name if hit and obj else None,
    "collections": collections(obj) if hit and obj else [],
    "distance_m": round((location-origin).length,4) if hit else None,
    "target_distance_m": round(target_distance,4),
    "distance_ratio": round((location-origin).length/target_distance,6) if hit else None
}

if hit:
    verdict="BLOCKED_BEFORE_TARGET"
else:
    verdict="CLEAR_TO_TARGET_POINT"

# Extended ray: diagnostic only. It helps identify whether the first geometry beyond the target
# belongs to authoritative municipal context. This does not change the clear/block verdict above.
ext_distance=target_distance*1.35
hit2, location2, normal2, face_index2, obj2, matrix2 = scene.ray_cast(
    deps, origin, direction, distance=ext_distance
)
extended={
    "hit":bool(hit2),
    "object":obj2.name if hit2 and obj2 else None,
    "collections":collections(obj2) if hit2 and obj2 else [],
    "distance_m":round((location2-origin).length,4) if hit2 else None,
    "distance_ratio_to_target":round((location2-origin).length/target_distance,6) if hit2 else None,
    "is_authoritative_municipal": bool(hit2 and obj2 and MUNICIPAL_COLLECTION in collections(obj2))
}

# Sample a small 3x3 target window to avoid overinterpreting one exact point.
# Offsets are in world Z and lateral XY approximately perpendicular to the view vector.
up=Vector((0,0,1))
side=direction.cross(up)
if side.length < 1e-8:
    side=Vector((1,0,0))
else:
    side.normalize()
samples=[]
for lateral in (-4.0,0.0,4.0):
    for vertical in (-4.0,0.0,4.0):
        t=TARGET + side*lateral + up*vertical
        v=t-origin
        d=v.length
        dr=v.normalized()
        h,loc,n,fi,o,m=scene.ray_cast(deps,origin,dr,distance=max(0.0,d-epsilon))
        samples.append({
            "lateral_m":lateral,
            "vertical_m":vertical,
            "target":[round(float(x),3) for x in t],
            "clear_to_target":not bool(h),
            "blocking_object":o.name if h and o else None,
            "blocking_collections":collections(o) if h and o else [],
            "hit_distance_m":round((loc-origin).length,3) if h else None,
            "target_distance_m":round(d,3)
        })

clear_count=sum(1 for s in samples if s["clear_to_target"])
report={
    "status":"REV18_F3_SIGHTLINE_DIAGNOSTIC",
    "camera":CAMERA_NAME,
    "origin":[round(float(x),3) for x in origin],
    "target":[round(float(x),3) for x in TARGET],
    "lens_mm":round(cam.data.lens,3),
    "pre_target":pre_target,
    "verdict":verdict,
    "extended_ray":extended,
    "target_window":{
        "sample_count":len(samples),
        "clear_count":clear_count,
        "blocked_count":len(samples)-clear_count,
        "samples":samples
    },
    "interpretation_policy":"A CLEAR_TO_TARGET_POINT verdict means Blender found no scene geometry between F3 eye position and the intended Sagrada target point. The 3x3 window is a robustness diagnostic, not a code-compliance or final visual-quality claim."
}
with open("rev18_f3_sightline_report.json","w") as f:
    json.dump(report,f,indent=2)
print(json.dumps(report,indent=2))
