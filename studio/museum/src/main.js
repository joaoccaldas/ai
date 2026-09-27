// CALDAS STUDIO — The Museum. Walk it with keyboard and mouse; every sculpture opens its site.
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
import * as TX from './tex.js';

const $ = id => document.getElementById(id);
const ROOMS = window.STUDIO_ROOMS || [], WINGS = window.STUDIO_WINGS || {};
const BY = Object.fromEntries(ROOMS.map(r => [r.slug, r]));
const BASE = (document.currentScript && document.currentScript.src) ? new URL('.', document.currentScript.src).href : 'museum/';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(pointer: coarse)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
// Blender (x, y, z) -> three (x, z, -y)
const B2T = (x, y, z = 0) => new THREE.Vector3(x, z, -y);

let renderer, scene, camera, composer, bloom, lens, L, layout, lite = false, dpr = 1, ftAvg = 1 / 60, ftN = 0;
const envs = {}, dyn = [], spinners = [], exhibits = {}, pickables = [], panels = [];
let floorRef, steam, sparkles, beaconBeam;

// ---------------------------------------------------------------- walking state
const EYE = 1.65;
const P = { x: 0, y: -13.5, yaw: 0, pitch: -.02, vx: 0, vy: 0 };   // Blender plane coords; yaw 0 looks toward +Y
const keys = new Set();
let locked = false, dragging = null, autoPath = null, curWing = 'atrium', target = null, hover = null, started = false;

// ---------------------------------------------------------------- walkable space (mirrors museum.py)
function localUV(ang, x, y) { const a = ang * Math.PI / 180, ax = Math.cos(a), ay = Math.sin(a); return [x * ax + y * ay, -x * ay + y * ax]; }
function regionAt(x, y) {
  if (Math.hypot(x, y) < layout.atrium.r - .7) return 'atrium';
  if (Math.abs(x) < 2.2 && y < -layout.atrium.r + 1 && y > -layout.atrium.r - 6.3) return 'vestibule';
  for (const w of layout.wings) {
    const [u, v] = localUV(w.angle, x, y);
    if (u > layout.atrium.r - 1 && u < layout.rooms.u0 + .3 && Math.abs(v) < layout.rooms.door / 2 - .45) return 'corridor:' + w.key;
    if (u > layout.rooms.u0 + .25 && u < layout.rooms.u1 - .45 && Math.abs(v) < layout.rooms.half - .45) return w.key;
  }
  return null;
}
function blocked(x, y) {
  if (Math.hypot(x, y) < 2.6) return true;                                         // the dais
  for (const e of layout.exhibits) if (Math.abs(x - e.pos[0]) < 1.05 && Math.abs(y - e.pos[1]) < 1.05) return true;
  return false;
}
const walkable = (x, y) => !!regionAt(x, y) && !blocked(x, y);

// ---------------------------------------------------------------- boot
try { boot(); } catch (err) { console.warn('museum disabled', err && err.message); $('loader').classList.add('done'); $('webglFail').hidden = false; }

