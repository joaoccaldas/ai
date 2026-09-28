import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildProduct, buildAthlete } from "./productFactory.js";

export class WyldViewer {
  constructor(canvas, { colorways }) {
    this.canvas = canvas;
    this.colorways = colorways;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#e8e3da");
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(3.1, 1.8, 4.2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0, 1.25);
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 7;
    this.controls.maxPolarAngle = Math.PI * 0.72;
    this.product = new THREE.Group();
    this.athlete = new THREE.Group();
    this.scene.add(this.athlete, this.product);
    this.scene.add(this.makeFloor());
    this.addLights();
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    new ResizeObserver(this.resize).observe(canvas.parentElement);
    this.resize();
    this.render();
  }

  makeFloor() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.2,80),
      new THREE.MeshStandardMaterial({ color:"#d4cec4",roughness:.92 })
    );
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; return floor;
  }

  addLights() {
    const key=new THREE.DirectionalLight("#fff7ef",3.2);key.position.set(3,4,4);
    const fill=new THREE.DirectionalLight("#a9eaff",1.5);fill.position.set(-4,2,2);
    const rim=new THREE.DirectionalLight("#ff76b8",2.0);rim.position.set(0,3,-4);
    this.scene.add(key,fill,rim);
  }

  loadProduct(kind,colorway) {
    this.clearGroup(this.product);
    this.product.add(buildProduct(kind));
    this.applyColorway(colorway);
    this.frame("hero");
  }

  setPose(pose="stand") {
    this.clearGroup(this.athlete);
    this.athlete.add(buildAthlete(pose));
  }

  applyColorway(key) {
    const c=this.colorways[key]||this.colorways.berry;
    this.product.traverse(o=>{
      if(!o.isMesh)return;
      const n=(o.name||"").toUpperCase();
      const color=n.includes("ACCENT")?c.accent:n.includes("DARK")?c.dark:c.primary;
      o.material.color.set(color);
      o.material.roughness=n.includes("DARK")?.68:.48;
    });
  }

  frame(mode="hero") {
    const shots={
      hero:[[3.1,1.8,4.2],[0,0,1.25]],
      fabric:[[1.5,2.05,2.35],[0,0,1.8]],
      aero:[[3.9,1.35,.35],[0,0,1.25]],
      silhouette:[[.05,1.7,4.8],[0,0,1.3]]
    };
    const [p,t]=shots[mode]||shots.hero;
    this.animateCamera(new THREE.Vector3(...p),new THREE.Vector3(...t),650);
    this.scene.background.set(mode==="silhouette"?"#0b0712":"#e8e3da");
  }

  animateCamera(pos,target,duration=700) {
    const startP=this.camera.position.clone(),startT=this.controls.target.clone(),start=performance.now();
    const tick=now=>{const x=Math.min(1,(now-start)/duration),e=1-Math.pow(1-x,3);this.camera.position.lerpVectors(startP,pos,e);this.controls.target.lerpVectors(startT,target,e);if(x<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }

  playCinema() {
    const start=performance.now(),duration=12000,target=new THREE.Vector3(0,0,1.35);
    const loop=now=>{const t=(now-start)/duration;if(t>1)return;const a=t*Math.PI*2+.25,r=3.8-Math.sin(t*Math.PI)*.55;this.camera.position.set(Math.cos(a)*r,1.45+Math.sin(t*Math.PI)*.75,Math.sin(a)*r);this.controls.target.lerp(target,.08);requestAnimationFrame(loop);};requestAnimationFrame(loop);
  }

  clearGroup(group) {
    while(group.children.length){const child=group.children.pop();child.traverse?.(o=>{o.geometry?.dispose?.();if(o.material){Array.isArray(o.material)?o.material.forEach(m=>m.dispose?.()):o.material.dispose?.();}});}
  }

  resize() {
    const el=this.canvas.parentElement,w=el.clientWidth,h=el.clientHeight;
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
  }

  render() {this.controls.update();this.renderer.render(this.scene,this.camera);requestAnimationFrame(this.render);}
}
