"""Seeded Quercus-ilex-inspired branching and leaf geometry, with shared mesh instances.

Botanical visual approximation; no claim of a surveyed tree inventory or CFD.
"""
import math
import random
import bpy
from mathutils import Vector
from .geometry import MeshBuilder


def holm_oak(name,collection,bark,leaves,seed=1,detail='hero'):
    rng=random.Random(seed);wood=MeshBuilder();leaf=MeshBuilder()
    trunk=[(0,0,0),(.09,-.02,1.2),(.03,.1,2.3),(.15,.08,3.2)]
    wood.tube(trunk,[.23,.19,.145,.1],sides=12)
    clusters=[]
    # Seven structural leaders, forks, twigs: branch hierarchy expresses load taper.
    for i in range(7):
        angle=math.tau*i/7+rng.uniform(-.2,.2)
        start=Vector(trunk[-1]);end=start+Vector((math.cos(angle)*rng.uniform(1.5,2.3),math.sin(angle)*rng.uniform(1.5,2.3),rng.uniform(1.4,2.3)))
        mid=start.lerp(end,.5)+Vector((0,0,.35))
        wood.tube([start,mid,end],[.085,.055,.025],sides=9)
        for j in range(5):
            a=angle+(j-2)*.42+rng.uniform(-.15,.15)
            base=mid.lerp(end,.15+j*.17)
            tip=base+Vector((math.cos(a)*rng.uniform(.5,1.25),math.sin(a)*rng.uniform(.5,1.25),rng.uniform(.3,1.15)))
            wood.tube([base,base.lerp(tip,.55)+Vector((0,0,.13)),tip],[.025,.015,.005],sides=6)
            for k in range(3):
                branch=tip+Vector((rng.uniform(-.5,.5),rng.uniform(-.5,.5),rng.uniform(-.12,.45)))
                wood.tube([tip,branch],[.007,.002],sides=5)
                clusters.append(branch)
    count=145 if detail=='hero' else 35
    for center in clusters:
        for _ in range(count):
            # Ellipsoid cloud, biased toward twig tips, with actual individual leaves.
            p=center+Vector((rng.gauss(0,.36),rng.gauss(0,.36),rng.gauss(0,.27)))
            a=rng.uniform(0,math.tau);tilt=rng.uniform(-.65,.65)
            u=Vector((math.cos(a),math.sin(a),tilt)).normalized()*rng.uniform(.055,.10)
            v=Vector((-math.sin(a),math.cos(a),0))*rng.uniform(.022,.035)
            ridge=Vector((0,0,.012))
            mi=rng.choices(range(len(leaves)),[5,4,2,1][:len(leaves)])[0]
            leaf.face([p-u,p-v,p+ridge],mi);leaf.face([p-u,p+ridge,p+v],mi)
            leaf.face([p+u,p+ridge,p-v],mi);leaf.face([p+u,p+v,p+ridge],mi)
    w=wood.object(name+'_wood',collection,[bark]);l=leaf.object(name+'_leaves',collection,leaves)
    for obj in [w,l]:
        obj['asset_id']='vegetation/holm-oak/'+detail+'/'+str(seed)
        obj['seed']=seed;obj['lod']=detail;obj['botanical_accuracy']='visual approximation'
    return w,l


def instance_tree(prototypes,name,position,collection,rotation=0,scale=1):
    result=[]
    for source in prototypes:
        obj=bpy.data.objects.new(name+'_'+source.name.rsplit('_',1)[-1],source.data)
        collection.objects.link(obj);obj.location=position;obj.rotation_euler.z=rotation
        obj.scale=(scale,scale,scale)
        for k in source.keys():obj[k]=source[k]
        obj['instance_of']=source.name;result.append(obj)
    return result