function boot() {
  const canvas = $('museum');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  lite = /swiftshader|llvmpipe|software/i.test(dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '');
  dpr = lite ? .6 : Math.min(devicePixelRatio, touch ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.08;
  scene = new THREE.Scene(); scene.background = new THREE.Color('#07070a'); scene.fog = new THREE.FogExp2('#07070a', .012);
  camera = new THREE.PerspectiveCamera(touch && innerWidth < innerHeight ? 70 : 62, innerWidth / innerHeight, .03, 160);
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: touch || lite ? 0 : 2 }));
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .5, .55, .88); composer.addPass(bloom);
  lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uAspect: { value: innerWidth / innerHeight } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform sampler2D tDiffuse;uniform float uAspect;
      void main(){vec2 d=vUv-.5;float r=length(d*vec2(uAspect,1.));vec3 c=texture2D(tDiffuse,vUv).rgb;
        float ca=.0014*r*r; c.r=texture2D(tDiffuse,vUv+d*ca).r; c.b=texture2D(tDiffuse,vUv-d*ca).b;
        c*=mix(1.,smoothstep(1.25,.25,r),.55); gl_FragColor=vec4(c,1.);}` });
  lens.enabled = !lite; composer.addPass(lens);
  composer.addPass(new OutputPass());
  composer.setPixelRatio(dpr); composer.setSize(innerWidth, innerHeight);
  addEventListener('resize', onResize);
  load().then(() => { $('loader').classList.add('done'); requestAnimationFrame(frame); if (!lite) setTimeout(upgradeKatana, 400); }).catch(err => { console.warn('museum assets failed', err && err.message); $('loader').classList.add('done'); $('webglFail').hidden = false; });
  window.__MUSEUM = { capture: () => { composer.render(); return canvas.toDataURL('image/jpeg', .85); }, teleport: (x, y, yaw, pitch = -.05) => { Object.assign(P, { x, y, yaw, pitch, vx: 0, vy: 0 }); autoPath = null; started = true; document.body.classList.add('walking'); }, go: slug => walkToExhibit(slug), get state() { return { ...P, curWing, target: target && target.slug, locked }; } };
}
function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.fov = touch && innerWidth < innerHeight ? 70 : 62; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); lens.uniforms.uAspect.value = innerWidth / innerHeight;
  if (floorRef) floorRef.getRenderTarget().setSize(innerWidth * dpr * .35, innerHeight * dpr * .35);
}

// ---------------------------------------------------------------- materials
const M = {};
function physical(o) {
  if (!lite) return new THREE.MeshPhysicalMaterial(o);
  // light mode: standard materials compile fast on software renderers and weak GPUs
  const { transmission, thickness, ior, dispersion, iridescence, iridescenceIOR, sheen, sheenColor, sheenRoughness, clearcoat, clearcoatRoughness, attenuationColor, attenuationDistance, specularIntensity, ...rest } = o;
  if (transmission) { rest.transparent = true; rest.opacity = .5; }
  return new THREE.MeshStandardMaterial(rest);
}
function buildMaterials() {
  M.diamond = physical({ color: '#ffffff', metalness: 0, roughness: 0, transmission: 1, thickness: 1.2, ior: 2.42, dispersion: 6, specularIntensity: 1, envMapIntensity: 3, flatShading: true, attenuationColor: new THREE.Color('#e8f4ff'), attenuationDistance: 3 });
  M.emerald = physical({ color: '#2fb56a', metalness: 0, roughness: 0, transmission: .95, thickness: .4, ior: 1.58, dispersion: 1, envMapIntensity: 2, flatShading: true, attenuationColor: new THREE.Color('#0c6a34'), attenuationDistance: .25 });
  M.gold = physical({ color: '#f4c56d', metalness: 1, roughness: .16, envMapIntensity: 1.5 });
  M.silver = physical({ color: '#ececef', metalness: 1, roughness: .14, envMapIntensity: 1.4 });
  M.mirror = physical({ color: '#ffffff', metalness: 1, roughness: .02, envMapIntensity: 1.6, side: THREE.DoubleSide });
  M.mirrorball = physical({ color: '#f2f2f6', metalness: 1, roughness: .06, envMapIntensity: 2.2, flatShading: true });
  M.glass = physical({ color: '#ffffff', metalness: 0, roughness: .02, transmission: 1, thickness: .03, ior: 1.5, envMapIntensity: 1.6, side: THREE.DoubleSide, transparent: true });
  M.frost = physical({ color: '#e3ebe4', metalness: 0, roughness: .38, transmission: .92, thickness: .2, ior: 1.46, envMapIntensity: 1.2 });
  M.wine = physical({ color: '#7a0b1c', roughness: .04, transmission: .55, thickness: .5, ior: 1.34, attenuationColor: new THREE.Color('#4a0010'), attenuationDistance: .2, envMapIntensity: 1.3 });
  M.bottle = physical({ color: '#0f3a1c', roughness: .08, transmission: .45, thickness: .3, ior: 1.5, envMapIntensity: 1.5 });
  M.label = new THREE.MeshStandardMaterial({ color: '#dccfb3', roughness: .8, side: THREE.DoubleSide });
  M.ceramic = physical({ color: '#efe8dc', roughness: .35, clearcoat: .7, clearcoatRoughness: .15 });
  M.glaze = physical({ color: '#3e5b4d', roughness: .2, clearcoat: 1, clearcoatRoughness: .05, side: THREE.DoubleSide });
  M.coffee = physical({ color: '#2a1509', roughness: .08, clearcoat: 1 });
  M.bean = new THREE.MeshStandardMaterial({ color: '#43200c', roughness: .45 });
  M.candle = physical({ color: '#efe5cf', roughness: .6, sheen: .5, sheenColor: new THREE.Color('#fff2d8') });
  M.velvet = physical({ color: '#101022', roughness: .9, sheen: 1, sheenColor: new THREE.Color('#5a5a9a'), sheenRoughness: .4 });
  M.iron_black = physical({ color: '#161616', metalness: .7, roughness: .45 });
  M.rubber = new THREE.MeshStandardMaterial({ color: '#141414', roughness: .92 });
  M.wood = new THREE.MeshStandardMaterial({ color: '#6b4527', roughness: .55 });
  M.camera = physical({ color: '#1b1b1c', metalness: .35, roughness: .35, clearcoat: .5 });
  M.lens = physical({ color: '#1d3340', metalness: 0, roughness: 0, transmission: .3, ior: 1.6, envMapIntensity: 2 });
  M.reel = physical({ color: '#bfc3c8', metalness: 1, roughness: .3 });
  { const gt = globeTexture(); M.globe = new THREE.MeshStandardMaterial({ map: gt, emissiveMap: gt, roughness: .4, metalness: 0, emissive: '#ffffff', emissiveIntensity: .18 }); }
  M.white = physical({ color: '#efeee9', roughness: .4, clearcoat: .3 });
  M.red = physical({ color: '#a21e18', roughness: .4, clearcoat: .3 });
  M.granite = new THREE.MeshStandardMaterial({ color: '#6c6d71', roughness: .85, flatShading: true });
  M.stone = new THREE.MeshStandardMaterial({ color: '#8d8a83', roughness: .75 });
  M.pearl = physical({ color: '#f6f2ea', roughness: .2, iridescence: .8, iridescenceIOR: 1.4, clearcoat: 1 });
  M.orbit = physical({ color: '#9fe3d6', metalness: 1, roughness: .25, emissive: '#1f6b5f', emissiveIntensity: .4 });
  M.moon = physical({ color: '#bff2e7', roughness: .3, emissive: '#5fd3bf', emissiveIntensity: .6 });
  M.concrete = new THREE.MeshStandardMaterial({ color: '#a19f9a', roughness: .92 });
  M.box = physical({ color: '#101010', roughness: .55, clearcoat: .4 });
  M.acid = new THREE.MeshStandardMaterial({ color: '#d8ff3a', emissive: '#b8e020', emissiveIntensity: .5, roughness: .5 });
  M.ribbon = physical({ color: '#8fb0ff', metalness: 0, roughness: .06, transmission: .75, thickness: .05, iridescence: 1, iridescenceIOR: 1.5, side: THREE.DoubleSide, envMapIntensity: 1.8 });
  M.stem = new THREE.MeshStandardMaterial({ color: '#2f5e26', roughness: .7 });
  M.bloom = physical({ color: '#f07fae', roughness: .6, sheen: 1, sheenColor: new THREE.Color('#ffd0e4') });
  M.bronze = physical({ color: '#2a2018', metalness: .9, roughness: .35 });
  M.panel = null;
  const trims = { luxury: '#caa45c', table: '#b8704a', body: '#c9a25a', culture: '#b8bcc2', nature: '#6a4528' };
  for (const [k, c] of Object.entries(trims)) M['trim_' + k] = physical({ color: c, metalness: k === 'nature' ? 0 : 1, roughness: .28 });
  for (const k of ['steel', 'lacquer', 'silk', 'cord', 'samegawa', 'fitting', 'gilt', 'iron', 'wood', 'tang', 'horn', 'inner', 'bamboo']) M['k_' + k] = new THREE.MeshStandardMaterial({ color: '#333', metalness: .6, roughness: .4 });
}
function upgradeKatana() {
  const old = { ...M }; buildKatanaMaterials();
  scene.traverse(o => { if (o.isMesh) for (const k in old) if (k.startsWith('k_') && o.material === old[k]) o.material = M[k]; });
}
function globeTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#123a52'; x.fillRect(0, 0, 1024, 512);
  const n = (a, b) => Math.sin(a * 3.1 + Math.sin(b * 2.3)) * Math.cos(b * 2.7 + Math.sin(a * 1.7)) + .5 * Math.sin(a * 7.3 + b * 5.1);
  const img = x.getImageData(0, 0, 1024, 512);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 1024; i++) {
    const lon = i / 1024 * 6.283, lat = (j / 512 - .5) * 3.1416, v = n(lon, lat * 2) - Math.abs(lat) * .35, o = (j * 1024 + i) * 4;
    if (v > .45) { img.data[o] = 196 - 40 * v; img.data[o + 1] = 170 - 30 * v; img.data[o + 2] = 118; }
    else { const k = .8 + .2 * Math.sin(i * .05 + j * .03); img.data[o] = 38 * k; img.data[o + 1] = 104 * k; img.data[o + 2] = 138 * k; }
  }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(230,210,160,.25)'; x.lineWidth = 1;
  for (let k = 1; k < 12; k++) { x.beginPath(); x.moveTo(k * 1024 / 12, 0); x.lineTo(k * 1024 / 12, 512); x.stroke(); }
  for (let k = 1; k < 6; k++) { x.beginPath(); x.moveTo(0, k * 512 / 6); x.lineTo(1024, k * 512 / 6); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildKatanaMaterials() {
  const silk = TX.silkMaps(), same = TX.samegawaMaps(), ham = TX.hammeredMaps(), eng = TX.engravingMaps(), cord = TX.cordMaps();
  const b = TX.bladeMaps('notare', { polish: .8, w: 2048, h: 128 }), s = TX.sayaMaps({ lacquer: 'aonami', pattern: 'waves', luminous: .45, raden: .6, w: 2048, h: 256 });
  M.k_steel = physical({ color: 0xffffff, metalness: 1, roughness: 1, map: b.map, roughnessMap: b.rough, metalnessMap: b.rough, envMapIntensity: 1.1 });
  M.k_lacquer = physical({ color: 0xffffff, metalness: 1, roughness: 1, map: s.map, roughnessMap: s.mr, metalnessMap: s.mr, emissive: 0xffffff, emissiveMap: s.emissive, emissiveIntensity: 1.05, clearcoat: 1, clearcoatRoughness: .025, envMapIntensity: .55 });
  M.k_silk = physical({ color: '#1c3fae', roughness: .62, sheen: 1, sheenRoughness: .35, sheenColor: new THREE.Color('#6f8fff'), normalMap: silk.normal, aoMap: silk.ao });
  M.k_cord = physical({ color: '#0d1634', roughness: .7, sheen: .8, sheenColor: new THREE.Color('#46609f'), normalMap: cord.normal });
  M.k_samegawa = new THREE.MeshStandardMaterial({ color: '#ebe4d2', roughness: .55, normalMap: same.normal, aoMap: same.ao });
  M.k_fitting = physical({ color: '#f1efea', metalness: 1, roughness: .2, normalMap: eng.normal, aoMap: eng.ao, envMapIntensity: 1.3 });
  M.k_gilt = physical({ color: '#ffc46b', metalness: 1, roughness: .22 });
  M.k_iron = new THREE.MeshStandardMaterial({ color: '#2a2b2e', metalness: .85, roughness: .55, normalMap: ham.normal, roughnessMap: ham.rough });
  M.k_wood = new THREE.MeshStandardMaterial({ map: TX.woodMaps().map, roughness: .7 });
  M.k_tang = new THREE.MeshStandardMaterial({ map: TX.tangMaps().map, metalness: .55, roughness: .75 });
  M.k_horn = physical({ color: 0x0a0a0c, roughness: .25, clearcoat: .8 });
  M.k_inner = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: .95 });
  M.k_bamboo = new THREE.MeshStandardMaterial({ color: 0xb8975e, roughness: .55 });
}
let bakedMat;
function bakedMaterial(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <project_vertex>', '#include <project_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vW;
float dh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float dn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dh(i),dh(i+vec2(1,0)),f.x),mix(dh(i+vec2(0,1)),dh(i+vec2(1,1)),f.x),f.y);}
float dfbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*dn(p);p*=2.07;a*=.5;}return s;}`).replace('#include <map_fragment>', `#include <map_fragment>
{ vec3 cr=cross(dFdx(vW),dFdy(vW)); float cl=length(cr); vec3 nrm=cl>1e-10?cr/cl:vec3(0.,1.,0.);
  float k=smoothstep(4.5,.8,length(vW-cameraPosition)); float g;
  if(abs(nrm.y)>.7){ g=dfbm(vW.xz*vec2(3.,3.)+dfbm(vW.xz*.7)*2.)*.7+dn(vW.xz*300.)*.3; }
  else if(abs(nrm.x)>.7){ g=dfbm(vW.zy*vec2(2.,24.))*.7+dn(vW.zy*400.)*.3; } else { g=dfbm(vW.xy*vec2(2.,24.))*.7+dn(vW.xy*400.)*.3; }
  diffuseColor.rgb*=1.+(g-.5)*.34*k; }
diffuseColor.rgb*=1.1;`);
  };
  bakedMat = m; return m;
}

