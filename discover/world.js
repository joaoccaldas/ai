/* Reuses the Caldas Studio hall GLB and lightmap in-place. Procedural sets follow Studio2's
 * one-active-scene lifecycle. Three.js is lazy-loaded; learning works if it is blocked. */
const THREE_URL='https://esm.sh/three@0.186.1?target=es2020';
const GLTF_URL='https://esm.sh/three@0.186.1/examples/jsm/loaders/GLTFLoader.js?target=es2020';
const MESHOPT_URL='https://esm.sh/three@0.186.1/examples/jsm/libs/meshopt_decoder.module.js?target=es2020';
const ASSETS='../studio/hall/assets/';
const mobile=()=>innerWidth<760||matchMedia('(pointer:coarse)').matches;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export async function createWorld(canvas,{onPick,onStatus=()=>{}}){
 let THREE,GLTFLoader,MeshoptDecoder;
 try{
   [THREE,{GLTFLoader},{MeshoptDecoder}]=await Promise.all([import(THREE_URL),import(GLTF_URL),import(MESHOPT_URL)]);
 }catch(e){onStatus('2D mode · 3D library unavailable');return null;}
 let renderer,scene,camera,active=null,markers=[],sceneType='',raf=0,alive=true,last=0,needsFrame=true,loadedHall=null;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile(),powerPreference:'low-power',alpha:true});}catch(e){onStatus('2D mode · graphics unavailable');return null;}
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.1;
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile()?1.25:1.65));
 scene=new THREE.Scene();scene.background=null;
 camera=new THREE.PerspectiveCamera(mobile()?53:40,1,.08,130);
 function size(){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);needsFrame=true;}
 function mat(color,metalness=0){return new THREE.MeshStandardMaterial({color,roughness:.73,metalness});}
 function box(parent,w,h,d,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);parent.add(m);return m;}
 function sphere(parent,r,color,x,y,z){const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,12),mat(color));m.position.set(x,y,z);parent.add(m);return m;}
 function dispose(node){if(!node)return;node.traverse(x=>{x.geometry?.dispose?.();const materials=Array.isArray(x.material)?x.material:[x.material];for(const m of materials){if(!m)continue;for(const prop of Object.values(m))if(prop?.isTexture&&!prop.userData?.shared)prop.dispose();m.dispose?.();}});scene.remove(node);}
 function base(type){
   const g=new THREE.Group();scene.add(g);active=g;
   g.add(new THREE.HemisphereLight(type==='science'?0x96c7ed:0xffe7ce,0x101d23,1.1));
   const key=new THREE.DirectionalLight(type==='science'?0x97cce8:0xffdaa9,type==='science'?1.6:2.8);key.position.set(4,8,7);g.add(key);
   return g;
 }
 function cafe(g){
   scene.fog=new THREE.Fog(0x21150e,9,35);camera.position.set(3,2.35,8.1);camera.lookAt(0,1.4,0);
   box(g,22,.12,19,'#38271d',0,-.07,-2);
   box(g,22,8,.25,'#392920',0,3.7,-8.2);
   box(g,.23,8,19,'#453022',-9,3.7,-2);box(g,.23,8,19,'#38261e',9,3.7,-2);
   for(let i=0;i<4;i++){
     const x=-5.7+i*3.7;
     const table=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.13,28),mat('#78503a'));table.position.set(x,.83,-1.8);g.add(table);
     const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.15,.83,12),mat('#a27b50',.7));leg.position.set(x,.38,-1.8);g.add(leg);
     const cup=new THREE.Mesh(new THREE.CylinderGeometry(.19,.16,.25,20),mat('#eee0c6'));cup.position.set(x,1.02,-1.8);g.add(cup);
     const cupCoffee=new THREE.Mesh(new THREE.CircleGeometry(.16,20),mat('#432212'));cupCoffee.rotation.x=-Math.PI/2;cupCoffee.position.set(x,1.148,-1.8);g.add(cupCoffee);
   }
   box(g,9,1.22,1.45,'#62432d',0,.65,-6.25);box(g,10,.15,1.7,'#aa8056',0,1.28,-6.25);
   for(let i=0;i<5;i++){
     const x=-5+i*2.5;
     const lamp=new THREE.Mesh(new THREE.ConeGeometry(.54,.75,16,1,true),new THREE.MeshStandardMaterial({color:'#b88e59',side:THREE.DoubleSide,metalness:.4}));lamp.rotation.x=Math.PI;lamp.position.set(x,3.1,-3.0);g.add(lamp);
     const light=new THREE.PointLight(0xffc187,1.5,6);light.position.set(x,2.75,-3);g.add(light);
   }
   const win=new THREE.Mesh(new THREE.PlaneGeometry(5,4.6),new THREE.MeshBasicMaterial({color:'#8eacae'}));win.position.set(0,3.2,-8.08);g.add(win);
   box(g,.13,4.6,.15,'#433225',0,3.2,-8.01);box(g,5,.11,.15,'#433225',0,3.2,-8.01);
   onStatus('Live 3D · Café set');
 }
 function science(g){
   scene.fog=new THREE.Fog(0x091825,15,75);camera.position.set(5,3.4,9);camera.lookAt(0,2,-1);
   const floor=new THREE.Mesh(new THREE.CylinderGeometry(10,10,.3,54),mat('#1a313b'));floor.position.y=-.18;g.add(floor);
   const dome=new THREE.Mesh(new THREE.SphereGeometry(12,32,18,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:'#182b3b',side:THREE.BackSide,roughness:1}));g.add(dome);
   const stars=new Float32Array(1050);for(let i=0;i<350;i++){const a=Math.random()*Math.PI*2,b=Math.random()*Math.PI*.45+.08,r=11.4;stars[i*3]=Math.cos(a)*Math.sin(b)*r;stars[i*3+1]=Math.cos(b)*r;stars[i*3+2]=Math.sin(a)*Math.sin(b)*r;}
   const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(stars,3));g.add(new THREE.Points(sg,new THREE.PointsMaterial({color:'#e1eef4',size:.1})));
   box(g,2.1,.18,1.55,'#3b5663',0,1.05,0);
   const tube=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,4,24),mat('#6a8b98',.7));tube.rotation.z=Math.PI*.38;tube.position.set(.25,2.55,-.5);g.add(tube);
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.12,24),mat('#83dad5',.45));lens.rotation.z=Math.PI*.38;lens.position.set(-1.4,3.3,-.5);g.add(lens);
   for(const x of [-1.3,0,1.3]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.065,.12,2.1,12),mat('#b2ac97'));leg.rotation.z=x*.23;leg.position.set(x*.5,.8,0);g.add(leg);}
   g.add(new THREE.PointLight(0x64bfc6,4,8));onStatus('Live 3D · Observatory set');
 }
 async function museum(g){
   scene.fog=new THREE.FogExp2('#191a19',.018);camera.position.set(0,1.8,8.4);camera.lookAt(0,1.62,-2);
   if(loadedHall){g.add(loadedHall);onStatus('Live 3D · Caldas Studio hall');return;}
   try{
     const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
     const [model,lightmap]=await Promise.all([loader.loadAsync(ASSETS+'hall.glb'),new THREE.TextureLoader().loadAsync(ASSETS+'hall_lightmap.jpg')]);
     if(!alive||sceneType!=='museum')return;
     lightmap.flipY=false;lightmap.colorSpace=THREE.SRGBColorSpace;
     model.scene.traverse(o=>{
       if(!o.isMesh)return;
       if(o.userData?.baked){o.material=new THREE.MeshBasicMaterial({map:lightmap,side:THREE.DoubleSide});}
       else if(o.userData?.art!==undefined){o.material=new THREE.MeshStandardMaterial({color:'#bfa88a',roughness:.65,metalness:.15});}
       else if(o.userData?.emit){o.material=new THREE.MeshBasicMaterial({color:'#c3a473'});}
       else{o.material=new THREE.MeshStandardMaterial({color:'#52473d',roughness:.65,metalness:.32});}
     });
     loadedHall=model.scene;g.add(loadedHall);onStatus('Live 3D · Reused Blender gallery');needsFrame=true;
   }catch(e){
     onStatus('3D fallback · gallery asset unavailable');
     // Graceful real-time procedural fallback, not an empty canvas.
     box(g,12,.1,75,'#2a2623',0,0,-26);box(g,12,7,.3,'#45392f',0,3.5,-65);
     for(let i=0;i<9;i++){const z=-4-i*6;
       for(const sign of [-1,1]){box(g,.3,6.4,3.1,'#655545',sign*5.8,3.2,z);box(g,.12,3.2,2.1,'#b59462',sign*5.55,2.45,z);
         box(g,.14,2.8,1.8,'#25363a',sign*5.43,2.45,z);}
       const lamp=new THREE.PointLight(0xffcd93,3,9);lamp.position.set(0,5.8,z);g.add(lamp);
     }
     needsFrame=true;
   }
 }
 function makeMarkers(chapter){for(const obj of chapter.objects){const i=chapter.objects.indexOf(obj), m=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),new THREE.MeshBasicMaterial({color:'#99ead7',transparent:true,opacity:.85}));
   const d=chapter.world==='museum'?3.5:3;
   m.position.set((i-1)*1.6,1.4+(i%2)*.8,chapter.world==='museum'?-(2+i*1.7):-d);
   m.userData.pick=obj.id;active.add(m);markers.push(m);
 }}
 async function setChapter(chapter){if(!alive)return;sceneType=chapter.world;markers=[];if(active){if(loadedHall&&loadedHall.parent===active){active.remove(loadedHall);}
 dispose(active);active=null;}
 const g=base(sceneType);scene.background=new THREE.Color(sceneType==='science'?'#091825':sceneType==='cafe'?'#21150e':'#1d1b18');
 if(sceneType==='museum')await museum(g);else if(sceneType==='cafe')cafe(g);else science(g);
 if(!alive||!active)return;makeMarkers(chapter);needsFrame=true;size();
 }
 function onClick(e){const rect=canvas.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(markers,false);if(hits[0])onPick(hits[0].object.userData.pick);}
 canvas.addEventListener('click',onClick);
 const observer=new ResizeObserver(size);observer.observe(canvas);document.addEventListener('visibilitychange',()=>{needsFrame=true;});
 function render(ts){if(!alive)return;raf=requestAnimationFrame(render);if(document.hidden)return;
 const frameMs=mobile()?42:24;if(ts-last<frameMs&&!needsFrame)return;last=ts;
 for(const m of markers)m.scale.setScalar(1+(reduced()?0:Math.sin(ts*.002+m.position.x)*.15));
 renderer.render(scene,camera);needsFrame=false;}
 size();raf=requestAnimationFrame(render);
 return {setChapter,setQuality(q){renderer.setPixelRatio(Math.min(devicePixelRatio||1,q==='low'?.8:mobile()?1.25:1.65));size();},dispose(){alive=false;cancelAnimationFrame(raf);canvas.removeEventListener('click',onClick);observer.disconnect();if(loadedHall?.parent)loadedHall.parent.remove(loadedHall);dispose(active);renderer.dispose();}};
}
