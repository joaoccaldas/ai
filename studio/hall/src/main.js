// CALDAS STUDIO — The Exposition. A Blender-built, Cycles-lit gallery hall walked by scroll.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import * as TX from './tex.js';

const $ = id => document.getElementById(id);
const ROOMS = window.STUDIO_ROOMS || [];
const N = ROOMS.length;
const BASE = (document.currentScript && document.currentScript.src) ? new URL('.', document.currentScript.src).href : 'hall/';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = innerWidth < 760 || matchMedia('(pointer: coarse)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- chrome (works even without WebGL)
const ROMAN = n => { const r = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]; let s = ''; for (const [k, v] of r) while (n >= v) { s += k; n -= v; } return s; };
const pad = n => String(n).padStart(2, '0');
const capEl = $('cap'), railEl = $('rail');
$('nTot').textContent = pad(N); $('specCount').textContent = N;
// progress line: one point per work, placed along the walk
const railPts = ROOMS.map((r, i) => {
  const b = document.createElement('button'); b.style.left = ((i + 1) / (N + 1) * 100) + '%'; b.style.setProperty('--c', r.accent || '#c9a86a');
  b.setAttribute('aria-label', r.n); b.innerHTML = `<span>${pad(i + 1)} · ${r.n}</span>`; b.onclick = () => { stopTour(); goTo(i); };
  railEl.appendChild(b); return b;
});
// all works overlay
$('worksGrid').innerHTML = ROOMS.map((r, i) => `<button class="card" data-i="${i}"><img loading="lazy" src="${r.img}" alt=""><div><b><i>${ROMAN(i + 1)}</i>${r.n}</b><span>${r.room}</span></div></button>`).join('');
$('worksGrid').querySelectorAll('.card').forEach(c => c.onclick = () => { closeWorks(); stopTour(); goTo(+c.dataset.i); });
$('allBtn').onclick = () => $('works').classList.add('on');
$('works-x').onclick = closeWorks;
function closeWorks() { $('works').classList.remove('on'); }
$('home').onclick = e => { e.preventDefault(); stopTour(); goWaypoint(0); };
$('walk').onclick = () => goWaypoint(1);

const track = $('track');
const scrollable = () => Math.max(1, track.offsetHeight - innerHeight);
// waypoints: 0 = entrance (hero), 1..N = works, N+1 = the commission niche
const WP = N + 1;
let curActive = 0;
const inGallery = () => scrollY < innerHeight * .35 && !$('modal').classList.contains('on') && !$('works').classList.contains('on');
function goWaypoint(k) {
  k = clamp(k, 0, WP);
  if (scrollY > 2) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  if (k === wpTarget) return;
  wpTarget = k; sfx();
}
function goTo(i) { goWaypoint(clamp(i, 0, N - 1) + 1); }
function step(dir) { stopTour(); goWaypoint(wpTarget + dir); }
$('prev').onclick = () => step(-1);
$('next').onclick = () => step(1);
addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeWorks(); if ($('modal').classList.contains('on')) closeModal(); return; }
  if (!inGallery()) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
    if (wpTarget >= WP && e.key !== 'ArrowRight') return;                 // continue down the page
    e.preventDefault(); step(1);
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
  else if (e.key === 'Home') { e.preventDefault(); goWaypoint(0); }
  else if (e.key === 'Enter' && wpTarget >= 1 && wpTarget <= N && e.target === document.body) { e.preventDefault(); open(curActive); }
});
// one wheel gesture = one work; trackpads send bursts, so a short cool-down groups them
let wheelAcc = 0, wheelLock = 0;
addEventListener('wheel', e => {
  if (!inGallery()) return;
  if (e.deltaY > 0 && wpTarget >= WP) return;
  e.preventDefault(); stopTour();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (Math.abs(wheelAcc) > 30) { step(Math.sign(wheelAcc)); wheelAcc = 0; wheelLock = now + 850; }
}, { passive: false });
let touch0 = null;
addEventListener('touchstart', e => { touch0 = inGallery() && e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
addEventListener('touchmove', e => { if (touch0 && !(wpTarget >= WP && e.touches[0].clientY < touch0[1])) e.preventDefault(); }, { passive: false });
addEventListener('touchend', e => {
  if (!touch0) return;
  const t = e.changedTouches[0], dx = t.clientX - touch0[0], dy = t.clientY - touch0[1]; touch0 = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 36) return;
  const dir = Math.abs(dx) > Math.abs(dy) ? -Math.sign(dx) : -Math.sign(dy);
  if (dir > 0 && wpTarget >= WP) return;
  step(dir);
});
$('cap-go').onclick = () => { if (wpTarget === 0) goWaypoint(1); else if (wpTarget > N) location.href = 'mailto:hello@caldas.studio?subject=Commission%20my%20site'; else open(curActive); };
let actx2;
function sfx() {                                   // a soft chime per step, only when sound is on
  const b = $('sound'); if (!b || !b.classList.contains('on')) return;
  try { actx2 ||= new (window.AudioContext || window.webkitAudioContext)(); const t = actx2.currentTime, o = actx2.createOscillator(), g = actx2.createGain();
    o.type = 'sine'; o.frequency.value = [440, 554.4, 659.3, 880][wpTarget % 4]; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.02, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + 1.8);
    o.connect(g).connect(actx2.destination); o.start(t); o.stop(t + 1.9); } catch (_) { }
}

