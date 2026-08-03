import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { rooms } from './gallery-rooms.js';

const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const mix = THREE.MathUtils.lerp;
const smoothstep = (a,b,v) => {
  const t=clamp((v-a)/(b-a),0,1);
  return t*t*(3-2*t);
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 720;

const ui = {
  loader: $('#loader'), loaderBar: $('#loaderBar'), loaderStatus: $('#loaderStatus'),
  sceneA: $('#sceneA'), sceneB: $('#sceneB'), veil: $('#transitionVeil'),
  hero: $('.hero-ui'), enter: $('#enterGallery'), label: $('#roomLabel'),
  number: $('#roomNumber'), type: $('#roomType'), name: $('#roomName'), line: $('#roomLine'),
  link: $('#roomLink'), counter: $('#roomCounter'), rail: $('#roomRail'), track: $('#scrollTrack'),
  index: $('#roomIndex'), indexGrid: $('#indexGrid'), indexToggle: $('#indexToggle'), indexClose: $('#indexClose'),
  study: $('#studyDrawer'), studyToggle: $('#studyToggle'), studyClose: $('#studyClose'),
  studyName: $('#studyName'), studyDescription: $('#studyDescription'), studyLink: $('#studyLink'), studyGrid: $('#studyGrid'),
  previous: $('#previousRoom'), next: $('#nextRoom'), restart: $('#restartTour'),
  sound: $('#soundToggle'), fallback: $('#fallback'), fallbackOpen: $('#fallbackOpen')
};

const LOBBY = 'https://images.unsplash.com/photo-1765940717433-cc42c13bfa88?auto=format&fit=crop&w=2400&q=84';
const ROOM_BACKPLATES = {
  innergroup: 'https://images.unsplash.com/photo-1774267916884-afae166d49b3?auto=format&fit=crop&w=2400&q=84',
  aurelia: rooms[1].studies[1].src.replace('w=1400','w=2400'),
  'maison-lumen': rooms[2].studies[0].src.replace('w=1400','w=2400'),
  pulse: rooms[3].studies[0].src.replace('w=1400','w=2400'),
  vinora: rooms[4].studies[0].src.replace('w=1400','w=2400'),
  'wild-stem': rooms[5].studies[0].src.replace('w=1400','w=2400'),
  eden: rooms[6].studies[0].src.replace('w=1400','w=2400'),
  dunhaven: rooms[7].studies[0].src.replace('w=1400','w=2400'),
  'ember-oak': rooms[8].studies[1].src.replace('w=1400','w=2400'),
  belong: rooms[9].studies[0].src.replace('w=1400','w=2400')
};
const backplate = room => ROOM_BACKPLATES[room.slug] || room.studies?.[0]?.src || room.image;

let currentIndex = -1;
let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
let smoothScroll = 0;
let audio = null, audioOn = false;

function setLayer(layer, url, key) {
  if (layer.dataset.key === key) return;
  layer.dataset.key = key;
  layer.style.backgroundImage = `url("${url}")`;
}

function preload(urls) {
  let loaded = 0;
  const total = urls.length;
  return Promise.all(urls.map(url => new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = image.onerror = () => {
      loaded++;
      ui.loaderBar.style.width = `${Math.round(loaded/total*100)}%`;
      ui.loaderStatus.textContent = `Prepared ${loaded} of ${total} environments`;
      resolve();
    };
    image.src = url;
  })));
}

