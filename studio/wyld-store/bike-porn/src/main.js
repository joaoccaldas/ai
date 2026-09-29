// Bike Porn: an immersive 3D studio for the Canyon Speedmax CFR AXS study model
// (from the open Canyon Museum project). Eight WYLD bike movies: each film pairs a custom
// livery with a persona rider, its own movie set and a cinematic trailer.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import * as TX from './tex.js';
import { applyDye } from './dye.js';
import { LIVERIES, swatch } from './liveries.js';
import { getSet } from './sets.js';
import { makeWheelKit } from './wheels.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const B2T = v => new THREE.Vector3(v[0], v[2], -v[1]);           // Blender (Z-up) -> three (Y-up)
const R_WHEEL = .3395, R_RING = .0127 / (2 * Math.sin(Math.PI / 50)), R_COG = .0127 / (2 * Math.sin(Math.PI / 14));
const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) { } } };

const S = {
  env: ['set', 'light', 'dark'].includes(store.get('wyld.bikeporn.env')) ? store.get('wyld.bikeporn.env') : 'set',
  spin: !reduced, ride: false, cadence: 92, quality: coarse ? 'balanced' : 'high',
  livery: LIVERIES.find(l => location.hash.slice(1) === l.id) || LIVERIES[0],
};

// ------------------------------------------------------------------ renderer
const canvas = $('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const DPR = Math.min(devicePixelRatio, coarse ? 1.6 : 2);
renderer.setPixelRatio(DPR);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .02, 60);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = .075;
controls.minDistance = .25; controls.maxDistance = 7.5;
controls.maxPolarAngle = Math.PI * .52;
controls.zoomToCursor = !coarse;
controls.rotateSpeed = coarse ? .8 : .6;
controls.autoRotateSpeed = .55;

const pmrem = new THREE.PMREMGenerator(renderer);
const roomEnv = pmrem.fromScene(new RoomEnvironment(), .035).texture;
scene.environment = roomEnv;

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(1.4, 3.2, 2.2);
key.castShadow = true;
key.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: .5, far: 8 });
key.shadow.bias = -.0004; key.shadow.normalBias = .01; key.shadow.radius = 4;
scene.add(key);
const rimL = new THREE.DirectionalLight(0xcfe3ff, .9); rimL.position.set(-2.5, 1.5, -2); scene.add(rimL);
const hemi = new THREE.HemisphereLight(0xffffff, 0x404048, .35); scene.add(hemi);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xdadbde, roughness: .9, metalness: 0 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: .32 }));
shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.position.y = .0008; shadowCatcher.receiveShadow = true; scene.add(shadowCatcher);

// Dark gallery: stone wall with fins and glow strips (tinted to the livery).
const glow = new THREE.MeshBasicMaterial({ color: 0x384956 });
const gallery = (() => {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x070b10, roughness: .9, envMapIntensity: .15 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 4, .12), stone); wall.position.set(0, 2, -3.6); g.add(wall);
  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(.085, 3.2, .38), stone); fin.position.set(i * 1.15, 1.6, -3.4); g.add(fin);
    const light = new THREE.Mesh(new THREE.BoxGeometry(.008, 2.7, .008), glow); light.position.set(i * 1.15 + .055, 1.5, -3.18); g.add(light);
  }
  return g;
})();
scene.add(gallery);

