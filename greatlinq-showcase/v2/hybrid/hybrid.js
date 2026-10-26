/* Hybrid handoff: a Blender Cycles film of the ribbed arch, then a concealed cut to the SAME object (its GLB, exported
   from the same Blender objects) through the SAME camera (exported in the GLB), lit by the Cycles sky (equirect HDR
   rendered from the hero position). No bespoke renderer: three.js standard loaders and controls only. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const $ = id => document.getElementById(id), q = new URLSearchParams(location.search);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MEDIA = './media/', FILM = MEDIA + 'arch-film.mp4', LAST = MEDIA + 'arch-night.jpg';
// Calibrated against the Cycles night still (see README); overridable for review captures.
const CAL = {bgRot: +(q.get('rot') ?? Math.PI / 2), exposure: +(q.get('exp') ?? 1), mirror: +(q.get('mirror') ?? .65), up: +(q.get('up') ?? 60), env: +(q.get('env') ?? 1), baked: q.get('baked') !== '0', reflect: +(q.get('reflect') ?? .6), fade: +(q.get('fade') ?? 6), blur: +(q.get('blur') ?? 3), floorDiffuse: +(q.get('fd') ?? .8), floorRough: +(q.get('fr') ?? .26), bgI: +(q.get('bgi') ?? 1), streak: +(q.get('streak') ?? .9)};
const B2T = (x, y, z) => new THREE.Vector3(x, z, -y);  // Blender Z-up -> glTF/three Y-up
const state = {live: false, touched: false, ready: false};

const canvas = $('gl'); let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: q.has('compare')}); }
catch (e) { window.__fallback?.('webgl-unavailable'); throw e; }
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = CAL.exposure;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.75 : 2));
const scene = new THREE.Scene(); let camera = new THREE.PerspectiveCamera(50, 16 / 9, .05, 2000), controls;

// ---- environment: the Cycles sky, as background and image-based light ----
const pmrem = new THREE.PMREMGenerator(renderer);
const hdr = await new RGBELoader().loadAsync(MEDIA + 'pano-night-1k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.background = hdr; scene.environment = pmrem.fromEquirectangular(hdr).texture;
scene.backgroundRotation.y = scene.environmentRotation.y = CAL.bgRot; scene.environmentIntensity = CAL.env; scene.backgroundIntensity = CAL.bgI;

// ---- ground: terrace with a real edge over still water (same dimensions as the Blender scene) ----
const concrete = new THREE.MeshPhysicalMaterial({color: 0x575a5d, roughness: .16, metalness: 0, clearcoat: .3, clearcoatRoughness: .2, transparent: true, opacity: 1 - CAL.mirror});
if (!CAL.baked) { const terrace = new THREE.Mesh(new THREE.BoxGeometry(48, .5, 28), concrete); terrace.position.copy(B2T(0, -12, -.25)); scene.add(terrace); }
const water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshPhysicalMaterial({color: 0x04080c, roughness: .03, metalness: 0, clearcoat: 1}));
water.rotation.x = -Math.PI / 2; water.position.y = -.42; water.renderOrder = -1; water.material.depthWrite = false; scene.add(water); // drawn first so the mirrored arch shows beyond the terrace edge

// ---- recessed warm uplights at the Blender positions ----
const tex = draw => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; draw(c.getContext('2d'), 64, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const GLOW = tex((g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,240,220,1)'); r.addColorStop(.35, 'rgba(255,190,120,.45)'); r.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const STREAK = tex((g, w, h) => { const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, 'rgba(255,235,210,1)'); l.addColorStop(.45, 'rgba(255,210,165,.55)'); l.addColorStop(1, 'rgba(255,200,150,0)'); g.fillStyle = l;
  const x = g.createLinearGradient(0, 0, w, 0); g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; x.addColorStop(0, 'rgba(0,0,0,0)'); x.addColorStop(.5, 'rgba(0,0,0,1)'); x.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = x; g.fillRect(0, 0, w, h); });
for (const x of [-5.2, -3.4, -1.2, 3.3, 4.6, 5.7]) {
  if (!CAL.baked) { const s = new THREE.SpotLight(0xffa860, CAL.up, 0, 1.05, 1, 2); s.position.copy(B2T(x, -2.6, .05)); s.target.position.copy(B2T(x, -2.6, 6)); scene.add(s, s.target); }
  const cap = new THREE.Mesh(new THREE.CircleGeometry(.07, 24), new THREE.MeshBasicMaterial({color: 0xffc58a})); cap.rotation.x = -Math.PI / 2; cap.position.copy(B2T(x, -2.6, .006)); scene.add(cap);
  // luminaire glow and its long reflection in polished concrete (Cycles shows both; approximated with additive sprites)
  for (const [sx, sy, col] of [[1.3, .36, 0xfff1df], [.55, .2, 0xffffff]]) { const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: GLOW, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
    glow.scale.set(sx, sy, 1); glow.position.copy(B2T(x, -2.6, .08)); scene.add(glow); }
  // its reflection: a mirrored vertical glow on the reflection layer, softened by the same blur as the arch reflection
  for (let k = 0; k < 2; k++) { const streak = new THREE.Sprite(new THREE.SpriteMaterial({map: STREAK, color: 0xfff0e0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: CAL.streak}));
  streak.scale.set(.5, 2.4, 1); streak.position.copy(B2T(x, -2.6, -1.15)); streak.layers.set(1); scene.add(streak); }
}
{ const moon = new THREE.DirectionalLight(0x99b3ff, .12); moon.position.set(20, 30, -10); scene.add(moon); }

// ---- the object: the exact GLB, with its exported camera ----
const gltf = await new GLTFLoader().loadAsync(MEDIA + (CAL.baked ? 'ondai-ribbed-arch-baked-night.glb' : 'ondai-ribbed-arch.glb'));
const shell = new THREE.MeshPhysicalMaterial({color: 0xd9d9d6, roughness: .34, clearcoat: .22, clearcoatRoughness: .24});
// three sanitises glTF node names (spaces -> underscores), hence [ _] below.
// Baked: Cycles' own diffuse lighting (direct + bounced) lives in COLOR_0 / the terrace texture; show it unlit.
const bakedShell = new THREE.MeshBasicMaterial({vertexColors: true});
const arch = new THREE.Group(); gltf.scene.traverse(o => { if (!o.isMesh) return;
  if (/^Concrete[ _]terrace/.test(o.name)) { // diffuse light baked by Cycles (emissive, view-independent) + live sky reflection (PBR, view-dependent), as in the Blender material
    const m = o.material.map; m.colorSpace = THREE.SRGBColorSpace;
    o.material = new THREE.MeshPhysicalMaterial({color: 0x000000, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: CAL.floorDiffuse, roughness: CAL.floorRough, metalness: 0, specularIntensity: 1, ior: 1.5}); o.userData.ground = true; }
  else o.material = CAL.baked && o.geometry.attributes.color ? bakedShell : shell; });
arch.add(gltf.scene); scene.add(arch);
// Fake glossy reflection: the mirrored arch fades with depth below the floor, like Cycles' reflection on rough concrete.
const fadeMirror = new THREE.MeshBasicMaterial({vertexColors: true, transparent: true, depthWrite: false});
fadeMirror.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vDepth;').replace('#include <fog_vertex>', '#include <fog_vertex>\nvDepth = -(modelMatrix * vec4(position, 1.0)).y;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vDepth;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= ' + CAL.reflect.toFixed(3) + ' * (1.0 - smoothstep(0.0, ' + CAL.fade.toFixed(2) + ', vDepth));'); };
const mirror = gltf.scene.clone(true); mirror.scale.y = -1; mirror.traverse(o => { if (!o.isMesh) return; o.layers.set(1); if (o.userData.ground) o.visible = false; else if (CAL.baked) o.material = fadeMirror; }); scene.add(mirror);
// Rough-concrete reflection: render the mirrored arch at half resolution, blur it (separable Gaussian), composite over the floor.
const rtOpt = {type: THREE.HalfFloatType}; let rtA = new THREE.WebGLRenderTarget(2, 2, rtOpt), rtB = new THREE.WebGLRenderTarget(2, 2, rtOpt);
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new THREE.Scene();
const blurMat = new THREE.ShaderMaterial({uniforms: {tex: {value: null}, dir: {value: new THREE.Vector2()}}, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv; void main(){ vec4 c = vec4(0.0); float w[7]; w[0]=.1964;w[1]=.1747;w[2]=.1209;w[3]=.0646;w[4]=.0266;w[5]=.0085;w[6]=.0021; c += texture2D(tex, vUv) * w[0]; for (int i = 1; i < 7; i++) { c += texture2D(tex, vUv + dir * float(i)) * w[i]; c += texture2D(tex, vUv - dir * float(i)) * w[i]; } gl_FragColor = c; }'});
const compMat = new THREE.MeshBasicMaterial({map: rtA.texture, transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true, toneMapped: false});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat); quadScene.add(quad); // fake glossy reflection under the floor
if (gltf.cameras[0]) { const c = gltf.cameras[0]; c.updateMatrixWorld(true); camera.fov = c.fov; camera.near = .05; camera.far = 2000;
  c.getWorldPosition(camera.position); c.getWorldQuaternion(camera.quaternion); }
camera.aspect = 16 / 9; camera.updateProjectionMatrix();
const target = B2T(-1.4, -3, 3.3);

function resize() { const r = $('stage').getBoundingClientRect(); renderer.setSize(r.width, r.height, false); const w = Math.max(2, Math.round(r.width * renderer.getPixelRatio() / 2)), h = Math.max(2, Math.round(r.height * renderer.getPixelRatio() / 2)); rtA.setSize(w, h); rtB.setSize(w, h); }
addEventListener('resize', resize); resize();
let raf = 0; const frames = [];
function renderFrame() {
  // 1) mirrored arch only, into rtA (transparent clear)
  const bg = scene.background; scene.background = null; camera.layers.set(1); renderer.setRenderTarget(rtA); renderer.setClearColor(0x000000, 0); renderer.clear();
  const tm = renderer.toneMapping; renderer.render(scene, camera); camera.layers.set(0); scene.background = bg;
  // 2) blur H then V (radius grows with CAL.blur)
  quad.material = blurMat; const px = 1 / rtA.width, py = 1 / rtA.height;
  blurMat.uniforms.tex.value = rtA.texture; blurMat.uniforms.dir.value.set(px * CAL.blur, 0); renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(quadScene, quadCam);
  blurMat.uniforms.tex.value = rtB.texture; blurMat.uniforms.dir.value.set(0, py * CAL.blur); renderer.setRenderTarget(rtA); renderer.clear(); renderer.render(quadScene, quadCam);
  // 3) main scene, then the blurred reflection composited on top
  renderer.setRenderTarget(null); renderer.render(scene, camera);
  quad.material = compMat; const ac = renderer.autoClear; renderer.autoClear = false; renderer.render(quadScene, quadCam); renderer.autoClear = ac;
}
function loop(t) { raf = requestAnimationFrame(loop); if (controls) controls.update(); renderFrame(); if (frames.length < 600) frames.push(t); }

// ---- sequence: film -> concealed cut -> live ----
const film = $('film'), still = $('still'), caption = $('caption');
function say(html) { caption.innerHTML = html; }
function goLive() {
  if (state.live) return; state.live = true;
  controls = new OrbitControls(camera, canvas); controls.target.copy(target); controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false;
  // The hero camera looks UP at the arch (polar ~98° from the target): a 90° limit would jump the camera on the first frame.
  controls.minDistance = 8; controls.maxDistance = 40; controls.maxPolarAngle = THREE.MathUtils.degToRad(100);
  controls.addEventListener('change', () => { if (camera.position.y < .35) camera.position.y = .35; }); controls.update();
  controls.addEventListener('start', () => { state.touched = true; $('hint').hidden = true; });
  canvas.classList.add('live'); film.classList.add('gone'); still.classList.add('gone');
  $('chapter').textContent = 'Live 3D'; $('method').textContent = 'Same object, live in your browser · three.js'; say('This one is live. <em>Try it.</em>');
  $('hint').hidden = false; $('skip').hidden = true; $('replay').hidden = false;
}
function playFilm() {
  state.live = false; canvas.classList.remove('live'); film.classList.remove('gone'); still.classList.remove('gone'); $('skip').hidden = false; $('replay').hidden = true;
  $('chapter').textContent = 'Rendered film'; $('method').textContent = 'Blender Cycles render · original parametric geometry'; say('Same place. <em>Authored light.</em>');
  if (controls) { controls.dispose(); controls = null; } if (gltf.cameras[0]) { gltf.cameras[0].getWorldPosition(camera.position); gltf.cameras[0].getWorldQuaternion(camera.quaternion); }
  film.src = FILM; film.currentTime = 0; film.play().catch(() => showLastFrame());
}
function showLastFrame() { film.hidden = true; still.src = LAST; still.hidden = false; setTimeout(goLive, reduce ? 0 : 1800); }
film.addEventListener('ended', goLive); film.addEventListener('error', showLastFrame);
$('skip').onclick = goLive; $('replay').onclick = () => { film.hidden = false; still.hidden = true; playFilm(); };
const sph = new THREE.Spherical();
canvas.addEventListener('keydown', e => { if (!controls) return; const off = camera.position.clone().sub(controls.target); sph.setFromVector3(off); let used = true;
  if (e.key === 'ArrowLeft') sph.theta -= .1; else if (e.key === 'ArrowRight') sph.theta += .1; else if (e.key === 'ArrowUp') sph.phi = Math.max(.3, sph.phi - .08);
  else if (e.key === 'ArrowDown') sph.phi = Math.min(THREE.MathUtils.degToRad(100), sph.phi + .08); else if (e.key === '+' || e.key === '=') sph.radius = Math.max(8, sph.radius * .9); else if (e.key === '-') sph.radius = Math.min(40, sph.radius * 1.1); else used = false;
  if (used) { e.preventDefault(); camera.position.setFromSpherical(sph).add(controls.target); camera.position.y = Math.max(.35, camera.position.y); camera.lookAt(controls.target); state.touched = true; $('hint').hidden = true; } });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); $('status').textContent = 'Graphics were interrupted by the device. Restoring…'; $('status').hidden = false; });
canvas.addEventListener('webglcontextrestored', () => { const u = new URL(location.href); u.searchParams.set('resume', 'live'); location.replace(u); });

requestAnimationFrame(loop); state.ready = window.__ready = true;
if (q.has('compare') || q.get('resume') === 'live') { film.hidden = true; goLive(); $('hint').hidden = true; } else if (reduce) showLastFrame(); else playFilm();
window.__h = {state, goLive, camera, renderer, frames, pose() { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); return {pos: camera.position.toArray().map(x => +x.toFixed(3)), pitch: +THREE.MathUtils.radToDeg(Math.asin(d.y)).toFixed(2)}; }, tris() { let n = 0; arch.traverse(o => { if (o.isMesh) n += o.geometry.index.count / 3; }); return n; }};
