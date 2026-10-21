"""Extend the existing coordination scene with a bounded civic-landscape study.

No renderer, source promotion or external registry. Called by the existing
coordinator; all earlier geometry is retained, with superseded proposals hidden.
"""
import hashlib
import json
import math
from pathlib import Path
import bpy
from mathutils import Matrix, Vector
from studio.scene_kit.geometry import MeshBuilder
from studio.scene_kit.landscape import planted_island
from studio.scene_kit.vegetation import instance_tree
from studio.scene_kit.materials import surface, foliage


GROVES=[('Neighbourhood garden',(-22,-22),18,7),
        ('Shared table garden',(15,-24),20,8),
        ('Quiet garden',(37,16),18,7),
        ('Culture garden',(18,34),18,7)]
ROUTES=[('Daily market',[(0,-47),(-1,-5),(-33,24)],4.8),
        # Approach the open western civic bay, not the rear teaching-kitchen wall.
        ('Culture approach',[(-1,-5),(-19.4,37.3)],4.8),
        ('Visitor connection',[(58,0),(-1,-5)],4.8)]


def segment_distance(p,a,b):
    p,a,b=Vector(p),Vector(a),Vector(b);d=b-a
    t=max(0,min(1,(p-a).dot(d)/d.length_squared))
    return (p-a-t*d).length


