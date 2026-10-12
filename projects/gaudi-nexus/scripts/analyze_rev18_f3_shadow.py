import bpy, json, math
from mathutils import Vector

CAMERA="A_HERO_MUNICIPAL_F3"
TARGET=Vector((96.1,100.4,30.0))
MUNICIPAL="00_SITE_MUNICIPAL_IMPORTED"
PROXY="CONTEXT"

scene=bpy.context.scene
deps=bpy.context.evaluated_depsgraph_get()
cam=bpy.data.objects.get(CAMERA)
if cam is None:
    raise SystemExit("Missing F3 camera")
origin=cam.matrix_world.translation.copy()

# Remove legacy proxy from the diagnostic so it cannot mask authoritative geometry.
proxy=bpy.data.collections.get(PROXY)
if proxy:
    proxy.hide_viewport=True
    proxy.hide_render=True
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()

def colls(o):
    return sorted(c.name for c in o.users_collection) if o else []

# Rebuild the same 3x3 target window used by the sightline gate and capture
# the actual first-hit municipal surface points visible from F3.
direction=(TARGET-origin).normalized()
up=Vector((0,0,1))
side=direction.cross(up)
if side.length < 1e-8:
    side=Vector((1,0,0))
else:
    side.normalize()

surface_samples=[]
for lateral in (-4.0,0.0,4.0):
    for vertical in (-4.0,0.0,4.0):
        intended=TARGET + side*lateral + up*vertical
        v=intended-origin
        d=v.length
        h,loc,n,fi,o,m=scene.ray_cast(deps,origin,v.normalized(),distance=d*1.05)
        if h and o and MUNICIPAL in colls(o):
            surface_samples.append({
                "lateral_m":lateral,
                "vertical_m":vertical,
                "point":loc.copy(),
                "normal":n.copy(),
                "object":o.name
            })

if len(surface_samples)!=9:
    raise SystemExit(f"Expected 9 authoritative municipal surface samples, got {len(surface_samples)}")

# Azimuth measured clockwise from north. Scene contract is X=east, Y=north, Z=up.
cases=[
    ("summer_0900",82.0,28.0),
    ("summer_1200",119.0,60.0),
    ("summer_1500",223.0,67.0),
    ("winter_0900",129.0,6.0),
    ("winter_1200",168.0,24.0),
    ("winter_1500",212.0,18.0),
]

def sun_dir(az_deg,alt_deg):
    az=math.radians(az_deg); alt=math.radians(alt_deg)
    return Vector((
        math.sin(az)*math.cos(alt),
        math.cos(az)*math.cos(alt),
        math.sin(alt)
    )).normalized()

case_reports=[]
total_non_municipal=0
for name,az,alt in cases:
    sd=sun_dir(az,alt)
    samples=[]
    direct=municipal_self=non_municipal=0
    for s in surface_samples:
        # Advance slightly toward the sun to avoid counting the originating triangle.
        start=s["point"] + sd*0.20
        h,loc,n,fi,o,m=scene.ray_cast(deps,start,sd,distance=500.0)
        if not h:
            category="DIRECT_SKY"
            direct+=1
        elif o and MUNICIPAL in colls(o):
            category="MUNICIPAL_SELF_OR_URBAN_OCCLUSION"
            municipal_self+=1
        else:
            category="NON_MUNICIPAL_SHADOW_BLOCKER"
            non_municipal+=1
            total_non_municipal+=1
        samples.append({
            "lateral_m":s["lateral_m"],
            "vertical_m":s["vertical_m"],
            "surface_point":[round(float(x),3) for x in s["point"]],
            "category":category,
            "first_hit_object":o.name if h and o else None,
            "first_hit_collections":colls(o) if h and o else [],
            "blocker_distance_m":round((loc-start).length,3) if h else None
        })
    case_reports.append({
        "case":name,
        "azimuth_deg":az,
        "altitude_deg":alt,
        "direct_sky_count":direct,
        "municipal_self_or_urban_count":municipal_self,
        "non_municipal_blocker_count":non_municipal,
        "samples":samples
    })

report={
    "status":"REV18_F3_AUTHORITATIVE_SHADOW_DIAGNOSTIC",
    "camera":CAMERA,
    "surface_sample_count":len(surface_samples),
    "solar_basis":"SOLAR_BASELINE_001 representative Barcelona vectors",
    "scene_axes":"X=east, Y=north, Z=up",
    "proxy_context_excluded":True,
    "cases":case_reports,
    "summary":{
        "case_count":len(case_reports),
        "ray_count":len(case_reports)*len(surface_samples),
        "non_municipal_shadow_blocker_count":total_non_municipal,
        "verdict":"NO_NON_MUNICIPAL_SHADOW_BLOCKERS_ON_TESTED_F3_MUNICIPAL_SURFACES" if total_non_municipal==0 else "NON_MUNICIPAL_SHADOW_BLOCKERS_DETECTED"
    },
    "interpretation_policy":"This tests whether non-municipal scene geometry blocks representative Barcelona sun vectors from the authoritative municipal surface visible in F3. Municipal self/urban occlusion is reported separately. It is a seasonal geometric shadow diagnostic, not annual daylight, thermal-comfort or certification evidence."
}
with open("rev18_f3_shadow_report.json","w") as f:
    json.dump(report,f,indent=2)
print(json.dumps(report,indent=2))
