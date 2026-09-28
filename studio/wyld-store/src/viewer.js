import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { buildProduct, buildAthlete } from "./productFactory.js";

export class WyldViewer {
  constructor(canvas,{colorways}){
    this.canvas=canvas;this.colorways=colorways;this.loader=new GLTFLoader();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color("#e8e3da");
    this.camera=new THREE.PerspectiveCamera(36,1,.05,100);this.camera.position.set(3.15,1.75,4.45);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const pmrem=new THREE.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.target.set(0,1.25,0);this.controls.minDistance=2;this.controls.maxDistance=7.5;this.controls.maxPolarAngle=Math.PI*.72;
    this.product=new THREE.Group();this.athlete=new THREE.Group();this.scene.add(this.athlete,this.product,this.makeFloor());this.addLights();
    this.currentColor="raspberry";this.currentProduct=null;this.currentPose="product";this.assetMode="loading";
    this.resize=this.resize.bind(this);this.render=this.render.bind(this);new ResizeObserver(this.resize).observe(canvas.parentElement);this.resize();this.render();
  }
  makeFloor(){const floor=new THREE.Mesh(new THREE.CircleGeometry(2.45,96),new THREE.MeshPhysicalMaterial({color:"#d4cec4",roughness:.9,metalness:.02,clearcoat:.08}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;floor.receiveShadow=true;return floor;}
  addLights(){const key=new THREE.DirectionalLight("#fff8f0",4.2);key.position.set(3.5,5.5,4.2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);const fill=new THREE.DirectionalLight("#b7efff",1.55);fill.position.set(-4,2.5,2.4);const rim=new THREE.DirectionalLight("#ff6faf",2.25);rim.position.set(0,3.2,-4);const top=new THREE.PointLight("#ffffff",7,8);top.position.set(0,5,0);this.scene.add(key,fill,rim,top);}
  async loadProduct(product,colorway){
    this.currentProduct=product;this.currentColor=colorway||product.defaultColor;this.currentPose="product";this.clearGroup(this.athlete);this.clearGroup(this.product);this.product.visible=true;this.athlete.visible=false;
    try{const gltf=await this.loader.loadAsync(new URL("../assets/"+product.asset,import.meta.url).href);const root=gltf.scene;this.normalize(root,product.kind==="cap"?1.55:2.35);this.product.add(root);this.recolor(root,this.currentColor);this.assetMode="GLB";}
    catch(error){console.warn("WYLD GLB load failed, using semantic fallback",error);const fallback=buildProduct(product.kind==="jersey"?"tee":product.kind);this.normalize(fallback,product.kind==="cap"?1.55:2.35);this.product.add(fallback);this.recolor(fallback,this.currentColor);this.assetMode="fallback";}
    this.frame("hero");return this.assetMode;
  }
  async setPose(pose="product"){
    this.currentPose=pose;
    if(pose==="product"){this.athlete.visible=false;this.product.visible=true;this.frame("hero");return this.assetMode;}
    this.product.visible=false;this.athlete.visible=true;this.clearGroup(this.athlete);
    try{const gltf=await this.loader.loadAsync(new URL("../assets/athlete-"+pose+".glb",import.meta.url).href);const root=gltf.scene;this.normalize(root,2.7);this.recolor(root,this.currentColor);this.athlete.add(root);this.assetMode="GLB";}
    catch(error){console.warn("WYLD athlete GLB load failed, using semantic fallback",error);const fallback=buildAthlete(pose);this.normalize(fallback,2.7);this.recolor(fallback,this.currentColor);this.athlete.add(fallback);this.assetMode="fallback";}
    this.frame(pose==="aero"?"aero":"hero");return this.assetMode;
  }
  normalize(root,targetHeight=2.4){root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),scale=targetHeight/Math.max(size.y,.001);root.scale.setScalar(scale);root.updateMatrixWorld(true);const scaled=new THREE.Box3().setFromObject(root),center=scaled.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=scaled.min.y;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}
  recolor(root,key){const c=this.colorways[key]||this.colorways.raspberry;root.traverse(o=>{if(!o.isMesh)return;const n=(o.name||"").toUpperCase();if(n.includes("BODY_")||n.includes("SHOE")||n.includes("BIKE_"))return;if(!o.material||!o.material.clone)return;o.material=o.material.clone();const color=n.includes("ACCENT")||n.includes("MARK")?c.accent:n.includes("DARK")||n.includes("ZIP")?c.dark:c.primary;o.material.color?.set(color);if("roughness"in o.material)o.material.roughness=n.includes("MARK")?.32:n.includes("DARK")?.68:.46;if("metalness"in o.material)o.material.metalness=n.includes("ZIP")?.18:.02;o.material.needsUpdate=true;});}
  applyColorway(key){this.currentColor=key;this.recolor(this.currentPose==="product"?this.product:this.athlete,key);}
  frame(mode="hero"){const shots={hero:[[3.1,1.75,4.35],[0,1.25,0]],fabric:[[1.45,1.95,2.25],[0,1.72,0]],aero:[[3.9,1.35,.55],[0,1.18,0]],silhouette:[[.08,1.65,4.75],[0,1.25,0]]};const[p,t]=shots[mode]||shots.hero;this.animateCamera(new THREE.Vector3(...p),new THREE.Vector3(...t),650);this.scene.background.set(mode==="silhouette"?"#0b0712":"#e8e3da");}
  animateCamera(pos,target,duration=700){const startP=this.camera.position.clone(),startT=this.controls.target.clone(),start=performance.now();const tick=now=>{const x=Math.min(1,(now-start)/duration),e=1-Math.pow(1-x,3);this.camera.position.lerpVectors(startP,pos,e);this.controls.target.lerpVectors(startT,target,e);if(x<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);}
  playCinema(){const start=performance.now(),duration=12000,target=new THREE.Vector3(0,1.3,0);const loop=now=>{const t=(now-start)/duration;if(t>1)return;const a=t*Math.PI*2+.25,r=3.8-Math.sin(t*Math.PI)*.55;this.camera.position.set(Math.cos(a)*r,1.4+Math.sin(t*Math.PI)*.72,Math.sin(a)*r);this.controls.target.lerp(target,.08);requestAnimationFrame(loop);};requestAnimationFrame(loop);}
  clearGroup(group){while(group.children.length){const child=group.children.pop();child.traverse?.(o=>{o.geometry?.dispose?.();if(o.material){Array.isArray(o.material)?o.material.forEach(m=>m.dispose?.()):o.material.dispose?.();}});}}
  resize(){const el=this.canvas.parentElement,w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  render(){this.controls.update();this.renderer.render(this.scene,this.camera);requestAnimationFrame(this.render);}
}