const tourBtn = $('tour'); let tour = false, tourTimer = null;
function setTour(on) {
  tour = on; tourBtn.classList.toggle('on', on); tourBtn.setAttribute('aria-pressed', on); tourBtn.textContent = on ? '❚❚ Tour' : '▶ Tour';
  if (on) { if (wpTarget < 1) goWaypoint(1); tourTimer = setInterval(() => goWaypoint(wpTarget >= N ? 1 : wpTarget + 1), 6500); }
  else if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
}
function stopTour() { if (tour) setTour(false); }
tourBtn.onclick = () => setTour(!tour);

const modal = $('modal'), mFrame = $('m-frame'), mLd = modal.querySelector('.ld');
function open(i) {
  const r = ROOMS[i]; if (!r) return;
  if (r.slug === 'sokai') { location.href = r.url; return; }          // SŌKAI deserves the whole screen
  $('m-name').textContent = r.n; $('m-room').textContent = r.room; $('m-open').href = r.url; mLd.style.opacity = 1;
  mFrame.onload = () => { mLd.style.opacity = 0; }; mFrame.src = r.url; modal.classList.add('on'); document.body.style.overflow = 'hidden';
}
function closeModal() { modal.classList.remove('on'); document.body.style.overflow = ''; setTimeout(() => { mFrame.src = 'about:blank'; }, 450); }
$('m-close').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
addEventListener('scroll', () => $('hd').classList.toggle('solid', scrollY > innerHeight * .5), { passive: true });
function done() { $('loader').classList.add('done'); }
setTimeout(done, 14000);

// ---------------------------------------------------------------- hall
const HALL = { Y0: 8, DY: 6, NX: 5.055, APSE: 62, KHOME: new THREE.Vector3(.24, 1.13, 0) };
function bay(b) { const j = Math.floor(b / 2), side = b % 2 === 0 ? -1 : 1; return { j, side, z: -(HALL.Y0 + HALL.DY * j) }; }
function stationFor(i) {           // i: room index (0 = SŌKAI dais)
  if (i === 0) return isMobile ? { p: [.22, 1.36, 2.25], t: [-.05, 1.18, -.3] } : { p: [.62, 1.33, 1.72], t: [-.12, 1.17, -.3] };
  const { side, z } = bay(i - 1);
  return isMobile ? { p: [-side * 1.35, 1.72, z], t: [side * HALL.NX, 2.25, z] } : { p: [-side * 1.9, 1.7, z + 1.8], t: [side * HALL.NX, 2.28, z - .25] };
}
const INTRO = { p: [0, 1.8, 8.4], t: [0, 1.62, -2] };
const CTA = { p: [0, 1.75, -(HALL.APSE - 5.5)], t: [0, 2.6, -(HALL.APSE + 4.2)] };

let renderer, scene, camera, composer, bloom, bokeh, finalPass, lite = false, dpr = 1, ftAvg = 1 / 60, ftN = 0;
try { boot(); } catch (err) { console.warn('hall disabled', err && err.message); document.getElementById('hall').style.background = 'radial-gradient(60% 60% at 50% 40%,#1a1712,#0c0b0a 72%)'; done(); }

