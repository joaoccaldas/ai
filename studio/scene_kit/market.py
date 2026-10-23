"""Open-front service stall with standard dimensions and repairable kit parts."""
from .geometry import MeshBuilder


def stall(name,collection,materials,width=2.7,depth=2.2,height=2.1,front=1):
    """Materials: steel frame, timber cabinetry, worktop, dark fittings.

    Origin is floor contact at footprint centre; +Y is customer front by default.
    Includes under-counter cabinet; caller may retain an existing worktop/produce.
    """
    m=MeshBuilder()
    for x in [-width/2+.04,width/2-.04]:
        for y in [-depth/2+.04,depth/2-.04]:
            m.box((x,y,height/2),(.045,.045,height),0)
            m.box((x,y,.035),(.08,.08,.07),0)
        m.box((x,0,height-.0225),(.045,depth,.045),0)
    for y in [-depth/2+.04,depth/2-.04]:m.box((0,y,height-.0225),(width,.045,.045),0)
    # Front cabinet supports the source counter while leaving the service space open.
    cabinet_y=front*(depth/2-.38)
    m.box((0,cabinet_y,.49),(width-.26,.56,.96),1)
    m.box((0,cabinet_y,1.04),(width-.23,.58,.12),2)
    for x in [-width*.29,0,width*.29]:
        m.box((x,cabinet_y+front*.287,.46),(.008,.008,.75),3)
        m.box((x+.2,cabinet_y+front*.3,.69),(.10,.015,.012),0)
    # Back display: open slats and shallow removable shelves, not a solid opaque box.
    back=-front*(depth/2-.05)
    for j in range(18):
        x=-width/2+.09+j*(width-.18)/17
        m.box((x,back,1.30),(.06,.035,1.45),1)
    for z in [.92,1.32,1.72]:
        m.box((0,back+front*.17,z),(width-.14,.34,.035),1)
        for x in [-width*.35,width*.35]:m.box((x,back+front*.12,z-.055),(.018,.22,.018),0)
    for x in [-width/2+.04,width/2-.04]:
        for y in [-depth/2+.04,depth/2-.04]:
            for z in [.12,height-.08]:m.ellipsoid((x,y,z),(.011,.025,.011),3,4,8)
    obj=m.object(name,collection,materials,smooth=False)
    bevel=obj.modifiers.new('RepairableKitEdge','BEVEL');bevel.width=.004;bevel.segments=2
    obj['asset_id']='market/open-stall/standard';obj['footprint_m']=[width,depth]
    obj['height_m']=height;obj['customer_front_local_y']=front
    obj['construction_status']='design-development kit; joints visible, engineering not validated'
    obj['collision_policy']='derive separate compound colliders; do not use render-mesh AABB as aisle obstruction'
    return obj


def produce_display(name,collection,materials,front=1,seed=1):
    """Three slatted produce crates supported by a 1.10 m worktop.

    Materials: timber, orange, tomato, green. No food texture assets required.
    """
    import random
    rng=random.Random(seed);m=MeshBuilder();y=front*.72
    for i,x in enumerate([-.79,0,.79]):
        m.box((x,y,1.115),(.69,.39,.03),0)
        for dy in [-.195,.195]:
            for z in [1.155,1.205]:m.box((x,y+dy,z),(.72,.015,.035),0)
        for dx in [-.345,.345]:m.box((x+dx,y,1.18),(.025,.4,.13),0)
        for col in range(4):
            for row in range(2):
                center=(x-.255+col*.17+rng.uniform(-.005,.005),y-.085+row*.17,1.205)
                m.ellipsoid(center,(.078,.078,.075),1+i%3,6,10)
                m.tube([(center[0],center[1],1.27),(center[0]+.012,center[1],1.30)],[.004,.002],3,4)
    obj=m.object(name,collection,materials)
    obj['asset_id']='market/supported-produce-crates';obj['seed']=seed
    obj['support_height_m']=1.10;obj['collision_policy']='display props; excluded from pedestrian collision'
    return obj


