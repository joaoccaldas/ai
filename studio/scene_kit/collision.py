"""Engine-neutral static collision meshes; separate from decorative geometry."""
import math
from .geometry import MeshBuilder


def static_proxy(name,collection,material,kind,front=1,*,width=2.7,depth=2.2,height=2.1):
    m=MeshBuilder()
    if kind=='tree':
        m.tube([(0,0,0),(0,0,3)],[.26,.18],sides=8)
    elif kind=='island':
        # Conservative ellipse includes the low seat; herbs remain non-colliding.
        m.ellipsoid((0,0,.23),(4.8,2.35,.23),rings=4,sides=24)
    elif kind=='stall':
        if not all(math.isfinite(v) for v in (width,depth,height)) or width<=.3 or depth<=.8 or height<=1.1:
            raise ValueError('Invalid stall collider dimensions')
        y=front*(depth/2-.38)
        m.box((0,y,.49),(width-.26,.56,.96))
        m.box((0,y,1.04),(width-.23,.58,.12))
        for x in [-width/2+.04,width/2-.04]:
            for y in [-depth/2+.04,depth/2-.04]:m.box((x,y,height/2),(.045,.045,height))
    else:raise ValueError('Unknown collision profile: '+kind)
    obj=m.object(name,collection,[material],False)
    obj['asset_id']='collision/static/'+kind
    obj['collision_role']='static';obj['collision_shape']='mesh'
    obj['profile']=kind;obj['friction']=.65;obj['restitution']=.05
    if kind=='stall':obj['footprint_m']=[width,depth];obj['height_m']=height
    obj['physics_status']='suggested parameters; engine integration and walking-route testing required'
    obj.display_type='WIRE';obj.hide_render=True
    return obj
