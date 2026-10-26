/* Lantern: a Cycles push-in lands on the hero camera, then a concealed cut to the SAME lantern (its GLB, exported from the same
   Blender objects, with the same camera). The visitor brings up the light. The live glow is driven by COLOR_0 = wall thinness
   exported from the generator (2 mm valleys glow, 12 mm ridges stay dark), i.e. the same geometry fact Cycles renders with
   subsurface scattering. No bespoke renderer: three.js standard loaders, Reflector and controls only. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const $ = id => document.getElementById(id), q = new URLSearchParams(location.search);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MEDIA = './media/', FILM = MEDIA + 'lantern-film.mp4';
// Calibrated against the Cycles stills (see README); overridable for review captures.
const CAL = {exposure: +(q.get('exp') ?? 1), K: +(q.get('k') ?? .5), glow: +(q.get('glow') ?? 7), base: +(q.get('base') ?? 9), key: +(q.get('key') ?? 1), mfp: +(q.get('mfp') ?? 2.5), rim: +(q.get('rim') ?? .5), mirror: +(q.get('mirror') ?? .55), env: +(q.get('env') ?? 0)};
const B2T = (x, y, z) => new THREE.Vector3(x, z, -y);  // Blender Z-up -> glTF/three Y-up
const state = {live: false, touched: false, ready: false, light: 0};

const canvas = $('gl'); let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: q.has('compare')}); }
catch (e) { window.__fallback?.('webgl-unavailable'); throw e; }
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = CAL.exposure;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.75 : 2));
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020202);
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = CAL.env;
let camera = new THREE.PerspectiveCamera(30, 16 / 9, .02, 50), controls;

// ---- room: polished dark-stone table (planar reflection under a dimming glaze) and a plaster wall, as in the Blender scene ----
const reflector = new Reflector(new THREE.PlaneGeometry(3.2, 3), {color: 0x8a847c, textureWidth: 1024, textureHeight: 1024});
reflector.rotation.x = -Math.PI / 2; reflector.position.copy(B2T(0, .2, -.0005)); scene.add(reflector);
const stone = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3), new THREE.MeshPhysicalMaterial({color: 0x0b0a09, roughness: .35, specularIntensity: 0, transparent: true, opacity: 1 - CAL.mirror}));  // reflections come from the Reflector only
stone.rotation.x = -Math.PI / 2; stone.position.copy(B2T(0, .2, 0)); scene.add(stone);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({color: 0x17130f, roughness: .95})); wall.position.copy(B2T(0, 1.6, 1)); scene.add(wall);

// ---- lights at the Blender positions; each interpolates from its unlit to its lit energy (object.py LIT table) ----
const spot = (rgb, from, to, angle) => { const s = new THREE.SpotLight(rgb, 0, 0, angle, .7, 2); s.position.copy(from); s.target.position.copy(to); scene.add(s, s.target); return s; };
const LIGHTS = [
  [spot(0xccdcff, B2T(-.7, .7, .45), B2T(0, 0, .2), .55), 2, 3],     // rim strip
  [spot(0xfff2e6, B2T(-.95, -.25, .22), B2T(0, 0, .2), .16), .5 * CAL.key, .2 * CAL.key], // raking key (narrow: Cycles limits it with spread)
  [spot(0xffd199, B2T(.8, .45, .3), B2T(0, 0, .2), .14), .5, .8],      // kicker (narrow, or it lands on the table front-left)
  [spot(0xffcc99, B2T(-.9, .9, 1.4), B2T(-.3, 1.6, .5), .7), 14, 7]];   // wall wash (spot vs Cycles area light: needs more energy for the same wall)
const inner = new THREE.PointLight(0xff8033, 0, 0, 2); inner.position.copy(B2T(0, 0, .2)); scene.add(inner);  // light that has passed the porcelain

// ---- the object: the exact GLB with its exported camera ----
const draco = new DRACOLoader().setDecoderPath('../../vendor/three@0.170.0/examples/jsm/libs/draco/gltf/');
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(MEDIA + 'ondai-lantern.glb');
const WARM = new THREE.Color(1, .42, .12), OCHRE = new THREE.Color(.5, .26, .04), IVORY = new THREE.Color(0xe6ded2), PEACH = new THREE.Color(0xf0b07c), RIM = new THREE.Color(0xfff4e6);
const porcelain = new THREE.MeshPhysicalMaterial({color: 0xe6ded2, roughness: .38, clearcoat: .6, clearcoatRoughness: .12, vertexColors: true, emissive: WARM, emissiveIntensity: 0});
const uBase = {value: new THREE.Color()}, uRim = {value: new THREE.Color()};
porcelain.onBeforeCompile = sh => {   // COLOR_0 is wall thinness, not albedo: drive the emissive with it, leave the diffuse untinted
  sh.uniforms.uBase = uBase; sh.uniforms.uRim = uRim;
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase;\nuniform vec3 uRim;').replace('#include <color_fragment>', '')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>'
      // Beer-Lambert: wall is 2.2 mm in a valley (t = 1) and 12.7 mm on a ridge (t = 0); transmission falls ~e per 2.5 mm of extra porcelain
      + '\nfloat thin = exp(-10.5 * (1. - vColor.r) / ' + CAL.mfp.toFixed(2) + ');\ntotalEmissiveRadiance *= .04 + .96 * thin;'
      + '\ntotalEmissiveRadiance += uBase * thin * pow(max(normal.z, 0.), 2.);'
      // the back-left rim strip scatters through the silhouette (Cycles SSS); a lit surface facing away cannot show that
      + '\ntotalEmissiveRadiance += uRim * pow(1. - max(normal.z, 0.), 2.5) * clamp(.2 - 1.2 * normal.x, 0., 1.);'); };  // room light seen through valleys that face the viewer
gltf.scene.traverse(o => { if (!o.isMesh) return; if (/^Lantern/.test(o.name)) o.material = porcelain;
  else o.material = new THREE.MeshPhysicalMaterial({color: 0xc78c47, metalness: 1, roughness: .22, anisotropy: .8}); });
if (q.has('thin')) gltf.scene.traverse(o => { if (o.isMesh && /^Lantern/.test(o.name)) o.material = new THREE.MeshBasicMaterial({vertexColors: true}); });  // debug: show exported wall thinness
scene.add(gltf.scene);
const hero = {pos: new THREE.Vector3(), quat: new THREE.Quaternion(), fov: 30};
if (gltf.cameras[0]) { const c = gltf.cameras[0]; c.updateMatrixWorld(true); c.getWorldPosition(hero.pos); c.getWorldQuaternion(hero.quat); hero.fov = c.fov; }
const toHero = () => { camera.position.copy(hero.pos); camera.quaternion.copy(hero.quat); camera.fov = hero.fov; camera.updateProjectionMatrix(); };
toHero(); const target = B2T(0, 0, .2);

function setLight(v) {   // v in [0, 1]; perceptual ease so the first third of the slider already shows the valleys
  state.light = v; const g = Math.pow(v, 1.6);
  for (const [s, a, b] of LIGHTS) s.intensity = CAL.K * (a + (b - a) * v);
  inner.intensity = CAL.K * 2.6 * g;
  // unlit, room light still passes the thin valleys (Cycles shows it as an ochre band); lit, the inner source takes over and the glaze warms
  porcelain.emissiveIntensity = CAL.glow * g; uBase.value.copy(OCHRE).multiplyScalar(CAL.base * (1 - v)); uRim.value.copy(RIM).multiplyScalar(CAL.rim * (1 - .5 * v)); porcelain.color.copy(IVORY).lerp(PEACH, g);
  const r = $('light'); r.value = Math.round(v * 100); r.setAttribute('aria-valuetext', v === 0 ? 'off' : Math.round(v * 100) + ' percent');
  $('compare').hidden = v < .99 || !state.live;
}
setLight(0);

function resize() { const r = $('stage').getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  reflector.getRenderTarget().setSize(Math.round(r.width * renderer.getPixelRatio()), Math.round(r.height * renderer.getPixelRatio())); }
addEventListener('resize', resize); resize();
let raf = 0; const frames = [];
function loop(t) { raf = requestAnimationFrame(loop); if (controls) controls.update(); renderer.render(scene, camera); if (frames.length < 600) frames.push(t); }

// ---- sequence: film -> concealed cut -> live -> the visitor brings up the light ----
const film = $('film'), caption = $('caption'), say = html => { caption.innerHTML = html; };
function goLive() {
  if (state.live) return; state.live = true;
  controls = new OrbitControls(camera, canvas); controls.target.copy(target); controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false;
  controls.minDistance = .7; controls.maxDistance = 3.6; controls.maxPolarAngle = THREE.MathUtils.degToRad(86); controls.update();
  controls.addEventListener('start', () => { state.touched = true; $('hint').hidden = true; $('ref').hidden = true; $('compare').setAttribute('aria-pressed', 'false'); });
  canvas.classList.add('live'); film.classList.add('gone');
  $('chapter').textContent = 'Live 3D'; $('method').textContent = 'Same object, live in your browser · three.js'; say('This one is live. <em>Turn it on.</em>');
  $('hint').hidden = false; $('skip').hidden = true; $('replay').hidden = false; $('lightRow').hidden = false;
}
function playFilm() {
  state.live = false; canvas.classList.remove('live'); film.classList.remove('gone'); film.hidden = false; $('skip').hidden = false; $('replay').hidden = true; $('lightRow').hidden = true; $('ref').hidden = true;
  $('chapter').textContent = 'Rendered film'; $('method').textContent = 'Blender Cycles render · original parametric geometry'; say('One object. <em>Made of light.</em>');
  if (controls) { controls.dispose(); controls = null; } toHero(); setLight(0);
  film.src = FILM; film.currentTime = 0; film.play().catch(() => showPoster());
}
function showPoster() { film.removeAttribute('src'); film.load(); setTimeout(goLive, reduce ? 0 : 1800); }   // the poster is the film's last frame
film.addEventListener('ended', goLive); film.addEventListener('error', showPoster);
$('skip').onclick = goLive; $('replay').onclick = playFilm;
$('light').addEventListener('input', e => { setLight(e.target.value / 100); state.touched = true; $('hint').hidden = true; });
$('compare').onclick = () => { const on = $('compare').getAttribute('aria-pressed') !== 'true'; $('compare').setAttribute('aria-pressed', String(on));
  if (on) { if (controls) { toHero(); controls.target.copy(target); controls.update(); } $('ref').src = MEDIA + 'lantern-lit.jpg'; } $('ref').hidden = !on;
  $('method').textContent = on ? 'Showing the Blender Cycles render · tap again for live' : 'Same object, live in your browser · three.js'; };
const sph = new THREE.Spherical();
canvas.addEventListener('keydown', e => { if (!controls) return; const off = camera.position.clone().sub(controls.target); sph.setFromVector3(off); let used = true;
  if (e.key === 'ArrowLeft') sph.theta -= .1; else if (e.key === 'ArrowRight') sph.theta += .1; else if (e.key === 'ArrowUp') sph.phi = Math.max(.3, sph.phi - .08);
  else if (e.key === 'ArrowDown') sph.phi = Math.min(THREE.MathUtils.degToRad(86), sph.phi + .08); else if (e.key === '+' || e.key === '=') sph.radius = Math.max(.7, sph.radius * .9); else if (e.key === '-') sph.radius = Math.min(3.6, sph.radius * 1.1); else used = false;
  if (used) { e.preventDefault(); camera.position.setFromSpherical(sph).add(controls.target); camera.lookAt(controls.target); state.touched = true; $('hint').hidden = true; $('ref').hidden = true; } });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); $('status').textContent = 'Graphics were interrupted by the device. Restoring…'; $('status').hidden = false; });
canvas.addEventListener('webglcontextrestored', () => { const u = new URL(location.href); u.searchParams.set('resume', 'live'); location.replace(u); });

// ?together=1: an ILLUSTRATIVE second participant (labelled on screen) brings the light up and down while the visitor is idle,
// to show what a shared T.2 room could do. It is a local animation, not a network peer and not a Greatlinq integration.
let idleAt = performance.now();
if (q.has('together')) {
  const mark = () => { idleAt = performance.now(); $('ghost').hidden = true; };
  for (const ev of ['pointerdown', 'keydown', 'input']) addEventListener(ev, mark, true);
  (function ghost(t) { requestAnimationFrame(ghost); if (!state.live || reduce || t - idleAt < 4000) return;
    $('ghost').hidden = false; setLight(.55 + .45 * Math.sin((t - idleAt - 4000) / 1400 - Math.PI / 2)); })(0);
}
requestAnimationFrame(loop); state.ready = window.__ready = true; try { parent.postMessage({ type: 'ondai-live-ready' }, '*'); } catch (_) {};
if (q.has('compare') || q.get('resume') === 'live') { film.hidden = true; goLive(); $('hint').hidden = true; if (q.has('light')) setLight(+q.get('light')); } else if (reduce) showPoster(); else playFilm();
window.__h = {state, goLive, setLight, camera, renderer, frames, pose() { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); return {pos: camera.position.toArray().map(x => +x.toFixed(3)), pitch: +THREE.MathUtils.radToDeg(Math.asin(d.y)).toFixed(2)}; },
  tris() { let n = 0; gltf.scene.traverse(o => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return n; }};
