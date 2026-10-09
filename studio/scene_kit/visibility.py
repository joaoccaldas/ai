"""Sample camera clearance against render-visible geometry without rendering.

This rejects obvious enclosures/nearby full-frame obstructions. It is not a
visual-quality, whole-frustum visibility, or building-compliance certificate.
Viewport flags are temporary and restored; the saved scene is not modified.
"""
from contextlib import contextmanager
import bpy
from mathutils import Vector


@contextmanager
def render_geometry(scene, exclude=('HAZE',)):
    collections = [(c,c.hide_viewport) for c in bpy.data.collections]
    objects = [(o,o.hide_viewport,o.hide_get()) for o in scene.objects]
    try:
        for c,_ in collections:
            c.hide_viewport = c.hide_render
        for o,_,_ in objects:
            o.hide_viewport = o.hide_render or o.name in exclude
            if o.name in bpy.context.view_layer.objects:
                o.hide_set(False)
        bpy.context.view_layer.update()
        yield bpy.context.evaluated_depsgraph_get()
    finally:
        for c,state in collections:
            c.hide_viewport = state
        for o,viewport,hidden in objects:
            o.hide_viewport = viewport
            if o.name in bpy.context.view_layer.objects:
                o.hide_set(hidden)
        bpy.context.view_layer.update()


def camera_clearance(scene, camera, depsgraph, near_m=.8, full_frame_m=5.):
    samples = []
    rotation = camera.matrix_world.to_quaternion()
    for x in (-.25,0,.25):
        for y in (-.15,0,.15):
            direction = (rotation @ Vector((x,y,-1))).normalized()
            hit,point,normal,index,obj,matrix = scene.ray_cast(
                depsgraph,camera.matrix_world.translation,direction,distance=500)
            distance = (point-camera.matrix_world.translation).length if hit else None
            samples.append({'x':x,'y':y,'first_hit':obj.name if hit else None,
                            'distance_m':round(distance,4) if hit else None})
    blocked_near = any(s['distance_m'] is not None and s['distance_m']<near_m for s in samples)
    hits = [s for s in samples if s['distance_m'] is not None]
    same_near = len(hits)==9 and len({s['first_hit'] for s in hits})==1 and max(s['distance_m'] for s in hits)<full_frame_m
    return {'camera':camera.name,'status':'FAIL_OBSTRUCTED' if blocked_near or same_near else 'PASS_SAMPLED_CLEARANCE',
            'near_limit_m':near_m,'full_frame_limit_m':full_frame_m,'samples':samples,
            'limits':'Nine inner-cone rays; does not prove whole-frustum visibility or visual quality.'}