function boot() {
  const canvas = $('hall');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // software renderers (SwiftShader, llvmpipe) and very weak GPUs get a light mode
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  lite = /swiftshader|llvmpipe|software/i.test(gpu);
  dpr = lite ? .6 : Math.min(devicePixelRatio, isMobile ? 1.25 : 1.5); renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.05;
  RectAreaLightUniformsLib.init();
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0c0b0a');
  scene.fog = new THREE.FogExp2('#0c0b0a', .018);
  camera = new THREE.PerspectiveCamera(isMobile ? 58 : 36, innerWidth / innerHeight, .02, 200);
  camera.position.set(...INTRO.p);
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: isMobile || lite ? 0 : 2 }));
  composer.addPass(new RenderPass(scene, camera));
  // lens falloff: sharp centre, softly defocused edges (cheaper and steadier than a depth pass)
  bokeh = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uBlur: { value: isMobile ? .004 : .007 }, uAspect: { value: innerWidth / innerHeight } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform sampler2D tDiffuse;uniform float uBlur,uAspect;
      void main(){vec2 d=vUv-.5;d.x*=uAspect;float b=smoothstep(.16,.62,length(d))*uBlur;
        if(b<.0005){gl_FragColor=texture2D(tDiffuse,vUv);return;}
        vec3 c=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*2.39996;float r=sqrt((float(i)+.5)/8.);vec2 o=vec2(cos(a),sin(a))*r*b;o.x/=uAspect;c+=texture2D(tDiffuse,vUv+o).rgb;}
        gl_FragColor=vec4(c/8.,1.);}` });
  bokeh.enabled = !lite;
  composer.addPass(bokeh);
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .55, .6, .86);
  composer.addPass(bloom);
  finalPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uWarm: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform sampler2D tDiffuse;uniform vec3 uWarm;varying vec2 vUv;void main(){vec2 c=vUv-.5;float ca=.0012*dot(c,c)*8.;vec3 col=vec3(texture2D(tDiffuse,vUv+c*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*ca).b);col*=uWarm;gl_FragColor=vec4(col,1.);}',
  });
  composer.addPass(finalPass);
  composer.addPass(new OutputPass());
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight);
  window.__HALL = { capture: () => { composer.render(); return canvas.toDataURL('image/jpeg', .85); }, get af() { return af; }, get camera() { return camera; }, get bokeh() { return bokeh; }, get target() { return vT; }, probe: () => { const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), camera); return rc.intersectObjects(scene.children, true).filter(h => h.object.isMesh).slice(0, 5).map(h => [h.object.name, +h.distance.toFixed(2), h.point.toArray().map(x => +x.toFixed(2))]); }, go: k => { wpTarget = k; tw = { from: k, to: k, t0: 0, dur: .01 }; af = k; lightsOn = 1; },
    settle: () => { lightsOn = 1; intro = 1; for (let i = 0; i < 40; i++) frame(); } };
  load().then(() => { done(); requestAnimationFrame(frame); }).catch(err => { console.warn('hall assets failed', err && err.message); done(); });
  addEventListener('resize', onResize);
}
function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); bokeh.uniforms.uAspect.value = innerWidth / innerHeight;
  if (floorRef) floorRef.getRenderTarget().setSize(innerWidth * dpr * .38, innerHeight * dpr * .38);
}

// ---------------------------------------------------------------- assets & materials
const arts = [], dyn = [], spills = [], cones = [];
let katana, bladeAsm, floorRef, dust, ctaArt;
const M = {};
let bakedMat;
function bakedMaterial(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.userData.u = { uLit: { value: .25 } }; bakedMat = m;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <project_vertex>', '#include <project_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vW; uniform float uLit;
float dh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float dn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dh(i),dh(i+vec2(1,0)),f.x),mix(dh(i+vec2(0,1)),dh(i+vec2(1,1)),f.x),f.y);}
float dfbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*dn(p);p*=2.07;a*=.5;}return s;}`).replace('#include <map_fragment>', `#include <map_fragment>
{ vec3 cr=cross(dFdx(vW),dFdy(vW)); float cl=length(cr); vec3 nrm=cl>1e-10?cr/cl:vec3(0.,1.,0.); float k=smoothstep(5.,.8,length(vW-cameraPosition)); float g;
  if(abs(nrm.y)>.7){ g=dfbm(vW.xz*vec2(3.,3.)+dfbm(vW.xz*.7)*2.)*.7+dn(vW.xz*300.)*.3; }
  else if(abs(nrm.x)>.7){ g=dfbm(vW.zy*vec2(2.,30.))*.7+dn(vW.zy*400.)*.3; } else { g=dfbm(vW.xy*vec2(2.,30.))*.7+dn(vW.xy*400.)*.3; }
  diffuseColor.rgb*=1.+(g-.5)*.4*k; }
diffuseColor.rgb*=1.12*uLit;`);
  };
  return m;
}
function artMaterial(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff });
  m.userData.u = { uGlow: { value: 0 }, uLit: { value: 0 } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow,uLit;').replace('#include <map_fragment>', `#include <map_fragment>
    { vec2 q=vMapUv; float spot=mix(.58,1.02,pow(clamp(q.y,0.,1.),.55))*(1.-.22*pow(abs(q.x-.5)*2.,2.)); diffuseColor.rgb*=spot*mix(.58,1.07,uGlow)*uLit; }`);
  };
  return m;
}
function ctaTexture() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1180; const x = c.getContext('2d');
  const g = x.createRadialGradient(450, 520, 40, 450, 590, 720); g.addColorStop(0, '#1d1812'); g.addColorStop(1, '#0b0a09'); x.fillStyle = g; x.fillRect(0, 0, 900, 1180);
  x.strokeStyle = 'rgba(201,168,106,.5)'; x.lineWidth = 2; x.strokeRect(70, 70, 760, 1040); x.strokeStyle = 'rgba(201,168,106,.18)'; x.strokeRect(92, 92, 716, 996);
  x.textAlign = 'center'; x.fillStyle = '#c9a86a'; x.font = '400 26px Jost, sans-serif'; x.fillText('R E S E R V E D', 450, 560);
  x.fillStyle = 'rgba(242,237,227,.72)'; x.font = 'italic 300 64px "Cormorant Garamond", serif'; x.fillText('for your business', 450, 640);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function comingTexture() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1200; const x = c.getContext('2d');
  x.fillStyle = '#100e0c'; x.fillRect(0, 0, 900, 1200); x.strokeStyle = 'rgba(242,237,227,.18)'; x.setLineDash([10, 12]); x.lineWidth = 2; x.strokeRect(80, 80, 740, 1040);
  x.fillStyle = 'rgba(242,237,227,.5)'; x.textAlign = 'center'; x.font = 'italic 300 72px "Cormorant Garamond", serif'; x.fillText('Reserved', 450, 590);
  x.font = '300 28px Jost, sans-serif'; x.fillText('for the next concept', 450, 650);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function planeUVs(mesh, side, cta) {
  const g = mesh.geometry, p = g.attributes.position; g.computeBoundingBox(); const bb = g.boundingBox;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let u;
    if (cta) u = (x - bb.min.x) / (bb.max.x - bb.min.x);
    else u = side < 0 ? (bb.max.z - z) / (bb.max.z - bb.min.z) : (z - bb.min.z) / (bb.max.z - bb.min.z);
    uv[i * 2] = u; uv[i * 2 + 1] = (y - bb.min.y) / (bb.max.y - bb.min.y);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function spillTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
}
const CONE_FRAG = `varying vec2 vUv; uniform vec3 uColor; uniform float uStrength;
  void main(){ float across=smoothstep(0.,.5,vUv.x)*smoothstep(1.,.5,vUv.x); float along=smoothstep(0.,.25,1.-vUv.y)*(.35+.65*vUv.y);
  gl_FragColor=vec4(uColor*across*along*uStrength,1.); }`;

async function load() {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const [gltf, lm, env] = await Promise.all([
    loader.loadAsync(BASE + 'assets/hall.glb'),
    new THREE.TextureLoader().loadAsync(BASE + 'assets/hall_lightmap.jpg'),
    new HDRLoader().setDataType(THREE.FloatType).loadAsync(BASE + 'assets/hall_env.hdr'),
  ]);
  lm.flipY = false; lm.colorSpace = THREE.SRGBColorSpace; lm.anisotropy = 8;
  // compress very bright pixels before prefiltering so small lamps don't sparkle on steel
  const d = env.image.data; for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]); if (m > 4) { const f = (4 + Math.log(m - 3)) / m; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; } }
  env.mapping = THREE.EquirectangularReflectionMapping; env.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(env).texture; scene.environmentRotation.set(0, -Math.PI / 2, 0); scene.environmentIntensity = .9;
  try { await document.fonts.load('italic 300 64px "Cormorant Garamond"'); await document.fonts.load('400 26px Jost'); } catch (_) { }
  buildKatanaMaterials();
  const texLoader = new THREE.TextureLoader();
  const root = gltf.scene, nodes = []; root.traverse(o => nodes.push(o));
  for (const o of nodes) {
    const ex = o.userData || {};
    if (o.name === 'KATANA') katana = o;
    if (o.name === 'BLADE_ASSEMBLY') bladeAsm = o;
    if (!o.isMesh) continue;
    const matName = (Array.isArray(o.material) ? o.material[0] : o.material)?.name || '';
    if (ex.baked) o.material = bakedMaterial(lm);
    else if (ex.art !== undefined) {
      const k = ex.art;
      if (k === 99) { planeUVs(o, 0, true); o.material = artMaterial(ctaTexture()); ctaArt = o; o.userData.room = -2; }
      else {
        planeUVs(o, ex.side, false);
        const room = k + 1, r = ROOMS[room];
        const mat = artMaterial(comingTexture()); o.material = mat; o.userData.room = r ? room : -1;
        if (r) texLoader.load(r.img, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; mat.map = t; mat.needsUpdate = true; });
        arts[room] = o;
      }
    } else if (ex.emit) {
      const c = new THREE.Color(...ex.emit).multiplyScalar(ex.strength);
      o.material = new THREE.MeshBasicMaterial({ color: c }); o.userData.base = c.clone();
      if (Math.abs(ex.strength - 2.2) < .01) { c.multiplyScalar(.45); o.userData.base.copy(c); }   // niche head-lights: glow, don't haze
      if (ex.dyn === 'breathe') o.position.z -= .06;
      if (ex.dyn === 'portal') { c.multiplyScalar(.55); o.userData.base.copy(c); }
      if (ex.dyn) dyn.push({ o, kind: ex.dyn });
    } else if (ex.mat === 'brass') o.material = new THREE.MeshStandardMaterial({ color: '#c19552', metalness: 1, roughness: .3, envMapIntensity: .75 });
    else if (ex.mat === 'bronze') o.material = new THREE.MeshStandardMaterial({ color: '#2a2018', metalness: .9, roughness: .35 });
    else { o.material = M[matName] || M.inner; o.userData.katana = true; }
    if (['tsuba_sakura', 'tsuba_nami'].includes(o.name)) o.visible = false;
  }
  scene.add(root);
  // wet, polished floor
  floorRef = new Reflector(new THREE.PlaneGeometry(12, 82), { clipBias: .003, textureWidth: innerWidth * dpr * .38, textureHeight: innerHeight * dpr * .38, color: 0xffffff, multisample: 0,
    shader: { name: 'Polish', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uStrength: { value: .34 } },
      vertexShader: 'uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform vec3 color;uniform sampler2D tDiffuse;uniform float uStrength;varying vec4 vUv;varying vec3 vW;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        void main(){ vec4 uv=vUv; vec3 c=texture2DProj(tDiffuse,uv).rgb*.4; vec2 o=vec2(.006,.0)*uv.w; c+=texture2DProj(tDiffuse,uv+vec4(o,0,0)).rgb*.15+texture2DProj(tDiffuse,uv-vec4(o,0,0)).rgb*.15;
          vec2 o2=vec2(.0,.012)*uv.w; c+=texture2DProj(tDiffuse,uv+vec4(o2,0,0)).rgb*.15+texture2DProj(tDiffuse,uv-vec4(o2,0,0)).rgb*.15;
          gl_FragColor=vec4(c*uStrength*(.85+.15*h(floor(vW.xz*1.5))),1.); }` } });
  floorRef.visible = !lite;
  floorRef.rotation.x = -Math.PI / 2; floorRef.position.set(0, .004, -28);
  Object.assign(floorRef.material, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(floorRef);
  // accent spill on the floor, and faint light cones from each niche spot
  const spillTex = spillTexture();
  for (let r = 0; r < N; r++) {
    let pos;
    if (r === 0) pos = new THREE.Vector3(0, .01, 0);
    else { const { side, z } = bay(r - 1); pos = new THREE.Vector3(side * 3.6, .012, z); }
    const s = new THREE.Mesh(new THREE.PlaneGeometry(r === 0 ? 5 : 4, r === 0 ? 5 : 3.4), new THREE.MeshBasicMaterial({ map: spillTex, color: new THREE.Color(ROOMS[r].accent || '#c9a86a'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.copy(pos); scene.add(s); spills[r] = s;
    if (r > 0) {
      const { side, z } = bay(r - 1);
      const m = new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color('#ffd9a8') }, uStrength: { value: .05 } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: CONE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const cone = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.6), m);
      cone.position.set(side * 4.55, 3.9, z); cone.rotation.set(0, side * Math.PI / 2, side * .0); cone.rotateX(-.55);
      scene.add(cone); cones.push(cone);
    }
  }
  // dust in the light
  const ND = isMobile ? 500 : 1400, g = new THREE.BufferGeometry(), p = new Float32Array(ND * 3), sd = new Float32Array(ND);
  for (let i = 0; i < ND; i++) { p[i * 3] = (Math.random() - .5) * 9; p[i * 3 + 1] = Math.random() * 6; p[i * 3 + 2] = 6 - Math.random() * 72; sd[i] = Math.random() * 100; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 1));
  dust = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uS: { value: innerHeight / 40 } },
    vertexShader: 'attribute float seed;uniform float uT,uS;varying float a;void main(){vec3 q=position;q.y+=sin(uT*.2+seed)*.35;q.x+=cos(uT*.15+seed)*.3;vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;a=.35+.4*sin(uT*.7+seed*3.);gl_PointSize=uS*(.6+a)/max(-mv.z,1.);}',
    fragmentShader: 'varying float a;void main(){vec2 c=gl_PointCoord-.5;gl_FragColor=vec4(vec3(1.,.9,.72)*smoothstep(.5,0.,length(c))*a*.5,1.);}' }));
  dust.frustumCulled = false; scene.add(dust);
  // soft key for the katana
  const key = new THREE.RectAreaLight('#fff1dc', 5, 1.4, .45); key.position.set(0, 3.2, .8); key.lookAt(0, 1.13, 0); scene.add(key);
  const rim = new THREE.PointLight('#7fe8ff', 3, 4, 2); rim.position.set(0, 1.6, -1.2); scene.add(rim);
  allPick = [...arts.filter(Boolean), ...(ctaArt ? [ctaArt] : [])];
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0, roughness: .06, envMapIntensity: .55, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const a of [...allPick, ...arts.filter(x => x && !allPick.includes(x))]) {
    const g = new THREE.Mesh(a.geometry, glassMat); g.position.copy(a.position); g.quaternion.copy(a.quaternion); g.scale.copy(a.scale);
    if (a === ctaArt) g.position.z += .012; else g.position.x += (a.position.x < 0 ? 1 : -1) * .012;
    a.parent.add(g);
  }
  katana.traverse(o => { if (o.isMesh && o.visible) kPick.push(o); });
}