function buildInterface() {
  ui.rail.innerHTML = rooms.map((r,i)=>`<button type="button" aria-label="${r.name}" data-room="${i}"></button>`).join('');
  ui.indexGrid.innerHTML = rooms.map((r,i)=>`
    <article class="index-card" data-room="${i}" tabindex="0">
      <img src="${backplate(r)}" alt="${r.name} gallery environment">
      <div class="meta"><span>${String(i+1).padStart(2,'0')} · ${r.type}</span><h3>${r.name}</h3><p>${r.line}</p></div>
    </article>`).join('');

  ui.rail.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>goToRoom(Number(b.dataset.room))));
  ui.indexGrid.querySelectorAll('.index-card').forEach(card=>{
    const open=()=>{closeIndex();goToRoom(Number(card.dataset.room));};
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
}

function updateRoomUI(index) {
  const room=rooms[index];
  if(!room) return;
  ui.number.textContent=`Room ${String(index+1).padStart(2,'0')}`;
  ui.type.textContent=room.type;
  ui.name.textContent=room.name;
  ui.line.textContent=room.line;
  ui.link.href=room.url;
  ui.counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(rooms.length).padStart(2,'0')}`;
  [...ui.rail.children].forEach((d,i)=>d.classList.toggle('active',i===index));
  ui.studyName.textContent=room.name;
  ui.studyDescription.textContent=room.description;
  ui.studyLink.href=room.url;
  ui.studyGrid.innerHTML=room.studies.map((s,i)=>`
    <article class="study-card">
      <img src="${s.src}" alt="${s.title} visual direction" style="object-position:${s.position||'center'}">
      <div><span>Direction ${String(i+1).padStart(2,'0')}</span><h3>${s.title}</h3><p>${s.note}</p></div>
    </article>`).join('');
  document.documentElement.style.setProperty('--accent',room.accent);
  if(audio) audio.osc.frequency.setTargetAtTime(42+index*2.2,audio.ctx.currentTime,.6);
}

function openIndex(){ui.index.classList.add('on');ui.index.setAttribute('aria-hidden','false');}
function closeIndex(){ui.index.classList.remove('on');ui.index.setAttribute('aria-hidden','true');}
function openStudy(){ui.study.classList.add('on');ui.study.setAttribute('aria-hidden','false');}
function closeStudy(){ui.study.classList.remove('on');ui.study.setAttribute('aria-hidden','true');}

ui.indexToggle.addEventListener('click',openIndex);
ui.indexClose.addEventListener('click',closeIndex);
ui.studyToggle.addEventListener('click',openStudy);
ui.studyClose.addEventListener('click',closeStudy);
ui.fallbackOpen.addEventListener('click',openIndex);
ui.enter.addEventListener('click',()=>goToRoom(0));
ui.restart.addEventListener('click',()=>scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'}));
ui.previous.addEventListener('click',()=>goToRoom(Math.max(0,currentIndex-1)));
ui.next.addEventListener('click',()=>goToRoom(Math.min(rooms.length-1,currentIndex+1)));
addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeIndex();closeStudy();}
  if((e.key==='ArrowRight'||e.key==='ArrowDown')&&currentIndex>=0)goToRoom(Math.min(rooms.length-1,currentIndex+1));
  if((e.key==='ArrowLeft'||e.key==='ArrowUp')&&currentIndex>=0)goToRoom(Math.max(0,currentIndex-1));
});

function setupAudio(){
  if(audio) return audio;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return null;
  const ctx=new AC();
  const gain=ctx.createGain();gain.gain.value=0;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=190;
  const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=42;
  const overtone=ctx.createOscillator();overtone.type='triangle';overtone.frequency.value=84;
  const og=ctx.createGain();og.gain.value=.08;
  osc.connect(filter);overtone.connect(og).connect(filter);filter.connect(gain).connect(ctx.destination);
  osc.start();overtone.start();
  audio={ctx,gain,osc,overtone};return audio;
}
ui.sound.addEventListener('click',async()=>{
  const system=setupAudio();if(!system)return;
  await system.ctx.resume();audioOn=!audioOn;
  system.gain.gain.cancelScheduledValues(system.ctx.currentTime);
  system.gain.gain.linearRampToValueAtTime(audioOn?.025:0,system.ctx.currentTime+.6);
  ui.sound.textContent=audioOn?'Sound on':'Sound off';
  ui.sound.setAttribute('aria-pressed',String(audioOn));
});

function maxScroll(){return Math.max(1,ui.track.offsetHeight-innerHeight);}
function roomScroll(index){
  const first=.095, last=.87;
  const p=first+(index/(rooms.length-1))* (last-first);
  return p*maxScroll();
}
function goToRoom(index){scrollTo({top:roomScroll(index),behavior:reduceMotion?'auto':'smooth'});}

addEventListener('pointermove',e=>{
  pointerX=(e.clientX/innerWidth-.5)*2;
  pointerY=(e.clientY/innerHeight-.5)*2;
},{passive:true});

buildInterface();
setLayer(ui.sceneA,LOBBY,'lobby');
ui.sceneA.classList.add('is-visible');

async function initWebGL(){
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas:$('#gallery'),alpha:true,antialias:!mobile,powerPreference:'high-performance'});
  }catch(error){
    ui.fallback.hidden=false;return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.2:1.6));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(mobile?66:52,innerWidth/innerHeight,.1,100);
  camera.position.set(0,0,10);

  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),mobile?.32:.58,.7,.78);
  composer.addPass(bloom);composer.addPass(new OutputPass());

  const dustCount=mobile?80:180;
  const positions=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){
    positions[i*3]=(Math.random()-.5)*20;
    positions[i*3+1]=(Math.random()-.5)*12;
    positions[i*3+2]=-Math.random()*22;
  }
  const dustGeo=new THREE.BufferGeometry();
  dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const dustMat=new THREE.PointsMaterial({color:0xe9dcc4,size:mobile?.035:.045,transparent:true,opacity:.38,depthWrite:false});
  const dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);

  const portalMat=new THREE.MeshBasicMaterial({color:0xc7a56a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const portal=new THREE.Mesh(new THREE.TorusGeometry(2.6,.028,10,128),portalMat);
  portal.position.set(1.7,.1,0);scene.add(portal);
  const inner=new THREE.Mesh(new THREE.TorusGeometry(2.28,.006,8,128),portalMat.clone());
  inner.material.opacity=0;inner.position.copy(portal.position);scene.add(inner);

  const orbMat=new THREE.MeshPhysicalMaterial({color:0x9a7d54,emissive:0x513615,emissiveIntensity:.3,roughness:.12,metalness:.72,clearcoat:1,transparent:true,opacity:.65});
  const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,2),orbMat);
  orb.position.set(1.7,.05,.1);scene.add(orb);

  return {renderer,scene,camera,composer,bloom,dust,portal,inner,orb};
}

const webgl=await initWebGL();
await preload([LOBBY,...rooms.map(backplate)]);
ui.loader.classList.add('done');

let previousTime=performance.now();
function render(now){
  requestAnimationFrame(render);
  const dt=Math.min(.05,(now-previousTime)/1000);previousTime=now;
  const target=scrollY/maxScroll();
  smoothScroll += (target-smoothScroll)*(reduceMotion?1:.075);
  smoothX += (pointerX-smoothX)*.055;
  smoothY += (pointerY-smoothY)*.055;
  document.documentElement.style.setProperty('--px',smoothX.toFixed(3));
  document.documentElement.style.setProperty('--py',smoothY.toFixed(3));

  const heroEnd=.07;
  const first=.085, last=.89;
  const heroOpacity=1-smoothstep(.018,heroEnd,smoothScroll);
  ui.hero.style.opacity=heroOpacity;
  ui.hero.style.transform=`translateY(calc(-48% + ${smoothstep(.02,heroEnd,smoothScroll)*-20}px))`;
  ui.hero.style.pointerEvents=heroOpacity>.2?'auto':'none';

  let stage=(smoothScroll-first)/(last-first)*rooms.length;
  const inRooms=stage>=0&&stage<rooms.length;
  stage=clamp(stage,0,rooms.length-.0001);
  const index=Math.floor(stage);
  const local=stage-index;
  const nextIndex=Math.min(rooms.length-1,index+1);

  if(inRooms){
    if(currentIndex!==index){currentIndex=index;updateRoomUI(index);}
    const room=rooms[index], next=rooms[nextIndex];
    setLayer(ui.sceneA,backplate(room),room.slug);
    setLayer(ui.sceneB,backplate(next),next.slug);
    const cross=nextIndex===index?0:smoothstep(.56,.96,local);
    ui.sceneA.style.opacity=String(1-cross);
    ui.sceneB.style.opacity=String(cross);
    ui.sceneA.style.filter=`saturate(${.88+.1*(1-cross)}) contrast(1.08) brightness(${.66+.08*(1-cross)}) blur(${cross*2.4}px)`;
    ui.sceneB.style.filter=`saturate(.95) contrast(1.08) brightness(${.67+.09*cross}) blur(${(1-cross)*3.2}px)`;
    ui.sceneA.style.transform=`translate3d(${smoothX*-10}px,${smoothY*-7}px,0) scale(${1.075+local*.018})`;
    ui.sceneB.style.transform=`translate3d(${smoothX*-8}px,${smoothY*-6}px,0) scale(${1.095-(cross*.02)})`;
    ui.label.classList.toggle('on',local<.86&&smoothScroll<.915);
    ui.label.style.opacity=String((1-smoothstep(.72,.92,local))*smoothstep(.03,.16,local));
    ui.veil.style.opacity=String(Math.pow(Math.sin(local*Math.PI),8)*.78);
  }else if(smoothScroll<first){
    currentIndex=-1;
    setLayer(ui.sceneA,LOBBY,'lobby');
    ui.sceneA.style.opacity='1';ui.sceneB.style.opacity='0';
    ui.label.classList.remove('on');ui.counter.textContent=`00 / ${String(rooms.length).padStart(2,'0')}`;
    [...ui.rail.children].forEach(d=>d.classList.remove('active'));
    ui.veil.style.opacity='0';
  }else{
    ui.label.classList.remove('on');ui.veil.style.opacity='0';
  }

  if(webgl){
    const {camera,composer,dust,portal,inner,orb}=webgl;
    const transition=inRooms?Math.pow(Math.sin(local*Math.PI),6):0;
    camera.position.x=mix(camera.position.x,smoothX*.22,.04);
    camera.position.y=mix(camera.position.y,-smoothY*.15,.04);
    portal.material.opacity=transition*.75;
    inner.material.opacity=transition*.35;
    portal.scale.setScalar(.45+transition*1.9);
    inner.scale.setScalar(.35+transition*2.25);
    portal.rotation.z+=dt*.15;inner.rotation.z-=dt*.1;
    orb.material.opacity=inRooms?.12+transition*.4:.44;
    orb.scale.setScalar(inRooms?.72+transition*.7:1);
    orb.rotation.x+=dt*.08;orb.rotation.y+=dt*.13;
    dust.rotation.y+=dt*.004;dust.position.y=Math.sin(now*.00018)*.12;
    composer.render();
  }
}
requestAnimationFrame(render);

addEventListener('resize',()=>{
  if(!webgl)return;
  webgl.camera.aspect=innerWidth/innerHeight;webgl.camera.updateProjectionMatrix();
  webgl.renderer.setSize(innerWidth,innerHeight);webgl.composer.setSize(innerWidth,innerHeight);
});
