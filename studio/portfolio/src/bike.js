import * as THREE from 'three';
import { applyWyld } from './stained-glass.js';
// Same exhibit and finish in both renderers; original Konam geometry is untouched.
export function prepareBike(root,{floorY=0,length=4.4,rotation=0,coat=false}={}) {
  const box=new THREE.Box3().setFromObject(root), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
  const scale=length/Math.max(size.x,size.y,size.z);
  root.scale.setScalar(scale);root.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  const group=new THREE.Group();group.name='STAINED_GLASS_SPEEDMAX';group.add(root);group.position.y=floorY;group.rotation.y=rotation;group.updateMatrixWorld(true);
  const painted=new Set(), replacements=new Map();
  root.traverse(o=>{if(!o.isMesh)return;o.userData.heroDetail=true;const materials=[].concat(o.material).map(original=>{
    let m=replacements.get(original)||original;
    if(m.name==='paint_frame'&&!painted.has(m)){
      if(coat){m=new THREE.MeshPhysicalMaterial({color:original.color,roughness:original.roughness,metalness:original.metalness,map:original.map,normalMap:original.normalMap,side:original.side,clearcoat:.55,clearcoatRoughness:.24});m.name=original.name;replacements.set(original,m);}
      painted.add(m);m.roughness=.28;m.metalness=.15;applyWyld(m,group,{stops:['#b3122e','#1d4fd6','#f2c14e','#2f9e5a','#6f4cd9'],angle:18,scale:2.1,flow:.4,darkness:0});}
    if(/carbon|rubber|tyre/.test(m.name))m.roughness=Math.max(m.roughness,.32);
    return m;
  });o.material=Array.isArray(o.material)?materials:materials[0];});
  for(const original of replacements.keys())original.dispose();
  if(!painted.size)throw new Error('The bike has no paint_frame material');
  return group;
}
