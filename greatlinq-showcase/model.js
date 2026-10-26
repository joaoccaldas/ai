// Optional real GLB viewer: self-contained public source files, no backend or hidden credentials.
// Dynamic import is loaded only when visitor reaches Objects. Image remains if CDN/WebGL fails.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export async function createViewer({mount,url,label,shouldKeep}){
  const scene=new THREE.Scene();const rect=mount.getBoundingClientRect();const width=Math.max(1,rect.width),height=Math.max(1,rect.height);
  const camera=new THREE.PerspectiveCamera(38,width/height,.01,250);camera.position.set(4,2.4,5);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(1.7,window.devicePixelRatio||1));renderer.setSize(width,height);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;mount.append(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.autoRotate=true;controls.autoRotateSpeed=.52;controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=.35;controls.maxDistance=18;
  scene.add(new THREE.HemisphereLight(0xeef6ff,0x3b4b68,2.4));const main=new THREE.DirectionalLight(0xffffff,3.1);main.position.set(4,8,5);scene.add(main);const rim=new THREE.DirectionalLight(0xb3a0ff,2.1);rim.position.set(-5,2,-5);scene.add(rim);
  let model=null,active=true,raf=0,resize=null;const cleanup=()=>{if(!active)return;active=false;cancelAnimationFrame(raf);resize?.disconnect();controls.dispose();if(model){model.traverse(x=>{x.geometry?.dispose();if(x.material){(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()})}})}renderer.dispose();renderer.domElement.remove()};
  try{
    const gltf=await new GLTFLoader().loadAsync(url);if(!active||!shouldKeep()){cleanup();throw new Error('Stale scene')}
    model=gltf.scene;scene.add(model);const box=new THREE.Box3().setFromObject(model);if(box.isEmpty())throw new Error('Empty GLB');const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());model.position.sub(center);const max=Math.max(size.x,size.y,size.z);if(!(max>0&&Number.isFinite(max)))throw new Error('Invalid model size');const factor=3.15/max;model.scale.setScalar(factor);controls.target.set(0,0,0);const dist=Math.max(4.5,factor*max*1.7);camera.position.set(dist*.93,dist*.56,dist);camera.near=.005;camera.far=500;camera.updateProjectionMatrix();controls.update();
    resize=new ResizeObserver(entries=>{const r=entries[0]?.contentRect;if(!r||!active)return;camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height))});resize.observe(mount);
    const frame=()=>{if(!active)return;raf=requestAnimationFrame(frame);if(!document.hidden){controls.update();renderer.render(scene,camera)}};frame();
    renderer.domElement.addEventListener('pointerdown',()=>{controls.autoRotate=false},{passive:true});return {dispose:cleanup};
  }catch(error){cleanup();throw error}
}