function buildKatanaMaterials() {
  const silk = TX.silkMaps(), same = TX.samegawaMaps(), ham = TX.hammeredMaps(), eng = TX.engravingMaps(), cord = TX.cordMaps();
  const b = TX.bladeMaps('notare', { polish: .8 }), s = TX.sayaMaps({ lacquer: 'aonami', pattern: 'waves', luminous: .45, raden: .6 });
  M.steel = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 1, map: b.map, roughnessMap: b.rough, metalnessMap: b.rough, envMapIntensity: 1.1 });
  M.lacquer = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 1, map: s.map, roughnessMap: s.mr, metalnessMap: s.mr, emissive: 0xffffff, emissiveMap: s.emissive, emissiveIntensity: 1.05, clearcoat: 1, clearcoatRoughness: .025, envMapIntensity: .55 });
  M.silk = new THREE.MeshPhysicalMaterial({ color: '#1c3fae', roughness: .62, sheen: 1, sheenRoughness: .35, sheenColor: new THREE.Color('#6f8fff'), normalMap: silk.normal, aoMap: silk.ao });
  M.cord = new THREE.MeshPhysicalMaterial({ color: '#0d1634', roughness: .7, sheen: .8, sheenColor: new THREE.Color('#46609f'), normalMap: cord.normal });
  M.samegawa = new THREE.MeshStandardMaterial({ color: '#ebe4d2', roughness: .55, normalMap: same.normal, aoMap: same.ao });
  M.fitting = new THREE.MeshPhysicalMaterial({ color: '#f1efea', metalness: 1, roughness: .2, normalMap: eng.normal, aoMap: eng.ao, envMapIntensity: 1.3 });
  M.gilt = new THREE.MeshPhysicalMaterial({ color: '#ffc46b', metalness: 1, roughness: .22 });
  M.iron = new THREE.MeshStandardMaterial({ color: '#2a2b2e', metalness: .85, roughness: .55, normalMap: ham.normal, roughnessMap: ham.rough });
  M.wood = new THREE.MeshStandardMaterial({ map: TX.woodMaps().map, roughness: .7 });
  M.tang = new THREE.MeshStandardMaterial({ map: TX.tangMaps().map, metalness: .55, roughness: .75 });
  M.horn = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, roughness: .25, clearcoat: .8 });
  M.inner = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: .95 });
  M.bamboo = new THREE.MeshStandardMaterial({ color: 0xb8975e, roughness: .55 });
}

