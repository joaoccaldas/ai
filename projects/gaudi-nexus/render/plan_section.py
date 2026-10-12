"""Plan and section drawings rendered straight from the derived scene (same geometry as the hero), Workbench engine, no lighting claims.

  blender -b rev17_aligned.blend --python plan_section.py -- plan|section <W> <H> <out.png>

plan   : orthographic, looking straight down, centred on the plaza + basilica relationship.
section: orthographic, looking north (+Y) through a cut plane at y = CUT_Y (near-clip removes everything south of it).
Proxy CONTEXT collection and lights are hidden. Municipal context is shown as massing only.
"""
import bpy, sys, math
a = sys.argv[sys.argv.index('--') + 1:]; MODE, W, H, OUT = a[0], int(a[1]), int(a[2]), a[3]
CUT_Y = 50.0
sc = bpy.context.scene
for n in ('CONTEXT', 'LIGHTS'):
    c = bpy.data.collections.get(n)
    if c: c.hide_render = True; c.hide_viewport = True
for o in bpy.data.objects:
    if o.type == 'LIGHT': o.hide_render = True
cd = bpy.data.cameras.new('PS'); cd.type = 'ORTHO'; co = bpy.data.objects.new('PS', cd); sc.collection.objects.link(co); sc.camera = co
if MODE == 'plan':
    co.location = (25, 70, 500); co.rotation_euler = (0, 0, 0); cd.ortho_scale = 340; cd.clip_start = 1; cd.clip_end = 2000
else:
    off = 400.0; co.location = (-15, CUT_Y - off, 18); co.rotation_euler = (math.radians(90), 0, 0)
    cd.ortho_scale = 78; cd.clip_start = off; cd.clip_end = 2000
# Workbench needs GPU/EGL (absent on the CPU worker): clay-style Cycles with a neutral material override and a low-sample AO-like world instead.
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.cycles.max_bounces = 3
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.film_transparent = False
clay = bpy.data.materials.new('CLAY'); clay.use_nodes = True; clay.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.80, 0.78, 0.74, 1); clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
_n = clay.node_tree; _g = _n.nodes.new('ShaderNodeNewGeometry'); _wh = _n.nodes.new('ShaderNodeBsdfDiffuse'); _wh.inputs['Color'].default_value = (0.88, 0.87, 0.84, 1)
_mx = _n.nodes.new('ShaderNodeMixShader'); _n.links.new(_g.outputs['Backfacing'], _mx.inputs[0]); _n.links.new(_n.nodes['Principled BSDF'].outputs['BSDF'], _mx.inputs[1]); _n.links.new(_wh.outputs['BSDF'], _mx.inputs[2]); _n.links.new(_mx.outputs['Shader'], _n.nodes['Material Output'].inputs['Surface'])   # open-top municipal tubes expose back faces: draw them as paper, not black
bpy.context.view_layer.material_override = clay
sun = bpy.data.lights.new('S', 'SUN'); sun.energy = 2.2; so = bpy.data.objects.new('S', sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(50), 0, math.radians(235))
w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True; bgn = w.node_tree.nodes['Background']; bgn.inputs['Color'].default_value = (0.93, 0.92, 0.89, 1); bgn.inputs['Strength'].default_value = 0.55
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.9
sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = OUT; bpy.ops.render.render(write_still=True); print('DRAWN', MODE, OUT)
