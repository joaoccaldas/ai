import bpy, json, os, sys
from mathutils import Vector

# Usage mirrors render/build.py after "--":
# blender -b scene.blend --python render_winning_candidate.py -- <camera-json> <hour> <w> <h> <samples> <out>
cfg_path,HOUR,W,H,S,OUT=sys.argv[-6],sys.argv[-5],sys.argv[-4],sys.argv[-3],sys.argv[-2],sys.argv[-1]
cfg=json.load(open(cfg_path))
name=cfg.get("id","WINNING_HERO")
cd=bpy.data.cameras.get(name) or bpy.data.cameras.new(name)
co=bpy.data.objects.get(name)
if not co:
    co=bpy.data.objects.new(name,cd)
    bpy.context.scene.collection.objects.link(co)
co.location=Vector(cfg["position"])
co.rotation_euler=Vector(cfg["target"])-co.location
co.rotation_euler=(Vector(cfg["target"])-co.location).to_track_quat("-Z","Y").to_euler()
cd.lens=float(cfg["lens_mm"])
cd.sensor_width=36
bpy.context.scene.camera=co

# Hand off to the established visual pipeline without changing its material/lighting logic.
build=os.path.join(os.path.dirname(os.path.abspath(__file__)),"build.py")
sys.argv=sys.argv[:-6]+[name,HOUR,W,H,S,OUT]
exec(compile(open(build).read(),build,"exec"),globals(),globals())
