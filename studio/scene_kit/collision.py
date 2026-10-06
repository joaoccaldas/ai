"""Engine-neutral static collision meshes; separate from decorative geometry."""
from .geometry import MeshBuilder


def static_proxy(name,collection,material,kind,front=1):
    m=MeshBuilder()
    if kind=='tree':
        m.tube([(0,0,0),(0,0,3)],[.26,.18],sides=8)
    elif kind=='island':
        # Conservative ellipse includes the low seat; herbs remain non-colliding.
        m.ellipsoid((0,0,.23),(4.8,2.35,.23),rings=4,sides=24)
    elif kind=='stall':
        m.box((0,.72*front,.49),(2.44,.56,.96))
        m.box((0,.72*front,1.04),(2.47,.58,.12))
        for x in [-1.30,1.30]:
            for y in [-1.05,1.05]:m.box((x,y,1.05),(.07,.07,2.1))
    else:raise ValueError('Unknown collision profile: '+kind)
    obj=m.object(name,collection,[material],False)
    obj['asset_id']='collision/static/'+kind
    obj['collision_role']='static';obj['collision_shape']='mesh'
    obj['profile']=kind;obj['friction']=.65;obj['restitution']=.05
    obj['physics_status']='suggested parameters; engine integration and walking-route testing required'
    obj.display_type='WIRE';obj.hide_render=True
    return obj