// ---------------------------------------------------------------- interaction
let allPick = []; const kPick = [];
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let hoverKatana = false, px = 0, py = 0, tmx = 0, tmy = 0, mx = 0, my = 0;
const cursor = $('cursor');
let hk = null, hoverDirty = false;
addEventListener('pointermove', e => { hoverDirty = true; px = e.clientX; py = e.clientY; tmx = (px / innerWidth) * 2 - 1; tmy = (py / innerHeight) * 2 - 1; }, { passive: true });
function hitAt(x, y) {
  if (!camera) return null;
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects([...allPick, ...kPick], false)[0];
  if (!h) return null;
  if (h.object.userData.katana) return 0;
  return h.object.userData.room;
}
addEventListener('click', e => {
  if (modal.classList.contains('on') || $('works').classList.contains('on')) return;
  if (e.target.closest('header,button,a,#cap,#navbar,#rail,#intro,main')) return;
  if (!inGallery()) return;
  const r = hitAt(e.clientX, e.clientY);
  if (r === null || r === undefined || r === -1) return;
  stopTour();
  if (r === -2) { location.href = 'mailto:hello@caldas.studio?subject=Commission%20my%20site'; return; }
  if (r === curActive && Math.abs(af - (r + 1)) < .3) open(r); else goTo(r);
});

