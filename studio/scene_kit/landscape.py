"""Seeded Mediterranean planting and repairable seating, in metres.

Design-development assets: no hydraulic, botanical or accessibility certification.
"""
import math
import random
from .geometry import MeshBuilder


def planted_island(name, collection, materials, seed=910, length=8, width=3):
    """One batched mesh: stone curb, soil, slatted seating, herbs and lavender.

    Material order: stone, soil, wood, steel, green, silver-green, lavender.
    Ground-contact origin; caller places and rotates the component.
    """
    rng=random.Random(seed);m=MeshBuilder();a=length/2;b=width/2
    # Low retaining curb, discretised ellipse with outward faces.
    count=96
    for i in range(count):
        t=i*math.tau/count;u=(i+1)*math.tau/count
        p=(a*math.cos(t),b*math.sin(t));q=(a*math.cos(u),b*math.sin(u))
        po=((a+.12)*math.cos(t),(b+.12)*math.sin(t));qo=((a+.12)*math.cos(u),(b+.12)*math.sin(u))
        m.face([(*p,.04),(*q,.04),(*q,.18),(*p,.18)],0)
        m.face([(*qo,.04),(*po,.04),(*po,.18),(*qo,.18)],0)
        m.face([(*p,.18),(*q,.18),(*qo,.18),(*po,.18)],0)
        m.face([(0,0,.10),(*p,.10),(*q,.10)],1)
    # Independent replaceable timber slats, 460 mm seat height, 550 mm depth.
    for i in range(38):
        t=math.pi*.10+i*math.pi*.8/37
        n=(math.cos(t),math.sin(t));center=((a+.43)*n[0],(b+.43)*n[1],.435)
        tangent=(-math.sin(t),math.cos(t));radial=n
        for z in [.41,.46]:
            corners=[(center[0]+tangent[0]*s+radial[0]*r,center[1]+tangent[1]*s+radial[1]*r,z) for s,r in [(-.07,-.275),(.07,-.275),(.07,.275),(-.07,.275)]]
            if z==.46:top=corners
            else:bottom=corners
        m.face(top,2);m.face(bottom[::-1],2)
        for j in range(4):m.face([bottom[j],bottom[(j+1)%4],top[(j+1)%4],top[j]],2)
        if i%6==0:m.tube([(center[0],center[1],.04),(center[0],center[1],.41)],[.024,.024],3,6)
    # Several blade lengths and hues avoid a single flat green mound.
    for i in range(220):
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
    return obj
