import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import * as TX from './tex.js';
import { Atmosphere } from './fx.js';
import { AmbientSound } from './sound.js';
import { PARTS, PRESETS, COLORS, METALS, SEASONS, WEATHERS } from './data.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

const ASSETS = window.__SOKAI_ASSETS;
const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };

// ------------------------------------------------------------------ state
const DEFAULT_CFG = { ...PRESETS.aonami.cfg };
const S = {
  env: 'atelier', season: 'spring', weather: 'clear', quality: coarse ? 'balanced' : 'high',
  bakedGain: .62, exposure: 1.0, lantern: 1.0, moon: 1.0, bloom: .45, dof: !coarse, grain: .5, look: 'agx',
  ambience: !reduced, sound: false, spin: false, cinematic: false,
  mode: 'sheathed', d: 0, dT: 0, e: 0, eT: 0, sel: '', hover: '', time: 'night',
  cfg: loadCfg(),
};
const WORLD_KEYS = ['env', 'time', 'season', 'weather', 'exposure', 'lantern', 'moon', 'bloom', 'grain', 'dof', 'ambience', 'look', 'quality', 'sound'];
try { const w = JSON.parse(localStorage.getItem('sokai.world') || '{}'); for (const k of WORLD_KEYS) if (k in w) S[k] = w[k]; } catch (_) { }
let saveT;
function saveWorld() { clearTimeout(saveT); saveT = setTimeout(() => { try { const w = {}; for (const k of WORLD_KEYS) w[k] = S[k]; localStorage.setItem('sokai.world', JSON.stringify(w)); } catch (_) { } }, 200); }
function saveView() { try { localStorage.setItem('sokai.view', JSON.stringify({ p: camera.position.toArray(), t: controls.target.toArray(), mode: S.mode, env: S.env })); } catch (_) { } }
function loadView() { try { return JSON.parse(localStorage.getItem('sokai.view') || 'null'); } catch (_) { return null; } }
function loadCollection() { try { return JSON.parse(localStorage.getItem('sokai.collection') || '[]'); } catch (_) { return []; } }
function saveCollection(c) { try { localStorage.setItem('sokai.collection', JSON.stringify(c.slice(0, 24))); } catch (_) { toast('Storage is unavailable in this browser view.'); } }
function loadCfg() {
  try { const h = new URLSearchParams(location.hash.slice(1)).get('forge'); if (h) return { ...DEFAULT_CFG, ...JSON.parse(atob(h)) }; } catch (_) { }
  try { const s = localStorage.getItem('sokai.forge'); if (s) return { ...DEFAULT_CFG, ...JSON.parse(s) }; } catch (_) { }
  return { ...DEFAULT_CFG };
}
function saveCfg() {
  try { localStorage.setItem('sokai.forge', JSON.stringify(S.cfg)); } catch (_) { }
  try { history.replaceState(null, '', '#forge=' + btoa(JSON.stringify(S.cfg))); } catch (_) { }
}

// ------------------------------------------------------------------ renderer
const canvas = $('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .004, 220);
camera.position.set(-1.6, 1.7, 4.2);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = .07;
controls.zoomToCursor = true; controls.minDistance = .035; controls.maxDistance = 7;
controls.rotateSpeed = .55; controls.zoomSpeed = .9; controls.panSpeed = .6;
controls.target.set(0, .7, 0);
controls.maxPolarAngle = Math.PI * .56;

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
const renderPass = new RenderPass(scene, camera);
const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
Object.assign(outline, { edgeStrength: 2.6, edgeGlow: .6, edgeThickness: 1.2, pulsePeriod: 2.4 });
outline.visibleEdgeColor.set('#7fe8ff'); outline.hiddenEdgeColor.set('#0e2a33');
const bokeh = new BokehPass(scene, camera, { focus: 1.2, aperture: .0035, maxblur: .007 });
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .45, .5, .9);
const finalPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: .5 }, uVig: { value: .55 }, uFlash: { value: 0 }, uWarp: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1.04 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime,uGrain,uVig,uFlash,uWarp,uSat; uniform vec3 uTint; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 c=vUv-.5; float r=length(c);
      vec3 col=vec3(0.);
      if(uWarp>0.001){ for(int i=0;i<12;i++){ float k=float(i)/12.; col+=texture2D(tDiffuse,.5+c*(1.-uWarp*.35*k)).rgb; } col/=12.; col+=vec3(.25,.9,1.)*uWarp*uWarp*2.5*(1.-r); }
      else { float ca=.0016*r*r*6.; col=vec3(texture2D(tDiffuse,vUv+c*ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*ca).b); }
      col*=uTint;
      float l=dot(col,vec3(.2126,.7152,.0722)); col=mix(vec3(l),col,uSat);
      col+=uFlash*vec3(.55,.65,.9)*(.6+.4*(1.-r));
      col*=mix(1.,smoothstep(.95,.2,r),uVig);
      col+=(h(vUv*uRes+fract(uTime*7.))-.5)*.045*uGrain;
      gl_FragColor=vec4(col,1.);
    }`,
});
composer.addPass(renderPass); composer.addPass(outline); composer.addPass(bokeh); composer.addPass(bloom); composer.addPass(finalPass); composer.addPass(new OutputPass());

// ------------------------------------------------------------------ world
const world = { atelier: new THREE.Group(), vault: new THREE.Group(), studio: new THREE.Group() };
Object.values(world).forEach(g => scene.add(g));
const envMaps = {};
const dyn = [];            // animated emissive objects
const bakedMats = [];
const foliage = [], pines = [];
const reflectors = [];
const HOME = new THREE.Vector3(.24, .66, 0);
let katana, bladeAsm, sayaAsm, sky, bakedAtelier, moonMesh; const lightmaps = {}; const ridges = [];
const partMeshes = {};     // part -> [meshes]
const partNodes = {};      // part -> [nodes] (tsuba has three designs)
let tsubaNodes = {};
const rest = {};           // part -> rest position
const M = {};              // katana materials

const fx = new Atmosphere(scene);
const sound = new AmbientSound();
fx.onThunder = () => sound.thunder();

function bakedMaterial(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex });
  m.userData.u = { uGain: { value: 1.0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uFlash: { value: 0 } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <project_vertex>', '#include <project_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uGain,uFlash; uniform vec3 uTint; varying vec3 vW;
float dh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float dn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dh(i),dh(i+vec2(1,0)),f.x),mix(dh(i+vec2(0,1)),dh(i+vec2(1,1)),f.x),f.y);}
float dfbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*dn(p);p*=2.07;a*=.5;}return s;}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      {
        vec3 cr=cross(dFdx(vW),dFdy(vW)); float cl=length(cr); vec3 nrm=cl>1e-10?cr/cl:vec3(0.,1.,0.);
        float k=smoothstep(4.,.5,length(vW-cameraPosition));
        float g;
        if(abs(nrm.y)>.7){ vec2 p=vW.xz*vec2(2.2,34.); g=dfbm(p+vec2(dfbm(p*.25)*3.,0.))*.75+dn(vW.xz*vec2(90.,900.))*.25; }
        else if(abs(nrm.x)>.7){ vec2 p=vW.zy*vec2(3.,26.); g=dfbm(p)*.7+dn(vW.zy*500.)*.3; }
        else { vec2 p=vW.xy*vec2(3.,26.); g=dfbm(p)*.7+dn(vW.xy*500.)*.3; }
        diffuseColor.rgb*=1.+(g-.5)*.42*k;
      }
      diffuseColor.rgb=diffuseColor.rgb*uGain*uTint+diffuseColor.rgb*uFlash*vec3(.7,.8,1.2)+uFlash*.012;`);
  };
  bakedMats.push(m);
  return m;
}

