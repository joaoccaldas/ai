#!/usr/bin/env python3
from pathlib import Path
import math, json, numpy as np, trimesh

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"; OUT.mkdir(parents=True,exist_ok=True)
C={
 "raspberry":np.array([209,27,107,255],np.uint8),
 "grape":np.array([106,67,213,255],np.uint8),
 "tiffany":np.array([42,212,209,255],np.uint8),
 "olive":np.array([129,139,40,255],np.uint8),
 "white":np.array([242,238,231,255],np.uint8),
 "black":np.array([9,9,11,255],np.uint8),
 "skin":np.array([187,150,132,255],np.uint8),
 "hair":np.array([52,42,38,255],np.uint8),
}
def vc(m,c): m.visual.vertex_colors=np.tile(c,(len(m.vertices),1)); return m
def ell(center,radii,c,sub=3):
 m=trimesh.creation.icosphere(subdivisions=sub,radius=1); m.apply_scale(radii); m.apply_translation(center); return vc(m,c)
def box(center,ext,c):
 m=trimesh.creation.box(extents=ext); m.apply_translation(center); return vc(m,c)
def seg(a,b,r,c):
 a=np.asarray(a,float); b=np.asarray(b,float); d=b-a; L=max(np.linalg.norm(d),.01)
 m=trimesh.creation.capsule(radius=r,height=max(L-2*r,.01),count=[24,24]); T=trimesh.geometry.align_vectors([0,0,1],d/L)
 if T is not None:m.apply_transform(T)
 m.apply_translation((a+b)/2); return vc(m,c)
def loft(rings,c,segments=64):
 verts=[]; faces=[]
 for y,rx,rz,z in rings:
  for i in range(segments):
   a=2*math.pi*i/segments; verts.append([rx*math.cos(a),y,z+rz*math.sin(a)])
 for r in range(len(rings)-1):
  for i in range(segments):
   j=(i+1)%segments; a=r*segments+i;b=r*segments+j;c1=(r+1)*segments+j;d=(r+1)*segments+i;faces += [[a,b,c1],[a,c1,d]]
 return vc(trimesh.Trimesh(np.asarray(verts),np.asarray(faces),process=True),c)
def add(sc,name,m): sc.add_geometry(m,node_name=name,geom_name=name)

def build_jersey(color=C["raspberry"],men=False,singlet=False):
 sc=trimesh.Scene(); shoulder=.39 if men else .355; waist=.30 if men else .275
 add(sc,"GARMENT_TORSO",loft([(1.15,waist,.17,0),(1.45,waist+.01,.18,0),(1.78,shoulder-.025,.19,0),(2.02,shoulder,.195,0),(2.13,shoulder-.045,.18,0)],color))
 if not singlet:
  for s in (-1,1): add(sc,f"GARMENT_SLEEVE_{s}",seg([s*(shoulder-.03),1.99,0],[s*(shoulder+.17),1.82,.02],.082,color))
 add(sc,"GARMENT_CHEST_MARK",box([0,1.91,.205],[.28,.024,.012],C["white"]))
 add(sc,"GARMENT_ZIP",box([0,1.63,.207],[.015,.40,.009],C["black"]))
 return sc
def build_bibs(color=C["tiffany"]):
 sc=trimesh.Scene(); add(sc,"BIB_HIPS",loft([(.68,.245,.16,0),(.9,.265,.17,0),(1.14,.292,.18,0),(1.28,.285,.176,0)],color))
 for s in (-1,1):
  add(sc,f"BIB_LEG_{s}",seg([s*.15,.94,0],[s*.15,.48,.01],.12,color))
  add(sc,f"BIB_STRAP_{s}",seg([s*.14,1.23,.02],[s*.19,1.92,.01],.035,C["black"]))
 add(sc,"BIB_MARK",box([0,1.08,.18],[.20,.025,.010],C["white"])); return sc
def build_cap():
 sc=trimesh.Scene(); add(sc,"CAP_CROWN",ell([0,1.2,0],[.43,.28,.40],C["black"],3)); add(sc,"CAP_BRIM",box([0,.96,.25],[.68,.055,.42],C["black"])); add(sc,"CAP_MARK",box([0,1.2,.405],[.16,.06,.015],C["white"])); return sc

