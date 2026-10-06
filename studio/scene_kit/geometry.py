"""Small batched geometry builder. No bpy operators, global RNG or per-leaf objects."""
import math
import bpy
from mathutils import Vector


class MeshBuilder:
    def __init__(self):
        self.vertices=[];self.faces=[];self.material_indices=[]

    def face(self, points, material=0):
        start=len(self.vertices);self.vertices.extend(tuple(p) for p in points)
        self.faces.append(tuple(range(start,start+len(points))))
        self.material_indices.append(material)

    def box(self,center,size,material=0):
        start=len(self.vertices)
        x,y,z=center;dx,dy,dz=(v/2 for v in size)
        self.vertices.extend([(x-dx,y-dy,z-dz),(x+dx,y-dy,z-dz),(x+dx,y+dy,z-dz),(x-dx,y+dy,z-dz),
                              (x-dx,y-dy,z+dz),(x+dx,y-dy,z+dz),(x+dx,y+dy,z+dz),(x-dx,y+dy,z+dz)])
        for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:
            self.faces.append(tuple(start+i for i in f));self.material_indices.append(material)

    def tube(self, points, radii, material=0, sides=8):
        start=len(self.vertices)
        for i,(point,radius) in enumerate(zip(points,radii)):
            tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])
            if tangent.length<1e-6: tangent=Vector((0,0,1))
            q=tangent.to_track_quat('Z','Y')
            for j in range(sides):
                a=j*math.tau/sides
                self.vertices.append(tuple(Vector(point)+q@Vector((radius*math.cos(a),radius*math.sin(a),0))))
        for i in range(len(points)-1):
            for j in range(sides):
                self.faces.append((start+i*sides+j,start+i*sides+(j+1)%sides,start+(i+1)*sides+(j+1)%sides,start+(i+1)*sides+j))
                self.material_indices.append(material)
        for ring in [0,len(points)-1]:
            f=tuple(start+ring*sides+j for j in range(sides))
            self.faces.append(f[::-1] if ring==0 else f);self.material_indices.append(material)

    def ellipsoid(self, center, scale, material=0, rings=8, sides=12):
        start=len(self.vertices)
        self.vertices.append((center[0],center[1],center[2]+scale[2]))
        for i in range(1,rings):
            phi=math.pi*i/rings
            for j in range(sides):
                a=math.tau*j/sides
                self.vertices.append((center[0]+scale[0]*math.sin(phi)*math.cos(a),center[1]+scale[1]*math.sin(phi)*math.sin(a),center[2]+scale[2]*math.cos(phi)))
        bottom=len(self.vertices);self.vertices.append((center[0],center[1],center[2]-scale[2]))
        for j in range(sides):
            self.faces.append((start,start+1+j,start+1+(j+1)%sides));self.material_indices.append(material)
        for i in range(rings-2):
            for j in range(sides):
                a=start+1+i*sides+j;b=start+1+(i+1)*sides+j
                c=start+1+(i+1)*sides+(j+1)%sides;d=start+1+i*sides+(j+1)%sides
                self.faces.append((a,b,c,d));self.material_indices.append(material)
        for j in range(sides):
            a=start+1+(rings-2)*sides+j;c=start+1+(rings-2)*sides+(j+1)%sides
            self.faces.append((a,bottom,c));self.material_indices.append(material)

    def object(self,name,collection,materials,smooth=True):
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(self.vertices,[],self.faces);mesh.update()
        for mat in materials:mesh.materials.append(mat)
        for p,mi in zip(mesh.polygons,self.material_indices):p.material_index=mi;p.use_smooth=smooth
        obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj)
        obj['generator']='scene-kit/1.0.0';obj['units']='metres';obj['license']='original-procedural-no-third-party-model'
        return obj