// ---------------------------------------------------------------- canvas text (room titles, wall labels, signage)
function textPlane(w, h, draw, px = 512) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); const x = c.getContext('2d');
  draw(x, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
}
function placeOnWall(mesh, x, y, z, nx, ny) {                      // Blender coords + wall normal (facing into the room)
  mesh.position.copy(B2T(x, y, z)); mesh.lookAt(B2T(x + nx, y + ny, z)); scene.add(mesh); return mesh;
}
function wingTitle(w) {
  const info = WINGS[w.key] || { title: w.title, line: '' }, idx = layout.wings.indexOf(w) + 1;
  return textPlane(4.6, 1.6, (x, W, H) => {
    x.textAlign = 'center'; x.fillStyle = 'rgba(201,168,106,.95)'; x.font = `400 ${H * .12}px Jost, sans-serif`; x.fillText(`R O O M   ${ROMAN[idx]}`, W / 2, H * .24);
    x.fillStyle = '#f2ede3'; x.font = `300 ${H * .3}px "Cormorant Garamond", serif`; x.fillText(info.title, W / 2, H * .6);
    x.fillStyle = 'rgba(242,237,227,.6)'; x.font = `italic 300 ${H * .12}px "Cormorant Garamond", serif`; x.fillText(info.line, W / 2, H * .85);
  }, 1024);
}
function wallLabel(r) {
  return textPlane(.62, .42, (x, W, H) => {
    x.fillStyle = 'rgba(12,11,10,.86)'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(201,168,106,.6)'; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, H - 2);
    x.fillStyle = '#c9a86a'; x.font = `400 ${H * .075}px Jost, sans-serif`; x.fillText((r.room || '').toUpperCase(), W * .08, H * .2);
    x.fillStyle = '#f2ede3'; x.font = `400 ${H * .17}px "Cormorant Garamond", serif`; x.fillText(r.n, W * .08, H * .42);
    x.fillStyle = 'rgba(242,237,227,.7)'; x.font = `italic ${H * .085}px "Cormorant Garamond", serif`;
    const words = (r.piece || r.tag || '').split(' '); let line = '', y = H * .6;
    for (const wd of words) { if (x.measureText(line + wd).width > W * .84) { x.fillText(line, W * .08, y); line = ''; y += H * .11; } line += wd + ' '; }
    x.fillText(line, W * .08, y);
    x.fillStyle = 'rgba(242,237,227,.45)'; x.font = `400 ${H * .065}px Jost, sans-serif`; x.fillText('CLICK THE PIECE TO ENTER ↗', W * .08, H * .9);
  }, 512);
}