def stall_identity(name, collection, materials, width=2.5, depth=2.4, front=1):
    """Removable linen shade, signboard and counter fascia within the stall.

    Floor-centred metres/Z-up, matching ``stall``. Materials: linen, timber,
    fittings, enamel. Shade sag is a designed cosine, not simulated cloth.
    Customer circulation remains outside the original 2.4 m depth.
    """
    import math
    if width < 1 or depth < 1 or front not in (-1, 1):
        raise ValueError('Invalid stall identity footprint/front')
    m=MeshBuilder()
    for j in range(24):
        x0=-width/2+.035+(width-.07)*j/24
        x1=-width/2+.035+(width-.07)*(j+1)/24
        z0=2.075-.045*math.cos(math.pi*x0/(width-.07))
        z1=2.075-.045*math.cos(math.pi*x1/(width-.07))
        m.face([(x0,-depth/2+.05,z0),(x1,-depth/2+.05,z1),
                (x1,depth/2-.05,z1),(x0,depth/2-.05,z0)],0)
    y=front*(depth/2-.065)
    m.box((0,y,1.88),(width-.12,.045,.26),3)
    for x in (-width/2+.12,width/2-.12):
        m.tube([(x,y,2.08),(x,y,1.99)],[.008,.008],2,6)
    # Replaceable ribs protect cabinet fronts; avoid a featureless timber panel.
    for j in range(28):
        x=-width/2+.16+(width-.32)*j/27
        m.box((x,front*(depth/2-.085),.48),(.022,.025,.80),1)
    obj=m.object(name,collection,materials,False)
    obj['asset_id']='market/removable-shade-and-identity/v1'
    obj['footprint_m']=[width,depth];obj['anchor']='floor_centre'
    obj['customer_front_local_y']=front
    obj['inspection_direction']=[0,0,-front]  # glTF axes: source +Y -> -Z
    obj['representation']='design-development; cosine shade, not cloth simulation'
    return obj


def funicular_table(name, collection, materials):
    """Interpretive tabletop: equal horizontal point loads and inverted polygon.

    Base-centre anchor, 2.5 × 1.1 m. This is an explanatory exhibit, not a model
    of the basilica or structural certification of the proposed building.
    Materials: timber, dark steel, brass string, terracotta compression model.
    """
    m=MeshBuilder()
    m.box((0,0,.94),(2.5,1.1,.10),0)
    for x in (-1.05,1.05):
        for y in (-.38,.38):m.box((x,y,.445),(.055,.055,.89),1)
    points=[]
    for j in range(13):
        x=-.95+1.9*j/12
        # Equal horizontal increments and equal vertical loads produce this
        # discrete parabolic funicular; intentionally not a catenary claim.
        z=1.82-.42*(1-(x/.95)**2)
        points.append((x,-.20,z))
    cable_start=len(m.vertices)
    m.tube(points,[.006]*13,2,8)
    for x,y,z in points[1:-1]:
        m.tube([(x,y,z),(x,y,z-.14)],[.0025,.0025],2,6)
        m.box((x,y,z-.17),(.035,.035,.06),1)
    for x in (-.95,.95):
        m.tube([(x,-.20,.99),(x,-.20,1.84)],[.012,.012],1,8)
    inverted=[(x,.25,2.08-(z-1.4)) for x,y,z in points]
    m.tube(inverted,[.025]*13,3,10)
    for x,y,z in (inverted[0],inverted[-1]):
        m.box((x,y,(.99+z)/2),(.06,.06,z-.99),3)
    obj=m.object(name,collection,materials,False)
    obj['asset_id']='interpretation/equal-point-load-funicular-table/v1'
    obj['anchor']='floor_centre';obj['footprint_m']=[2.5,1.1]
    obj['inspection_direction']=[0,0,1]
    obj['model']='discrete equal vertical loads at equal horizontal spacing'
    obj['funicular_cable_vertex_range']=[cable_start,cable_start+13*8]
    obj['funicular_ring_vertices']=8
    obj['representation']='explanatory polygon and inversion; not historical geometry or engineering approval'
    return obj
