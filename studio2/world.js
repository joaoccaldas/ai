import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';

const isMobile = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export class StoryWorld {
  constructor(canvas, onActGesture){
    this.canvas=canvas; this.onActGesture=onActGesture; this.act='cave'; this.active=null; this.running=true; this.last=0; this.fpsSamples=[]; this.manualQuality=false;
    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color('#07080a'); this.scene.fog=new THREE.FogExp2('#080a0d',.025);
    this.camera=new THREE.PerspectiveCamera(isMobile?52:42,innerWidth/innerHeight,.05,120); this.camera.position.set(0,2.2,8.5);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile,powerPreference:'high-performance'}); this.renderer.outputColorSpace=THREE.SRGBColorSpace; this.renderer.toneMapping=THREE.AgXToneMapping; this.renderer.toneMappingExposure=1.05;
    this.setQuality('auto');
    this.controls=new OrbitControls(this.camera,canvas); this.controls.enableDamping=true; this.controls.enablePan=false; this.controls.minDistance=4; this.controls.maxDistance=12; this.controls.maxPolarAngle=Math.PI*.58; this.controls.minPolarAngle=Math.PI*.33; this.controls.target.set(0,1,0);
    this.controls.addEventListener('change',()=>this.wake());
    this.base=new THREE.Group(); this.scene.add(this.base);
    this.addBase(); this.setAct('cave'); this.bind(); this.loop(0);
  }
  addBase(){
    const hemi=new THREE.HemisphereLight(0x9eb8d8,0x15100b,.8); this.base.add(hemi);
    this.key=new THREE.DirectionalLight(0xffe5bd,2.3); this.key.position.set(4,7,5); this.base.add(this.key);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(15,64),new THREE.MeshStandardMaterial({color:0x0b0d10,roughness:.95,metalness:.05})); floor.rotation.x=-Math.PI/2; this.base.add(floor);
    this.dust=this.particles(260,isMobile?15:28,0xd8c79f,.018); this.base.add(this.dust);
  }
  particles(count,spread,color,size){
    const p=new Float32Array(count*3); for(let i=0;i<count;i++){p[i*3]=(Math.random()-.5)*spread;p[i*3+1]=Math.random()*7;p[i*3+2]=(Math.random()-.5)*spread;}
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(p,3)); const m=new THREE.PointsMaterial({color,size,transparent:true,opacity:.45,depthWrite:false}); return new THREE.Points(g,m);
  }
  box(w,h,d,color,rough=.75,metal=.05){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}));m.castShadow=false;return m}
  glow(color,intensity=1){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.35,metalness:.2})}
  clearActive(){
    if(!this.active)return; this.scene.remove(this.active);
    this.active.traverse(o=>{o.geometry?.dispose?.(); const ms=Array.isArray(o.material)?o.material:[o.material];ms.filter(Boolean).forEach(m=>{Object.values(m).forEach(v=>v?.isTexture&&v.dispose());m.dispose?.()})});
    this.active=null;
  }
  setAct(id){this.act=id;this.clearActive();const g=new THREE.Group();g.name='act:'+id;this.active=g;this.scene.add(g);const fn=this['build_'+id]||this.build_cave;fn.call(this,g);this.wake(2200)}
  build_cave(g){
    this.scene.fog.density=.045;this.key.color.set(0xffb45f);this.key.intensity=1.2;
    for(let i=0;i<18;i++){const r=.7+Math.random()*1.8;const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),new THREE.MeshStandardMaterial({color:0x2a2723,roughness:1}));const a=(i/18)*Math.PI*2;rock.position.set(Math.cos(a)*(5+Math.random()*2),r*.35,Math.sin(a)*(5+Math.random()*2));rock.scale.y=.6+Math.random();g.add(rock)}
    const fire=new THREE.PointLight(0xff8a32,13,9);fire.position.set(0,1.1,0);g.add(fire);
    const altar=this.box(3,.3,1.4,0x302b25);altar.position.y=.15;g.add(altar);
    for(let i=0;i<7;i++){const glyph=this.box(.18,.18,.03,0xffa340,.4,0);glyph.material=this.glow(0xff8f35,2);glyph.position.set(-1.1+i*.36,.45,-.72);glyph.rotation.z=(i-3)*.12;g.add(glyph)}
  }
  build_workshop(g){
    this.scene.fog.density=.024;this.key.color.set(0xffcf91);this.key.intensity=2.5;
    const wall=this.box(11,5,.3,0x2b251f);wall.position.set(0,2.5,-4);g.add(wall);
    for(let i=0;i<5;i++){const bench=this.box(1.8,.16,.8,0x5b3b24);bench.position.set(-4+i*2,1,-2.8+((i%2)*1.4));g.add(bench);const screen=this.box(.8,.52,.08,0x12161c,.3,.2);screen.material=this.glow(i%2?0x62d6c3:0xffa35c,.7);screen.position.set(bench.position.x,1.5,bench.position.z);g.add(screen)}
    for(let i=0;i<12;i++){const wire=new THREE.Mesh(new THREE.TorusGeometry(.35+Math.random()*.35,.018,6,40),new THREE.MeshStandardMaterial({color:i%2?0xe7aa58:0x5aa5a8,roughness:.5}));wire.position.set((Math.random()-.5)*8,.4+Math.random()*2,(Math.random()-.5)*5);wire.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);g.add(wire)}
  }
  build_cemetery(g){
    this.scene.fog.density=.055;this.key.color.set(0x9f9bd0);this.key.intensity=1.1;
    const moon=new THREE.Mesh(new THREE.SphereGeometry(.9,32,32),this.glow(0xc9d9ff,1.5));moon.position.set(-5,6,-8);g.add(moon);
    for(let i=0;i<18;i++){const grave=this.box(.72,1.3,.18,0x3f4148,1,0);grave.position.set((i%6-2.5)*1.45,.65,-1-Math.floor(i/6)*1.8);grave.rotation.y=(Math.random()-.5)*.16;g.add(grave);const crt=this.box(.46,.23,.04,0x151a22,.4,.3);crt.material=this.glow(i===8?0xff6f6f:0x7582a8,i===8?1.5:.35);crt.position.set(grave.position.x,grave.position.y+.18,grave.position.z-.11);g.add(crt)}
    const empty=new THREE.Mesh(new THREE.BoxGeometry(1.4,.12,2.1),new THREE.MeshStandardMaterial({color:0x050607,roughness:1}));empty.position.set(4,.04,-4.8);g.add(empty);
  }
  build_arcade(g){
    this.scene.fog.density=.018;this.key.color.set(0xff60be);this.key.intensity=2;
    for(let i=0;i<12;i++){const cab=this.box(.8,1.8,.72,0x15131a,.5,.1);cab.position.set((i%6-2.5)*1.35,.9,-1.2-Math.floor(i/6)*2.1);g.add(cab);const s=this.box(.56,.48,.03,0x111111);s.material=this.glow(i%3===0?0xff4fac:i%3===1?0x62e6ff:0xc7ff63,1.8);s.position.set(cab.position.x,1.2,cab.position.z-.38);g.add(s)}
    const sign=this.box(6,.65,.12,0x111111);sign.material=this.glow(0xff4fac,1.2);sign.position.set(0,3.6,-4.6);g.add(sign);
  }
  build_observatory(g){
    this.scene.fog.density=.008;this.key.color.set(0x89baff);this.key.intensity=.8;
    const dome=new THREE.Mesh(new THREE.SphereGeometry(5,40,20,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0x23344f,wireframe:true,transparent:true,opacity:.28,roughness:.3,metalness:.4}));dome.position.y=0;g.add(dome);
    const globe=new THREE.Mesh(new THREE.SphereGeometry(1.25,48,48),new THREE.MeshPhysicalMaterial({color:0x16314a,metalness:.2,roughness:.6,emissive:0x0d2f55,emissiveIntensity:.4}));globe.position.y=1.35;g.add(globe);
    for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.8+i*.55,.012,6,128),this.glow(i%2?0x6fe3c4:0x77aaff,.8));ring.position.y=1.35;ring.rotation.set(.4+i*.17,.2+i*.25,0);g.add(ring)}
    const stars=this.particles(isMobile?800:1800,70,0xffffff,.025);g.add(stars);
  }
  build_machine(g){
    this.scene.fog.density=.014;this.key.color.set(0x7de4c8);this.key.intensity=2.4;
    for(let x=-3;x<=3;x++)for(let z=-3;z<=1;z+=2){const h=1.2+((Math.abs(x+z))%3)*.6;const tower=this.box(.55,h,.55,0x17211f,.3,.5);tower.position.set(x*1.15,h/2,z);g.add(tower);const node=new THREE.Mesh(new THREE.SphereGeometry(.08,12,12),this.glow(0x72e5c9,2));node.position.set(tower.position.x,h+.14,z);g.add(node)}
    for(let i=0;i<8;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.4+i*.33,.009,5,96),this.glow(0x68d9ff,.5));ring.position.set(0,2,-1);ring.rotation.x=Math.PI/2+(i*.06);g.add(ring)}
  }
  build_horizon(g){
    this.scene.fog.density=.01;this.key.color.set(0xffead0);this.key.intensity=2.8;
    for(let i=0;i<10;i++){const frame=new THREE.Mesh(new THREE.TorusGeometry(1.2+i*.18,.018,4,48,Math.PI),new THREE.MeshStandardMaterial({color:0xe8dfd0,wireframe:true,roughness:.8}));frame.scale.y=1.5;frame.position.set((i-4.5)*1.1,1.1,-i*.65);frame.rotation.y=Math.PI/2;g.add(frame)}
    for(let i=0;i<30;i++){const cube=this.box(.12,.12,.12,0xf0e6d6,.8,0);cube.position.set((Math.random()-.5)*10,Math.random()*4,(Math.random()-.5)*12);cube.material.wireframe=true;g.add(cube)}
  }
  setQuality(mode){this.quality=mode;const dpr=mode==='low'?.75:mode==='high'?Math.min(devicePixelRatio,1.75):Math.min(devicePixelRatio,isMobile?1.05:1.4);this.renderer.setPixelRatio(dpr);this.renderer.setSize(innerWidth,innerHeight,false)}
  cycleQuality(){this.manualQuality=true;const modes=['auto','low','high'];const n=modes[(modes.indexOf(this.quality)+1)%modes.length];this.setQuality(n);return n}
  wake(ms=1400){this.running=true;clearTimeout(this.sleepTimer);if(!reduceMotion)this.sleepTimer=setTimeout(()=>{if(!this.controls.enabled)return;this.running=false;},ms)}
  bind(){
    addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.setQuality(this.quality)});
    document.addEventListener('visibilitychange',()=>{this.running=!document.hidden;this.wake()});
    let wheelLock=false;this.canvas.addEventListener('wheel',e=>{if(wheelLock)return;wheelLock=true;setTimeout(()=>wheelLock=false,700);this.onActGesture?.(e.deltaY>0?1:-1);},{passive:true});
    this.canvas.addEventListener('pointerdown',()=>this.wake(2400));
  }
  loop(t){
    requestAnimationFrame(x=>this.loop(x));if(document.hidden)return;
    const target=isMobile?33:16;if(t-this.last<target)return;const dt=Math.min(.05,(t-this.last)/1000||0);this.last=t;
    if(this.running){
      this.controls.update();
      if(this.active){
        this.active.rotation.y+=reduceMotion?0:dt*.012;
        if(this.act==='observatory')this.active.children.forEach((o,i)=>{if(o.geometry?.type==='TorusGeometry')o.rotation.z+=dt*.05*(i+1)});
        if(this.act==='machine')this.active.position.y=Math.sin(t*.00045)*.04;
      }
      if(this.dust)this.dust.rotation.y+=dt*.008;
      this.renderer.render(this.scene,this.camera);
    }
    if(!this.manualQuality&&t>2500){
      this.fpsSamples.push(dt);if(this.fpsSamples.length>90)this.fpsSamples.shift();
      if(this.fpsSamples.length===90){const avg=this.fpsSamples.reduce((a,b)=>a+b,0)/90;const fps=1/avg;if(fps<38&&this.quality!=='low')this.setQuality('low')}
    }
  }
}