// ---------------------------------------------------------------- load
async function load() {
  const set = (p, t) => { $('loadbar').style.width = (p * 100) + '%'; if (t) $('loadtxt').textContent = t; };
  set(.05, 'Opening the doors');
  try { await document.fonts.load('300 40px "Cormorant Garamond"'); await document.fonts.load('400 20px Jost'); } catch (_) { }
  layout = await (await fetch(BASE + 'assets/museum_layout.json')).json();
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const hdr = new HDRLoader().setDataType(THREE.FloatType);
  const envKeys = lite ? ['atrium'] : ['atrium', ...layout.wings.map(w => w.key)];
  const [gltf, lm, ...hdrs] = await Promise.all([
    loader.loadAsync(BASE + 'assets/museum.glb', e => e.total && set(.1 + .5 * e.loaded / e.total, 'Hanging the works')),
    new THREE.TextureLoader().loadAsync(BASE + 'assets/museum_lightmap.jpg'),
    ...envKeys.map(k => hdr.loadAsync(BASE + `assets/env_${k}.hdr`)),
  ]);
  set(.75, 'Lighting the rooms');
  lm.flipY = false; lm.colorSpace = THREE.SRGBColorSpace; lm.anisotropy = 8;
  const pm = new THREE.PMREMGenerator(renderer);
  hdrs.forEach((t, i) => {
    const d = t.image.data; for (let k = 0; k < d.length; k += 4) { const m = Math.max(d[k], d[k + 1], d[k + 2]); if (m > 5) { const f = (5 + Math.log(m - 4)) / m; d[k] *= f; d[k + 1] *= f; d[k + 2] *= f; } }
    t.mapping = THREE.EquirectangularReflectionMapping; t.needsUpdate = true; envs[envKeys[i]] = pm.fromEquirectangular(t).texture;
  });
  scene.environment = envs.atrium; scene.environmentRotation.set(0, -Math.PI / 2, 0); scene.environmentIntensity = 1;
  buildMaterials();
  const texLoader = new THREE.TextureLoader();
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    const ex = o.userData || {}, mname = (Array.isArray(o.material) ? o.material[0] : o.material)?.name || '';
    if (ex.baked) { o.material = bakedMaterial(lm); return; }
    if (ex.emit) {
      const c = new THREE.Color(...ex.emit).multiplyScalar(ex.strength * (Math.abs(ex.strength - 1.1) < .01 ? .7 : 1));
      o.material = new THREE.MeshBasicMaterial({ color: c }); o.userData.base = c.clone();
      if (ex.dyn) dyn.push({ o, kind: ex.dyn, seed: Math.random() * 6 });
    } else if (ex.panel) {
      const r = BY[ex.exh]; o.material = new THREE.MeshBasicMaterial({ color: '#15130f' });
      panels.push({ o, r });
      if (r) texLoader.load(r.img, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; panelUV(o, ex.exh); o.material = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(.92, .9, .86) }); });
    } else if (ex.mat) { o.material = M[ex.mat] || M['trim_' + ex.mat] || new THREE.MeshStandardMaterial({ color: '#888' }); if (ex.mat === 'globe') sphereUV(o); }
    else o.material = M['k_' + mname] || M.k_inner;             // katana part
    if (['tsuba_sakura', 'tsuba_nami'].includes(o.name)) o.visible = false;
    let slug = ex.exh;
    if (!slug) { let p = o; while (p) { if (p.name === 'KATANA') { slug = 'sokai'; break; } p = p.parent; } }
    if (slug && !ex.panel) {
      (exhibits[slug] ||= { slug, meshes: [], box: new THREE.Box3() }).meshes.push(o); o.userData.slug = slug; pickables.push(o);
    }
    if (ex.spin) { o.geometry.computeBoundingBox(); const ctr = o.geometry.boundingBox.getCenter(new THREE.Vector3()); o.geometry.translate(-ctr.x, -ctr.y, -ctr.z); o.position.add(ctr); spinners.push({ o, axis: ex.spin, speed: { eclat: .25, aurelia: .15, wander: .12, flowstate: .18, belong: .3, 'laurie-hedges': .6, 'inner-group': .2 }[ex.exh] || .2 }); }
  });
  scene.add(gltf.scene);
  scene.updateMatrixWorld(true);
  for (const e of Object.values(exhibits)) for (const m of e.meshes) e.box.expandByObject(m);
  set(.88, 'Writing the labels');
  // room titles on the back walls, signs over each corridor, labels beside every panel
  for (const w of layout.wings) {
    const a = w.angle * Math.PI / 180, ax = Math.cos(a), ay = Math.sin(a);
    const t = wingTitle(w); placeOnWall(t, ax * (layout.rooms.u1 - .02), ay * (layout.rooms.u1 - .02), 3.5, -ax, -ay);
    const sign = textPlane(3.2, .55, (x, W, H) => { x.textAlign = 'center'; x.fillStyle = 'rgba(201,168,106,.95)'; x.font = `400 ${H * .22}px Jost, sans-serif`; x.fillText(`R O O M  ${ROMAN[layout.wings.indexOf(w) + 1]}`, W / 2, H * .34); x.fillStyle = '#f2ede3'; x.font = `300 ${H * .46}px "Cormorant Garamond", serif`; x.fillText((WINGS[w.key] || w).title, W / 2, H * .82); }, 1024);
    placeOnWall(sign, ax * (layout.atrium.r - .05), ay * (layout.atrium.r - .05), 5.4, -ax, -ay);
  }
  for (const e of layout.exhibits) {
    const r = BY[e.slug]; if (!r) continue;
    const a = e.angle * Math.PI / 180, ax = Math.cos(a), ay = Math.sin(a), [nx, ny] = e.panelNormal;
    const lb = wallLabel(r); placeOnWall(lb, e.panel[0] + nx * .015 + ax * 1.2, e.panel[1] + ny * .015 + ay * 1.2, 1.35, nx, ny);
  }
  { const r = BY.sokai; if (r) { const lb = wallLabel(r); lb.position.copy(B2T(2.3, -2.2, 1.05)); lb.lookAt(B2T(3.6, -5.2, 1.05)); lb.scale.setScalar(1.15); scene.add(lb); } }
  // the reflective floor follows you from room to room
  floorRef = new Reflector(new THREE.PlaneGeometry(13, 18), { clipBias: .003, textureWidth: innerWidth * dpr * .35, textureHeight: innerHeight * dpr * .35, color: 0xffffff, multisample: 0,
    shader: { name: 'Polish', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uStrength: { value: .3 } },
      vertexShader: 'uniform mat4 textureMatrix;varying vec4 vUv;varying vec2 vL;void main(){vUv=textureMatrix*vec4(position,1.);vL=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform vec3 color;uniform sampler2D tDiffuse;uniform float uStrength;varying vec4 vUv;varying vec2 vL;
        void main(){ vec4 uv=vUv; vec3 c=texture2DProj(tDiffuse,uv).rgb*.4; vec2 o=vec2(.006,0.)*uv.w; c+=texture2DProj(tDiffuse,uv+vec4(o,0,0)).rgb*.15+texture2DProj(tDiffuse,uv-vec4(o,0,0)).rgb*.15;
          vec2 o2=vec2(0.,.012)*uv.w; c+=texture2DProj(tDiffuse,uv+vec4(o2,0,0)).rgb*.15+texture2DProj(tDiffuse,uv-vec4(o2,0,0)).rgb*.15;
          float edge=smoothstep(0.,.12,vL.x)*smoothstep(1.,.88,vL.x)*smoothstep(0.,.1,vL.y)*smoothstep(1.,.9,vL.y);
          gl_FragColor=vec4(c*uStrength*edge,1.); }` } });
  floorRef.rotation.x = -Math.PI / 2; Object.assign(floorRef.material, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  floorRef.visible = !lite; scene.add(floorRef); placeReflector('atrium');
  // a beam of light for the diamond, sparkles around it, steam over the coffee, the lighthouse beam
  const eclat = layout.exhibits.find(e => e.slug === 'eclat');
  if (eclat) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.35, .9, 4.6, 32, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying float v;void main(){v=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying float v;void main(){gl_FragColor=vec4(vec3(.75,.85,1.)*.07*smoothstep(0.,.8,v),1.);}' }));
    beam.position.copy(B2T(eclat.pos[0], eclat.pos[1], 3.9)); scene.add(beam);
    sparkles = points(80, B2T(eclat.pos[0], eclat.pos[1], eclat.pos[2] + 1.15), .8, '#ffffff', .05, 'twinkle');
  }
  const coffee = layout.exhibits.find(e => e.slug === 'ember-oak');
  if (coffee) steam = points(60, B2T(coffee.pos[0], coffee.pos[1], coffee.pos[2] + .42), .12, '#ffffff', .12, 'steam');
  const light = layout.exhibits.find(e => e.slug === 'dunhaven');
  if (light) {
    beaconBeam = new THREE.Mesh(new THREE.ConeGeometry(.35, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .9, .6).multiplyScalar(.35), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beaconBeam.geometry.translate(0, -1.5, 0); beaconBeam.geometry.rotateZ(Math.PI / 2);
    beaconBeam.position.copy(B2T(light.pos[0], light.pos[1], light.pos[2] + .18 + 1.27)); scene.add(beaconBeam);
  }
  L = new THREE.DirectionalLight('#fff1dc', .6); L.position.set(3, 8, 4); scene.add(L);
  const start = layout.start; P.x = start[0]; P.y = start[1];
  buildMap();
  set(1, 'Welcome');
}
function points(n, center, radius, color, size, kind) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = Math.random() * radius, h = (Math.random() - .5) * radius * 1.4; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = h; p[i * 3 + 2] = Math.sin(a) * r; s[i] = Math.random() * 10; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(s, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(color) }, uS: { value: size * innerHeight }, uK: { value: kind === 'steam' ? 1 : 0 } },
    vertexShader: `attribute float seed;uniform float uT,uS,uK;varying float a;void main(){vec3 q=position;
      if(uK>.5){float t=fract(uT*.18+seed*.1);q=vec3(sin(seed+uT*.7)*.05*t*3.,t*.9,cos(seed*1.3+uT*.5)*.05*t*3.);a=smoothstep(0.,.15,t)*(1.-t)*.35;}
      else{a=pow(max(0.,sin(uT*2.1+seed*7.)),24.)*1.6;}
      vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uS*(uK>.5?1.:.35)/max(-mv.z,.5);}`,
    fragmentShader: 'uniform vec3 uC;varying float a;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float s=uC.r>.9?max(smoothstep(.5,0.,d)*.4,smoothstep(.06,0.,abs(c.x))*smoothstep(.5,0.,abs(c.y))+smoothstep(.06,0.,abs(c.y))*smoothstep(.5,0.,abs(c.x))):smoothstep(.5,0.,d);gl_FragColor=vec4(uC*s*a,1.);}' });
  const pts = new THREE.Points(g, m); pts.position.copy(center); pts.frustumCulled = false; scene.add(pts); return pts;
}
function sphereUV(o) {
  const g = o.geometry; g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()), p = g.attributes.position, uv = new Float32Array(p.count * 2), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).sub(c).normalize(); uv[i * 2] = .5 + Math.atan2(v.z, v.x) / (2 * Math.PI); uv[i * 2 + 1] = .5 + Math.asin(clamp(v.y, -1, 1)) / Math.PI; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function panelUV(o, slug) {
  const e = layout.exhibits.find(x => x.slug === slug); if (!e) return;
  const n = B2T(e.panelNormal[0], e.panelNormal[1], 0).normalize(), right = new THREE.Vector3().crossVectors(n.clone().negate(), new THREE.Vector3(0, 1, 0)).negate();
  const c = B2T(e.panel[0], e.panel[1], e.panel[2]), g = o.geometry, p = g.attributes.position, uv = new Float32Array(p.count * 2), v = new THREE.Vector3();
  o.updateMatrixWorld();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).sub(c); uv[i * 2] = clamp(v.dot(right) / 1.5 + .5, 0, 1); uv[i * 2 + 1] = clamp(v.y / 2 + .5, 0, 1); }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function placeReflector(key) {
  if (!floorRef) return;
  if (key === 'atrium' || key === 'vestibule' || !key) { floorRef.position.set(0, .004, 0); floorRef.rotation.z = 0; floorRef.scale.set(1.4, 1, 1); return; }
  const w = layout.wings.find(x => x.key === key.replace('corridor:', '')); if (!w) return;
  const c = B2T(w.center[0], w.center[1], .004); floorRef.position.copy(c); floorRef.rotation.z = -(w.angle * Math.PI / 180) + Math.PI / 2; floorRef.scale.set(1, 1, 1);
}

// ---------------------------------------------------------------- input: keyboard & mouse first
const canvas = () => $('museum');
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea,select')) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'q', 'e'].includes(k) && started && !overlayOpen()) { keys.add(k); autoPath = null; if (k.startsWith('arrow')) e.preventDefault(); }
  if (!started && (k === 'enter' || k === ' ')) { e.preventDefault(); enter(); return; }
  if (!started) return;
  if (k === 'e' || k === 'enter') { if (target) openWork(target.slug); }
  if (k === 'm') toggleMap();
  if (k === 'escape') { closeOverlays(); }
  if (k >= '1' && k <= '5') walkToWing(layout.wings[+k - 1].key);
  if (k === '0' || k === 'h') walkToAtrium();
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas();
  document.body.classList.toggle('locked', locked);
  if (!locked && started && !overlayOpen()) $('pause').classList.add('on'); else $('pause').classList.remove('on');
});
let downAt = null;
function onCanvasDown(e) {
  if (!started) return;
  downAt = [e.clientX, e.clientY, performance.now()];
  if (!locked) dragging = { x: e.clientX, y: e.clientY, yaw: P.yaw, pitch: P.pitch };
}
function onCanvasUp(e) {
  if (!started || !downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); dragging = null;
  if (locked) { if (target) openWork(target.slug); return; }
  if (moved > 6) return;
  const hit = pick(e.clientX, e.clientY);
  if (hit && hit.slug) { openWork(hit.slug); return; }
  if (hit && hit.point) { const q = hit.point; if (walkable(q.x, -q.z)) autoPath = [{ x: q.x, y: -q.z }]; }
  if (!touch && e.pointerType === 'mouse' && e.button === 0 && !hit?.slug) requestLock();
}
function requestLock() { try { const p = canvas().requestPointerLock({ unadjustedMovement: true }); if (p && p.catch) p.catch(() => canvas().requestPointerLock()); } catch (_) { } }
addEventListener('pointermove', e => {
  if (!started) return;
  if (locked) { P.yaw -= e.movementX * .0022; P.pitch = clamp(P.pitch - e.movementY * .0022, -1.2, 1.2); return; }
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.dirty = true;
  if (dragging) { P.yaw = dragging.yaw - (e.clientX - dragging.x) * .004; P.pitch = clamp(dragging.pitch - (e.clientY - dragging.y) * .004, -1.2, 1.2); autoPath = null; }
});
const mouse = { x: innerWidth / 2, y: innerHeight / 2, dirty: false };
addEventListener('wheel', e => { if (!started || overlayOpen() || scrollY > 10) return; if (locked || e.target === canvas()) { e.preventDefault(); const f = -Math.sign(e.deltaY) * Math.min(1.2, Math.abs(e.deltaY) / 80); nudge(f); } }, { passive: false });
function nudge(f) { const nx = P.x - Math.sin(P.yaw) * f, ny = P.y + Math.cos(P.yaw) * f; if (walkable(nx, ny)) { P.x = nx; P.y = ny; } }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); ray.far = 14;
  const h = ray.intersectObjects(scene.children, true).find(h => h.object.isMesh && h.object.visible && !(h.object.material && h.object.material.blending === THREE.AdditiveBlending));
  if (!h) return null;
  let o = h.object, slug = o.userData.slug; if (!slug) { const pn = panels.find(p => p.o === o); if (pn) slug = pn.r && pn.r.slug; }
  return { slug, point: h.point, dist: h.distance };
}
function enter() {
  started = true; document.body.classList.add('walking'); $('intro').classList.add('off');
  if (!touch) requestLock();
  sfx(0);
}
$('enterBtn').onclick = e => { e.stopPropagation(); enter(); };
$('resume').onclick = () => { $('pause').classList.remove('on'); requestLock(); };
function openWork(slug) {
  const r = BY[slug]; if (!r) return;
  if (document.pointerLockElement) document.exitPointerLock();
  if (slug === 'sokai') { location.href = r.url; return; }
  $('m-name').textContent = r.n; $('m-room').textContent = r.room; $('m-open').href = r.url; $('modal').querySelector('.ld').style.opacity = 1;
  $('m-frame').onload = () => { $('modal').querySelector('.ld').style.opacity = 0; }; $('m-frame').src = r.url; $('modal').classList.add('on'); $('pause').classList.remove('on');
}
function closeModal() { $('modal').classList.remove('on'); setTimeout(() => { $('m-frame').src = 'about:blank'; }, 400); }
$('m-close').onclick = closeModal;
const overlayOpen = () => $('modal').classList.contains('on') || $('mapPanel').classList.contains('on') || $('works').classList.contains('on');
function closeOverlays() { closeModal(); $('mapPanel').classList.remove('on'); $('works').classList.remove('on'); }
function toggleMap() { const on = !$('mapPanel').classList.contains('on'); closeOverlays(); $('mapPanel').classList.toggle('on', on); if (on && document.pointerLockElement) document.exitPointerLock(); }
$('mapBtn').onclick = toggleMap; $('mapClose').onclick = () => $('mapPanel').classList.remove('on');
$('worksBtn').onclick = () => { closeOverlays(); $('works').classList.add('on'); if (document.pointerLockElement) document.exitPointerLock(); };
$('worksClose').onclick = () => $('works').classList.remove('on');
$('pauseMap').onclick = () => { $('pause').classList.remove('on'); toggleMap(); };

// ---------------------------------------------------------------- guided walking (map, room keys, all works)
function pathTo(x, y) {
  const here = regionAt(P.x, P.y) || 'atrium', dest = regionAt(x, y) || 'atrium', pts = [];
  const wingOf = r => r && r !== 'atrium' && r !== 'vestibule' ? r.replace('corridor:', '') : null;
  const wh = wingOf(here), wd = wingOf(dest);
  if (wh && wh !== wd) { const w = layout.wings.find(q => q.key === wh), a = w.angle * Math.PI / 180; pts.push({ x: Math.cos(a) * (layout.rooms.u0 - .5), y: Math.sin(a) * (layout.rooms.u0 - .5) }, { x: Math.cos(a) * 6, y: Math.sin(a) * 6 }); }
  if (here === 'vestibule' && dest !== 'vestibule') pts.push({ x: 0, y: -6.5 });
  if (wd && wd !== wh) { const w = layout.wings.find(q => q.key === wd), a = w.angle * Math.PI / 180; if (!wh) { const ang = Math.atan2(P.y, P.x), d = Math.abs(((ang - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d > .9) pts.push({ x: Math.cos(a) * 5, y: Math.sin(a) * 5 }); } pts.push({ x: Math.cos(a) * 6.8, y: Math.sin(a) * 6.8 }, { x: Math.cos(a) * (layout.rooms.u0 + .8), y: Math.sin(a) * (layout.rooms.u0 + .8) }); }
  pts.push({ x, y });
  return pts;
}
function walkToWing(key) { const w = layout.wings.find(q => q.key === key); if (!w) return; closeOverlays(); const a = w.angle * Math.PI / 180; autoPath = pathTo(Math.cos(a) * (layout.rooms.u0 + 2.2), Math.sin(a) * (layout.rooms.u0 + 2.2)); autoPath.face = { x: w.center[0], y: w.center[1] }; }
function walkToAtrium() { closeOverlays(); autoPath = pathTo(0, -5.5); autoPath.face = { x: 0, y: 0 }; }
function walkToExhibit(slug) {
  closeOverlays();
  if (slug === 'sokai') { autoPath = pathTo(0, -4.2); autoPath.face = { x: 0, y: 0 }; return; }
  const e = layout.exhibits.find(q => q.slug === slug); if (!e) return;
  const a = e.angle * Math.PI / 180, back = 2.6;
  let tx = e.pos[0] - Math.cos(a) * back, ty = e.pos[1] - Math.sin(a) * back;
  if (!walkable(tx, ty)) { tx = e.pos[0] - e.panelNormal[0] * 2.2; ty = e.pos[1] - e.panelNormal[1] * 2.2; }
  autoPath = pathTo(tx, ty); autoPath.face = { x: e.pos[0], y: e.pos[1] };
}

// ---------------------------------------------------------------- map
function buildMap() {
  const s = 5.2, cx = 200, cy = 150, T = (x, y) => [cx + x * s, cy - y * s];
  let svg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><g fill="rgba(242,237,227,.06)" stroke="rgba(242,237,227,.35)" stroke-width="1">`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${layout.atrium.r * s}"/>`;
  const [vx, vy] = T(-2.5, -layout.atrium.r); svg += `<rect x="${vx}" y="${vy}" width="${5 * s}" height="${6 * s}"/>`;
  for (const [i, w] of layout.wings.entries()) {
    const a = -w.angle, u0 = layout.rooms.u0, u1 = layout.rooms.u1, h = layout.rooms.half;
    svg += `<g transform="translate(${cx} ${cy}) rotate(${a})"><rect x="${layout.atrium.r * s}" y="${-2 * s}" width="${(u0 - layout.atrium.r) * s}" height="${4 * s}"/>`;
    svg += `<rect class="wing" data-w="${w.key}" x="${u0 * s}" y="${-h * s}" width="${(u1 - u0) * s}" height="${2 * h * s}" style="cursor:pointer"/></g>`;
    const [tx, ty] = T(w.center[0], w.center[1]);
    svg += `<text x="${tx}" y="${ty + 3}" text-anchor="middle" fill="#f2ede3" stroke="none" font-size="10" font-family="Cormorant Garamond, serif" pointer-events="none">${ROMAN[i + 1]} · ${(WINGS[w.key] || w).title}</text>`;
  }
  svg += `</g><g fill="#c9a86a">`;
  for (const e of layout.exhibits) { const [x, y] = T(e.pos[0], e.pos[1]); svg += `<circle cx="${x}" cy="${y}" r="2.6" data-x="${e.slug}" style="cursor:pointer"><title>${(BY[e.slug] || {}).n || e.slug}</title></circle>`; }
  svg += `<circle cx="${cx}" cy="${cy}" r="3.4" fill="#7fe8ff" data-x="sokai" style="cursor:pointer"><title>SŌKAI</title></circle></g><path id="me" d="M0,-7 L4.5,5 L0,2.5 L-4.5,5 Z" fill="#f2ede3"/></svg>`;
  for (const el of [$('miniMap'), $('bigMap')]) el.innerHTML = svg;
  document.querySelectorAll('#bigMap .wing, #miniMap .wing').forEach(r => r.addEventListener('click', ev => { ev.stopPropagation(); walkToWing(r.dataset.w); }));
  document.querySelectorAll('#bigMap [data-x], #miniMap [data-x]').forEach(c => c.addEventListener('click', ev => { ev.stopPropagation(); walkToExhibit(c.dataset.x); }));
  $('mapWings').innerHTML = layout.wings.map((w, i) => `<button data-w="${w.key}"><i>${ROMAN[i + 1]}</i><b>${(WINGS[w.key] || w).title}</b><span>${w.exhibits.map(s => (BY[s] || {}).n || s).join(' · ')}</span><kbd>${i + 1}</kbd></button>`).join('') + `<button data-w="atrium"><i>·</i><b>The Atrium</b><span>SŌKAI</span><kbd>0</kbd></button>`;
  $('mapWings').querySelectorAll('button').forEach(b => b.onclick = () => b.dataset.w === 'atrium' ? walkToAtrium() : walkToWing(b.dataset.w));
  $('worksGrid').innerHTML = ROOMS.map(r => `<button class="card" data-s="${r.slug}"><img loading="lazy" src="${r.img}" alt=""><div><b>${r.n}</b><span>${(WINGS[r.wing] || {}).title || ''}</span><em>${r.piece || ''}</em></div></button>`).join('');
  $('worksGrid').querySelectorAll('.card').forEach(c => c.onclick = () => walkToExhibit(c.dataset.s));
}
function updateMap() {
  const s = 5.2, x = 200 + P.x * s, y = 150 - P.y * s, rot = -P.yaw * 180 / Math.PI;
  for (const el of document.querySelectorAll('#me')) el.setAttribute('transform', `translate(${x} ${y}) rotate(${rot})`);
}

// ---------------------------------------------------------------- sound: a quiet chime when you enter a room
let actx;
function sfx(n) {
  const b = $('sound'); if (!b || !b.classList.contains('on')) return;
  try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = [392, 440, 523.3, 587.3, 659.3, 784][n % 6]; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.03, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + 2.2);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 2.3); } catch (_) { }
}

