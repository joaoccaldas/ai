import * as THREE from "three";

const mat = (name, color="#ffffff") => {
  const m = new THREE.MeshPhysicalMaterial({
    color, roughness:.52, metalness:0, clearcoat:.08, clearcoatRoughness:.75
  });
  m.name=name;
  return m;
};
const mesh = (geo, role, color="#ffffff") => {
  const o = new THREE.Mesh(geo, mat(role,color));
  o.name = role;
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
};
const box = (x,y,z,px,py,pz,role) => {
  const o=mesh(new THREE.BoxGeometry(x,y,z,4,4,4),role);
  o.position.set(px,py,pz); return o;
};
const cyl = (r,h,px,py,pz,axis,role) => {
  const o=mesh(new THREE.CylinderGeometry(r,r*.92,h,32,2),role);
  if(axis==="x") o.rotation.z=Math.PI/2;
  o.position.set(px,py,pz); return o;
};
const ellipsoid=(x,y,z,px,py,pz,role)=>{
  const o=mesh(new THREE.SphereGeometry(1,36,24),role);
  o.scale.set(x,y,z); o.position.set(px,py,pz); return o;
};

export function buildProduct(kind="trisuit"){
  const g=new THREE.Group(); g.name=`PRODUCT_${kind.toUpperCase()}`;
  if(kind==="trisuit"){
    g.add(box(.62,.34,.92,0,0,1.77,"FABRIC_PRIMARY_TORSO"));
    g.add(box(.66,.35,.18,0,0,1.91,"FABRIC_ACCENT_CHEST"));
    g.add(cyl(.15,.72,-.2,0,.88,"z","FABRIC_DARK_LEG_L"));
    g.add(cyl(.15,.72,.2,0,.88,"z","FABRIC_DARK_LEG_R"));
    g.add(cyl(.12,.5,-.48,0,1.98,"x","FABRIC_PRIMARY_SLEEVE_L"));
    g.add(cyl(.12,.5,.48,0,1.98,"x","FABRIC_PRIMARY_SLEEVE_R"));
    g.add(cyl(.2,.07,0,0,2.28,"z","FABRIC_DARK_COLLAR"));
  } else if(kind==="hoodie"){
    g.add(box(.72,.42,1.0,0,0,1.74,"FABRIC_PRIMARY_TORSO"));
    g.add(cyl(.15,.88,-.55,0,1.78,"x","FABRIC_PRIMARY_SLEEVE_L"));
    g.add(cyl(.15,.88,.55,0,1.78,"x","FABRIC_PRIMARY_SLEEVE_R"));
    const hood=mesh(new THREE.TorusGeometry(.25,.08,18,42),"FABRIC_ACCENT_HOOD");
    hood.rotation.x=Math.PI/2; hood.position.set(0,.06,2.25); g.add(hood);
    g.add(box(.45,.38,.17,0,-.02,1.42,"FABRIC_DARK_POCKET"));
  } else if(kind==="tee"){
    g.add(box(.68,.36,.82,0,0,1.76,"FABRIC_PRIMARY_TORSO"));
    g.add(cyl(.14,.42,-.48,0,1.98,"x","FABRIC_ACCENT_SLEEVE_L"));
    g.add(cyl(.14,.42,.48,0,1.98,"x","FABRIC_ACCENT_SLEEVE_R"));
    g.add(cyl(.2,.06,0,0,2.2,"z","FABRIC_DARK_COLLAR"));
  } else if(kind==="cap"){
    g.add(ellipsoid(.4,.36,.24,0,0,1.95,"FABRIC_PRIMARY_CROWN"));
    g.add(box(.48,.38,.05,0,-.28,1.8,"FABRIC_DARK_VISOR"));
    g.add(box(.22,.03,.10,0,-.37,1.94,"FABRIC_ACCENT_BADGE"));
  }
  return g;
}

export function buildAthlete(pose="stand"){
  const g=new THREE.Group(); g.name=`ATHLETE_${pose.toUpperCase()}`;
  const bodyMat=new THREE.MeshStandardMaterial({color:"#aaa49c",roughness:.96,transparent:true,opacity:.18,depthWrite:false});
  const body=(geo,px,py,pz)=>{const o=new THREE.Mesh(geo,bodyMat);o.position.set(px,py,pz);g.add(o);return o;};
  body(new THREE.SphereGeometry(1,24,16),0,0,2.34).scale.set(.17,.17,.19);
  body(new THREE.SphereGeometry(1,24,16),0,0,1.76).scale.set(.28,.18,.42);
  body(new THREE.SphereGeometry(1,24,16),0,0,1.25).scale.set(.24,.16,.18);
  if(pose==="aero"){
    [-.17,.17].forEach(x=>{const a=body(new THREE.CylinderGeometry(.075,.075,.72,20),x,-.33,1.79);a.rotation.x=Math.PI/2;});
    [-.14,.14].forEach((x,i)=>{const l=body(new THREE.CylinderGeometry(.085,.09,.9,20),x,0,.68);l.rotation.x=(i?-.16:.22);});
  } else if(pose==="run"){
    [-.16,.16].forEach((x,i)=>{const l=body(new THREE.CylinderGeometry(.085,.09,.9,20),x,0,.7);l.rotation.x=i?-.38:.38;});
    [-.38,.38].forEach((x,i)=>{const a=body(new THREE.CylinderGeometry(.072,.075,.7,20),x,0,1.75);a.rotation.x=i?.52:-.52;});
  } else {
    [-.43,.43].forEach(x=>body(new THREE.CylinderGeometry(.072,.075,.78,20),x,0,1.72));
    [-.14,.14].forEach(x=>body(new THREE.CylinderGeometry(.085,.09,.96,20),x,0,.7));
  }
  return g;
}
