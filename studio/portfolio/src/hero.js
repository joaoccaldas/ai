import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { prepareBike } from './bike.js';
import { renderProfile } from './quality.mjs';

const stage=document.getElementById('bike-stage'), canvas=document.getElementById('bike-canvas');
const toggle=document.getElementById('bike-toggle'), reset=document.getElementById('bike-reset'), status=document.getElementById('bike-status');
const base=new URL('.',document.currentScript.src);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
let renderer, scene, camera, controls, bike, environment, observer, frame=0, active=false, visible=true, loading=false;
let home, target, minDistance, maxDistance, generation=0;
const cleanups=[];
function dispose() {
  generation++;loading=false;
  cancelAnimationFrame(frame); frame=0;
  controls?.dispose(); environment?.dispose(); observer?.disconnect();
  cleanups.splice(0).forEach(fn=>fn());
  if(scene) { const geometries=new Set(), materials=new Set(); scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);[].concat(o.material).forEach(m=>materials.add(m));}}); geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); }
  renderer?.dispose(); renderer=scene=camera=controls=bike=environment=observer=undefined;
}
function fail(error) {
  active=false;loading=false;stage.classList.remove('loaded');canvas.hidden=true;reset.hidden=true;
  toggle.disabled=false;toggle.textContent='Retry 3D';toggle.setAttribute('aria-pressed','false');
  status.textContent='The still image is available. 3D could not load on this device.';
  console.warn('Studio hero unavailable:',error?.message||error);dispose();
}
function setActive(value) {
  active=value;stage.classList.toggle('loaded',value);canvas.hidden=!value;reset.hidden=!value;
  toggle.setAttribute('aria-pressed',String(value));toggle.textContent=value?'Use still image':'Explore in 3D';
  status.textContent=value?'Drag to orbit · arrow keys to rotate · + / − to zoom':'';
  if(value){resize();schedule();}else{cancelAnimationFrame(frame);frame=0;}
}
function schedule(){if(!frame&&active&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
function draw(){frame=0;if(!active||!visible||document.hidden)return;controls.update();renderer.render(scene,camera);if(controls.autoRotate||controls.enableDamping)schedule();}
function resize(){if(!renderer)return;const {width,height}=stage.getBoundingClientRect();camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);schedule();}
function fit(){
  const aspect=stage.clientWidth/stage.clientHeight;
  const distance=Math.max(3.6,2.45/(Math.tan(THREE.MathUtils.degToRad(32)/2)*aspect),1.45/Math.tan(THREE.MathUtils.degToRad(32)/2))*1.12;
  target=new THREE.Vector3(0,1.25,0);
  home=new THREE.Vector3(distance*.28,1.25+distance*.16,distance*.96);
  minDistance=distance*.65;maxDistance=distance*1.6;
  camera.position.copy(home);controls.target.copy(target);controls.minDistance=minDistance;controls.maxDistance=maxDistance;controls.update();
}
async function start(){
  if(loading)return;if(renderer){setActive(!active);return;}
  const attempt=++generation;
  loading=true;toggle.disabled=true;status.textContent='Preparing the Stained Glass exhibit…';
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
    const gl=renderer.getContext(), debug=gl.getExtension('WEBGL_debug_renderer_info');
    const software=/swiftshader|llvmpipe|software/i.test(debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'');
    const profile=renderProfile('auto',{coarse,software,dpr:devicePixelRatio});
    renderer.setPixelRatio(software?Math.min(devicePixelRatio,1):profile.dpr);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.05,100);
    const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
    environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#edf1df','#343827',.35));
    for(const [color,intensity,pos] of [['#fff3dd',2.2,[2,5,4]],['#b4d1fa',1.5,[-3,3,-2]],['#b4be7a',.7,[5,2,-3]]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(...pos);scene.add(light);}
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf=await loader.loadAsync(new URL(`assets/speedmax-${coarse||innerWidth<700?'mobile':'desktop'}.glb`,base).href);
    if(attempt!==generation)return;
    bike=prepareBike(gltf.scene,{coat:profile.coat});scene.add(bike);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.7,2.7,.055,80),new THREE.MeshStandardMaterial({color:'#121510',metalness:.1,roughness:.8}));plinth.scale.z=.38;plinth.position.y=-.055;scene.add(plinth);
    controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=false;controls.enableZoom=false;controls.autoRotate=false;controls.autoRotateSpeed=.22;controls.minPolarAngle=.6;controls.maxPolarAngle=1.64;
    controls.addEventListener('start',()=>{controls.autoRotate=false;});controls.addEventListener('change',schedule);
    fit();reset.onclick=()=>{fit();controls.autoRotate=false;schedule();};
    const onKey=e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
      e.preventDefault();controls.autoRotate=false;
      if(e.key==='Home'){fit();schedule();return;}
      const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if(e.key==='ArrowLeft')spherical.theta-=.12;if(e.key==='ArrowRight')spherical.theta+=.12;
      if(e.key==='ArrowUp')spherical.phi-=.08;if(e.key==='ArrowDown')spherical.phi+=.08;
      if(e.key==='+'||e.key==='=')spherical.radius*=.9;if(e.key==='-')spherical.radius*=1.1;
      spherical.phi=THREE.MathUtils.clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);spherical.radius=THREE.MathUtils.clamp(spherical.radius,minDistance,maxDistance);
      camera.position.setFromSpherical(spherical).add(controls.target);controls.update();schedule();
    };
    canvas.addEventListener('keydown',onKey);cleanups.push(()=>canvas.removeEventListener('keydown',onKey));
    observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}},{threshold:.01});observer.observe(stage);
    loading=false;toggle.disabled=false;setActive(true);
    window.__STUDIO_HERO={get active(){return active;},get triangles(){return renderer.info.render.triangles;},get drawCalls(){return renderer.info.render.calls;},capture:()=>{controls.autoRotate=false;fit();const previousRatio=renderer.getPixelRatio();renderer.setPixelRatio(2);renderer.render(scene,camera);const image=canvas.toDataURL('image/webp',.95);renderer.setPixelRatio(previousRatio);resize();return image;}};
  }catch(error){fail(error);}
}
toggle.addEventListener('click',start);
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('WebGL context lost'));});
addEventListener('pagehide',()=>{setActive(false);dispose();});
addEventListener('pageshow',e=>{if(e.persisted&&!reduced&&!navigator.connection?.saveData)start();});
// HTML and poster are available before JavaScript, WebGL or the model download.
if(!reduced&&!navigator.connection?.saveData) {if('requestIdleCallback' in window)requestIdleCallback(start,{timeout:1500});else setTimeout(start,300);}
