"""Studio 2 Blender production scaffold.

Run in Blender 4.2+ / 5.x:
  blender -b --python studio2/blender/build_world.py -- --out studio2/assets/blender

It creates a compact reusable environment kit and seven act marker props. The web MVP
is procedural Three.js, so these assets can be introduced incrementally without blocking runtime.
"""
import bpy, math, os, sys

OUT = os.path.abspath(sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '//../assets/blender')
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, color, rough=.7, metal=0, emission=None):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    if emission:
        bs.inputs['Emission Color'].default_value=(*emission,1);bs.inputs['Emission Strength'].default_value=2.0
    return m
STONE=mat('Basalt',(0.09,.085,.075),.95);WOOD=mat('AgedWood',(.22,.12,.065),.82);METAL=mat('PaintedMetal',(.08,.09,.11),.45,.55);CRT=mat('CRT',(.02,.08,.07),.35,.2,(.12,.8,.55));MOON=mat('Moon',(.65,.72,.9),.3,0,(.55,.65,1.0))

def cube(name, loc, scale, material, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('soft edges','BEVEL');mod.width=bevel;mod.segments=2
    return o

def torus(name, loc, major, minor, material, rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=64,minor_segments=8,location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(material);return o

cube('ground',(0,-.12,0),(8,.12,8),STONE,0)

for i in range(10):
    a=i/10*math.tau
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.9+(i%3)*.2,location=(math.cos(a)*5,.6,math.sin(a)*5))
    bpy.context.object.data.materials.append(STONE)
cube('cave_altar',(0,.25,-1),(1.6,.22,.8),STONE)

for i in range(4):
    cube(f'workbench_{i}',(-3+i*2,1,1),(0.8,.08,.45),WOOD)
    cube(f'crt_{i}',(-3+i*2,1.5,.8),(.35,.25,.08),CRT)

for i in range(12):
    x=(i%4-1.5)*1.3;z=-3-(i//4)*1.5;cube(f'grave_{i}',(x,.65,z),(.35,.65,.09),STONE)

NEON=mat('ArcadeNeon',(.2,.03,.15),.3,.2,(1,.08,.55))
for i in range(6):
    x=(i-2.5)*1.2
    cube(f'cabinet_{i}',(x,.9,3),(.38,.9,.36),METAL)
    cube(f'screen_{i}',(x,1.15,2.62),(.25,.23,.02),NEON)

for i in range(5):
    torus(f'orbit_{i}',(0,1.7,0),1.4+i*.42,.012,CRT,(.35+i*.12,.2+i*.16,0))
bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=1.0,location=(0,1.7,0))
bpy.context.object.data.materials.append(MOON)

for x in range(-3,4):
    h=1.0+(abs(x)%3)*.45
    cube(f'data_tower_{x}',(x*1.0,h/2,5),(.28,h/2,.28),METAL)
    cube(f'data_node_{x}',(x*1.0,h+.12,5),(.07,.07,.07),CRT)

for i in range(7):
    torus(f'horizon_arch_{i}',((i-3)*1.25,1.2,7-i*.5),1.0+i*.08,.012,MOON,(math.pi/2,0,math.pi/2))

bpy.ops.object.light_add(type='AREA',location=(4,7,3));bpy.context.object.data.energy=1200;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.light_add(type='POINT',location=(-3,2,-2));bpy.context.object.data.energy=500;bpy.context.object.data.color=(1,.45,.18)

out=os.path.join(OUT,'studio2_worldkit.glb')
bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',export_apply=True,export_extras=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT')
print('wrote',out)
