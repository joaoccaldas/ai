# Atoll Ascent Maldives
# Blender source generator for the concept hero asset.
# Run: blender -b -P build_atoll_ascent.py
# Output: ../assets/atoll-ascent.glb
#
# Personal project by João Caldas. Built as part of self-directed learning with
# extensive AI-assisted iteration. The exported model is illustrative, not a
# surveyed geographic model.

import bpy, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(ROOT, "..", "assets", "atoll-ascent.glb"))

bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, color, metallic=0.0, roughness=0.55, emission=None):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    bs=m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value=(*color,1)
    bs.inputs["Metallic"].default_value=metallic
    bs.inputs["Roughness"].default_value=roughness
    if emission:
        bs.inputs["Emission Color"].default_value=(*emission,1)
        bs.inputs["Emission Strength"].default_value=.7
    return m

WATER=mat("Lagoon",(0.02,0.38,0.46),0.05,0.15)
SAND=mat("Coral Sand",(0.77,0.70,0.48),0.0,0.85)
GREEN=mat("Island Canopy",(0.06,0.29,0.20),0.0,0.95)
WHITE=mat("Yacht White",(0.9,0.9,0.87),0.15,0.28)
GLASS=mat("Yacht Glass",(0.03,0.14,0.18),0.45,0.12)
GOLD=mat("Course Gold",(0.85,0.62,0.23),0.2,0.32,(0.35,0.16,0.02))
SURF=mat("Surfboard",(0.88,0.67,0.32),0.0,0.4)

bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=13.5, depth=.12, location=(0,0,-.2))
bpy.context.object.name="Lagoon"
bpy.context.object.data.materials.append(WATER)

for i in range(20):
    a=(i/20.0)*math.tau-.42
    r=7.2+math.sin(i*1.67)*.5
    x=math.cos(a)*r*1.17
    y=math.sin(a)*r*.82
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(x,y,.05))
    island=bpy.context.object
    island.name="Island_%02d"%i
    island.scale=(1.0+((i%3)*.14),.38+((i%2)*.08),.13)
    island.rotation_euler[2]=-a+.35
    island.data.materials.append(SAND)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, location=(x,y,.18))
    canopy=bpy.context.object
    canopy.name="Canopy_%02d"%i
    canopy.scale=(.82+((i%3)*.10),.31+((i%2)*.06),.10)
    canopy.rotation_euler[2]=-a+.35
    canopy.data.materials.append(GREEN)

pts=[(-5.2,4.8,.32),(-3.0,3.0,.32),(-.8,1.6,.32),(1.7,.2,.32),(4.7,-3.3,.32)]
curve=bpy.data.curves.new("RaceRoute","CURVE")
curve.dimensions="3D"
curve.bevel_depth=.055
curve.bevel_resolution=4
spl=curve.splines.new("BEZIER")
spl.bezier_points.add(len(pts)-1)
for p,co in zip(spl.bezier_points,pts):
    p.co=co
    p.handle_left_type="AUTO"
    p.handle_right_type="AUTO"
route=bpy.data.objects.new("RaceRoute",curve)
bpy.context.collection.objects.link(route)
curve.materials.append(GOLD)

def cube(name,loc,scale,material):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object
    o.name=name
    o.scale=scale
    o.data.materials.append(material)
    return o

hull=cube("YachtHull",(0,-5.2,.45),(1.55,.42,.16),WHITE)
hull.rotation_euler[2]=.12
deck=cube("YachtDeck",(.05,-5.18,.77),(.82,.32,.18),WHITE)
deck.rotation_euler[2]=.12
cabin=cube("YachtGlass",(.18,-5.16,1.02),(.42,.29,.12),GLASS)
cabin.rotation_euler[2]=.12

bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(6.3,1.7,.45))
board=bpy.context.object
board.name="Surfboard"
board.scale=(1.0,.22,.05)
board.rotation_euler=(0,.08,.55)
board.data.materials.append(SURF)

for idx,co in enumerate((pts[0],pts[-1])):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.17,depth=.55,location=(co[0],co[1],.55))
    marker=bpy.context.object
    marker.name="Marker_%d"%idx
    marker.data.materials.append(GOLD)

bpy.ops.object.light_add(type="SUN",location=(-8,-3,12))
bpy.context.object.data.energy=3
bpy.context.object.rotation_euler=(math.radians(25),math.radians(-20),math.radians(-30))
bpy.ops.object.light_add(type="AREA",location=(4,-1,10))
bpy.context.object.data.energy=900
bpy.context.object.data.shape="DISK"
bpy.context.object.data.size=9

bpy.ops.object.camera_add(location=(0,-17,13))
cam=bpy.context.object
bpy.context.scene.camera=cam
direction=Vector((0,0,0))-cam.location
cam.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
cam.data.lens=48

try:
    bpy.context.scene.render.engine="BLENDER_EEVEE_NEXT"
except:
    bpy.context.scene.render.engine="BLENDER_EEVEE"

bpy.context.scene.world.color=(0.015,0.05,0.07)
bpy.context.scene.render.resolution_x=1600
bpy.context.scene.render.resolution_y=1000
bpy.context.scene.render.resolution_percentage=100

os.makedirs(os.path.dirname(OUT),exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT,export_format="GLB",export_apply=True)
print("Wrote",OUT)
