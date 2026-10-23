"""Seeded Mediterranean planting and repairable seating, in metres.

Design-development assets: no hydraulic, botanical or accessibility certification.
"""
import math
import random
from .geometry import MeshBuilder


def planted_island(name, collection, materials, seed=910, length=8, width=3,
                   seat_slats=38, tufts=220, grounded=False, backed=False):
    """One batched mesh: stone curb, soil, slatted seating, herbs and lavender.

    Material order: stone, soil, wood, steel, green, silver-green, lavender.
    Ground-contact origin; caller places and rotates the component.
    """
    if min(length,width)<=0 or seat_slats<2 or tufts<0:
        raise ValueError('Positive planting dimensions and at least two seat slats required')
    rng=random.Random(seed);m=MeshBuilder();a=length/2;b=width/2
    base=0 if grounded else .04
    # Low retaining curb, discretised ellipse with outward faces.
    count=96
    for i in range(count):
        t=i*math.tau/count;u=(i+1)*math.tau/count
        p=(a*math.cos(t),b*math.sin(t));q=(a*math.cos(u),b*math.sin(u))
        po=((a+.12)*math.cos(t),(b+.12)*math.sin(t));qo=((a+.12)*math.cos(u),(b+.12)*math.sin(u))
        m.face([(*p,base),(*q,base),(*q,.18),(*p,.18)],0)
        m.face([(*qo,base),(*po,base),(*po,.18),(*qo,.18)],0)
        m.face([(*p,.18),(*q,.18),(*qo,.18),(*po,.18)],0)
        m.face([(0,0,.10),(*p,.10),(*q,.10)],1)
    # Independent replaceable timber slats, 460 mm seat height, 550 mm depth.
    # Detailed seating follows equal arc increments, avoiding the tight slats at
    # the ellipse ends produced by equal angular increments. Legacy stays fixed.
    angles=[math.pi*.10+i*math.pi*.8/(seat_slats-1) for i in range(seat_slats)]
    if backed:
        samples=2048;arc=[0.];ts=[math.pi*.10+j*math.pi*.8/samples for j in range(samples+1)]
        for t,u in zip(ts,ts[1:]):arc.append(arc[-1]+math.hypot((a+.43)*(math.cos(u)-math.cos(t)),(b+.43)*(math.sin(u)-math.sin(t))))
        import bisect
        angles=[]
        for i in range(seat_slats):
            target=arc[-1]*i/(seat_slats-1);j=min(samples,max(1,bisect.bisect_left(arc,target)))
            angles.append(ts[j-1]+(ts[j]-ts[j-1])*(target-arc[j-1])/(arc[j]-arc[j-1]))
    for i,t in enumerate(angles):
        n=(math.cos(t),math.sin(t));center=((a+.43)*n[0],(b+.43)*n[1],.435)
        tangent=(-math.sin(t),math.cos(t));radial=n
        if backed:
            # Use the true ellipse normal for a square-on seat, rather than the
            # radius vector (which is not normal except at the ellipse axes).
            nx,ny=math.cos(t)/(a+.43),math.sin(t)/(b+.43)
            scale=math.hypot(nx,ny);radial=(nx/scale,ny/scale)
            tangent=(-radial[1],radial[0])
        for z in [.41,.46]:
            corners=[(center[0]+tangent[0]*s+radial[0]*r,center[1]+tangent[1]*s+radial[1]*r,z) for s,r in [(-.07,-.275),(.07,-.275),(.07,.275),(-.07,.275)]]
            if z==.46:top=corners
            else:bottom=corners
        m.face(top[::-1] if backed else top,2)
        m.face(bottom if backed else bottom[::-1],2)
        for j in range(4):
            side=[bottom[j],bottom[(j+1)%4],top[(j+1)%4],top[j]]
            m.face(side[::-1] if backed else side,2)
        if i%6==0:m.tube([(center[0],center[1],base),(center[0],center[1],.41)],[.024,.024],3,6)
    if backed:
        # Three replaceable timber back rails and a restrained steel support
        # rhythm. Geometry intent only; no ergonomic/structural certification.
        for i,(t,u) in enumerate(zip(angles,angles[1:])):
            for z in (.61,.74,.87):
                points=[((a+.70+r)*math.cos(v),(b+.70+r)*math.sin(v),h)
                        for h,r,v in [(z-.035,-.018,t),(z-.035,-.018,u),(z+.035,-.018,u),(z+.035,-.018,t),
                                      (z-.035,.018,t),(z-.035,.018,u),(z+.035,.018,u),(z+.035,.018,t)]]
                start=len(m.vertices);m.vertices.extend(points)
                for f in [(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]:
                    m.faces.append(tuple(start+j for j in f[::-1]));m.material_indices.append(2)
            if i%6==0 or i==len(angles)-2:
                p=((a+.70)*math.cos(t),(b+.70)*math.sin(t))
                m.tube([(*p,.41),(*p,.92)],[.018,.018],3,6)
    # Several blade lengths and hues avoid a single flat green mound.
    for i in range(tufts):
        t=rng.random()*math.tau;r=math.sqrt(rng.random())*.88
        x=a*r*math.cos(t);y=b*r*math.sin(t)
        for j in range(7):
            angle=rng.random()*math.tau;h=rng.uniform(.16,.45);lean=rng.uniform(.07,.20)
            dx=math.cos(angle);dy=math.sin(angle);w=.018
            m.face([(x-dy*w,y+dx*w,.11),(x+dy*w,y-dx*w,.11),(x+dx*lean,y+dy*lean,.11+h)],4+i%2)
        if i%3==0:
            h=rng.uniform(.38,.60)
            tip=(x+.07,y,.11+h)
            m.tube([(x,y,.11),tip],[.005,.003],5,4)
            m.ellipsoid(tip,(.025,.025,.065),6,4,6)
    obj=m.object(name,collection,materials,False)
    obj['asset_id']='landscape/mediterranean-seating-island'
    obj['seed']=seed;obj['seat_height_m']=.46;obj['seat_depth_m']=.55
    obj['collision_policy']='static curb/seat proxy; foliage excluded'
    obj['representation']='proposed planting; no hydraulic or accessibility certification'
    if backed:obj['seating_detail']='equal-arc slats; three timber back rails; design study'
    return obj