// ---------------------------------------------------------------- frame
let last = performance.now() / 1000, bob = 0, expo = 1.08;
const EXPO = { atrium: 1.1, luxury: 1.1, table: 1.0, body: .56, culture: .64, nature: 1.1 };
const fwd = new THREE.Vector3(), look = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now() / 1000, dt = Math.min(.05, now - last); last = now;
  // movement: velocity with gentle acceleration, no jumps
  let ix = 0, iy = 0;
  if (keys.has('w') || keys.has('arrowup')) iy += 1;
  if (keys.has('s') || keys.has('arrowdown')) iy -= 1;
  if (keys.has('a') || (keys.has('arrowleft') && locked)) ix -= 1;
  if (keys.has('d') || (keys.has('arrowright') && locked)) ix += 1;
  if (!locked) { if (keys.has('arrowleft')) P.yaw += dt * 1.6; if (keys.has('arrowright')) P.yaw -= dt * 1.6; }
  if (keys.has('q')) P.yaw += dt * 1.4;
  const speed = keys.has('shift') ? 4.2 : 2.3;
  let wx = 0, wy = 0;
  if (ix || iy) { const s = Math.sin(P.yaw), c = Math.cos(P.yaw), l = Math.hypot(ix, iy); wx = (-s * iy + c * ix) / l * speed; wy = (c * iy + s * ix) / l * speed; }
  else if (autoPath && autoPath.length) {
    const t = autoPath[0], dx = t.x - P.x, dy = t.y - P.y, d = Math.hypot(dx, dy);
    if (d < .25) autoPath.shift();
    else { const sp = Math.min(3.0, d * 2.2 + .6); wx = dx / d * sp; wy = dy / d * sp; const want = Math.atan2(-dx, dy); let dyaw = ((want - P.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; if (autoPath.length > 1 || !autoPath.face) P.yaw += dyaw * (1 - Math.exp(-dt * 3.5)); }
    if (!autoPath.length && autoPath.face) {}
  }
  if (autoPath && autoPath.face && autoPath.length <= 1) {
    const want = Math.atan2(-(autoPath.face.x - P.x), autoPath.face.y - P.y); let dyaw = ((want - P.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; P.yaw += dyaw * (1 - Math.exp(-dt * 3)); P.pitch += (-.08 - P.pitch) * (1 - Math.exp(-dt * 3));
    if (!autoPath.length && Math.abs(dyaw) < .01) autoPath = null;
  }
  const k = 1 - Math.exp(-dt * 9); P.vx += (wx - P.vx) * k; P.vy += (wy - P.vy) * k;
  const nx = P.x + P.vx * dt, ny = P.y + P.vy * dt;
  if (walkable(nx, ny)) { P.x = nx; P.y = ny; } else if (walkable(nx, P.y)) { P.x = nx; P.vy *= .5; } else if (walkable(P.x, ny)) { P.y = ny; P.vx *= .5; } else { P.vx = P.vy = 0; if (autoPath) autoPath.shift(); }
  const moving = Math.hypot(P.vx, P.vy);
  bob += dt * moving * 3.2;
  // before entering, the camera drifts slowly at the doorway
  const idle = started ? 0 : 1;
  const camYaw = P.yaw + idle * Math.sin(now * .12) * .08, camPitch = P.pitch + idle * .02;
  camera.position.copy(B2T(P.x, P.y, EYE + (reduce ? 0 : Math.sin(bob) * .012 * Math.min(1, moving))));
  fwd.set(-Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), -Math.cos(camYaw) * Math.cos(camPitch));
  look.copy(camera.position).add(fwd); camera.lookAt(look);
  // room awareness
  const reg = regionAt(P.x, P.y) || curWing, wing = reg === 'vestibule' ? 'atrium' : reg.replace('corridor:', '');
  if (wing !== curWing && !reg.startsWith('corridor')) {
    curWing = wing; scene.environment = envs[wing] || envs.atrium; placeReflector(wing);
    const i = layout.wings.findIndex(w => w.key === wing), info = WINGS[wing] || {};
    $('roomName').textContent = i >= 0 ? `${ROMAN[i + 1]} · ${info.title}` : 'The Atrium';
    if (started) sfx(i + 1);
  }
  // what are you looking at? (crosshair when walking, cursor otherwise)
  let h = null;
  if (started && (locked || mouse.dirty || moving > .05)) { h = pick(locked ? innerWidth / 2 : mouse.x, locked ? innerHeight / 2 : mouse.y); mouse.dirty = false; target = h && h.slug && h.dist < 9 ? { slug: h.slug } : null; }
  const r = target && BY[target.slug];
  $('aim').classList.toggle('on', !!r);
  if (r) { $('aimName').textContent = r.n; $('aimType').textContent = r.room; $('aimHint').textContent = locked ? 'Click or press E to enter' : 'Click to enter'; }
  canvas().style.cursor = !locked && started ? (r ? 'pointer' : dragging ? 'grabbing' : 'grab') : '';
  if (!locked) { $('aim').style.left = mouse.x + 'px'; $('aim').style.top = (mouse.y + 26) + 'px'; } else { $('aim').style.left = '50%'; $('aim').style.top = 'calc(50% + 26px)'; }
  // living things
  for (const s of spinners) { const a = dt * s.speed * (reduce ? 0 : 1); if (s.axis === 'z') s.o.rotation.y += a; else if (s.axis === 'x') s.o.rotation.x += a; else s.o.rotation.z += a; }
  for (const { o, kind, seed } of dyn) {
    const b = o.userData.base;
    if (kind === 'flicker') o.material.color.copy(b).multiplyScalar(.85 + .1 * Math.sin(now * 9 + seed) + .06 * Math.sin(now * 23 + seed * 3));
    else if (kind === 'portal') o.material.color.copy(b).multiplyScalar(.6 + .15 * Math.sin(now * 1.4));
    else if (kind === 'pulse') o.material.color.copy(b).multiplyScalar(.6 + .4 * Math.pow(.5 + .5 * Math.sin(now * 2.2), 3));
    else if (kind === 'neon') o.material.color.copy(b).multiplyScalar(Math.random() < .015 ? .15 : 1);
    else if (kind === 'disco') o.material.color.setHSL((now * .1 + seed) % 1, .9, .6).multiplyScalar(6);
  }
  if (beaconBeam) beaconBeam.rotation.y = now * .8;
  for (const p of [sparkles, steam]) if (p) p.material.uniforms.uT.value = now;
  if (L) L.position.copy(camera.position).add(new THREE.Vector3(2, 5, 2));
  expo += ((EXPO[curWing] || 1) - expo) * (1 - Math.exp(-dt * 2)); renderer.toneMappingExposure = expo;
  updateMap();
  composer.render(dt);
  ftAvg += (dt - ftAvg) * .05; ftN++;
  if (ftN > 90 && ftAvg > 1 / 38) {
    ftN = 0;
    if (dpr > 1) { dpr = Math.max(1, dpr - .25); renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr); onResize(); }
    else if (floorRef && floorRef.visible) floorRef.visible = false;
    else if (lens.enabled) lens.enabled = false;
  }
}
const cv = $('museum');
cv.addEventListener('pointerdown', onCanvasDown);
addEventListener('pointerup', onCanvasUp);