const REFLECT_SHADER = {
  name: 'WetReflection',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uStrength: { value: .35 }, uTime: { value: 0 }, uRain: { value: 0 }, uRough: { value: 1 } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main(){ vUv=textureMatrix*vec4(position,1.); vW=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float uStrength,uTime,uRain,uRough; varying vec4 vUv; varying vec3 vW;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){
      vec2 p=vW.xz;
      vec2 off=(vec2(n(p*vec2(3.,40.)),n(p*vec2(3.,40.)+7.))-.5)*.012*uRough;
      // rain ripples
      vec2 cell=floor(p*6.); vec2 f=fract(p*6.)-.5; float rip=0.;
      float t=fract(uTime*.9+h(cell)); float d=length(f-(vec2(h(cell+1.),h(cell+2.))-.5)*.5);
      rip=sin((d-t*.5)*60.)*exp(-d*9.)*(1.-t)*uRain*step(.35,h(cell+3.));
      off+=vec2(rip)*.02;
      vec4 uv=vUv; uv.xy+=off*uv.w;
      vec3 c=vec3(0.);
      c+=texture2DProj(tDiffuse,uv).rgb*.4;
      c+=texture2DProj(tDiffuse,uv+vec4(.004,.0,0,0)*uv.w*uRough).rgb*.15;
      c+=texture2DProj(tDiffuse,uv-vec4(.004,.0,0,0)*uv.w*uRough).rgb*.15;
      c+=texture2DProj(tDiffuse,uv+vec4(.0,.009,0,0)*uv.w*uRough).rgb*.15;
      c+=texture2DProj(tDiffuse,uv-vec4(.0,.009,0,0)*uv.w*uRough).rgb*.15;
      float streak=.55+.45*n(p*vec2(1.5,.4));
      gl_FragColor=vec4(c*color*uStrength*streak,1.);
    }`,
};
function addReflector(group, w, h, pos, strength, rough = 1, scale = .5) {
  const pr = Math.min(devicePixelRatio, 2) * scale;
  const r = new Reflector(new THREE.PlaneGeometry(w, h), { clipBias: .002, textureWidth: innerWidth * pr, textureHeight: innerHeight * pr, color: 0xffffff, shader: REFLECT_SHADER, multisample: 0 });
  r.rotation.x = -Math.PI / 2; r.position.copy(pos);
  r.material.transparent = true; r.material.blending = THREE.AdditiveBlending; r.material.depthWrite = false;
  r.material.uniforms.uStrength.value = strength; r.material.uniforms.uRough.value = rough;
  r.userData.base = strength; r.userData.scale = scale; r.userData.primary = w > 9;
  r.renderOrder = 1;
  group.add(r); reflectors.push(r);
  return r;
}

// ------------------------------------------------------------------ katana materials
function buildMaterials() {
  const silk = TX.silkMaps(), same = TX.samegawaMaps(), ham = TX.hammeredMaps(), eng = TX.engravingMaps(), cord = TX.cordMaps();
  M.steel = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 1, envMapIntensity: 1.1 });
  M.lacquer = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 1, clearcoat: 1, clearcoatRoughness: .025, emissive: 0xffffff, envMapIntensity: .55, iridescence: .1, iridescenceIOR: 1.6 });
  M.silk = new THREE.MeshPhysicalMaterial({ color: 0x1d3fb0, roughness: .62, sheen: 1, sheenRoughness: .35, sheenColor: new THREE.Color('#6d8cff'), normalMap: silk.normal, normalScale: new THREE.Vector2(.9, .9), aoMap: silk.ao, envMapIntensity: .9 });
  M.cord = new THREE.MeshPhysicalMaterial({ color: 0x0c1733, roughness: .7, sheen: .8, sheenRoughness: .4, sheenColor: new THREE.Color('#4a63b8'), normalMap: cord.normal, normalScale: new THREE.Vector2(1.1, 1.1) });
  M.samegawa = new THREE.MeshStandardMaterial({ color: 0xe9e2cf, roughness: .55, normalMap: same.normal, normalScale: new THREE.Vector2(1.2, 1.2), aoMap: same.ao });
  M.fitting = new THREE.MeshPhysicalMaterial({ color: 0xf2f0ec, metalness: 1, roughness: .22, normalMap: eng.normal, normalScale: new THREE.Vector2(.9, .9), aoMap: eng.ao, envMapIntensity: 1.35 });
  M.gilt = new THREE.MeshPhysicalMaterial({ color: 0xffc36a, metalness: 1, roughness: .2, envMapIntensity: 1.5 });
  M.iron = new THREE.MeshStandardMaterial({ color: 0x17181b, metalness: .85, roughness: .5, normalMap: ham.normal, normalScale: new THREE.Vector2(1.3, 1.3), roughnessMap: ham.rough, envMapIntensity: 1.2 });
  M.wood = new THREE.MeshStandardMaterial({ map: TX.woodMaps().map, roughness: .7 });
  M.tang = new THREE.MeshStandardMaterial({ map: TX.tangMaps().map, metalness: .55, roughness: .75 });
  M.horn = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, roughness: .25, clearcoat: .8, clearcoatRoughness: .1 });
  M.inner = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: .95 });
  M.bamboo = new THREE.MeshStandardMaterial({ color: 0xb8975e, roughness: .55 });
}
let texTimer;
function applyCfg(regen = true) {
  const c = S.cfg;
  for (const [k, n] of Object.entries(tsubaNodes)) if (n) n.visible = (c.tsubaDesign || 'infinity') === k;
  const metal = (m, key) => { const k = METALS[key] || METALS.silver; m.color.set(k.color); m.roughness = k.rough; };
  metal(M.fitting, c.fittings); metal(M.gilt, c.menuki);
  const tk = METALS[c.tsuba] || METALS.iron; M.iron.color.set(tk.color); M.iron.metalness = tk.metal ?? .9; M.iron.roughness = tk.rough + .15;
  const ito = COLORS[c.ito] || COLORS.cobalt; M.silk.color.set(ito.hex); M.silk.sheenColor.set(ito.sheen);
  const sg = COLORS[c.sageo] || COLORS.midnight; M.cord.color.set(sg.hex); M.cord.sheenColor.set(sg.sheen);
  M.samegawa.color.set(c.same === 'black' ? '#1d1d20' : c.same === 'indigo' ? '#28324f' : '#ebe4d2');
  M.lacquer.emissiveIntensity = .05 + 2.2 * c.luminous;
  if (!regen) return;
  clearTimeout(texTimer);
  texTimer = setTimeout(() => {
    const b = TX.bladeMaps(c.hamon, { polish: c.polish, engraving: c.engraving });
    M.steel.map?.dispose(); M.steel.roughnessMap?.dispose();
    M.steel.map = b.map; M.steel.roughnessMap = b.rough; M.steel.metalnessMap = b.rough; M.steel.needsUpdate = true;
    const s = TX.sayaMaps(c);
    M.lacquer.map?.dispose(); M.lacquer.emissiveMap?.dispose(); M.lacquer.roughnessMap?.dispose();
    M.lacquer.map = s.map; M.lacquer.emissiveMap = s.emissive; M.lacquer.roughnessMap = s.mr; M.lacquer.metalnessMap = s.mr; M.lacquer.needsUpdate = true;
  }, 30);
}

// ------------------------------------------------------------------ load
function progress(p, label) { $('#loadbar i').style.width = (p * 100).toFixed(0) + '%'; if (label) $('#loadlabel').textContent = label; }
async function load() {
  progress(.05, 'Reading the Blender master');
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const glb = b64(ASSETS.glb);
  const gltf = await loader.parseAsync(glb.buffer, '');
  progress(.35, 'Unpacking Cycles light');
  const texLoader = new THREE.TextureLoader();
  const lm = {};
  for (const k of ['atelier', 'vault', 'atelier_dawn']) {
    const t = await texLoader.loadAsync('data:image/jpeg;base64,' + ASSETS['lm_' + k]);
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
    lm[k] = t;
  }
  progress(.55, 'Capturing reflections');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const hdr = new HDRLoader(); hdr.setDataType(THREE.FloatType);
  for (const k of ['atelier', 'vault', 'atelier_dawn']) {
    const data = hdr.parse(b64(ASSETS['hdr_' + k]).buffer);
    for (let i = 0; i < data.data.length; i += 4) { const m = Math.max(data.data[i], data.data[i + 1], data.data[i + 2]); if (m > 4) { const f = (4 + Math.log(m - 3)) / m; data.data[i] *= f; data.data[i + 1] *= f; data.data[i + 2] *= f; } }
    const t = new THREE.DataTexture(data.data, data.width, data.height, THREE.RGBAFormat, data.type);
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.LinearSRGBColorSpace; t.flipY = true; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
    envMaps[k] = pmrem.fromEquirectangular(t).texture;
  }
  envMaps.studio = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  progress(.7, 'Forging the finish');
  buildMaterials();
  applyCfg(false);
  { const b = TX.bladeMaps(S.cfg.hamon, S.cfg); Object.assign(M.steel, { map: b.map, roughnessMap: b.rough, metalnessMap: b.rough }); const s = TX.sayaMaps(S.cfg); Object.assign(M.lacquer, { map: s.map, emissiveMap: s.emissive, roughnessMap: s.mr, metalnessMap: s.mr }); }
  progress(.85, 'Arranging the atelier');
  const root = gltf.scene;
  const nodes = []; root.traverse(o => nodes.push(o));
  for (const o of nodes) {
    const ex = o.userData || {};
    if (o.name === 'KATANA') katana = o;
    if (o.name === 'BLADE_ASSEMBLY') bladeAsm = o;
    if (o.name === 'SAYA_ASSEMBLY') sayaAsm = o;
    if (!o.isMesh) continue;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (ex.baked) {
      o.material = bakedMaterial(lm[ex.baked]);
      if (ex.baked === 'atelier') { bakedAtelier = o.material; lightmaps.night = lm.atelier; lightmaps.dawn = lm.atelier_dawn; }
      (ex.baked === 'atelier' ? world.atelier : world.vault).attach(o);
    } else if (ex.emit) {
      const inVault = o.name.startsWith('VAULT') || o.name.startsWith('DYN_v');
      const c = new THREE.Color(...ex.emit).multiplyScalar(ex.strength * (inVault ? .38 : .8));
      o.material = new THREE.MeshBasicMaterial({ color: c });
      o.userData.baseColor = c.clone();
      if (Math.abs(ex.strength - 3.2) < .01) moonMesh = o;
      const isA = o.name.startsWith('ATELIER') || (o.name.startsWith('DYN') ? false : !o.name.startsWith('VAULT'));
      (o.name.startsWith('VAULT') || o.name.startsWith('DYN_v') ? world.vault : isA ? world.atelier : world.vault).attach(o);
      if (ex.dyn) {
        if (['spin', 'spin2', 'core'].includes(ex.dyn)) { o.geometry.computeBoundingBox(); const ctr = o.geometry.boundingBox.getCenter(new THREE.Vector3()); o.geometry.translate(-ctr.x, -ctr.y, -ctr.z); o.position.add(ctr); }
        if (ex.dyn === 'fall') { o.material = fallMaterial(c); }
        dyn.push({ o, kind: ex.dyn, seed: Math.random() * 10 });
      }
    } else if (ex.nobake) {
      if (ex.mat === 'water') {
        o.material = new THREE.MeshPhysicalMaterial({ color: 0x02060a, roughness: .04, metalness: 0, envMapIntensity: 1.6, clearcoat: 1 });
      } else {
        const fl = ex.mat === 'pine' ? flowerPoints(o.geometry, 'pine') : flowerPoints(o.geometry);
        (o.name.startsWith('VAULT') ? world.vault : world.atelier).add(fl);
        o.visible = false; o.material = new THREE.MeshBasicMaterial();
      }
      (o.name.startsWith('VAULT') ? world.vault : world.atelier).attach(o);
    } else {
      // katana part
      const name = mats[0]?.name || '';
      o.material = M[name] || M.inner;
      o.castShadow = true;
      let part = o.name;
      if (part === 'blade_tang') part = 'blade';
      if (part.startsWith('tsuba')) part = 'tsuba';
      if (part === 'sageo_tips') part = 'sageo';
      if (part === 'saya_inner') part = 'saya';
      o.userData.part = part;
      (partMeshes[part] ||= []).push(o);
    }
  }
  scene.add(katana);
  for (const p of Object.keys(PARTS)) {
    const names = p === 'tsuba' ? ['tsuba', 'tsuba_sakura', 'tsuba_nami'] : [p];
    partNodes[p] = names.map(nm => katana.getObjectByName(nm)).filter(Boolean);
    for (const n of partNodes[p]) n.userData.rest = n.position.clone();
  }
  tsubaNodes = { infinity: katana.getObjectByName('tsuba'), sakura: katana.getObjectByName('tsuba_sakura'), nami: katana.getObjectByName('tsuba_nami') };
  // floors that shine: the wet timber, the table, the obsidian vault floor
  addReflector(world.atelier, 10.4, 7.6, new THREE.Vector3(0, .0012, .16), .32, 1.4, coarse ? .35 : .5);
  addReflector(world.atelier, 2.26, 1.12, new THREE.Vector3(0, .4512, 0), .22, 1.0, coarse ? .35 : .5);
  addReflector(world.atelier, 7, 4.6, new THREE.Vector3(-1.2, -.244, -7.3), .8, .35, .3);
  addReflector(world.vault, 28, 26, new THREE.Vector3(0, .0015, -7), .3, .6, coarse ? .35 : .5);
  buildLights();
  progress(1, 'Ready');
}

let flowerTex, tuftTex;
function flowerPoints(geo, kind = 'flower') {
  flowerTex ||= TX.spriteTex('flower'); tuftTex ||= TX.spriteTex('tuft');
  const pine = kind === 'pine', step = pine ? 2 : 9;
  const src = geo.attributes.position, n = Math.floor(src.count / step), p = new Float32Array(n * 3), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) { const k = i * step; p[i * 3] = src.getX(k); p[i * 3 + 1] = src.getY(k); p[i * 3 + 2] = src.getZ(k); sd[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uWind: { value: .1 }, uColor: { value: new THREE.Color(pine ? '#1d3524' : '#f2b9c8') }, uTex: { value: pine ? tuftTex : flowerTex }, uPx: { value: 1 }, uBig: { value: pine ? 3.2 : 1 } }]),
    vertexShader: `attribute float seed; uniform float uTime,uWind,uPx,uBig; varying float vS;
#include <fog_pars_vertex>
void main(){ vec3 q=position; float k=clamp(q.y*.3,0.,1.); q.x+=sin(uTime*1.3+q.x*1.7+q.z)*.012*k*(1.+uWind*5.); q.z+=cos(uTime*1.1+q.x)*.008*k*(1.+uWind*5.);
        vec4 mvPosition=modelViewMatrix*vec4(q,1.); gl_Position=projectionMatrix*mvPosition; gl_PointSize=uBig*(.022+.014*seed)*mix(1.,4.5,smoothstep(2.5,5.,length(position.xz)))*uPx*(700./-mvPosition.z); vS=seed;
#include <fog_vertex>
}`,
    fragmentShader: `uniform vec3 uColor; uniform sampler2D uTex; uniform float uTime; varying float vS;
#include <fog_pars_fragment>
void main(){ vec2 c=gl_PointCoord-.5; float a=vS*6.28; c=mat2(cos(a),-sin(a),sin(a),cos(a))*c; vec4 t=texture2D(uTex,c+.5); if(t.a<.05) discard;
        gl_FragColor=vec4(uColor*t.rgb*(.45+.25*vS),t.a);
#include <fog_fragment>
}`,
  });
  m.userData.u = m.uniforms; m.color = m.uniforms.uColor.value;
  if (pine) { m.userData.pine = true; pines.push(m); } else foliage.push(m);
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}
function fallMaterial(c) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: c } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vW;
      void main(){ float s=fract(vW.y*.9+uTime*.6+sin(vW.x*37.)*.5); float a=pow(s,6.)*1.4+.12; gl_FragColor=vec4(uColor*a,1.); }`,
  });
}
function swayify(m) {
  m.userData.u = { uTime: { value: 0 }, uWind: { value: .1 } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime,uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wp=modelMatrix*vec4(transformed,1.);
        float k=clamp(wp.y*.25,0.,1.);
        transformed.x+=sin(uTime*1.3+wp.x*1.7+wp.z)*.012*k*(1.+uWind*5.);
        transformed.z+=cos(uTime*1.1+wp.x)*.008*k*(1.+uWind*5.);`);
  };
}

// ------------------------------------------------------------------ lights (dynamic, for the katana)
const L = {};
function buildLights() {
  L.key = new THREE.RectAreaLight('#fff1dc', 7, 1.4, .45); L.key.position.set(.05, 2.25, .55); L.key.lookAt(0, .66, 0);
  L.rim = new THREE.RectAreaLight('#8fb6ff', 5, 1.0, .3); L.rim.position.set(-.4, 1.5, -1.4); L.rim.lookAt(0, .66, 0);
  L.front = new THREE.RectAreaLight('#ffe2c4', 1.2, 1.2, .8); L.front.position.set(.3, .95, 1.6); L.front.lookAt(0, .7, 0);
  L.andon = new THREE.PointLight('#ff9d52', 1.6, 4, 2); L.andon.position.set(1.75, .4, .35);
  L.forge = new THREE.PointLight('#ff6a1c', 5, 7, 2); L.forge.position.set(3.85, .9, -1.7);
  L.portal = new THREE.PointLight('#40e8ff', 2.5, 20, 1.5); L.portal.position.set(-.55, 2.35, -11.9);
  L.shadow = new THREE.SpotLight('#fff3e0', 6, 5, .5, .7, 1.5); L.shadow.position.set(.15, 2.3, .35); L.shadow.target.position.set(0, .45, 0);
  L.shadow.castShadow = true; L.shadow.shadow.mapSize.set(2048, 2048); L.shadow.shadow.bias = -.0002; L.shadow.shadow.radius = 6; L.shadow.shadow.camera.near = .5; L.shadow.shadow.camera.far = 4;
  L.vKey = new THREE.RectAreaLight('#cfeaff', 9, 3, 1.4); L.vKey.position.set(0, 5, .2); L.vKey.lookAt(0, .6, 0);
  L.vAmber = new THREE.PointLight('#ff8a3a', 6, 16, 1.4); L.vAmber.position.set(0, 4.1, -8.5);
  L.vCyan = new THREE.RectAreaLight('#40e8ff', 4, 2, .3); L.vCyan.position.set(0, .9, -1.4); L.vCyan.lookAt(0, .7, 0);
  L.sKey = new THREE.RectAreaLight('#ffffff', 10, 1.6, .5); L.sKey.position.set(0, 2.2, .7); L.sKey.lookAt(0, .66, 0);
  L.sRim = new THREE.RectAreaLight('#bcd6ff', 7, 1.6, .3); L.sRim.position.set(0, 1.2, -1.5); L.sRim.lookAt(0, .66, 0);
  world.atelier.add(L.key, L.rim, L.front, L.andon, L.forge, L.portal);
  world.vault.add(L.vKey, L.vAmber, L.vCyan);
  world.studio.add(L.sKey, L.sRim);
  scene.add(L.shadow, L.shadow.target);
  // soft contact shadow receivers
  const sm = new THREE.ShadowMaterial({ opacity: .45 });
  const t1 = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.1), sm); t1.rotation.x = -Math.PI / 2; t1.position.set(0, .4508, 0); t1.receiveShadow = true; world.atelier.add(t1);
  const t2 = new THREE.Mesh(new THREE.PlaneGeometry(1.85, .75), sm); t2.rotation.x = -Math.PI / 2; t2.position.set(0, .4405, 0); t2.receiveShadow = true; world.vault.add(t2);
  const studioBg = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vP; void main(){ float y=normalize(vP).y; vec3 c=mix(vec3(.004,.006,.009),vec3(.03,.04,.05),smoothstep(-.2,.6,y)); gl_FragColor=vec4(c,1.);}' }));
  world.studio.add(studioBg);
  // night sky: gradient, stars, moon halo, weather clouds lit by lightning
  sky = new THREE.Mesh(new THREE.SphereGeometry(95, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uDawn: { value: 0 }, uSun: { value: new THREE.Vector3(-.55, .16, -1).normalize() }, uTime: { value: 0 }, uCloud: { value: .15 }, uFlash: { value: 0 }, uMoon: { value: new THREE.Vector3(-3.2, 6.8, -42).normalize() }, uSnow: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }',
    fragmentShader: `uniform float uTime,uCloud,uFlash,uSnow,uDawn; uniform vec3 uMoon,uSun; varying vec3 vD;
      float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453),b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5453),c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5453),d=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5453);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
      float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}
      void main(){
        vec3 d=normalize(vD); float y=max(d.y,-.1);
        vec3 col=mix(vec3(.018,.03,.055),vec3(.002,.004,.012),smoothstep(0.,.6,y));
        float sd=max(dot(d,uSun),0.);
        vec3 dawnCol=mix(vec3(.95,.52,.32),vec3(.10,.17,.34),smoothstep(-.02,.45,y))+vec3(1.,.62,.35)*pow(sd,8.)*.6+vec3(1.,.8,.55)*pow(sd,900.)*6.;
        col=mix(col,dawnCol,uDawn);
        float md=max(dot(d,uMoon),0.)*(1.-uDawn);
        col+=vec3(.25,.33,.5)*pow(md,90.)*.9+vec3(.12,.16,.26)*pow(md,12.)*.5;
        vec3 sp=floor(d*420.); float st=step(.9975,h(sp))*smoothstep(.02,.25,y);
        col+=vec3(.8,.85,1.)*st*(.55+.45*sin(uTime*2.+h(sp+1.)*40.))*(1.-uCloud)*1.4*(1.-uDawn);
        vec2 cp=d.xz/max(y+.15,.05)*.9+vec2(uTime*.004,uTime*.0015);
        float c=smoothstep(.45-uCloud*.25,.95,fbm(cp))*smoothstep(-.02,.2,y);
        vec3 ccol=mix(vec3(.02,.03,.05),vec3(.14,.17,.24),pow(md,6.))+uFlash*vec3(.6,.7,1.);
        ccol=mix(ccol,mix(vec3(.55,.32,.3),vec3(.95,.6,.45),pow(sd,3.)),uDawn);
        col=mix(col,ccol,c*min(1.,uCloud*1.3+.15));
        col+=uFlash*.08*vec3(.5,.6,1.)*smoothstep(0.,.5,y);
        gl_FragColor=vec4(col,1.);
      }`,
  }));
  sky.renderOrder = -1; world.atelier.add(sky);
  // layered mountain ridges fading into the night air
  const ridgeCols = ['#05080e', '#080d16', '#0c1320', '#111a2a'];
  for (let k = 0; k < 4; k++) {
    const N = 220, pos = [], idx = [], z = -24 - k * 13;
    for (let i = 0; i <= N; i++) {
      const x = -80 + 160 * i / N, t = x * .06 + k * 3.1;
      const hgt = (2.5 + k * 2.2) * (.55 + .45 * Math.sin(t) * Math.sin(t * .37 + 1) + .25 * Math.sin(t * 2.7) + .12 * Math.sin(t * 7.3)) + k * 1.2;
      pos.push(x, -2, z, x, hgt, z + Math.sin(i) * .5);
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: ridgeCols[k], fog: false, side: THREE.DoubleSide }));
    world.atelier.add(m); ridges.push(m);
  }
}

// ------------------------------------------------------------------ environment switching, seasons, weather
function setEnv(env, instant = false) {
  S.env = env;
  for (const k in world) world[k].visible = k === env;
  scene.environment = envMaps[env === 'atelier' && S.time === 'dawn' ? 'atelier_dawn' : env];
  scene.environmentRotation.set(0, -Math.PI / 2, 0);
  scene.background = env === 'studio' ? null : new THREE.Color(env === 'vault' ? '#010203' : '#02040a');
  scene.environmentIntensity = env === 'vault' ? 1.1 : env === 'studio' ? .9 : .75;
  fx.setEnv(env);
  applyWeather();
  document.body.dataset.env = env;
  $('#envName').textContent = { atelier: 'The Atelier', vault: 'The Infinite Vault', studio: 'Obsidian Study' }[env];
  $$('[data-env]').forEach(b => b.classList.toggle('active', b.dataset.env === env));
  $('#portalBtn').innerHTML = env === 'vault' ? '<i></i>Return to the atelier' : '<i></i>Enter the ring';
  sound.setScene(env, S.weather, S.season);
}
function setTime(t) {
  S.time = t;
  const dawn = t === 'dawn';
  if (bakedAtelier) { bakedAtelier.map = dawn ? lightmaps.dawn : lightmaps.night; bakedAtelier.needsUpdate = true; }
  if (S.env === 'atelier') scene.environment = envMaps[dawn ? 'atelier_dawn' : 'atelier'];
  if (sky) sky.material.uniforms.uDawn.value = dawn ? 1 : 0;
  if (moonMesh) moonMesh.visible = !dawn;
  ridges.forEach((m, k) => m.material.color.set(dawn ? ['#1a1520', '#2a2230', '#3d3040', '#554355'][k] : ['#05080e', '#080d16', '#0c1320', '#111a2a'][k]));
  if (L.rim) { L.rim.color.set(dawn ? '#ffb27a' : '#8fb6ff'); L.key.color.set(dawn ? '#ffe6cc' : '#fff1dc'); }
  fx.setTime(dawn);
  $$('[data-time]').forEach(b => b.classList.toggle('active', b.dataset.time === t));
  applyWeather();
}
function applyWeather() {
  const se = SEASONS[S.season], we = WEATHERS[S.weather];
  foliage.forEach(m => { m.color.set(S.weather === 'snow' || S.season === 'winter' ? '#eef2f7' : se.foliage); m.userData.u.uWind.value = we.wind; });
  pines.forEach(m => m.color.set(S.weather === 'snow' || S.season === 'winter' ? '#6f7c86' : S.season === 'autumn' ? '#2a3a22' : '#1d3524'));
  fx.setSeason(S.season, S.weather);
  const fogCol = new THREE.Color(S.env === 'vault' ? '#020a0e' : we.fog);
  if (S.env === 'atelier' && S.time === 'dawn') fogCol.lerp(new THREE.Color('#4a3a3e'), .7);
  scene.fog = S.env === 'studio' ? null : new THREE.FogExp2(fogCol, S.env === 'vault' ? .028 : we.density);
  const tint = new THREE.Color(...se.tint).multiply(new THREE.Color(...we.tint));
  bakedMats.forEach(m => m.userData.u.uTint.value.copy(tint));
  reflectors.forEach(r => { r.material.uniforms.uStrength.value = r.userData.base * (S.env === 'atelier' ? we.wet : 1); r.material.uniforms.uRain.value = S.env === 'atelier' ? we.rain : 0; });
  $$('[data-season]').forEach(b => b.classList.toggle('active', b.dataset.season === S.season));
  $$('[data-weather]').forEach(b => b.classList.toggle('active', b.dataset.weather === S.weather));
  sound.setScene(S.env, S.weather, S.season);
  saveWorld();
}

// ------------------------------------------------------------------ katana choreography
const R = 3.5, DRAW = .79;
const EXPLODE = {
  blade: [-.03, 0, 0], habaki: [.05, -.05, .004], seppa_front: [.1, -.02, 0], tsuba: [.155, .0, 0], seppa_back: [.21, -.02, 0], fuchi: [.265, 0, 0],
  tsuka: [.31, 0, 0], samegawa: [.31, .075, -.012], ito: [.31, .15, .02], menuki_front: [.31, -.05, .05], menuki_back: [.31, -.085, -.05], mekugi: [.27, -.12, .03], kashira: [.41, 0, 0],
  saya: [0, -.03, 0], koiguchi: [.07, -.03, 0], kojiri: [-.08, -.03, 0], kurigata: [0, .02, .07], sageo: [0, -.1, .03],
};
const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), vA = new THREE.Vector3(), vB = new THREE.Vector3(), zAxis = new THREE.Vector3(0, 0, 1);
function pose(time) {
  const d = S.d, p1 = clamp(d / .7), p2 = smooth(.7, 1, d);
  const ds = DRAW * ease(p1), a = ds / R;
  // exit pose: rotate about the sori arc centre (0,R,0) in katana-local space
  vA.set(R * Math.sin(a), R - R * Math.cos(a), 0);
  qA.setFromAxisAngle(zAxis, a);
  const bob = S.mode !== 'sheathed' && !reduced && S.ambience ? Math.sin(time * .9) * .0025 : 0;
  vB.set(.02, .128 + bob, -.004 + .0 * p2);
  qB.setFromAxisAngle(zAxis, .0);
  bladeAsm.position.copy(vA).lerp(vB, ease(p2));
  bladeAsm.quaternion.copy(qA).slerp(qB, ease(p2));
  sayaAsm.position.set(0, 0, 0);
  const e = S.e;
  for (const [p, off] of Object.entries(EXPLODE)) {
    for (const n of partNodes[p] || []) { const r = n.userData.rest; n.position.set(r.x + off[0] * e, r.y + off[1] * e, r.z + off[2] * e); }
  }
  katana.position.copy(HOME).add(vA.set(-.14 * e, 0, 0));
}
// iai: draw, rise, a diagonal cut, zanshin, chiburi, and a slow noto back into the saya
const IAI_A = DRAW / R, IAI_EXIT = [R * Math.sin(DRAW / R), R - R * Math.cos(DRAW / R), 0];
const IAI = [
  [0, null, null],
  [.3, IAI_EXIT, [0, 0, IAI_A]],
  [.62, [.516, .608, .252], [0, .5, -1.0]],
  [.84, [.376, .158, .244], [0, .75, .42]],
  [1.3, [.39, .16, .25], [0, .72, .38]],
  [1.5, [.45, .2, .2], [0, .5, .15]],
  [2.2, IAI_EXIT, [0, 0, IAI_A]],
  [3.0, [0, 0, 0], [0, 0, 0]],
];
let iai = null;
const trail = { n: 48, pts: [], mesh: null };
function startIai() {
  if (iai || !katana) return;
  clearFocus(); S.eT = 0; S.e = 0; S.spin = false; S.cinematic = false; syncTools(); hideIntro();
  iai = { t: 0, p0: bladeAsm.position.clone(), q0: bladeAsm.quaternion.clone(), swished: false };
  const tg = new THREE.Vector3(.3, .86, .15), sh = new THREE.Vector3(...(S.env === 'vault' ? [.6, 1.2, 2.3] : [.55, 1.05, 2.05]));
  if (camera.aspect < 1) sh.sub(tg).multiplyScalar(1.9).add(tg);
  flyTo(sh, tg, 1.0);
  trail.pts = [];
}
const tq = new THREE.Quaternion(), te = new THREE.Euler();
function iaiPose(dt) {
  iai.t += dt;
  const t = iai.t;
  let i = 1; while (i < IAI.length - 1 && t > IAI[i][0]) i++;
  const [t0, p0, r0] = IAI[i - 1], [t1, p1, r1] = IAI[i];
  const k = ease(clamp((t - t0) / (t1 - t0)));
  const P0 = p0 ? vA.set(...p0) : vA.copy(iai.p0), Q0 = r0 ? qA.setFromEuler(te.set(...r0)) : qA.copy(iai.q0);
  bladeAsm.position.copy(P0).lerp(vB.set(...p1), k);
  bladeAsm.quaternion.copy(Q0).slerp(tq.setFromEuler(te.set(...r1)), k);
  if (!iai.swished && t > .6) { iai.swished = true; sound.swish(); }
  if (t >= IAI[IAI.length - 1][0]) { iai = null; S.d = S.dT = 0; setMode('sheathed', true); syncMode(); }
}
function updateTrail() {
  if (!trail.mesh) {
    const g = new THREE.BufferGeometry(), n = trail.n;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const a = new Float32Array(n * 2), ed = new Float32Array(n * 2), idx = [];
    for (let i = 0; i < n; i++) { a[i * 2] = a[i * 2 + 1] = i / (n - 1); ed[i * 2] = 1; ed[i * 2 + 1] = 0; if (i < n - 1) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    g.setAttribute('age', new THREE.BufferAttribute(a, 1)); g.setAttribute('edge', new THREE.BufferAttribute(ed, 1)); g.setIndex(idx);
    trail.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uFade: { value: 0 } },
      vertexShader: 'attribute float age,edge; varying float vA,vE; void main(){ vA=age; vE=edge; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uFade; varying float vA,vE; void main(){ float a=pow(vA,3.)*uFade*(.06+pow(vE,6.)*1.3); gl_FragColor=vec4(mix(vec3(.3,.8,1.),vec3(1.),pow(vE,12.))*a,1.); }' }));
    trail.mesh.frustumCulled = false; scene.add(trail.mesh);
  }
  const on = iai && iai.t > .6 && iai.t < .98;
  const tip = bladeAsm.localToWorld(new THREE.Vector3(-.69, .06, 0)), mid = bladeAsm.localToWorld(new THREE.Vector3(-.5, .035, 0));
  if (on) { trail.pts.push([tip, mid]); if (trail.pts.length > trail.n) trail.pts.shift(); }
  else if (trail.pts.length) trail.pts.shift();
  const pos = trail.mesh.geometry.attributes.position, n = trail.n, L2 = trail.pts.length;
  for (let i = 0; i < n; i++) {
    const src = trail.pts[Math.max(0, L2 - n + i)] || trail.pts[0];
    if (!src) { pos.setXYZ(i * 2, 0, -99, 0); pos.setXYZ(i * 2 + 1, 0, -99, 0); continue; }
    pos.setXYZ(i * 2, src[0].x, src[0].y, src[0].z); pos.setXYZ(i * 2 + 1, src[1].x, src[1].y, src[1].z);
  }
  pos.needsUpdate = true;
  trail.mesh.material.uniforms.uFade.value = L2 ? Math.min(1, L2 / 8) : 0;
}
function setMode(m, quiet = false) {
  S.mode = m; S.dT = m === 'sheathed' ? 0 : 1; S.eT = m === 'exploded' ? 1 : 0;
  $$('[data-mode]').forEach(b => { b.classList.toggle('active', b.dataset.mode === m); b.setAttribute('aria-pressed', b.dataset.mode === m); });
  const cap = { sheathed: ['01', 'Quiet, complete.', 'THE SHEATHED FORM'], drawn: ['02', 'An edge, remembered.', 'THE DRAWN BLADE'], exploded: ['03', 'One life, many hands.', 'EIGHTEEN PARTS'] }[m];
  $('#capIdx').textContent = cap[0]; $('#capTitle').textContent = cap[1]; $('#capSub').textContent = cap[2];
  if (!S.sel && !quiet) frame(m === 'exploded' ? 'exploded' : 'whole');
  if (!quiet) hideIntro();
}

// ------------------------------------------------------------------ camera
const tween = { active: false };
function flyTo(pos, target, dur = 1.4) {
  Object.assign(tween, { active: true, t: 0, dur: reduced ? .01 : dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone() });
}
function katanaCenter() { const b = new THREE.Box3(); for (const k in partMeshes) for (const m of partMeshes[k]) b.expandByObject(m); return b.getCenter(new THREE.Vector3()); }
const SHOTS = {
  atelier: { pos: [.2, .95, 1.22], target: [-.02, .71, -.05] },
  vault: { pos: [.45, 1.25, 2.35], target: [0, 1.05, -.8] },
  studio: { pos: [.1, .8, 1.3], target: [0, .7, 0] },
};
function frame(kind) {
  const sh = SHOTS[S.env];
  let tgt = new THREE.Vector3(...sh.target), pos = new THREE.Vector3(...sh.pos);
  if (kind === 'exploded') { tgt.set(.1, .76, 0); pos.set(.16, 1.12, 2.05); }
  if (kind === 'drawn') { tgt.y += .05; }
  if (camera.aspect < 1) { tgt.x += .07; pos.x += .07; pos.sub(tgt).multiplyScalar(2.15).add(tgt); pos.y += .25; }
  flyTo(pos, tgt);
}
function focusPart(p, point) {
  if (!PARTS[p]) return clearFocus();
  if (p === 'blade' && S.d < .99) { setMode('drawn'); setTimeout(() => focusPart(p, point), 1100); return; }
  S.sel = p;
  const b = new THREE.Box3(); for (const m of partMeshes[p].filter(shown)) b.expandByObject(m);
  const c = point || b.getCenter(new THREE.Vector3());
  const dist = PARTS[p].dist * (camera.aspect < 1 ? 1.8 : 1);
  const dir = camera.position.clone().sub(controls.target).normalize();
  if (PARTS[p].side) dir.set(...PARTS[p].side).normalize();
  flyTo(c.clone().add(dir.multiplyScalar(dist)), c, 1.2);
  $('#insTitle').textContent = PARTS[p].label; $('#insJp').textContent = PARTS[p].jp; $('#insSub').textContent = PARTS[p].sub; $('#insText').textContent = PARTS[p].text;
  $('#inspector').hidden = false; $('#focusSelect').value = p;
  document.body.classList.add('inspecting');
  outline.selectedObjects = partMeshes[p].filter(shown);
  hideIntro();
}
function clearFocus() {
  if (!S.sel) return;
  S.sel = ''; $('#inspector').hidden = true; $('#focusSelect').value = ''; document.body.classList.remove('inspecting'); outline.selectedObjects = [];
  frame(S.mode === 'exploded' ? 'exploded' : 'whole');
}

// ------------------------------------------------------------------ picking, hover, pulling the hilt
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let allKatanaMeshes = [];
function shown(o) { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; }
function pick(x, y) {
  const r = canvas.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(allKatanaMeshes.filter(shown), false)[0];
  return h ? { part: h.object.userData.part, point: h.point } : null;
}
const HILT = new Set(['ito', 'tsuka', 'samegawa', 'kashira', 'fuchi', 'menuki_front', 'menuki_back', 'mekugi']);
let pull = null, downAt = null, moved = 0;
canvas.addEventListener('pointerdown', e => {
  downAt = [e.clientX, e.clientY]; moved = 0;
  S.spin = false; S.cinematic = false; syncTools(); hideIntro();
  const h = pick(e.clientX, e.clientY);
  if (h && HILT.has(h.part) && S.e < .02 && !S.sel && e.button === 0) {
    const a = project(katana.localToWorld(new THREE.Vector3(0, 0, 0))), b = project(katana.localToWorld(new THREE.Vector3(.1, 0, 0)));
    const dir = [b[0] - a[0], b[1] - a[1]], ppm = Math.hypot(...dir) / .1;
    pull = { x: e.clientX, y: e.clientY, d0: S.d, dir: dir.map(v => v / (ppm * .1)), ppm };
    controls.enabled = false; canvas.setPointerCapture(e.pointerId); canvas.classList.add('pulling');
  }
});
canvas.addEventListener('pointermove', e => {
  if (downAt) moved = Math.max(moved, Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]));
  if (pull) {
    const dx = e.clientX - pull.x, dy = e.clientY - pull.y, travel = (dx * pull.dir[0] + dy * pull.dir[1]) / pull.ppm;
    S.d = S.dT = clamp(pull.d0 + travel / (DRAW / .7));
    S.mode = S.d < .01 ? 'sheathed' : 'drawn'; syncMode();
    return;
  }
  hoverAt = [e.clientX, e.clientY];
});
let hoverAt = null;
function endPull(e) {
  if (pull) { canvas.releasePointerCapture?.(e.pointerId); if (S.d > .45) setMode('drawn'); else setMode('sheathed'); pull = null; controls.enabled = true; canvas.classList.remove('pulling'); }
  downAt = null;
}
canvas.addEventListener('pointerup', e => {
  const wasPull = !!pull; endPull(e);
  if (!wasPull && moved < 4 && e.pointerType !== 'mouse') { const h = pick(e.clientX, e.clientY); if (h) focusPart(h.part, h.point); }
});
canvas.addEventListener('pointercancel', endPull);
canvas.addEventListener('pointerleave', () => { hoverAt = null; setHover(''); });
canvas.addEventListener('dblclick', e => { const h = pick(e.clientX, e.clientY); if (h) focusPart(h.part, h.point); else clearFocus(); });
function setHover(p, x, y) {
  const tip = $('#tip');
  if (p !== S.hover) { S.hover = p; if (!S.sel) outline.selectedObjects = p ? partMeshes[p].filter(shown) : []; canvas.style.cursor = p ? (HILT.has(p) && S.d < .99 && !S.e ? 'grab' : 'pointer') : ''; }
  if (!p) { tip.style.opacity = 0; return; }
  const P = PARTS[p];
  tip.innerHTML = `<b>${P.label}</b><span>${P.jp}</span><em>${HILT.has(p) && S.d < .99 && S.e < .02 ? 'Drag to draw the blade' : 'Double-click to inspect'}</em>`;
  tip.style.transform = `translate(${x + 18}px,${y + 14}px)`; tip.style.opacity = 1;
}
function project(v) { const p = v.clone().project(camera), r = canvas.getBoundingClientRect(); return [(p.x + 1) / 2 * r.width, (1 - p.y) / 2 * r.height]; }

// ------------------------------------------------------------------ portal transition (atelier <-> vault)
let warp = null;
function travel() {
  if (warp) return;
  const to = S.env === 'vault' ? 'atelier' : 'vault';
  clearFocus();
  warp = { t: 0, to, switched: false };
  if (S.env === 'atelier') flyTo(new THREE.Vector3(-.5, 2.1, -9.5), new THREE.Vector3(-.55, 2.35, -12.2), 1.6);
  else flyTo(new THREE.Vector3(0, 4.1, -6.5), new THREE.Vector3(0, 4.1, -9), 1.6);
  sound.whoosh();
}
function updateWarp(dt) {
  if (!warp) return;
  warp.t += dt;
  const t = warp.t;
  finalPass.uniforms.uWarp.value = t < 1.6 ? smooth(.2, 1.6, t) : 1 - smooth(1.7, 3.2, t);
  if (!warp.switched && t > 1.6) {
    warp.switched = true; setEnv(warp.to);
    if (warp.to === 'vault') { camera.position.set(0, 4.1, -7.5); controls.target.set(0, 4.1, -9); }
    else { camera.position.set(-.5, 2.2, -8.5); controls.target.set(-.55, 2.3, -11); }
    const sh = SHOTS[warp.to]; flyTo(new THREE.Vector3(...sh.pos), new THREE.Vector3(...sh.target), 2.2);
    toast(warp.to === 'vault' ? 'Every life remembers the blade.' : 'Back to the forge, and the rain on the garden.');
  }
  if (t > 3.3) { warp = null; finalPass.uniforms.uWarp.value = 0; }
}

// ------------------------------------------------------------------ cinematic camera
const CINE = [
  { p: [.55, .72, .38], t: [.2, .67, 0], d: 7 },
  { p: [-.75, .8, .55], t: [-.35, .66, 0], d: 7 },
  { p: [.06, 1.1, .9], t: [0, .7, 0], d: 7 },
  { p: [.32, .73, .16], t: [.24, .67, 0], d: 6 },
];
let cine = { i: 0, t: 0 };
function updateCinematic(dt) {
  if (!S.cinematic) return;
  cine.t += dt;
  const s = CINE[cine.i % CINE.length];
  if (cine.t === dt || !tween.active && cine.t > s.d) {
    if (cine.t > s.d) { cine.i++; cine.t = 0; }
    const n = CINE[cine.i % CINE.length];
    const off = new THREE.Vector3(...n.t).sub(HOME).add(katana.position);
    flyTo(new THREE.Vector3(...n.p).add(off).sub(new THREE.Vector3(...n.t)).add(new THREE.Vector3(...n.t)), new THREE.Vector3(...n.t), 4.5);
  }
  if (tween.active) return;
  camera.position.x += Math.sin(cine.t * .3) * .0004;
}

// ------------------------------------------------------------------ quality & resize
function resize() {
  const w = innerWidth, h = innerHeight;
  const pr = Math.min(devicePixelRatio || 1, S.quality === 'ultra' ? 2.5 : S.quality === 'high' ? 2 : 1.35);
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  composer.setPixelRatio(pr); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w / h < 1 ? 46 : 30; camera.updateProjectionMatrix();
  finalPass.uniforms.uRes.value.set(w * pr, h * pr);
  fx.setPixelRatio(pr);
  for (const r of reflectors) r.getRenderTarget().setSize(w * pr * r.userData.scale, h * pr * r.userData.scale);
  bloom.resolution.set(w * .5, h * .5);
}
function applyQuality() {
  const q = S.quality;
  renderer.shadowMap.enabled = q !== 'balanced';
  L.shadow && (L.shadow.castShadow = q !== 'balanced');
  reflectors.forEach((r, i) => r.visible = q !== 'balanced' || r.userData.primary);
  bokeh.enabled = S.dof && q !== 'balanced';
  outline.enabled = !coarse;
  resize();
}

// ------------------------------------------------------------------ UI
let toastT;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2800); }
function hideIntro() { document.body.classList.add('engaged'); }
function syncMode() {
  $$('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === S.mode));
  const r = $('#drawRange'); if (document.activeElement !== r) r.value = S.d * 100;
  r.style.setProperty('--p', (S.d * 100).toFixed(1) + '%'); $('#drawVal').textContent = Math.round(S.d * 100) + '%';
}
function syncTools() { $('#spinBtn').classList.toggle('active', S.spin); $('#cineBtn').classList.toggle('active', S.cinematic); }

function buildUI() {
  $$('[data-mode]').forEach(b => b.onclick = () => { clearFocus(); setMode(b.dataset.mode); });
  $('#drawRange').oninput = e => { clearFocus(); S.eT = 0; S.d = S.dT = e.target.value / 100; S.mode = S.d < .01 ? 'sheathed' : 'drawn'; syncMode(); hideIntro(); };
  $('#focusSelect').innerHTML = '<option value="">The whole</option>' + Object.entries(PARTS).map(([k, p], i) => `<option value="${k}">${String(i + 1).padStart(2, '0')} · ${p.label}</option>`).join('');
  $('#focusSelect').onchange = e => e.target.value ? focusPart(e.target.value) : clearFocus();
  $('#closeIns').onclick = clearFocus; $('#backWhole').onclick = clearFocus;
  $('#spinBtn').onclick = () => { S.spin = !S.spin; S.cinematic = false; controls.autoRotate = S.spin; syncTools(); };
  $('#cineBtn').onclick = () => { S.cinematic = !S.cinematic; S.spin = false; controls.autoRotate = false; cine = { i: 0, t: 0 }; syncTools(); clearFocus(); if (S.cinematic && S.mode === 'sheathed') setMode('drawn'); toast(S.cinematic ? 'Cinematic camera. Touch the scene to take control.' : 'Cinematic camera off.'); };
  $('#resetBtn').onclick = () => { clearFocus(); setMode('sheathed'); frame('whole'); };
  $('#zoomIn').onclick = () => dolly(.72); $('#zoomOut').onclick = () => dolly(1 / .72);
  $('#fsBtn').onclick = async () => { try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch (_) { toast('Fullscreen is not available here.'); } };
  $('#captureBtn').onclick = () => { try { composer.render(); const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `SOKAI-${S.env}-${S.mode}.png`; a.click(); toast(`Frame saved · ${canvas.width} × ${canvas.height}`); } catch (_) { toast('Capture is unavailable in this view.'); } };
  $('#portalBtn').onclick = travel;
  $('#iaiBtn').onclick = startIai;
  $$('[data-time]').forEach(b => b.onclick = () => { setTime(b.dataset.time); toast(b.dataset.time === 'dawn' ? 'Akatsuki — first light over the garden.' : 'Yoru — the moon returns.'); });
  $('#resetWorld').onclick = () => { try { localStorage.removeItem('sokai.world'); localStorage.removeItem('sokai.view'); } catch (_) { } Object.assign(S, { season: 'spring', weather: 'clear', time: 'night', exposure: 1, lantern: 1, moon: 1, bloom: .45, grain: .5 }); ['expo', 'lanternR', 'moonR', 'bloomR', 'grainR'].forEach(id => $('#' + id)._sync?.()); setTime('night'); toast('The world returns to its first night.'); };
  window.addEventListener('pagehide', saveView); document.addEventListener('visibilitychange', () => document.hidden && saveView());
  // drawers
  const open = id => { $$('.drawer').forEach(d => d.classList.toggle('open', d.id === id && !d.classList.contains('open'))); $$('[data-drawer]').forEach(b => b.classList.toggle('active', $('#' + b.dataset.drawer).classList.contains('open'))); };
  $$('[data-drawer]').forEach(b => b.onclick = () => open(b.dataset.drawer));
  $$('.drawer .x').forEach(b => b.onclick = () => open(''));
  // dialogs
  $$('[data-dialog]').forEach(b => b.onclick = () => $('#' + b.dataset.dialog).showModal());
  $$('dialog .x').forEach(b => b.onclick = () => b.closest('dialog').close());
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  $('#componentGrid').innerHTML = Object.entries(PARTS).map(([k, p], i) => `<button data-part="${k}"><span>${String(i + 1).padStart(2, '0')}</span><strong>${p.label}</strong><em>${p.jp}</em></button>`).join('');
  $$('#componentGrid [data-part]').forEach(b => b.onclick = () => { b.closest('dialog').close(); focusPart(b.dataset.part); });
  // world
  $$('[data-env]').forEach(b => b.onclick = () => { if (b.dataset.env === S.env) return; if ((S.env === 'atelier' && b.dataset.env === 'vault') || (S.env === 'vault' && b.dataset.env === 'atelier')) travel(); else { setEnv(b.dataset.env); frame('whole'); } });
  $$('[data-season]').forEach(b => b.onclick = () => { S.season = b.dataset.season; if (S.season === 'winter' && S.weather === 'rain') S.weather = 'snow'; if (S.season !== 'winter' && S.weather === 'snow') S.weather = 'clear'; applyWeather(); toast(SEASONS[S.season].line); });
  $$('[data-weather]').forEach(b => b.onclick = () => { S.weather = b.dataset.weather; applyWeather(); toast(WEATHERS[S.weather].line); });
  const slider = (id, key, fn) => { const el = $('#' + id); el.value = S[key]; el._sync = () => el.value = S[key]; el.oninput = () => { S[key] = +el.value; fn?.(); saveWorld(); }; };
  slider('expo', 'exposure'); slider('lanternR', 'lantern'); slider('moonR', 'moon'); slider('bloomR', 'bloom'); slider('grainR', 'grain');
  $('#dofT').checked = S.dof; $('#dofT').onchange = e => { S.dof = e.target.checked; applyQuality(); saveWorld(); };
  $('#ambT').checked = S.ambience; $('#ambT').onchange = e => { S.ambience = e.target.checked; saveWorld(); };
  $('#lookSel').value = S.look; $('#lookSel').onchange = e => { S.look = e.target.value; applyLook(); saveWorld(); };
  $('#qualSel').value = S.quality; $('#qualSel').onchange = e => { S.quality = e.target.value; applyQuality(); saveWorld(); };
  $('#soundBtn').onclick = () => { S.sound = !S.sound; saveWorld(); sound.enable(S.sound); sound.setScene(S.env, S.weather, S.season); $('#soundBtn').classList.toggle('active', S.sound); $('#soundBtn').setAttribute('aria-pressed', S.sound); toast(S.sound ? 'Sound on — rain, wind, forge and ring are generated live.' : 'Sound off.'); };
  buildForge();
  window.addEventListener('keydown', e => {
    if (document.querySelector('dialog[open]') || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === '1') setMode('sheathed'); if (k === '2') setMode('drawn'); if (k === '3') setMode('exploded');
    if (k === 's') $('#spinBtn').click(); if (k === 'c') $('#cineBtn').click(); if (k === 'r') $('#resetBtn').click();
    if (k === 'f') $('#fsBtn').click(); if (k === 'p') travel(); if (k === 'escape') clearFocus();
    if (k === '+' || k === '=') dolly(.8); if (k === '-') dolly(1.25);
    if (k === 'i') startIai(); if (k === 'n') setTime(S.time === 'dawn' ? 'night' : 'dawn');
    if (k === 'e') open('forgeDrawer'); if (k === 'w') open('worldDrawer'); if (k === '?') $('#helpDlg').showModal();
  });
}
function applyLook() { renderer.toneMapping = { agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping }[S.look] || THREE.AgXToneMapping; }
function dolly(f) { const off = camera.position.clone().sub(controls.target).multiplyScalar(f); const dl = clamp(off.length(), controls.minDistance, controls.maxDistance); flyTo(controls.target.clone().add(off.setLength(dl)), controls.target.clone(), .5); }

function buildForge() {
  const c = S.cfg;
  const chips = (id, items, key, regen = true, swatch = null) => {
    const el = $('#' + id);
    el.innerHTML = Object.entries(items).map(([k, v]) => `<button data-v="${k}" title="${v.name || v}">${swatch ? `<i style="background:${swatch(v)}"></i>` : ''}<span>${(v.name || v).split(' — ')[0]}</span></button>`).join('');
    const sync = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.v === S.cfg[key]));
    el.querySelectorAll('button').forEach(b => b.onclick = () => { S.cfg[key] = b.dataset.v; sync(); applyCfg(regen); saveCfg(); markPreset(); });
    sync(); el._sync = sync;
  };
  chips('fHamon', { notare: 'Notare', suguha: 'Suguha', gunome: 'Gunome', choji: 'Chōji', infinite: 'Mugen ∞' }, 'hamon');
  chips('fEngr', { none: 'None', bohi: 'Bo-hi groove', sigil: '∞ Horimono' }, 'engraving');
  chips('fLacq', TX.LACQUER, 'lacquer', true, v => `linear-gradient(90deg,rgb(${v.base}),rgb(${v.deep}),rgb(${v.glow}))`);
  chips('fPattern', { waves: 'Waves', sakura: 'Sakura', infinite: '∞ Lemniscate', plain: 'Plain' }, 'pattern');
  chips('fIto', COLORS, 'ito', false, v => v.hex);
  chips('fSame', { ivory: 'Ivory', black: 'Black', indigo: 'Indigo' }, 'same', false);
  chips('fFit', METALS, 'fittings', false, v => v.swatch);
  chips('fTsubaD', { infinity: '∞ Mugen', sakura: 'Sakura', nami: 'Moon & waves' }, 'tsubaDesign', false);
  chips('fTsuba', METALS, 'tsuba', false, v => v.swatch);
  chips('fMenuki', METALS, 'menuki', false, v => v.swatch);
  chips('fSageo', COLORS, 'sageo', false, v => v.hex);
  const rng = (id, key, regen) => { const el = $('#' + id); el.value = c[key]; el.oninput = () => { S.cfg[key] = +el.value; applyCfg(regen); saveCfg(); markPreset(); }; el._sync = () => el.value = S.cfg[key]; };
  rng('fLum', 'luminous', true); rng('fRaden', 'raden', true); rng('fPolish', 'polish', true);
  $('#fPresets').innerHTML = Object.entries(PRESETS).map(([k, p]) => `<button data-p="${k}"><strong>${p.name}</strong><span>${p.line}</span></button>`).join('');
  $$('#fPresets [data-p]').forEach(b => b.onclick = () => { S.cfg = { ...PRESETS[b.dataset.p].cfg }; syncForge(); applyCfg(true); saveCfg(); markPreset(); toast(PRESETS[b.dataset.p].name + ' — ' + PRESETS[b.dataset.p].line); });
  $('#fRandom').onclick = () => {
    const pickK = o => { const k = Object.keys(o); return k[Math.floor(Math.random() * k.length)]; };
    Object.assign(S.cfg, { hamon: pickK(TX.HAMON), lacquer: pickK(TX.LACQUER), pattern: pickK({ waves: 1, sakura: 1, infinite: 1, plain: 1 }), ito: pickK(COLORS), sageo: pickK(COLORS), fittings: pickK(METALS), tsuba: pickK(METALS), menuki: pickK(METALS), same: pickK({ ivory: 1, black: 1, indigo: 1 }), luminous: Math.random(), raden: Math.random() });
    syncForge(); applyCfg(true); saveCfg(); markPreset(); toast('A new life for the blade.');
  };
  $('#fShare').onclick = async () => { saveCfg(); try { await navigator.clipboard.writeText(location.href); toast('Link to this forging copied.'); } catch (_) { toast('Copy the address bar to share this forging.'); } };
  markPreset();
  renderCollection();
  $('#colSave').onclick = () => {
    const name = ($('#colName').value || '').trim() || `Life ${String(loadCollection().length + 1).padStart(2, '0')}`;
    const c = loadCollection(); c.unshift({ name: name.slice(0, 40), cfg: { ...S.cfg }, t: Date.now() }); saveCollection(c); $('#colName').value = ''; renderCollection(); toast(`“${name}” kept in your collection.`);
  };
}
function renderCollection() {
  const c = loadCollection(), el = $('#colList');
  el.innerHTML = c.length ? c.map((it, i) => `<div class="col-item"><button data-load="${i}"><i style="background:linear-gradient(90deg,rgb(${(TX.LACQUER[it.cfg.lacquer] || TX.LACQUER.aonami).deep}),rgb(${(TX.LACQUER[it.cfg.lacquer] || TX.LACQUER.aonami).glow}))"></i><strong></strong><span>${new Date(it.t).toLocaleDateString()}</span></button><button class="del" data-del="${i}" aria-label="Remove">×</button></div>`).join('') : '<p class="empty">Nothing kept yet. Name a forging and keep it — it stays in this browser.</p>';
  el.querySelectorAll('strong').forEach((s2, i) => s2.textContent = c[i].name);
  el.querySelectorAll('[data-load]').forEach(b => b.onclick = () => { const it = loadCollection()[+b.dataset.load]; if (!it) return; S.cfg = { ...DEFAULT_CFG, ...it.cfg }; syncForge(); applyCfg(true); saveCfg(); markPreset(); toast(`“${it.name}” returns.`); });
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const c2 = loadCollection(); c2.splice(+b.dataset.del, 1); saveCollection(c2); renderCollection(); });
}
function syncForge() { $$('#forgeDrawer [id^=f]').forEach(el => el._sync?.()); }
function markPreset() { const k = Object.entries(PRESETS).find(([, p]) => Object.entries(p.cfg).every(([kk, v]) => S.cfg[kk] === v))?.[0]; $$('#fPresets [data-p]').forEach(b => b.classList.toggle('active', b.dataset.p === k)); }

// ------------------------------------------------------------------ main loop
const clock = new THREE.Timer();
let introT = 0;
function loop() {
  requestAnimationFrame(loop);
  clock.update(); const dt = Math.min(clock.getDelta(), .1), time = clock.getElapsed();
  // draw / explode easing
  const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
  if (!pull && !iai) {
    const eTarget = S.d > .995 ? S.eT : 0, dTarget = S.eT > 0 || S.e > .01 ? 1 : S.dT;
    S.e += (eTarget - S.e) * k; if (Math.abs(S.e - eTarget) < .0005) S.e = eTarget;
    const kd = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    S.d += (dTarget - S.d) * kd; if (Math.abs(S.d - dTarget) < .0005) S.d = dTarget;
  }
  pose(time); if (iai) iaiPose(iai.hold ? 0 : dt); if (!iai?.hold) updateTrail(); syncMode();
  // camera
  if (tween.active) {
    tween.t += dt; const t = ease(clamp(tween.t / tween.dur));
    camera.position.lerpVectors(tween.p0, tween.p1, t); controls.target.lerpVectors(tween.t0, tween.t1, t);
    if (tween.t >= tween.dur) tween.active = false;
  }
  updateCinematic(dt); updateWarp(dt);
  controls.update(dt);
  if (hoverAt && !pull && !tween.active) { const h = pick(...hoverAt); setHover(h?.part || '', ...hoverAt); }
  // living light
  const T = S.ambience && !reduced ? time : 0;
  for (const { o, kind, seed } of dyn) {
    const bc = o.userData.baseColor;
    if (kind === 'flicker') o.material.color.copy(bc).multiplyScalar(S.lantern * (.88 + .08 * Math.sin(T * 7.3 + seed) + .05 * Math.sin(T * 17.1 + seed * 3)));
    else if (kind === 'forge') o.material.color.copy(bc).multiplyScalar(.8 + .25 * Math.sin(T * 1.7) * Math.sin(T * 5.3 + 1) + .1 * Math.sin(T * 13));
    else if (kind === 'portal' || kind === 'ring') o.material.color.copy(bc).multiplyScalar(.85 + .2 * Math.sin(T * 1.4 + seed));
    else if (kind === 'memory') o.material.color.copy(bc).multiplyScalar(.6 + .5 * Math.pow(.5 + .5 * Math.sin(T * .8 + o.position.z), 4));
    else if (kind === 'pulse') o.material.color.copy(bc).multiplyScalar(.7 + .5 * Math.sin(T * 2));
    else if (kind === 'spin') o.rotation.z = T * .12;
    else if (kind === 'spin2') o.rotation.z = -T * .08 + 1;
    else if (kind === 'core') { const s = 1 + .04 * Math.sin(T * 1.3); o.scale.setScalar(s); }
    else if (kind === 'fall' && o.material.uniforms) o.material.uniforms.uTime.value = T;
  }
  foliage.forEach(m => m.userData.u.uTime.value = T); pines.forEach(m => { m.uniforms.uTime.value = T * .4; m.uniforms.uPx.value = renderer.getPixelRatio(); });
  if (sky) { sky.material.uniforms.uTime.value = T; sky.material.uniforms.uFlash.value = fx.flash; sky.material.uniforms.uCloud.value += (({ clear: .12, mist: .55, rain: .85, storm: 1, snow: .8 })[S.weather] - sky.material.uniforms.uCloud.value) * .02; }
  foliage.forEach(m => m.uniforms && (m.uniforms.uPx.value = renderer.getPixelRatio()));
  reflectors.forEach(r => r.material.uniforms.uTime.value = T);
  fx.update(dt, time, S.ambience && !reduced);
  const flash = fx.flash;
  bakedMats.forEach(m => { m.userData.u.uFlash.value = flash * .9; m.userData.u.uGain.value = S.env === 'atelier' ? S.bakedGain * (.8 + .2 * S.moon) : 1.0; });
  if (L.key) {
    const fl = .9 + .06 * Math.sin(T * 7.3) + .04 * Math.sin(T * 17.1);
    L.andon.intensity = 1.6 * S.lantern * fl; L.forge.intensity = 5 * (.8 + .25 * Math.sin(T * 1.7) * Math.sin(T * 5.3 + 1));
    L.rim.intensity = 5 * S.moon + flash * 30; L.portal.intensity = 2.5 + flash * 20;
    L.shadow.intensity = S.env === 'studio' ? 3 : 6 * (S.env === 'atelier' ? S.lantern : 1);
  }
  renderer.toneMappingExposure = S.exposure * (S.env === 'vault' ? .9 : 1);
  bloom.strength = S.bloom * (S.env === 'vault' ? .85 : 1); finalPass.uniforms.uGrain.value = S.grain; finalPass.uniforms.uTime.value = time;
  finalPass.uniforms.uFlash.value = flash * .25;
  const ws = WEATHERS[S.weather]; finalPass.uniforms.uTint.value.set(...(S.env === 'atelier' ? ws.grade : [1, 1, 1]));
  bokeh.enabled = S.dof && S.quality !== 'balanced' && (!!S.sel || S.cinematic || camera.position.distanceTo(controls.target) < .5);
  if (bokeh.enabled) { const f = camera.position.distanceTo(controls.target); bokeh.uniforms.focus.value = f; bokeh.uniforms.aperture.value = .0011 / Math.max(.3, f); bokeh.uniforms.maxblur.value = .0045; }
  composer.render(dt);
  introT += dt;
}

// ------------------------------------------------------------------ boot
(async () => {
  try {
    await load();
    allKatanaMeshes = Object.values(partMeshes).flat();
    buildUI();
    applyLook();
    setEnv(S.env || 'atelier');
    setTime(S.time || 'night');
    applyCfg(true);
    applyQuality();
    if (S.sound) { $('#soundBtn').classList.add('active'); const once = () => { sound.enable(true); sound.setScene(S.env, S.weather, S.season); removeEventListener('pointerdown', once); }; addEventListener('pointerdown', once); }
    window.addEventListener('resize', resize);
    setMode('sheathed', true);
    camera.position.set(-1.5, 1.55, 3.3); controls.target.set(-.6, 1.0, -2);
    const view = loadView();
    if (view && view.env === S.env) { if (view.mode && view.mode !== 'sheathed') { setMode(view.mode, true); } flyTo(new THREE.Vector3(...view.p), new THREE.Vector3(...view.t), reduced ? .01 : 4.5); document.body.classList.add('engaged'); }
    else { frame('whole'); tween.dur = reduced ? .01 : 5.5; }
    document.body.classList.add('ready');
    setTimeout(() => $('#loader').remove(), 1600);
    loop();
    window.__SOKAI = { S, camera, controls, scene, renderer, focusPart, setEnv, setMode, setTime, travel, startIai, M, version: '4.1.0',
      stepIai: (t1, n = 40) => { if (!iai) startIai(); iai.hold = true; const t0 = iai.t; for (let i = 1; i <= n; i++) { iai.t = t0 + (t1 - t0) * (i - 1) / n; iaiPose((t1 - t0) / n); updateTrail(); } tween.active = false; camera.position.set(.55 + (camera.aspect < 1 ? .5 : 0), 1.05 + (camera.aspect < 1 ? .4 : 0), 2.05 * (camera.aspect < 1 ? 1.9 : 1)); controls.target.set(.3, .86, .15); controls.update(); composer.render(); } };
  } catch (err) {
    console.error(err);
    $('#loadlabel').textContent = 'The 3D view could not start: ' + (err.message || err);
  }
})();
