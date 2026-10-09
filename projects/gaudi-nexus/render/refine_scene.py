"""Pixel-review-driven scene refinement; no renderer and no source transforms changed.

Municipal context stays massing. Planting is a design proposal, not a survey.
All views use the same deterministic layout. Portable shared generators own assets.
"""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from studio.scene_kit import materials as M
from studio.scene_kit.landscape import planted_island
from studio.scene_kit.vegetation import holm_oak, instance_tree
from studio.scene_kit.visibility import render_geometry, camera_clearance
from procassets.figures import person
from procassets.contacts import settle_on_supports


def refine():
    scene = bpy.context.scene
    coll = bpy.data.collections.new('VIS_Refinement_20261009')
    scene.collection.children.link(coll)
    anchor = bpy.data.objects.new('VIS_MetreCoordinates', None)
    coll.objects.link(anchor)
    anchor['coordinate_units'] = 'metres'
    palette = {
        'PlazaSlabs': M.paving('VIS_DryCivicStone', anchor),
        'Ceramic': M.glaze('VIS_HoneyGlaze', anchor),
        'Stone': M.mineral('VIS_WarmMineralStructure', anchor, (.48,.43,.35)),
        'Tile': M.mineral('VIS_TerracottaVault', anchor, (.34,.16,.075), scale=8, roughness=.68),
        'MuniLimestone': M.mineral('VIS_MunicipalMassing', anchor, (.56,.51,.43), scale=.18, roughness=.84),
        'Chalkboard': M.surface('VIS_QuietChalkboard', (.027,.035,.031), .89)[0],
    }
    changed = []
    for obj in scene.objects:
        if obj.type != 'MESH':
            continue
        for slot in obj.material_slots:
            if slot.material and slot.material.name in palette:
                # Object-linked assignment preserves source mesh/material data.
                key = slot.material.name
                slot.link = 'OBJECT'
                slot.material = palette[key]
                changed.append({'object': obj.name, 'replaced_material': key})
    street = bpy.data.objects.get('Street_Base')
    if street and street.material_slots:
        street.material_slots[0].link = 'OBJECT'
        street.material_slots[0].material = M.mineral('VIS_StreetAsphalt', anchor, (.075,.083,.087), 30, .86)
    # Hero-specific wet props were authored for the old wet scene; retain for audit.
    wet_hidden = []
    for obj in scene.objects:
        if obj.type == 'MESH' and any(s.material and s.material.name == 'HeroWetStone' for s in obj.material_slots):
            obj.hide_render = True
            wet_hidden.append(obj.name)
    soil = M.mineral('VIS_PlantingSoil', anchor, (.075,.052,.027), 90, .96)
    wood = M.timber('VIS_SeatTimber', anchor)
    steel = M.surface('VIS_SeatSteel', (.04,.046,.04), .45, .7)[0]
    herbs = [M.foliage('VIS_HerbGreen', (.12,.19,.055)),
             M.foliage('VIS_SilverHerb', (.25,.30,.18)),
             M.surface('VIS_Lavender', (.22,.12,.31), .72)[0]]
    leaves = [M.foliage('VIS_OakLeaf_'+str(i), c) for i,c in enumerate(
        [(.055,.095,.025),(.10,.15,.045),(.16,.20,.07),(.23,.26,.10)])]
    bark = M.mineral('VIS_OakBark', anchor, (.15,.12,.08), 25, .9)
    prototypes = [holm_oak('VIS_OakPrototype_'+str(i), coll, bark, leaves, 810+i, 'hero') for i in range(3)]
    for pair in prototypes:
        for obj in pair:
            obj.hide_render = True
    # Replace derived plane-tree approximations only; original trees stay preserved.
    for obj in list(scene.objects):
        if obj.name.startswith('Platane_'):
            obj.hide_render = True
    plaza = bpy.data.objects['Plaza']
    inverse = plaza.matrix_world.inverted()
    axis_origin = Vector((-15,42))
    axis = (Vector((96.1,100.4))-axis_origin).normalized()
    beds = []
    positions = [(-35,-8),(-15,-28),(15,-18),(34,4),(32,32),(22,40)]
    for i,(x,y) in enumerate(positions):
        bed = planted_island('VIS_SeatingGarden_%02d'%i, coll,
            [palette['Stone'],soil,wood,steel,*herbs], seed=910+i)
        bed.location = (x,y,.005)
        bed.rotation_euler.z = math.radians(44.14)
        bpy.context.view_layer.update()
        for vertex in bed.data.vertices:
            point = bed.matrix_world @ vertex.co
            hit,loc,normal,index = plaza.ray_cast(inverse @ Vector((point.x,point.y,5)), Vector((0,0,-1)))
            if not hit:
                raise ValueError('Planting leaves plaza footprint: '+bed.name)
        distance = abs(axis.x*(y-axis_origin.y)-axis.y*(x-axis_origin.x))
        if distance < 7:
            raise ValueError('Planting centre enters F3 corridor')
        instance_tree(prototypes[i%3], 'VIS_GardenOak_%02d'%i, (x,y,.005), coll,
                      rotation=i*2.39996, scale=.86+(i%3)*.06)
        beds.append({'name':bed.name,'center_m':[x,y],'footprint_on_existing_plaza':True,
                     'distance_from_F3_axis_m':round(distance,3),'seat_height_m':.46})
    existing_positions = [(-33,44),(-56,46),(-40,62),(-7,18),(6,38),(-18,70),(9,58)]
    for i,(x,y) in enumerate(existing_positions):
        instance_tree(prototypes[i%3], 'VIS_ExistingLayoutOak_%02d'%i, (x,y,.005), coll,
                      rotation=i*2.39996, scale=1.05+(i%3)*.05)
    # Market activity remains in fixed world positions, clear of the central aisle.
    yaw = math.radians(44.14)
    def local(x,y):
        return (-50+x*math.cos(yaw)-y*math.sin(yaw),
                 20+x*math.sin(yaw)+y*math.cos(yaw))
    citizens = []
    for i,(x,y) in enumerate([(-10,1.25),(-6,-1.25),(-2,1.25),(3,-1.25),(7,1.25),(11,-1.25),
                             (-10,3.5),(-2,-3.5),(7,3.5),(13,-3.5)]):
        wx,wy = local(x,y)
        obj = person('VIS_MarketCitizen_%02d'%i, wx,wy,.04,
                     yaw+(math.pi if y>0 else 0), h=1.62+(i%5)*.045,
                     seed=410+i, pose='stand',carry=False)
        obj['representation'] = 'illustrative procedural citizen, static pose'
        citizens.append(obj)
    contacts = settle_on_supports(citizens, [plaza], max_shift_m=.5)
    if any(r['status'] != 'SETTLED' for r in contacts):
        raise ValueError('Market citizens have unresolved ground contacts: '+repr(contacts))
    # New arrival camera complements, rather than overwrites, registered F3.
    views = [
        ('HERO_ARRIVAL',(-75,-25,1.56),(5,58,25),32),
        ('MARKET_AISLE',(*local(-9,0),1.56),(*local(12,0),2.0),32),
        ('PLAZA_OBLIQUE',(-105,-80,58),(-7,25,3),38),
    ]
    for name,pos,target,lens in views:
        data = bpy.data.cameras.new(name)
        data.lens = lens
        data.sensor_width = 36
        data.clip_end = 1500
        data.dof.use_dof = False
        obj = bpy.data.objects.new(name,data)
        coll.objects.link(obj)
        obj.location = pos
        obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
        obj['status'] = 'DESIGN_DEVELOPMENT_CAMERA_NOT_REGISTERED_HERO_APPROVAL'
    bpy.context.view_layer.update()
    with render_geometry(scene) as dg:
        clearance = [camera_clearance(scene,bpy.data.objects[name],dg) for name in
                     ['HERO_F3','HERO_ARRIVAL','MARKET_AISLE','PLAZA_OBLIQUE']]
    if any(r['status']!='PASS_SAMPLED_CLEARANCE' for r in clearance):
        raise ValueError('Camera obstruction: '+repr(clearance))
    # Projection is a geometric diagnostic, not visibility or a visual-quality score.
    scene.render.resolution_x,scene.render.resolution_y = 1200,900
    projection = {}
    for name,_,_,_ in views:
        cam = bpy.data.objects[name]
        projection[name] = {}
        for label,point in {'market_center':(-50,20,3),'civic_center':(-15,50,3),
                            'municipal_target':(96.1,100.4,30),'municipal_height_check':(96.1,100.4,120)}.items():
            v = world_to_camera_view(scene,cam,Vector(point))
            projection[name][label] = [round(float(k),4) for k in v]
    return {'version':'2026-10-09-v3','materials':changed,'wet_props_hidden':wet_hidden,
            'planting':beds,'tree_count':13,'shared_oak_variants':3,'market_people':len(citizens),
            'market_people_contacts':contacts,'camera_projection':projection,'camera_clearance':clearance,
            'limits':['Planting positions are design proposals, not surveyed inventory.',
                      'Municipal geometry remains low-detail massing.',
                      'Static contacts are not human motion or crowd simulation.',
                      'Architecture coordination prototype is not integrated or certified.']}
