"""Reusable floor plates and switchback stairs in metres; design geometry only.

No regulatory, structural or GFA certification. Floor areas are measured from
the resulting mesh, with explicit voids, rather than inferred from room labels.
"""
import math
from collections import Counter
import bpy
from mathutils import Vector
from .geometry import MeshBuilder


def rectangle_cells(bounds,voids=()):
    """Partition an XY rectangle minus the union of rectangular voids."""
    x0,y0,x1,y1=bounds
    if not all(math.isfinite(v) for v in bounds) or x1<=x0 or y1<=y0:
        raise ValueError('Invalid floor bounds')
    for a,b,c,d in voids:
        if not all(math.isfinite(v) for v in (a,b,c,d)) or not x0<=a<c<=x1 or not y0<=b<d<=y1:
            raise ValueError('Void must lie inside the floor bounds')
    xs=sorted({x0,x1,*[v[k] for v in voids for k in (0,2)]})
    ys=sorted({y0,y1,*[v[k] for v in voids for k in (1,3)]})
    return [(a,b,c,d) for a,c in zip(xs,xs[1:]) for b,d in zip(ys,ys[1:])
            if not any(u<(a+c)/2<w and v<(b+d)/2<t for u,v,w,t in voids)]


def floor_plate(name,collection,materials,bounds,elevation,thickness=.28,voids=()):
    if not math.isfinite(thickness) or thickness<=0:raise ValueError('Positive slab thickness required')
    cells=rectangle_cells(bounds,voids)
    if not cells:raise ValueError('Floor is completely void')
    vertices=[];faces=[];index={};edges=Counter()
    def point(x,y,z):
        key=(x,y,z)
        if key not in index:index[key]=len(vertices);vertices.append(key)
        return index[key]
    for a,b,c,d in cells:
        top=[point(x,y,elevation) for x,y in [(a,b),(c,b),(c,d),(a,d)]]
        bot=[point(x,y,elevation-thickness) for x,y in [(a,b),(c,b),(c,d),(a,d)]]
        faces.extend([tuple(top),tuple(reversed(bot))])
        for i in range(4):edges[(top[i],top[(i+1)%4])]+=1
    for (a,b),count in edges.items():
        if edges[(b,a)]:continue
        va,vb=vertices[a],vertices[b]
        faces.append((a,point(va[0],va[1],elevation-thickness),point(vb[0],vb[1],elevation-thickness),b))
    builder=MeshBuilder();builder.vertices=vertices;builder.faces=faces;builder.material_indices=[0]*len(faces)
    obj=builder.object(name,collection,materials,smooth=False)
    obj['asset_id']='architecture/floor-plate';obj['generator']='scene-kit/architecture/1'
    obj['geometric_floor_area_m2']=sum((c-a)*(d-b) for a,b,c,d in cells)
    obj['quantity_status']='geometric horizontal slab surface; not certified GFA'
    obj['void_count']=len(voids)
    return obj


def projected_top_area(obj):
    """XY area of upward-facing world-space faces; independent of metadata."""
    matrix=obj.matrix_world
    area=0
    for face in obj.data.polygons:
        pts=[matrix@obj.data.vertices[i].co for i in face.vertices]
        signed=sum(p.x*q.y-q.x*p.y for p,q in zip(pts,pts[1:]+pts[:1]))/2
        if signed>1e-8:area+=signed
    return area


def switchback_parameters(rise=4.5,clear_width=1.5,going=.28,landing=1.5,max_riser=.18,gap=.2):
    if not all(math.isfinite(v) and v>0 for v in (rise,clear_width,going,landing,max_riser,gap)):
        raise ValueError('Stair dimensions must be finite and positive')
    risers=math.ceil(rise/max_riser)
    if risers%2:risers+=1
    per_flight=risers//2;run=(per_flight-1)*going
    return {'rise_m':rise,'clear_width_m':clear_width,'going_m':going,'landing_m':landing,
        'risers':risers,'risers_per_flight':per_flight,'riser_m':rise/risers,'run_m':run,
        'gap_m':gap,'width_m':2*clear_width+gap,'core_length_m':run+2*landing,
        'floor_void_local_m':[0,0,run+landing,2*clear_width+gap],
        'top_landing_local_m':[-landing,0,0,2*clear_width+gap],
        'status':'DIMENSIONED_GEOMETRY_NOT_CODE_CERTIFICATION'}


def switchback_stair(name,collection,materials,**dimensions):
    """Two flights, midlanding, framing and rails; top landing belongs to slab.

    Lower ascent runs along +X. Return flight ends at X=0 on the upper floor.
    An upper slab must provide the declared top landing and cut the declared void.
    """
    p=switchback_parameters(**dimensions)
    n=p['risers_per_flight'];h=p['riser_m'];w=p['clear_width_m'];g=p['gap_m'];run=p['run_m'];L=p['landing_m']
    builder=MeshBuilder();samples=[]
    for flight in (0,1):
        yc=w/2 if flight==0 else w+g+w/2
        for k in range(1,n):
            x=(k-.5)*p['going_m'] if flight==0 else run-(k-.5)*p['going_m']
            z=k*h if flight==0 else p['rise_m']/2+k*h
            builder.box((x,yc,z-h/2),(p['going_m'],w,h),0)
            samples.append([x,yc,z])
        for yy in (yc-w/2-.035,yc+w/2+.035):
            ends=[(0,yy,.02),(run,yy,p['rise_m']/2-.12)] if flight==0 else [(run,yy,p['rise_m']/2+.02),(0,yy,p['rise_m']-.12)]
            builder.tube(ends,[.055,.055],1,sides=8)
            rail=[(x,y,z+1.0) for x,y,z in ends]
            builder.tube(rail,[.022,.022],1,sides=8)
            for i in range(5):
                t=i/4;v=Vector(ends[0]).lerp(Vector(ends[1]),t)
                builder.tube([tuple(v),tuple(v+Vector((0,0,1)))],[.016,.016],1,sides=6)
    builder.box((run+L/2,p['width_m']/2,p['rise_m']/2-.10),(L,p['width_m'],.20),0)
    # Midlanding support columns; structural sizes remain schematic.
    for y in (0,p['width_m']):
        for x in (run+.10,run+L-.10):
            builder.box((x,y,p['rise_m']/4-.05),(.10,.10,p['rise_m']/2-.10),1)
    for y in (-.035,p['width_m']+.035):
        builder.tube([(run,y,p['rise_m']/2+1.1),(run+L,y,p['rise_m']/2+1.1)],[.022,.022],1)
        for x in (run,run+L):builder.tube([(x,y,p['rise_m']/2),(x,y,p['rise_m']/2+1.1)],[.016,.016],1)
    builder.tube([(run+L,0,p['rise_m']/2+1.1),(run+L,p['width_m'],p['rise_m']/2+1.1)],[.022,.022],1)
    obj=builder.object(name,collection,materials,smooth=False)
    obj['asset_id']='architecture/switchback-stair';obj['generator']='scene-kit/architecture/1'
    obj['quantity_status']='dimensioned design geometry; structure, handrails and code remain unverified'
    for key in ('risers','riser_m','going_m','clear_width_m'):obj[key]=p[key]
    return obj,p,samples
