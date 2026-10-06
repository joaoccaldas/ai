"""NOAA approximate solar geometry and reproducible photographic render presets."""
import math
import datetime
import bpy
from mathutils import Vector


def sun_position(latitude,longitude,date,local_hour,utc_offset):
    day=datetime.date.fromisoformat(date).timetuple().tm_yday
    gamma=2*math.pi/365*(day-1+(local_hour-12)/24)
    eq=229.18*(.000075+.001868*math.cos(gamma)-.032077*math.sin(gamma)-.014615*math.cos(2*gamma)-.040849*math.sin(2*gamma))
    dec=.006918-.399912*math.cos(gamma)+.070257*math.sin(gamma)-.006758*math.cos(2*gamma)+.000907*math.sin(2*gamma)-.002697*math.cos(3*gamma)+.00148*math.sin(3*gamma)
    ha=math.radians((local_hour*60+eq+4*longitude-60*utc_offset)/4-180)
    lat=math.radians(latitude)
    east=-math.cos(dec)*math.sin(ha)
    north=math.sin(dec)*math.cos(lat)-math.cos(dec)*math.cos(ha)*math.sin(lat)
    up=math.sin(lat)*math.sin(dec)+math.cos(lat)*math.cos(dec)*math.cos(ha)
    return Vector((east,north,up)),math.degrees(math.asin(up)),math.degrees(math.atan2(east,north))%360


def daylight(scene,collection,latitude,longitude,date,hour,utc_offset):
    direction,alt,az=sun_position(latitude,longitude,date,hour,utc_offset)
    sun_data=bpy.data.lights.new('SK_Daylight','SUN');sun_data.energy=4.0
    sun_data.angle=math.radians(.526);sun_data.color=(1,.89,.73)
    sun=bpy.data.objects.new('SK_Daylight',sun_data);collection.objects.link(sun)
    sun.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
    world=bpy.data.worlds.new('SK_Barcelona_Daylight');world.use_nodes=True
    scene.world=world;n=world.node_tree.nodes;n.clear()
    sky=n.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING';sky.sun_disc=False
    sky.sun_elevation=math.radians(alt);sky.sun_rotation=math.radians(az)
    sky.altitude=33;sky.air_density=1;sky.aerosol_density=.8;sky.ozone_density=1
    bg=n.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.13
    out=n.new('ShaderNodeOutputWorld');world.node_tree.links.new(sky.outputs[0],bg.inputs[0]);world.node_tree.links.new(bg.outputs[0],out.inputs[0])
    return {'latitude_deg':latitude,'longitude_deg':longitude,'date':date,'local_hour':hour,'utc_offset_hours':utc_offset,'altitude_deg':alt,'azimuth_deg':az,'model':'NOAA fractional-year approximation','weather':'assumed clear sky; not historical weather','sun_strength':4.0,'sky_strength':.13}


def render_preset(scene,width=1280,samples=64,device='METAL'):
    scene.render.engine='CYCLES';scene.cycles.samples=samples
    scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.035
    scene.cycles.use_denoising=True;scene.cycles.max_bounces=8
    scene.cycles.diffuse_bounces=3;scene.cycles.glossy_bounces=4
    scene.cycles.transmission_bounces=6;scene.cycles.transparent_max_bounces=4
    scene.cycles.use_light_tree=True
    selected=[]
    try:
        pref=bpy.context.preferences.addons['cycles'].preferences
        pref.compute_device_type=device;pref.get_devices()
        for d in pref.devices:
            d.use=d.type==device
            if d.use:selected.append(d.name)
        scene.cycles.device='GPU' if selected else 'CPU'
    except (TypeError,RuntimeError):scene.cycles.device='CPU'
    scene.render.resolution_x=width;scene.render.resolution_y=round(width*9/16)
    scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='16'
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=-.65
    return {'engine':'Cycles','width':width,'height':scene.render.resolution_y,'samples':samples,'adaptive_threshold':.035,'denoised':True,'device':scene.cycles.device,'devices':selected,'view_transform':'AgX','exposure':-.65}
