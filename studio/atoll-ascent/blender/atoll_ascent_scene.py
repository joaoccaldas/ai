"""Atoll Ascent hero scene generator.

Personal experimental project by a self-taught builder using AI extensively as part
of the learning, research and production process.

Run inside Blender 4.x:
    blender --background --python atoll_ascent_scene.py

The script builds a stylised Addu-inspired connected-island chain, bike course,
swim course and support yacht, then exports a web-ready GLB.

This is an artistic course model, not GIS geometry. Real race routes require
local surveying, permits and operational validation.
"""
import bpy
import math
from mathutils import Vector
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"assets"/"atoll-ascent.glb"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name,color,metallic=0.0,roughness=0.6,emission=None,alpha=1.0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,alpha)
    m.use_nodes=True
    bsdf=m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Metallic'].default_value=metallic
    bsdf.inputs['Roughness'].default_value=roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value=(*emission,1)
        bsdf.inputs['Emission Strength'].default_value=2.0
    return m

sand=mat('Sand',(0.79,0.66,0.40),roughness=.9)
green=mat('Vegetation',(0.05,0.30,0.25),roughness=.92)
roadmat=mat('CourseGold',(0.72,0.48,0.18),metallic=.1,roughness=.35,emission=(0.32,0.14,0.03))
swimmat=mat('SwimGlow',(0.30,0.95,1.0),roughness=.25,emission=(0.08,0.52,0.58))
white=mat('YachtWhite',(0.93,0.95,0.94),metallic=.15,roughness=.24)

nodes=[(-3.6,-.7,1.2),(-2.7,-.3,1.4),(-1.8,.1,1.55),(-.8,.35,1.55),(.25,.45,1.45),(1.35,.25,1.5),(2.45,-.05,1.35),(3.45,-.25,1.05)]
for x,y,s in nodes:
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=s,depth=.18,location=(x,y,0))
    o=bpy.context.object;o.scale.y=.48;o.data.materials.append(sand)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=s*.75,depth=.13,location=(x,y,.14))
    v=bpy.context.object;v.scale.y=.43;v.data.materials.append(green)

def tube(points,radius,material,name):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=4
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for bp,co in zip(spline.bezier_points,points):
        bp.co=Vector(co);bp.handle_left_type=bp.handle_right_type='AUTO'
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(material)

tube([(x,y,.24) for x,y,_ in nodes],.045,roadmat,'BikeCourse')
tube([(-3.9,-1.65,.20),(-2.6,-2.25,.22),(-.8,-1.75,.20),(.7,-2.3,.21),(2.3,-1.65,.20)],.032,swimmat,'SwimCourse')

bpy.ops.mesh.primitive_cube_add(location=(1.8,2.1,.38),scale=(.95,.24,.12))
bpy.context.object.data.materials.append(white)
bpy.ops.mesh.primitive_cube_add(location=(1.95,2.1,.60),scale=(.38,.19,.15))
bpy.context.object.data.materials.append(white)
bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.018,depth=.9,location=(2.06,2.1,1.15))
bpy.context.object.data.materials.append(white)

for i,idx in enumerate((1,3,5,7)):
    x,y,_=nodes[idx]
    bpy.ops.mesh.primitive_torus_add(major_radius=.22,minor_radius=.025,major_segments=36,minor_segments=10,location=(x,y,.48),rotation=(math.pi/2,0,0))
    bpy.context.object.data.materials.append(swimmat if i<3 else roadmat)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_apply=True)
print("Exported",OUT)