def apply(collection,wood,steel,stone,output):
    """Return source-bound geometry checks and one drawing, never render pixels."""
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    hidden=[]
    for o in bpy.context.scene.objects:
        if o.name.startswith(('VIS_SeatingGarden_','VIS_GardenOak_','VIS_ExistingLayoutOak_')):
            o.hide_render=True;hidden.append(o.name)
    soil=surface('CivicGardenSoil',(.075,.06,.035),.98)[0]
    plants=[foliage('CivicHerbs',(.12,.19,.055)),foliage('CivicSilver',(.25,.30,.18)),
            surface('CivicLavender',(.22,.12,.31),.72)[0]]
    # Reuse the exact tree meshes already in the prepared scene. New instances
    # express proposed mature shade, not a surveyed botanical inventory.
    trees=[(bpy.data.objects[f'VIS_OakPrototype_{i}_wood'],
            bpy.data.objects[f'VIS_OakPrototype_{i}_leaves']) for i in range(3)]
    plaza=bpy.data.objects['Plaza'];inverse=plaza.matrix_world.inverted()
    floor=max((plaza.matrix_world@v.co).z for v in plaza.data.vertices)
    angle=math.radians(44.14);records=[];new=[];tree_instances=[]
    # Reuse the chair component of the existing cafe family. Six chairs leave
    # both table ends free for approach; a full accessibility review is separate.
    import sys,bmesh
    sys.path.insert(0,str(Path(__file__).resolve().parents[3]/'studio/shared/procedural-assets'))
    from procassets.public_realm import community_table
    from procassets.furniture import chair_parts
    bw,bi=bmesh.new(),bmesh.new();chair_parts(bw,bi)
    chair_meshes=[]
    for bm,mat,suffix in ((bw,wood,'wood'),(bi,steel,'steel')):
        mesh=bpy.data.meshes.new('CivicChair_'+suffix);bm.to_mesh(mesh);bm.free()
        mesh.materials.append(mat);chair_meshes.append(mesh)
    for i,(title,center,length,width) in enumerate(GROVES):
        tf=Matrix.Translation(Vector((*center,floor)))@Matrix.Rotation(angle,4,'Z')
        bed=planted_island(f'CivicGarden_{i}',collection,[stone,soil,wood,steel,*plants],
            seed=1200+i,length=length,width=width,seat_slats=110,tufts=500,grounded=True)
        bed.matrix_world=tf;new.append(bed)
        # Equal-length slats are not equal arc spacing on an ellipse. These
        # remain a concept seating strip, pending detailed joints/backrests.
        for j,x in enumerate((-length*.31,0,length*.31)):
            objects=instance_tree(trees[(i+j)%3],f'CivicShade_{i}_{j}',
                tf@Vector((x,0,.10)),collection,rotation=i+j*.9,scale=1.32)
            tree_instances.extend(objects);new.extend(objects)
        # Compose the maintained community-table builder rather than another
        # furniture library; no dimensions or safety certification are implied.
        bm=community_table(L=3.6,d=.9,h=.76)
        mesh=bpy.data.meshes.new(f'CivicTableMesh_{i}');bm.to_mesh(mesh);bm.free()
        mesh.materials.append(wood);mesh.materials.append(steel)
        ob=bpy.data.objects.new(f'CivicTable_{i}',mesh);collection.objects.link(ob)
        ob.matrix_world=tf@Matrix.Translation(Vector((0,-width/2-2,0)))
        ob['asset_id']='community_table';ob['anchor']='base_centre';new.append(ob)
        for side in (-1,1):
            for x in (-1.2,0,1.2):
                ct=ob.matrix_world@Matrix.Translation(Vector((x,side*.95,0)))@Matrix.Rotation(math.pi if side==1 else 0,4,'Z')
                for mesh in chair_meshes:
                    chair=bpy.data.objects.new(f'CivicChair_{i}_{side}_{x}_{mesh.name}',mesh)
                    collection.objects.link(chair);chair.matrix_world=ct
                    chair['source_builder']='procassets.furniture.chair_parts'
                    chair['representation']='cafe chair component reused for civic table study'
                    new.append(chair)
        records.append({'title':title,'center_m':list(center),'planting_length_width_m':[length,width],
                        'proposed_trees':3,'community_tables':1,'loose_chairs':6,'seat_height_m':.46})
    bpy.context.view_layer.update()
    # Test actual emitted geometry, including table edges and bench slats.
    checked=0;min_route=float('inf');min_f3=float('inf')
    for obj in new:
        if obj in tree_instances:continue # crown overhang is allowed; roots checked below
        for v in obj.data.vertices:
            p=obj.matrix_world@v.co
            hit=plaza.ray_cast(inverse@Vector((p.x,p.y,floor+20)),Vector((0,0,-1)))[0]
            if not hit:raise ValueError('Civic proposal outside source plaza: '+obj.name)
            checked+=1
            for _,points,width in ROUTES:
                for a,b in zip(points,points[1:]):
                    clearance=segment_distance((p.x,p.y),a,b)-width/2
                    min_route=min(min_route,clearance)
                    if clearance<.25:raise ValueError(f'Route obstructed by {obj.name}: {clearance:.3f} m')
    for obj in tree_instances[::2]:
        p=obj.location
        # A conservative 6.5 m canopy radius guards the entire new tree, rather
        # than merely the planting-bed centre used in the earlier study.
        distance=segment_distance((p.x,p.y),(-15,42),(96.1,100.4))-6.5
        min_f3=min(min_f3,distance)
        if distance<7:raise ValueError('New canopy enters F3 protected corridor: '+obj.name)
    # Flush material ribbons are a visual circulation study, not a certified
    # build-up. Portable clearance across the full world still needs checking.
    pathmat=surface('CivicRouteMineral',(.42,.36,.26),.88)[0]
    m=MeshBuilder()
    route_samples=0
    for title,points,width in ROUTES:
        for a,b in zip(points,points[1:]):
            d=(Vector(b)-Vector(a)).normalized();n=Vector((-d.y,d.x))*width/2
            corners=[Vector(a)-n,Vector(b)-n,Vector(b)+n,Vector(a)+n]
            for j in range(31):
                c=Vector(a).lerp(Vector(b),j/30)
                for offset in (-n,Vector((0,0)),n):
                    p=c+offset
                    if not plaza.ray_cast(inverse@Vector((p.x,p.y,20)),Vector((0,0,-1)))[0]:
                        raise ValueError('Route outside source plaza: '+title)
                    route_samples+=1
            m.face([(p.x,p.y,floor+.002) for p in corners])
    paths=m.object('CivicFlushRouteStudy',collection,[pathmat],False);new.append(paths)
    # Readable public-space programme: leave one open, deliberately unfilled
    # assembly area. It is kept free of new fixtures, not counted as occupancy.
    # Check the approach against the actual proposed kitchen geometry, not a
    # destination name. West civic bay is outside the two kitchen enclosures.
    civic_tf=bpy.data.objects['Civic_CoordFloor_L0'].matrix_world
    local=civic_tf.inverted()@Vector((*ROUTES[1][1][-1],floor))
    assert -16<local.x<-9 and -6.2<local.y<-5
    report={'status':'PLAZA_DESIGN_STUDY_NOT_FINAL','version':'civic-gardens-v4','groves':records,
        'routes':[{'purpose':n,'points_m':p,'width_m':w} for n,p,w in ROUTES],
        'new_trees':12,'planting_area_ellipse_proxy_m2':sum(math.pi*l*w/4 for _,_,l,w in GROVES),
        'footprint_vertices_checked':checked,'route_support_samples':route_samples,
        'minimum_fixture_clearance_to_route_edge_m':min_route,
        'minimum_new_canopy_clearance_to_F3_axis_m':min_f3,
        'culture_approach_local_m':list(local),'culture_approach_outside_kitchen_wall':True,
        'source_geometry_preserved':True,'hidden_superseded_proposals':hidden,
        'render_invocations':0,'limits':['Four gardens and proposed mature trees, not surveyed existing trees.',
        'Source plaza polygon is not a legal boundary; inherited building-edge conflicts remain.',
        'Routes are material ribbons; 2 mm offset is not a tested full-world portable clearance.',
        'No annual shade, irrigation, drainage, species, root-volume or accessibility acceptance.',
        'Tables have six reused chairs and free ends; accessible approach/detail remains unapproved.']}
    # A direct geometry projection: intentionally labelled as a plan, not render.
    def xy(p):return (610+p[0]*6,470-p[1]*6)
    svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000"><rect width="1200" height="1000" fill="#f4f2ea"/>',
         '<g font-family="sans-serif" fill="#263b32"><text x="55" y="45" font-size="27">Living Threshold / civic landscape study</text>',
         '<text x="55" y="73" font-size="15">Scene footprint envelopes and routes · schematic canopies · not a final competition image</text></g>']
    def polygon(points,color):
        return '<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="{color}"/>'
    svg.append(polygon([xy(plaza.matrix_world@v.co) for v in plaza.data.vertices],'#dedbd0'))
    for obj in (paths,*[o for o in new if o.name.startswith(('CivicGarden_','CivicTable_'))]):
        if obj.name.startswith('CivicGarden_'):
            # A plan needs a readable footprint, not thousands of projected
            # herb blades. Preserve the real mesh's projected envelope.
            from mathutils.geometry import convex_hull_2d
            points=list({tuple(round(c,5) for c in xy(obj.matrix_world@v.co)) for v in obj.data.vertices})
            hull=convex_hull_2d([Vector(p) for p in points])
            svg.append(polygon([points[i] for i in hull],'#a4a58c'))
            continue
        for face in obj.data.polygons:
            if face.normal.z>.4:
                color=('#a4a58c' if obj.name.startswith('CivicGarden') else '#ad8b61')
                if obj==paths:color='#c4b69b'
                svg.append(polygon([xy(obj.matrix_world@obj.data.vertices[j].co) for j in face.vertices],color))
    for obj in tree_instances[::2]:
        x,y=xy(obj.location);svg.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="31" fill="#59714e" fill-opacity=".65"/>')
    for bar in ('Hard','Civic'):
        obj=bpy.data.objects[bar+'_CoordFloor_L0']
        for f in obj.data.polygons:
            if f.normal.z>.9:svg.append(polygon([xy(obj.matrix_world@obj.data.vertices[j].co) for j in f.vertices],'#b57754'))
    for title,p,_,_ in GROVES:
        x,y=xy(p);svg.append(f'<text x="{x:.1f}" y="{y+65:.1f}" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#263b32">{title}</text>')
    svg.append('<g font-family="sans-serif" fill="#263b32"><text x="55" y="930" font-size="18">Everyday market → gardens → shared culture</text><text x="55" y="958" font-size="14">Existing geometry retained. Building edge fit, detailed landscape and final visual review remain open.</text></g></svg>')
    drawing=output/'civic-plan.svg';drawing.write_text(''.join(svg)+'\n')
    report['plan_sha256']=hashlib.sha256(drawing.read_bytes()).hexdigest()
    (output/'landscape-receipt.json').write_text(json.dumps(report,indent=2)+'\n')
    return report