POSES={
 "stand":{"sl":(-.41,0,1.98),"sr":(.41,0,1.98),"el":(-.51,.02,1.55),"er":(.51,.02,1.55),"wl":(-.54,.05,1.14),"wr":(.54,.05,1.14),"hl":(-.18,0,1.06),"hr":(.18,0,1.06),"kl":(-.18,.02,.52),"kr":(.18,.02,.52),"al":(-.18,.04,-.06),"ar":(.18,.04,-.06)},
 "aero":{"sl":(-.38,.18,1.74),"sr":(.38,.18,1.74),"el":(-.28,.58,1.27),"er":(.28,.58,1.27),"wl":(-.17,1.01,1.22),"wr":(.17,1.01,1.22),"hl":(-.18,-.10,1.06),"hr":(.18,-.10,1.06),"kl":(-.18,.30,.57),"kr":(.18,-.25,.43),"al":(-.18,.06,.01),"ar":(.18,0,-.05)},
 "run":{"sl":(-.41,0,1.98),"sr":(.41,0,1.98),"el":(-.38,.35,1.62),"er":(.38,-.31,1.62),"wl":(-.22,.54,1.38),"wr":(.23,-.48,1.39),"hl":(-.18,0,1.06),"hr":(.18,0,1.06),"kl":(-.18,-.32,.47),"kr":(.18,.34,.61),"al":(-.18,-.16,-.02),"ar":(.18,.68,.08)}
}
def build_athlete(pose,color=C["raspberry"]):
 j=POSES[pose]; sc=trimesh.Scene(); aero=pose=="aero"; torso=(0,.08 if aero else .02,1.54 if aero else 1.67); head=(0,.38 if aero else .02,2.22 if aero else 2.56)
 add(sc,"BODY_HEAD",ell(head,(.17,.165,.21),C["skin"])); add(sc,"BODY_HAIR",ell((head[0],head[1]-.025,head[2]+.07),(.173,.17,.13),C["hair"]))
 add(sc,"GARMENT_TORSO",ell(torso,(.392,.224,.558),color)); add(sc,"GARMENT_BIB_HIPS",ell((0,-.005,1.10),(.31,.226,.25),C["black"]))
 for side in ("l","r"):
  L=side.upper(); add(sc,f"BODY_FOREARM_{L}",seg(j[f"e{side}"],j[f"w{side}"],.066,C["skin"])); add(sc,f"BODY_HAND_{L}",ell(j[f"w{side}"],(.075,.065,.085),C["skin"],2))
  se=np.array(j[f"s{side}"])*.43+np.array(j[f"e{side}"])*.57; ke=np.array(j[f"h{side}"])*.34+np.array(j[f"k{side}"])*.66
  add(sc,f"GARMENT_SLEEVE_{L}",seg(j[f"s{side}"],se,.091,color)); add(sc,f"GARMENT_BIB_LEG_{L}",seg(j[f"h{side}"],ke,.142,C["black"])); add(sc,f"BODY_CALF_{L}",seg(j[f"k{side}"],j[f"a{side}"],.092,C["skin"]))
  ankle=np.array(j[f"a{side}"]); add(sc,f"SHOE_{L}",ell(ankle+np.array((0,.12,-.08)),(.105,.22,.072),C["white"],2))
 add(sc,"GARMENT_CHEST_MARK",box([0,1.89 if not aero else 1.68,.235 if not aero else .305],[.25,.025,.012],C["white"]))
 if aero:
  for x in (-.38,.38):
   wheel=trimesh.creation.torus(major_radius=.34,minor_radius=.018,major_sections=56,minor_sections=10); wheel.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0])); wheel.apply_translation([x,.32,.30]); add(sc,f"BIKE_WHEEL_{x}",vc(wheel,C["black"]))
  add(sc,"BIKE_FRAME",seg([-.38,.32,.30],[.10,.32,.72],.022,C["black"])); add(sc,"BIKE_TOP",seg([.10,.32,.72],[.38,.32,.30],.022,C["black"])); add(sc,"BIKE_SEAT",seg([.02,.32,.73],[-.08,.32,1.01],.020,C["black"])); add(sc,"BIKE_BAR",seg([.20,.32,.74],[.32,.62,.82],.018,C["black"]))
 return sc

assets={
 "jersey-women.glb":build_jersey(C["raspberry"],False),
 "jersey-men.glb":build_jersey(C["grape"],True),
 "singlet.glb":build_jersey(C["raspberry"],False,True),
 "bib-tiffany.glb":build_bibs(C["tiffany"]),
 "bib-black.glb":build_bibs(C["black"]),
 "cap.glb":build_cap(),
 "athlete-stand.glb":build_athlete("stand",C["raspberry"]),
 "athlete-aero.glb":build_athlete("aero",C["raspberry"]),
 "athlete-run.glb":build_athlete("run",C["raspberry"]),
}
manifest={}
for name,scene in assets.items():
 p=OUT/name; p.write_bytes(scene.export(file_type="glb")); manifest[name]={"bytes":p.stat().st_size,"semantic_parts":len(scene.geometry)}
(OUT/"manifest.json").write_text(json.dumps({"version":2,"assets":manifest},indent=2)+"\n")
print(json.dumps(manifest,indent=2))
