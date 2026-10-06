"""Dimensioned civic figures. Batched meshes with restrained PBR palette.

Intended as architectural entourage, not photoreal scanned humans.
"""
import math
import random
from .geometry import MeshBuilder


def person(name,collection,materials,position,height=1.73,heading=0,seed=1):
    rng=random.Random(seed);m=MeshBuilder();s=height/1.73
    # Material slots: skin, coat, trousers, shoes, hair, bag.
    walk=rng.uniform(-.10,.10)
    for side in [-1,1]:
        hip=(side*.105,0,.88);knee=(side*.11,side*walk,.51);ankle=(side*.12,-side*walk,.10)
        m.tube([hip,knee,ankle],[.082,.066,.046],2,10)
        m.ellipsoid((side*.12,-side*walk-.035,.065),(.07,.14,.06),3)
    m.ellipsoid((0,0,.87),(.18,.115,.14),2)
    # Tunic/jacket taper and shoulder outline rather than a vertical cylinder.
    # Ellipsoid torso, with lapels, collar and small sleeves.
    m.ellipsoid((0,0,1.11),(.205,.125,.29),1,12,16)
    m.tube([(0,0,1.35),(0,0,1.47)],[.065,.06],0,12)
    for side in [-1,1]:
        shoulder=(side*.20,0,1.30);elbow=(side*.25,-.025,1.04)
        wrist=(side*.24,-.09 if side==1 else .02,.88)
        m.tube([shoulder,elbow,wrist],[.062,.05,.035],1,10)
        m.ellipsoid((wrist[0],wrist[1],wrist[2]-.035),(.037,.035,.066),0)
    m.ellipsoid((0,-.01,1.59),(.097,.087,.126),0,12,16)
    m.ellipsoid((0,.01,1.65),(.102,.086,.088),4,10,14)
    m.ellipsoid((0,-.095,1.585),(.022,.028,.027),0)
    for side in [-1,1]:m.ellipsoid((side*.10,-.006,1.60),(.02,.024,.034),0)
    # Quiet facial marks, collar, buttons; bags tell ordinary plaza life.
    for side in [-1,1]:m.ellipsoid((side*.035,-.092,1.616),(.006,.004,.004),4,4,6)
    for z in [1.02,1.10,1.18,1.26]:m.ellipsoid((0,-.124,z),(.008,.004,.008),3,4,6)
    if seed%3==0:
        m.ellipsoid((.25,.025,.96),(.12,.065,.15),5)
        m.tube([(.17,0,1.28),(.27,.03,1.1),(.25,.025,.98)],[.012,.012,.012],5,5)
    obj=m.object(name,collection,materials)
    obj.location=position;obj.rotation_euler.z=heading;obj.scale=(s,s,s)
    obj['asset_id']='entourage/civic-person';obj['seed']=seed
    obj['visual_status']='architectural-entourage-not-photoreal-human'
    return obj