// ---------------------------------------------------------------- camera path & frame loop
let af = 0, last = performance.now() / 1000, intro = 0, kd = 0, tw = null, idleT = 0, wpTarget = 0, lightsOn = 0;
const vP = new THREE.Vector3(), vT = new THREE.Vector3(), aP = new THREE.Vector3(), aT = new THREE.Vector3(), bP = new THREE.Vector3(), bT = new THREE.Vector3();
function wp(k) { if (k <= 0) return INTRO; if (k >= N + 1) return CTA; return stationFor(k - 1); }
function pose(f) {
  const k = Math.floor(f), t = f - k, A = wp(k), Bw = wp(Math.min(k + 1, N + 1)), e = ease(t);
  aP.set(...A.p); bP.set(...Bw.p); aT.set(...A.t); bT.set(...Bw.t);
  vP.lerpVectors(aP, bP, e); vT.lerpVectors(aT, bT, e);
  // a walk, not a slide: step back into the nave, look down the hall, then turn into the next niche
  const arc = Math.sin(Math.PI * t), dz = bP.z - aP.z;
  vP.x *= 1 - .85 * arc; vP.y += .07 * arc;
  const ahead = new THREE.Vector3(0, 1.85, vP.z + (Math.abs(dz) > .5 ? Math.sign(dz) : -1) * 9);
  vT.lerp(ahead, Math.pow(arc, 1.3) * .8);
}
const R = 3.5, DRAW = .79;
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now() / 1000, dt = Math.min(.1, now - last); last = now;
  intro += (1 - intro) * (1 - Math.exp(-dt * 1.2));
  if (!tw || tw.to !== wpTarget) tw = { from: af, to: wpTarget, t0: now, dur: reduce ? .01 : Math.min(4.2, 1.8 + .38 * (Math.abs(wpTarget - af) - 1)) };
  { const k = clamp((now - tw.t0) / tw.dur, 0, 1), m = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; af = tw.from + (tw.to - tw.from) * m; }
  const moving = Math.abs(af - wpTarget) > .002;
  lightsOn = Math.min(1, lightsOn + dt / (reduce ? .01 : 4.2));   // opening: the hall lights come on down the nave
  pose(af);
  mx += (tmx - mx) * .04; my += (tmy - my) * .04;
  idleT = moving ? 0 : idleT + dt;
  const sway = reduce ? 0 : smooth(0, 2, idleT);
  camera.position.copy(vP).add(new THREE.Vector3(mx * .18 + Math.sin(now * .37) * .025 * sway, -my * .08 + Math.sin(now * .53) * .012 * sway, 0));
  if (af < .05) camera.position.z += (1 - intro) * 6, camera.position.y += (1 - intro) * .8;
  camera.lookAt(vT.x + mx * .25, vT.y - my * .15, vT.z);
  curActive = clamp(Math.round(af) - 1, 0, N - 1);
  const near = Math.abs(af - (curActive + 1));
  // katana teaser: at the dais, hovering draws the blade a little along its sori
  if (hoverDirty && !moving) { hoverDirty = false; hk = hitAt(px, py); } else if (moving) hk = null;
  hoverKatana = hk === 0 && curActive === 0 && near < .35;
  kd += ((hoverKatana ? .32 : 0) - kd) * (1 - Math.exp(-dt * 3));
  if (bladeAsm) { const a = DRAW * kd / R; bladeAsm.position.set(R * Math.sin(a), R - R * Math.cos(a), 0); bladeAsm.rotation.set(0, 0, a); }
  // living light
  for (const { o, kind } of dyn) {
    const b = o.userData.base;
    if (kind === 'portal') o.material.color.copy(b).multiplyScalar(.85 + .2 * Math.sin(now * 1.4));
    else if (kind === 'breathe') o.material.color.copy(b).multiplyScalar(.7 + .5 * Math.pow(.5 + .5 * Math.sin(now * .9), 2) + (curActive === N - 1 && af > N + .4 ? 1.5 : 0));
    else if (kind === 'fall') o.material.color.copy(b).multiplyScalar(.6 + .4 * Math.sin(now * 3 + o.position.x));
  }
  const inCTA = af > N + .5;
  spills.forEach((s, r) => { const on = r === curActive && !inCTA ? 1 - clamp(near * 2, 0, 1) : 0; s.material.opacity += (on * (r === 0 ? .35 : .28) - s.material.opacity) * .08; });
  arts.forEach((a, r) => { if (!a) return; const lit = smooth((r - 1) / N * .8, (r - 1) / N * .8 + .2, lightsOn); a.material.userData.u.uLit.value = lit; a.material.userData.u.uGlow.value += ((r === curActive && !inCTA && af > .5 ? 1 : 0) - a.material.userData.u.uGlow.value) * (1 - Math.exp(-dt * 3)); });
  cones.forEach((c, i) => { const lit = smooth(i / N * .8, i / N * .8 + .2, lightsOn), on = i + 1 === curActive && !inCTA && af > .5 ? 1 : 0; c.material.uniforms.uStrength.value = lit * (.02 + .08 * on + .05 * (1 - smooth(.8, 1, lightsOn)) * lit); });
  if (ctaArt) { const u = ctaArt.material.userData.u; u.uLit.value = smooth(.75, 1, lightsOn); u.uGlow.value += ((inCTA ? 1 : 0) - u.uGlow.value) * (1 - Math.exp(-dt * 3)); }
  if (bakedMat) bakedMat.userData.u.uLit.value = .25 + .75 * smooth(0, .55, lightsOn);
  if (dust) dust.material.uniforms.uT.value = now;
  bokeh.uniforms.uBlur.value = (isMobile ? .004 : .007) * (af < .5 ? .4 : 1);
  // chrome follows the visual centre
  const gz = scrollY < innerHeight * .6, atStart = af < .45;
  const show = gz && !atStart && !inCTA;
  capEl.classList.toggle('on', show && !moving || show && Math.abs(af - Math.round(af)) < .25);
  $('navbar').classList.toggle('on', gz && lightsOn > .35); railEl.classList.toggle('on', gz && !atStart);
  $('cta-cap').classList.toggle('on', inCTA && gz);
  $('intro').classList.toggle('off', !atStart || !gz); $('introdim').style.opacity = atStart ? 1 : 0;
  $('prev').disabled = wpTarget <= 0; $('next').disabled = wpTarget >= WP;
  $('nIdx').textContent = atStart ? '00' : inCTA ? '—' : pad(curActive + 1);
  $('cap-go').textContent = atStart ? 'Walk the hall →' : inCTA ? 'Commission ↗' : (ROOMS[curActive].slug === 'sokai' ? 'Enter SŌKAI ↗' : 'Enter work ↗');
  $('railFill').style.width = (clamp(af, 0, WP) / WP * 100) + '%';
  railPts.forEach((b, i) => b.classList.toggle('on', i === curActive && !atStart && !inCTA));
  if (show) {
    const r = ROOMS[curActive];
    if (capEl.dataset.i !== String(curActive)) {
      capEl.dataset.i = curActive;
      $('cap-idx').textContent = ROMAN(curActive + 1) + ' · ' + pad(curActive + 1) + ' / ' + pad(N); $('cap-idx').style.color = r.accent || '';
      $('cap-name').textContent = r.n; $('cap-tag').textContent = r.room + ' — ' + r.tag; $('cap-note').textContent = r.note || '';
      const ex = $('cap-extra'); ex.hidden = !r.extra; if (r.extra) { ex.textContent = r.extra.label + ' ↗'; ex.href = r.extra.url; }
    }
  }
  if (cursor) {
    cursor.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%)`;
    cursor.classList.toggle('enter', gz && hk !== null && hk !== undefined && hk !== -1);
    cursor.querySelector('b').textContent = hk === -2 ? 'Commission' : (hk === curActive && near < .3 ? 'Enter' : 'Go');
  }
  composer.render(dt);
  // quality governor: if frames run long, lower resolution, then drop the reflection and the lens pass
  ftAvg += (dt - ftAvg) * .05; ftN++;
  if (ftN > 90 && ftAvg > 1 / 38) {
    ftN = 0;
    if (dpr > 1) { dpr = Math.max(1, dpr - .25); renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr); onResize(); }
    else if (floorRef && floorRef.visible) floorRef.visible = false;
    else if (bokeh.enabled) bokeh.enabled = false;
  }
}