// Bloom for the movie sets: neon, candles, windows and flashes glow.
let bloomC = null, bloomPass = null, bloomOn = true, bokeh = null, grade = null;
const KEY_POS = [1.4, 3.2, 2.2], FOCUS = new THREE.Vector3(.1, .55, 0);
const setCtx = { renderer, key, onProgress: p => { const el = $('#setload'); el.hidden = false; el.querySelector('i').style.width = Math.round(p * 100) + '%'; } };
function aimKey(pos, box) {
  key.position.fromArray(pos);
  Object.assign(key.shadow.camera, { left: -box, right: box, top: box, bottom: -box, near: .5, far: box > 2 ? 40 : 8 });
  key.shadow.camera.updateProjectionMatrix();
}
function setupBloom() {
  bloomC = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: coarse ? 0 : 4 }));
  bloomC.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), .8, .55, .9);
  bloomC.addPass(bloomPass);
  // Horror films: shallow depth of field on the bike, then a film grade (desaturated, teal shadows, vignette, grain).
  bokeh = new BokehPass(scene, camera, { focus: 3.4, aperture: .0035, maxblur: .007 }); bokeh.enabled = false;
  bloomC.addPass(bokeh);
  bloomC.addPass(new OutputPass());
  grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(.299, .587, .114));
        vec3 g = mix(vec3(l), c, .68);
        g = mix(g, g * vec3(.88, 1.0, 1.1) + vec3(0., .012, .025) * (1. - l), .9);
        g = pow(g, vec3(1.12));
        float v = 1. - smoothstep(.35, .95, length((vUv - .5) * vec2(1.15, 1.)) * 1.2);
        g *= mix(1., v, .75);
        g += (h(vUv * 900. + fract(uTime) * 91.) - .5) * .045;
        gl_FragColor = vec4(g, 1.);
      }`,
  });
  grade.enabled = false;
  bloomC.addPass(grade);
}

let composer = null;
function setupComposer() {
  composer?.dispose?.(); composer = null;
  if (S.quality !== 'high') return;
  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.updateGtaoMaterial({ radius: .12, distanceExponent: 1.6, thickness: 1.2, scale: 1.0, samples: 16 });
  gtao.blendIntensity = .9;
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  resize();
}

// ------------------------------------------------------------------ materials
const physical = o => new THREE.MeshPhysicalMaterial(o);
const M = {
  paint: physical({ color: 0xffffff, roughness: .3, metalness: .05, clearcoat: 1, clearcoatRoughness: .04, iridescence: 0, iridescenceIOR: 1.35, iridescenceThicknessRange: [140, 420] }),
  decal: physical({ color: 0x111114, roughness: .38, clearcoat: 1, clearcoatRoughness: .05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  rimGraphic: physical({ color: 0xbdbdbd, roughness: .48, polygonOffset: true, polygonOffsetFactor: -2 }),
  decalLight: physical({ color: 0xbdbdbd, roughness: .45, clearcoat: .6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  cockpit: physical({ color: 0x111113, roughness: .42, metalness: .1, clearcoat: .7, clearcoatRoughness: .18 }),
  crank: physical({ color: 0x18181b, roughness: .32, clearcoat: 1, clearcoatRoughness: .08 }),
  rim: physical({ color: 0xffffff, roughness: .5, clearcoat: .45, clearcoatRoughness: .25, envMapIntensity: .6 }),
  tyreF: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78, envMapIntensity: .45 }),
  tyreR: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78, envMapIntensity: .45 }),
  bottle: physical({ color: 0x2a2c30, roughness: .12, transparent: true, opacity: .6, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 }),
};
function mapMaterial(m, mesh) {
  switch (m.name) {
    case 'paint_frame': return M.paint;
    case 'decal_dark': return M.decal;
    case 'decal_light': return /rim_.*graphics/.test(mesh.name) ? M.rimGraphic : M.decalLight;
    case 'carbon_cockpit': return M.cockpit;
    case 'carbon_crank': return M.crank;
    case 'carbon_rim': return M.rim;
    case 'rubber_tyre': return /front/.test(mesh.name) ? M.tyreF : M.tyreR;
    case 'bottle_smoke': return M.bottle;
    default:
      if (m.name === 'led_green') m.emissiveIntensity = 4;
      else if (/alu_silver|steel/.test(m.name)) m.envMapIntensity = 1.2;
      return m;
  }
}

// ------------------------------------------------------------------ load
const bike = new THREE.Group(); scene.add(bike);
const parts = {};
let wheelF, wheelR, crankset, chain = null, dye = null, wheelKit = null;
const progress = (p, label) => { $('#loadbar').value = p; if (label) $('#loadlabel').textContent = label; };

new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load('speedmax.glb', gltf => {
  progress(.92, 'Laying up the paint…');
  bike.add(gltf.scene);
  gltf.scene.traverse(o => {
    if (o.userData?.part) parts[o.userData.part] = o;
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.material = Array.isArray(o.material) ? o.material.map(m => mapMaterial(m, o)) : mapMaterial(o.material, o);
    }
  });
  wheelF = parts.wheel_front; wheelR = parts.wheel_rear; crankset = parts.crankset;
  buildChain(parts.chain);
  // Fully equipped race build: aero fuel tray, front bottle, AeroShield and pads; rear cages off for a clean line.
  const vis = (id, v) => { if (parts[id]) parts[id].visible = v; };
  vis('aerofuel_front', true); vis('bottle_front', true); vis('aeroshield', true); vis('arm_pads', true);
  vis('bottles_rear', false); vis('bottle_cages_rear', false);
  bike.updateMatrixWorld(true);
  dye = applyDye(M.paint, bike);
  wheelKit = makeWheelKit(wheelF, wheelR, parts);
  setLivery(S.livery, false);
  progress(1, 'Ready');
  setTimeout(() => { document.body.classList.add('ready'); queueTrailer(1200); }, 250);
  flyTo('hero', 0);
}, e => { if (e.total) progress(.05 + .85 * e.loaded / e.total, 'Unpacking carbon…'); },
err => { $('#loadlabel').textContent = 'Could not load the bike. Please refresh.'; console.error(err); });

function buildChain(node) {
  if (!node || !node.userData.chain_path) return;
  const pts = JSON.parse(node.userData.chain_path).map(B2T);
  const pitch = node.userData.chain_pitch, N = node.userData.chain_links;
  const L = [0];
  for (let i = 1; i <= pts.length; i++) L.push(L[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]));
  const tot = L[L.length - 1];
  const tpl = {};
  node.traverse(o => { if (o.isMesh && /chainlink_(outer|inner)/.test(o.name)) { tpl[o.name.includes('outer') ? 'outer' : 'inner'] = o; o.visible = false; } });
  if (!tpl.outer || !tpl.inner) return;
  const inst = ['outer', 'inner'].map(k => {
    tpl[k].updateMatrix();
    const im = new THREE.InstancedMesh(tpl[k].geometry.clone().applyMatrix4(tpl[k].matrix), tpl[k].material, N / 2);
    im.castShadow = true; im.frustumCulled = false; node.add(im);
    return im;
  });
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
  const at = (s, out) => {
    s = ((s % tot) + tot) % tot;
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid] <= s) lo = mid; else hi = mid; }
    return out.copy(pts[lo]).lerp(pts[(lo + 1) % pts.length], (s - L[lo]) / (L[lo + 1] - L[lo]));
  };
  chain = {
    s: 0, tot, update() {
      for (let i = 0; i < N; i++) {
        const s0 = this.s + i * pitch;
        at(s0, P); at(s0 + pitch, Q);
        q.setFromAxisAngle(Z, Math.atan2(Q.y - P.y, Q.x - P.x));
        m4.compose(P.add(Q).multiplyScalar(.5), q, one);
        inst[i % 2].setMatrixAt(i >> 1, m4);
      }
      inst.forEach(im => im.instanceMatrix.needsUpdate = true);
    },
  };
  chain.update();
}

// ------------------------------------------------------------------ liveries
function setLivery(l, announce = true) {
  S.livery = l;
  dye?.set(l);
  wheelKit?.set(l);
  const fin = { gloss: [.26, 1, .03], satin: [.5, .45, .3], matte: [.72, 0, .6] }[l.finish] || [.3, 1, .04];
  [M.paint.roughness, M.paint.clearcoat, M.paint.clearcoatRoughness] = fin;
  M.paint.iridescence = l.irid || 0;
  M.decal.color.set(l.decal);
  const frameCockpit = l.cockpit === 'frame';
  M.cockpit.color.set(frameCockpit ? l.stops[1] : l.cockpit === 'carbon' ? '#111113' : l.cockpit);
  M.cockpit.iridescence = frameCockpit ? l.irid : 0;
  M.decalLight.color.set(l.cockpit === 'carbon' ? '#bdbdbd' : '#1a1a1a');
  M.rimGraphic.color.set(l.rimText);
  M.rim.map?.dispose(); M.rim.map = TX.rimTexture(l.rimText, '#0b0b0c', true); M.rim.needsUpdate = true;
  M.tyreF.map?.dispose(); M.tyreR.map?.dispose();
  M.tyreF.map = TX.tyreTexture('CONTINENTAL', 'AERO 111  ·  26-622', l.tyreText);
  M.tyreR.map = TX.tyreTexture('CONTINENTAL', 'GRAND PRIX 5000 TT TR  ·  28-622', l.tyreText);
  M.tyreF.needsUpdate = M.tyreR.needsUpdate = true;
  glow.color.set(l.glow);
  document.documentElement.style.setProperty('--accent', l.glow);
  $$('[data-livery]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.livery === l.id)));
  const card = $(`[data-livery="${l.id}"]`), rail = $('#liveries');
  if (card && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2, behavior: announce && !reduced ? 'smooth' : 'auto' });
  $('#lvName').textContent = l.name; $('#lvSub').textContent = l.sub; $('#lvFilm').textContent = l.film;
  $('#lvPersona').textContent = `${l.persona} · ${l.place}`;
  $('#lvTitle').dataset.font = l.font;
  $('#avUse').setAttribute('href', 'personas.svg#' + l.avatar);
  if (S.env === 'set') showSet(l, announce);
  const n = LIVERIES.indexOf(l) + 1; $('#lvNum').textContent = String(n).padStart(2, '0') + ' / ' + String(LIVERIES.length).padStart(2, '0');
  try { history.replaceState(null, '', '#' + l.id); } catch (_) { }
  if (announce) { const t = $('#lvTitle'); t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); queueTrailer(); }
}

// ------------------------------------------------------------------ camera
const VIEWS = {
  hero: { p: [1.95, 1.12, 3.05], t: [.08, .55, 0] },
  side: { p: [.09, .6, 3.6], t: [.09, .58, 0] },
  nds: { p: [.09, .6, -3.6], t: [.09, .58, 0] },
  front: { p: [2.9, .95, .75], t: [.2, .6, 0] },
  cockpit: { p: [1.15, 1.4, .95], t: [.5, .92, 0] },
  drivetrain: { p: [-.05, .62, 1.6], t: [-.18, .38, 0] },
  top: { p: [.1, 3.4, .01], t: [.1, .5, 0] },
};
let tw = null;
function flyTo(name, dur = 1.4) {
  const v = VIEWS[name]; if (!v) return;
  const p1 = new THREE.Vector3(...v.p), t1 = new THREE.Vector3(...v.t);
  if (coarse && name === 'hero' && innerWidth >= innerHeight) p1.multiplyScalar(1.25);
  if (innerWidth < innerHeight) p1.sub(t1).multiplyScalar(1.4).add(t1);
  $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  if (!dur || reduced) { camera.position.copy(p1); controls.target.copy(t1); tw = null; return; }
  tw = { p0: camera.position.clone(), t0: controls.target.clone(), p1, t1, t: 0, dur };
}

// ------------------------------------------------------------------ environments
const ENVS = {
  dark: { bg: 0x111820, floor: 0x18212b, fog: [0x111820, 4, 14], env: .85, key: 2.0, rim: 1.9, hemi: .22, shadow: .5 },
  light: { bg: 0xdcdde0, floor: 0xd4d5d8, fog: [0xdcdde0, 5, 14], env: 1.0, key: 1.6, rim: .9, hemi: .35, shadow: .32 },
};
let activeSet = null, cutTimer = 0;
function showSet(l, cut) {
  const apply = () => {
    const set = getSet(l.set, setCtx);
    if (activeSet !== set) { if (activeSet) scene.remove(activeSet.group); scene.add(set.group); activeSet = set; set.update(0, 0); }
    const L = set.look;
    scene.environment = set.envTex || roomEnv;
    aimKey(L.keyPos || KEY_POS, L.shadowBox || 1.4);
    if (bokeh) bokeh.enabled = !!L.horror && !coarse;
    if (grade) grade.enabled = !!L.horror;
    if (set.ready) { $('#setload').hidden = false; set.ready.then(() => { if (activeSet === set) scene.environment = set.envTex || roomEnv; $('#setload').hidden = true; }, () => { $('#setload').hidden = true; }); }
    else $('#setload').hidden = true;
    scene.background = new THREE.Color(L.fog[0]);
    scene.fog = new THREE.Fog(...L.fog);
    scene.environmentIntensity = L.env;
    key.color.set(L.key[0]); key.intensity = L.key[1];
    rimL.color.set(L.rim[0]); rimL.intensity = L.rim[1];
    hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
    renderer.toneMappingExposure = L.exp;
    if (bloomPass) { bloomPass.strength = L.bloom ?? .5; bloomPass.threshold = L.thr ?? 1.1; }
    document.documentElement.dataset.theme = ['stickers', 'meadow', 'beach'].includes(l.set) ? 'light' : 'dark';
    $('meta[name="theme-color"]').content = '#' + scene.background.getHexString();
  };
  clearTimeout(cutTimer);
  if (!cut || reduced) { apply(); return; }
  // Clapperboard cut: bars close, the set changes behind them, bars open.
  const slate = $('#slate');
  slate.querySelector('b').textContent = l.persona;
  slate.querySelector('small').textContent = `Scene ${String(LIVERIES.indexOf(l) + 1).padStart(2, '0')} · Take 1 · ${l.film}`;
  document.body.classList.add('cut');
  cutTimer = setTimeout(() => { apply(); cutTimer = setTimeout(() => document.body.classList.remove('cut'), 520); }, 380);
}
function setEnv(name) {
  S.env = name; store.set('wyld.bikeporn.env', name);
  document.documentElement.dataset.env = name;
  const isSet = name === 'set';
  floor.visible = shadowCatcher.visible = !isSet;
  if (isSet) { gallery.visible = false; showSet(S.livery, false); $$('[data-env]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.env === name))); return; }
  if (activeSet) { scene.remove(activeSet.group); activeSet = null; }
  scene.environment = roomEnv; aimKey(KEY_POS, 1.4); $('#setload').hidden = true;
  key.color.set(0xffffff); rimL.color.set(0xcfe3ff); hemi.color.set(0xffffff); hemi.groundColor.set(0x404048); renderer.toneMappingExposure = 1;
  const E = ENVS[name];
  gallery.visible = name === 'dark';
  floor.material.envMapIntensity = name === 'dark' ? .08 : 1;
  scene.background = new THREE.Color(E.bg);
  scene.fog = new THREE.Fog(...E.fog);
  floor.material.color.set(E.floor);
  scene.environmentIntensity = E.env;
  key.intensity = E.key; rimL.intensity = E.rim; hemi.intensity = E.hemi;
  shadowCatcher.material.opacity = E.shadow;
  document.documentElement.dataset.theme = name;
  $('meta[name="theme-color"]').content = name === 'dark' ? '#111820' : '#dcdde0';
  $$('[data-env]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.env === name)));
}

// ------------------------------------------------------------------ UI
function buildUI() {
  const rail = $('#liveries');
  LIVERIES.forEach(l => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lv'; b.dataset.livery = l.id;
    b.innerHTML = `<span class="sw"></span><span class="lv-t"><b></b></span>`;
    b.querySelector('.sw').style.background = swatch(l);
    b.querySelector('b').textContent = l.film;
    b.title = `${l.film}: ${l.persona}, ${l.name}`;
    b.onclick = () => { if (TR) endTrailer(false); setLivery(l); };
    rail.appendChild(b);
  });
  $$('[data-view]').forEach(b => b.onclick = () => { stopSpin(); flyTo(b.dataset.view); });
  $$('[data-env]').forEach(b => b.onclick = () => setEnv(b.dataset.env));
  $('#spin').onclick = () => { S.spin = !S.spin; syncToggles(); };
  $('#ride').onclick = () => { S.ride = !S.ride; syncToggles(); };
  $('#trailer').onclick = () => { clearTimeout(queued); playTrailer(); };
  $('#cineClose').onclick = () => endTrailer();
  $('#cineSkip').onclick = () => endTrailer();
  $('#cinePause').onclick = () => pauseTrailer();
  canvas.addEventListener('click', () => { if (TR) pauseTrailer(); });
  $('#cineReplay').onclick = () => { clearTimeout(queued); playTrailer(); };
  $('#shuffle').onclick = () => {
    const rest = LIVERIES.filter(l => l !== S.livery);
    setLivery(rest[Math.floor(Math.random() * rest.length)]);
  };
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    if (TR) { if (e.key === ' ' || e.key === 'k') { e.preventDefault(); pauseTrailer(); return; } if (e.key === 'Escape') { endTrailer(); return; } if (!/^Arrow(Left|Right)$/.test(e.key)) return; endTrailer(false); }
    const i = LIVERIES.indexOf(S.livery);
    if (e.key === 'ArrowRight') setLivery(LIVERIES[(i + 1) % LIVERIES.length]);
    else if (e.key === 'ArrowLeft') setLivery(LIVERIES[(i + LIVERIES.length - 1) % LIVERIES.length]);
  });
  canvas.addEventListener('pointerdown', stopSpin);
  canvas.addEventListener('wheel', stopSpin, { passive: true });
  syncToggles();
}
function stopSpin() { if (S.spin) { S.spin = false; syncToggles(); } }
function syncToggles() {
  controls.autoRotate = S.spin;
  $('#spin').setAttribute('aria-pressed', String(S.spin));
  $('#ride').setAttribute('aria-pressed', String(S.ride));
}

// ------------------------------------------------------------------ trailer
// A 20-second teaser per film: six shots with hard cuts, title cards, letterbox and grain,
// the wheels turning, and the set's own climax (lightning, flashes, the beam...) on shot five.
const SHOTS = [
  { p0: [-1.8, .2, 2.3], t0: [.1, .45, 0], p1: [-.8, .28, 2.75], t1: [.12, .5, 0], d: 3.4, card: l => ['WYLD Pictures', 'presents'] },
  { p0: [1.1, .38, .78], t0: [.62, .34, 0], p1: [.86, .44, 1.08], t1: [.56, .36, 0], d: 2.8, card: l => [l.persona, l.place] },
  { p0: [-.5, .5, 1.02], t0: [-.12, .36, 0], p1: [.12, .52, 1.08], t1: [-.05, .4, 0], d: 2.8, card: l => [l.tagline, ''] },
  { p0: [1.3, 1.36, .6], t0: [.45, .92, 0], p1: [1.02, 1.3, -.6], t1: [.45, .9, 0], d: 2.8, card: l => [`Starring the ${l.name} Speedmax`, 'CFR AXS · fully equipped'] },
  { orbit: true, r: 3.2, y: .95, a0: .5, a1: -.6, t: [.08, .55, 0], d: 3.8, cue: true },
  { p0: [1.3, .75, 2.1], t0: [.08, .55, 0], p1: [2.5, 1.35, 4.1], t1: [.08, .62, 0], d: 4.4, end: true },
];
let TR = null, setClock = 0;
const V3 = (a, b = new THREE.Vector3()) => b.set(a[0], a[1], a[2]);
const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
// The trailer plays by default: when the page opens and whenever a film is picked (after its set has loaded).
let queued = 0;
function queueTrailer(delay = 950) {
  clearTimeout(queued);
  queued = setTimeout(() => {
    if (TR) return;
    const was = { env: S.env, pos: camera.position.clone(), target: controls.target.clone() };
    if (S.env !== 'set') setEnv('set');             // the movie set is where trailers live
    const set = activeSet;
    Promise.resolve(set?.ready).then(() => { if (activeSet === set && !TR) playTrailer(was); }, () => { });
  }, delay);
}
function playTrailer(was) {
  // Remember exactly where we were, so Esc / ✕ puts everything back.
  const prev = TR ? TR.prev : (was?.pos ? was : { env: S.env, pos: camera.position.clone(), target: controls.target.clone() });
  clearTimeout(TR?.auto);
  if (S.env !== 'set') setEnv('set');
  const cine = $('#cine');
  TR = { i: -1, t: 0, l: S.livery, ride: TR ? TR.ride : S.ride, spin: TR ? TR.spin : S.spin, boost: 0, prev, paused: false, total: SHOTS.reduce((a, s) => a + s.d, 0), elapsed: 0 };
  syncPause();
  S.spin = false; syncToggles(); controls.enabled = false; tw = null;
  document.body.classList.add('cine'); cine.classList.remove('done'); cine.hidden = false;
  $('#cineFilm').textContent = TR.l.film; $('#cineFilm').dataset.font = TR.l.font;
  $('#cineSub').textContent = `${TR.l.persona} · ${TR.l.name}`;
  $('#cineAv').setAttribute('href', 'personas.svg#' + TR.l.avatar);
  resize(); nextShot();
}
function nextShot() {
  TR.i++; TR.t = 0;
  const sh = SHOTS[TR.i];
  if (!sh) { $('#cine').classList.add('done'); TR.hold = true; TR.auto = setTimeout(() => endTrailer(), 7000); return; }
  const cut = $('#cineCut'); cut.classList.remove('go'); void cut.offsetWidth; cut.classList.add('go');
  const card = $('#cineCard'), c = sh.card ? sh.card(TR.l) : null;
  card.classList.remove('on'); card.dataset.font = TR.i === 0 ? 'serif' : TR.l.font;
  if (c) { card.querySelector('b').textContent = c[0]; card.querySelector('small').textContent = c[1]; setTimeout(() => card.classList.add('on'), 250); }
  $('#cine').classList.toggle('finale', !!sh.end);
  if (sh.cue) setTimeout(() => { if (TR && activeSet) { activeSet.cue(); TR.boost = 1; } }, 900);
}
function shotCam(sh, k) {
  if (sh.orbit) {
    const a = sh.a0 + (sh.a1 - sh.a0) * k;
    V3(sh.t, tmpT); tmpP.set(tmpT.x + Math.sin(a) * sh.r, sh.y + Math.sin(k * Math.PI) * .25, Math.cos(a) * sh.r);
  } else {
    tmpP.lerpVectors(V3(sh.p0, tmpA), V3(sh.p1, tmpB), k);
    tmpT.lerpVectors(V3(sh.t0, tmpA), V3(sh.t1, tmpB), k);
  }
  if (innerWidth < innerHeight) tmpP.sub(tmpT).multiplyScalar(1.45).add(tmpT);
  camera.position.copy(tmpP); controls.target.copy(tmpT); camera.lookAt(tmpT);
}
function directTrailer(dt) {
  TR.boost = Math.max(0, TR.boost - dt * .6);
  if (TR.hold || TR.paused) return;
  const sh = SHOTS[TR.i];
  TR.t += dt / sh.d; TR.elapsed += dt;
  $('#cineBar').style.transform = `scaleX(${Math.min(1, TR.elapsed / TR.total)})`;
  shotCam(sh, sh.end ? ease(clamp(TR.t)) : clamp(TR.t));
  if (TR.t >= 1) nextShot();
}
function pauseTrailer(p = !TR?.paused) {
  if (!TR || TR.hold) return;
  TR.paused = p; syncPause();
}
function syncPause() {
  const on = !!TR?.paused;
  $('#cine').classList.toggle('paused', on);
  $('#cinePause').setAttribute('aria-label', on ? 'Play trailer' : 'Pause trailer');
  $('#cinePause').textContent = on ? '▶' : '❚❚';
}
function endTrailer(fly = true) {
  if (!TR) return;
  clearTimeout(TR.auto);
  const prev = TR.prev;
  S.spin = TR.spin; S.ride = TR.ride; TR = null;
  $('#cine').classList.remove('paused');
  controls.enabled = true; syncToggles();
  document.body.classList.remove('cine'); $('#cine').hidden = true; $('#cine').classList.remove('done', 'finale'); $('#cineCard').classList.remove('on');
  resize();
  if (prev && prev.env !== S.env) setEnv(prev.env);
  if (prev && fly) { tw = { p0: camera.position.clone(), t0: controls.target.clone(), p1: prev.pos, t1: prev.target, t: 0, dur: reduced ? .01 : 1.2 }; }
  else flyTo('hero', 0);
}

// ------------------------------------------------------------------ loop
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 42 : 32;
  // Keep the bike clear of the UI: right of the side panel on desktop, above the rail on phones.
  if (w >= 900 && !TR) camera.setViewOffset(w, h, -w * .1, 0, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  composer?.setSize(w, h);
  bloomC?.setSize(w, h); bloomPass?.resolution.set(w / (coarse ? 3 : 2), h / (coarse ? 3 : 2));
}
addEventListener('resize', resize);
// Test hook for screenshots: only with ?debug in the URL.
if (new URLSearchParams(location.search).has('debug')) window.__bp = { camera, controls, scene };

let last = performance.now(), fpsAcc = 0, fpsN = 0, tuned = false;
const t0 = performance.now();
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (TR) directTrailer(dt);
  if ((S.ride && !reduced) || (TR && !TR.paused)) {
    const wc = S.cadence / 60 * Math.PI * 2, vChain = wc * R_RING, wRear = vChain / R_COG;
    crankset && (crankset.rotation.z -= wc * dt);
    wheelR && (wheelR.rotation.z -= wRear * dt);
    wheelF && (wheelF.rotation.z -= wRear * dt);
    if (chain) { chain.s = (chain.s + vChain * dt) % chain.tot; chain.update(); }
  }
  if (tw) {
    tw.t += dt / tw.dur; const k = ease(clamp(tw.t));
    camera.position.lerpVectors(tw.p0, tw.p1, k); controls.target.lerpVectors(tw.t0, tw.t1, k);
    if (tw.t >= 1) tw = null;
  }
  if (activeSet && (!reduced || TR) && !TR?.paused) { setClock += dt; activeSet.update(setClock, dt); }
  if (bokeh?.enabled) bokeh.uniforms.focus.value = camera.position.distanceTo(FOCUS);
  if (grade?.enabled) grade.uniforms.uTime.value = now / 1000;
  wheelKit?.update(now / 1000, TR?.boost || 0);
  controls.update(dt);
  // Ambient occlusion only in the plain studios: the movie sets use sprites and glow that GTAO would shade.
  if (activeSet) { if (bloomC && bloomOn) bloomC.render(); else renderer.render(scene, camera); }
  else if (composer) composer.render(); else renderer.render(scene, camera);
  // Adaptive quality: drop ambient occlusion if the first seconds run slow.
  if (!tuned && now - t0 > 1500 && document.body.classList.contains('ready')) {
    fpsAcc += dt; fpsN++;
    if (fpsN > 90) { tuned = true; if (fpsN / fpsAcc < 38) { if (composer) { S.quality = 'balanced'; setupComposer(); } if (activeSet && fpsN / fpsAcc < 28) bloomOn = false; } }
  }
  requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', () => { last = performance.now(); });

buildUI();
setupBloom();
setEnv(S.env);
setupComposer();
resize();
flyTo('hero', 0);
requestAnimationFrame(tick);
