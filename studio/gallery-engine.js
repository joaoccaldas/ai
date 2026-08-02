import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { rooms, ROOM_SPAN } from './gallery-rooms.js';

const $ = selector => document.querySelector(selector);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = THREE.MathUtils.lerp;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 760;

const ui = {
  loader: $('#loader'), loaderBar: $('#loaderBar'), loaderStatus: $('#loaderStatus'),
  hero: $('.hero-ui'), enter: $('#enterGallery'), roomLabel: $('#roomLabel'), roomNumber: $('#roomNumber'),
  roomType: $('#roomType'), roomName: $('#roomName'), roomLine: $('#roomLine'), roomLink: $('#roomLink'),
  roomCounter: $('#roomCounter'), rail: $('#roomRail'), hint: $('#journeyHint'), veil: $('#transitionVeil'),
  index: $('#roomIndex'), indexGrid: $('#indexGrid'), indexToggle: $('#indexToggle'), indexClose: $('#indexClose'),
  study: $('#studyDrawer'), studyToggle: $('#studyToggle'), studyClose: $('#studyClose'), studyName: $('#studyName'),
  studyDescription: $('#studyDescription'), studyLink: $('#studyLink'), studyGrid: $('#studyGrid'),
  track: $('#scrollTrack'), restart: $('#restartTour'), sound: $('#soundToggle'), fallback: $('#fallback'),
  fallbackOpen: $('#fallbackOpen')
};

let currentIndex = -1;
let desiredScroll = 0;
let smoothScroll = 0;
let pointerX = 0;
let pointerY = 0;
let smoothPointerX = 0;
let smoothPointerY = 0;
let audio = null;
let audioOn = false;

function preferredImage(room) { return room.image || room.fallbackImage; }
function imageTag(room, className = '') {
  const fallback = room.fallbackImage || room.image;
  return `<img class="${className}" src="${preferredImage(room)}" alt="${room.name} room preview" onerror="this.onerror=null;this.src='${fallback}'">`;
}

function buildInterface() {
  ui.rail.innerHTML = rooms.map((room, i) => `<button type="button" aria-label="${room.name}" data-room="${i}"></button>`).join('');
  ui.indexGrid.innerHTML = rooms.map((room, i) => `
    <article class="index-card" data-room="${i}" tabindex="0">
      ${imageTag(room)}
      <div class="meta"><span>${String(i + 1).padStart(2, '0')} · ${room.type}</span><h3>${room.name}</h3><p>${room.line}</p></div>
    </article>`).join('');

  ui.rail.querySelectorAll('button').forEach(button => button.addEventListener('click', () => goToRoom(Number(button.dataset.room))));
  ui.indexGrid.querySelectorAll('.index-card').forEach(card => {
    const open = () => { closeIndex(); goToRoom(Number(card.dataset.room)); };
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') open(); });
  });
}

function updateRoomUI(index) {
  const room = rooms[index];
  if (!room) return;
  ui.roomNumber.textContent = `Room ${String(index + 1).padStart(2, '0')}`;
  ui.roomType.textContent = room.type;
  ui.roomName.textContent = room.name;
  ui.roomLine.textContent = room.line;
  ui.roomLink.href = room.url;
  ui.roomCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')}`;
  [...ui.rail.children].forEach((dot, i) => dot.classList.toggle('active', i === index));
  ui.studyName.textContent = room.name;
  ui.studyDescription.textContent = room.description;
  ui.studyLink.href = room.url;
  ui.studyGrid.innerHTML = room.studies.map((study, i) => `
    <article class="study-card">
      <img src="${study.src}" alt="${study.title} visual direction" style="object-position:${study.position || 'center'}">
      <div><span>Direction ${String(i + 1).padStart(2, '0')}</span><h3>${study.title}</h3><p>${study.note}</p></div>
    </article>`).join('');
  document.documentElement.style.setProperty('--gold', room.accent);
  if (audio) audio.osc.frequency.setTargetAtTime(46 + index * 2.4, audio.ctx.currentTime, .8);
}

function openIndex() { ui.index.classList.add('on'); ui.index.setAttribute('aria-hidden', 'false'); }
function closeIndex() { ui.index.classList.remove('on'); ui.index.setAttribute('aria-hidden', 'true'); }
function openStudy() { ui.study.classList.add('on'); ui.study.setAttribute('aria-hidden', 'false'); }
function closeStudy() { ui.study.classList.remove('on'); ui.study.setAttribute('aria-hidden', 'true'); }

ui.indexToggle.addEventListener('click', openIndex);
ui.indexClose.addEventListener('click', closeIndex);
ui.studyToggle.addEventListener('click', openStudy);
ui.studyClose.addEventListener('click', closeStudy);
ui.fallbackOpen.addEventListener('click', openIndex);
ui.enter.addEventListener('click', () => goToRoom(0));
ui.restart.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeIndex(); closeStudy(); }
  if (event.key === 'ArrowDown' && currentIndex >= 0) goToRoom(Math.min(rooms.length - 1, currentIndex + 1));
  if (event.key === 'ArrowUp' && currentIndex >= 0) goToRoom(Math.max(0, currentIndex - 1));
});

function maxGalleryScroll() { return Math.max(1, ui.track.offsetHeight - innerHeight); }
function progressForRoom(index) {
  const startZ = 15;
  const endZ = -((rooms.length - 1) * ROOM_SPAN) - 13;
  const roomZ = -(index * ROOM_SPAN);
  return clamp((startZ - roomZ) / (startZ - endZ), 0, 1);
}
function goToRoom(index) {
  const progress = progressForRoom(index);
  scrollTo({ top: progress * maxGalleryScroll(), behavior: reduceMotion ? 'auto' : 'smooth' });
}

function setupAudio() {
  if (audio) return audio;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  const gain = ctx.createGain(); gain.gain.value = 0;
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 180;
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 46;
  const overtone = ctx.createOscillator(); overtone.type = 'triangle'; overtone.frequency.value = 92;
  const overtoneGain = ctx.createGain(); overtoneGain.gain.value = .12;
  osc.connect(filter); overtone.connect(overtoneGain).connect(filter); filter.connect(gain).connect(ctx.destination);
  osc.start(); overtone.start();
  audio = { ctx, gain, osc, overtone };
  return audio;
}
ui.sound.addEventListener('click', async () => {
  const system = setupAudio();
  if (!system) return;
  await system.ctx.resume();
  audioOn = !audioOn;
  system.gain.gain.cancelScheduledValues(system.ctx.currentTime);
  system.gain.gain.linearRampToValueAtTime(audioOn ? .035 : 0, system.ctx.currentTime + .8);
  ui.sound.textContent = audioOn ? 'Sound on' : 'Sound off';
  ui.sound.setAttribute('aria-pressed', String(audioOn));
});

buildInterface();

function makeNoiseTexture(base, light, size = 512) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, base); gradient.addColorStop(.5, light); gradient.addColorStop(1, base);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size); const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - .5) * 12;
    data[i] += noise; data[i + 1] += noise; data[i + 2] += noise;
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * .025})`;
    ctx.lineWidth = Math.random() * 2 + .3; ctx.beginPath();
    ctx.moveTo(Math.random() * size, 0); ctx.bezierCurveTo(Math.random() * size, size * .3, Math.random() * size, size * .7, Math.random() * size, size); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 2);
  return texture;
}

function softDiscTexture(color = '255,255,255') {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${color},.7)`); g.addColorStop(.35, `rgba(${color},.25)`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function loadTexture(loader, room, loaded, total) {
  return new Promise(resolve => {
    const done = texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      loaded.value += 1;
      ui.loaderBar.style.width = `${Math.round((loaded.value / total) * 100)}%`;
      ui.loaderStatus.textContent = `Loaded room ${loaded.value} of ${total}`;
      resolve(texture);
    };
    loader.load(room.image, done, undefined, () => {
      if (room.fallbackImage) loader.load(room.fallbackImage, done, undefined, () => done(null));
      else done(null);
    });
  });
}

async function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('#gallery'), antialias: !mobile, powerPreference: 'high-performance' });
  } catch (error) {
    ui.loader.classList.add('done'); ui.fallback.hidden = false; return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = mobile ? .95 : 1.08;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#090909');
  scene.fog = new THREE.FogExp2('#090909', .025);

  const camera = new THREE.PerspectiveCamera(mobile ? 69 : 58, innerWidth / innerHeight, .08, 420);
  camera.position.set(0, 1.55, 15);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), mobile ? .24 : .38, .75, .82);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  const loadState = { value: 0 };
  const textures = await Promise.all(rooms.map(room => loadTexture(loader, room, loadState, rooms.length)));

  const interactive = [];
  const roomObjects = [];
  const shared = {
    white: new THREE.MeshStandardMaterial({ color: 0xf3eee5, roughness: .55 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: .4, metalness: .1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .25, roughness: .05, metalness: .05, transmission: .65, thickness: .35 }),
    glowTexture: softDiscTexture('255,240,210')
  };

  const hemi = new THREE.HemisphereLight(0xc8d5d0, 0x100b08, .38); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.1); sun.position.set(-5, 14, 10); sun.castShadow = !mobile;
  if (!mobile) { sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -16; sun.shadow.camera.right = 16; sun.shadow.camera.top = 16; sun.shadow.camera.bottom = -16; }
  scene.add(sun);

  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, mobile ? 20 : 36);
  const SPHERE = new THREE.SphereGeometry(1, mobile ? 20 : 32, mobile ? 14 : 24);

  function mesh(geometry, material, scale, position, parent, rotation = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, material);
    object.scale.set(...scale); object.position.set(...position); object.rotation.set(...rotation);
    object.castShadow = !mobile; object.receiveShadow = true; parent.add(object); return object;
  }

  function addPortal(group, z, room, front = false) {
    const material = new THREE.MeshStandardMaterial({ color: room.wall, roughness: .48, metalness: .08 });
    const edge = new THREE.MeshStandardMaterial({ color: room.accent, roughness: .3, metalness: .7, emissive: room.accent, emissiveIntensity: .08 });
    mesh(BOX, material, [4.25, 5.2, .35], [-6.7, 2.5, z], group);
    mesh(BOX, material, [4.25, 5.2, .35], [6.7, 2.5, z], group);
    mesh(BOX, material, [5.1, 1.2, .35], [0, 6.5, z], group);
    mesh(BOX, edge, [5.15, .08, .42], [0, 5.33, z + (front ? .06 : -.06)], group);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.6, .06, 8, 48, Math.PI), edge);
    ring.rotation.z = Math.PI; ring.position.set(0, 1.15, z + (front ? .08 : -.08)); group.add(ring);
  }

  function addFrame(group, texture, room, z, side, interactiveScale = 1) {
    const x = side * 8.72;
    const frameGroup = new THREE.Group(); frameGroup.position.set(x, 2.25, z); frameGroup.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; group.add(frameGroup);
    const shadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: shared.glowTexture, color: 0x000000, transparent: true, opacity: .7, depthWrite: false }));
    shadow.scale.set(6.7, 5.4, 1); shadow.position.set(0, -.15, -.12); frameGroup.add(shadow);
    const frameMat = new THREE.MeshStandardMaterial({ color: room.accent, roughness: .3, metalness: .7 });
    mesh(BOX, frameMat, [5.35 * interactiveScale, 4.1 * interactiveScale, .18], [0, 0, 0], frameGroup);
    const matBoard = new THREE.MeshStandardMaterial({ color: 0xede8df, roughness: .75 });
    mesh(BOX, matBoard, [5.04 * interactiveScale, 3.8 * interactiveScale, .12], [0, 0, .14], frameGroup);
    const artMat = new THREE.MeshStandardMaterial({ map: texture || null, color: texture ? 0xffffff : room.accent, roughness: .62, metalness: 0 });
    const art = mesh(BOX, artMat, [4.68 * interactiveScale, 3.42 * interactiveScale, .055], [0, 0, .25], frameGroup);
    art.userData.url = room.url; art.userData.room = room.slug; interactive.push(art);
    const wash = new THREE.SpotLight(room.accent, 4.2, 14, .56, .7, 1.4); wash.position.set(0, 4.2, 2.4); wash.target = art; frameGroup.add(wash, wash.target);
    return art;
  }

  function addAmbientBars(group, room, z) {
    const mat = new THREE.MeshBasicMaterial({ color: room.accent, transparent: true, opacity: .55 });
    for (let i = -2; i <= 2; i++) {
      mesh(BOX, mat, [.045, .045, 3.8], [i * 2.5, 7.1, z + 1], group);
    }
  }

  function addForum(group, room, z) {
    const stone = new THREE.MeshStandardMaterial({ color: 0xaeb9b0, roughness: .85 });
    const fabric = new THREE.MeshStandardMaterial({ color: 0xd8d9cf, roughness: .95 });
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2; const r = 4.2;
      const seat = mesh(CYL, stone, [1.05, .42, 1.05], [Math.cos(a) * r, -1.48, z + Math.sin(a) * r], group);
      seat.rotation.y = -a; mesh(CYL, fabric, [.88, .12, .88], [Math.cos(a) * r, -1.02, z + Math.sin(a) * r], group);
    }
    const trunk = new THREE.MeshStandardMaterial({ color: 0x4b3323, roughness: 1 });
    mesh(CYL, trunk, [.25, 2.5, .25], [0, .6, z], group);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x547967, roughness: .95 });
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4; const r = 1.2 + (i % 4) * .23;
      mesh(SPHERE, leafMat, [.62 + (i % 3) * .15, .48, .62], [Math.cos(a) * r, 2.6 + (i % 5) * .28, z + Math.sin(a) * r], group);
    }
    const skylight = new THREE.Mesh(new THREE.TorusGeometry(4.2, .28, 16, 64), new THREE.MeshStandardMaterial({ color: 0xc9d8d1, emissive: room.accent, emissiveIntensity: .22, roughness: .3 }));
    skylight.rotation.x = Math.PI / 2; skylight.position.set(0, 7.15, z); group.add(skylight);
    const light = new THREE.PointLight(room.accent, 16, 17, 2); light.position.set(0, 6.6, z); group.add(light);
  }

  function addGem(group, room, z) {
    const plinth = new THREE.MeshStandardMaterial({ color: 0x16110d, roughness: .25, metalness: .45 });
    mesh(CYL, plinth, [1.25, .65, 1.25], [0, -1.35, z], group);
    const gemMat = new THREE.MeshPhysicalMaterial({ color: room.accent, emissive: room.accent, emissiveIntensity: .16, roughness: .02, metalness: .52, transmission: .3, thickness: 1.5, clearcoat: 1 });
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, mobile ? 0 : 1), gemMat); gem.position.set(0, .65, z); gem.rotation.z = .28; gem.castShadow = true; group.add(gem); group.userData.animated = { type: 'gem', object: gem };
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, .035, 8, 96), new THREE.MeshBasicMaterial({ color: room.accent })); ring.position.set(0, .7, z); group.add(ring);
    const light = new THREE.PointLight(room.accent, 20, 14, 2); light.position.set(0, 3.2, z + 1.5); group.add(light);
  }

  function addTable(group, room, z) {
    const timber = new THREE.MeshStandardMaterial({ color: 0x422915, roughness: .52, metalness: .05 });
    mesh(BOX, timber, [2.5, .14, 5.8], [0, -.45, z], group);
    mesh(BOX, timber, [.24, 1.35, .24], [-1.7, -1.42, z - 3.8], group); mesh(BOX, timber, [.24, 1.35, .24], [1.7, -1.42, z - 3.8], group);
    mesh(BOX, timber, [.24, 1.35, .24], [-1.7, -1.42, z + 3.8], group); mesh(BOX, timber, [.24, 1.35, .24], [1.7, -1.42, z + 3.8], group);
    const wax = new THREE.MeshStandardMaterial({ color: 0xf2dfbd, roughness: .9 });
    for (let i = -3; i <= 3; i++) {
      mesh(CYL, wax, [.055, .34 + Math.abs(i % 2) * .12, .055], [0, .05, z + i * 1.25], group);
      const flame = mesh(SPHERE, new THREE.MeshBasicMaterial({ color: room.accent }), [.055, .12, .055], [0, .48 + Math.abs(i % 2) * .12, z + i * 1.25], group);
      flame.userData.flame = true;
      if (!mobile && i % 2 === 0) { const light = new THREE.PointLight(room.accent, 1.8, 4.5, 2); light.position.copy(flame.position); group.add(light); }
    }
  }

  function addPulse(group, room, z) {
    const neon = new THREE.MeshBasicMaterial({ color: room.accent });
    for (let i = -4; i <= 4; i++) {
      const zz = z + i * 2.25;
      mesh(BOX, neon, [.055, .055, 1.7], [-8.65, 3.2 + (i % 2) * .8, zz], group, [0, 0, Math.PI / 2]);
      mesh(BOX, neon, [.055, .055, 1.7], [8.65, 3.2 + (i % 2) * .8, zz], group, [0, 0, Math.PI / 2]);
    }
    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.35, .22, mobile ? 80 : 150, 16), new THREE.MeshStandardMaterial({ color: 0x111515, emissive: room.accent, emissiveIntensity: .55, metalness: .8, roughness: .18 }));
    knot.position.set(0, .35, z); group.add(knot); group.userData.animated = { type: 'pulse', object: knot };
    const light = new THREE.PointLight(room.accent, 14, 16, 2); light.position.set(0, 3.5, z); group.add(light);
  }

  function addWine(group, room, z) {
    const glass = new THREE.MeshPhysicalMaterial({ color: room.accent, transparent: true, opacity: .5, roughness: .05, transmission: .45, thickness: .6, clearcoat: 1 });
    for (let i = -2; i <= 2; i++) {
      const vessel = mesh(CYL, glass, [.55 + Math.abs(i) * .12, 1.2 + (i % 2) * .2, .55 + Math.abs(i) * .12], [i * 1.5, -.65, z + Math.abs(i) * .5], group);
      vessel.rotation.z = i * .05;
      mesh(CYL, new THREE.MeshStandardMaterial({ color: 0x2d080e, roughness: .25 }), [.5 + Math.abs(i) * .11, .72, .5 + Math.abs(i) * .11], [i * 1.5, -1.0, z + Math.abs(i) * .5], group);
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(3.8, .05, 8, 80), new THREE.MeshBasicMaterial({ color: room.accent, transparent: true, opacity: .8 })); halo.rotation.x = Math.PI / 2; halo.position.set(0, .1, z); group.add(halo); group.userData.animated = { type: 'wine', object: halo };
    const light = new THREE.PointLight(room.accent, 17, 15, 2); light.position.set(0, 4, z); group.add(light);
  }

  function addBloom(group, room, z) {
    const stem = new THREE.MeshStandardMaterial({ color: 0x355b3e, roughness: .9 });
    mesh(CYL, stem, [.16, 2.4, .16], [0, .45, z], group, [0, 0, -.16]);
    const petal = new THREE.MeshStandardMaterial({ color: room.accent, roughness: .5, side: THREE.DoubleSide });
    const petalGeo = new THREE.SphereGeometry(.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const flower = new THREE.Group(); flower.position.set(0, 2.7, z); group.add(flower);
    for (let i = 0; i < 11; i++) {
      const p = new THREE.Mesh(petalGeo, petal); const a = i / 11 * Math.PI * 2; p.scale.set(.65, .25, 1); p.position.set(Math.cos(a) * .65, Math.sin(a) * .65, 0); p.rotation.z = a - Math.PI / 2; p.rotation.x = -.5; flower.add(p);
    }
    mesh(SPHERE, new THREE.MeshStandardMaterial({ color: 0x8f5128, roughness: .7 }), [.38, .38, .38], [0, 2.7, z], group);
    group.userData.animated = { type: 'bloom', object: flower };
    const light = new THREE.PointLight(room.accent, 13, 14, 2); light.position.set(0, 5, z + 1); group.add(light);
  }

  function addMirror(group, room, z) {
    const metal = new THREE.MeshPhysicalMaterial({ color: 0xf6e7df, metalness: .78, roughness: .12, clearcoat: 1 });
    for (let i = -1; i <= 1; i++) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.45, .09, 12, 64, Math.PI), new THREE.MeshStandardMaterial({ color: room.accent, emissive: room.accent, emissiveIntensity: .12, metalness: .55, roughness: .2 }));
      arch.rotation.z = Math.PI; arch.position.set(i * 3.1, .5, z); group.add(arch);
      mesh(BOX, metal, [1.35, 2.15, .06], [i * 3.1, -.65, z + .04], group);
    }
    const light = new THREE.PointLight(room.accent, 11, 15, 2); light.position.set(0, 4, z + 2); group.add(light);
  }

  function addTide(group, room, z) {
    const water = new THREE.MeshPhysicalMaterial({ color: 0x17454e, transparent: true, opacity: .78, roughness: .08, metalness: .28, clearcoat: 1 });
    mesh(BOX, water, [5.8, .06, 4.7], [0, -1.82, z], group);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4d5352, roughness: .96 });
    for (let i = 0; i < 12; i++) {
      const rock = mesh(new THREE.DodecahedronGeometry(.7 + (i % 3) * .25, 0), rockMat, [1.2, .75, 1], [(Math.random() - .5) * 9, -1.45, z + (Math.random() - .5) * 7], group);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
    }
    const horizon = mesh(BOX, new THREE.MeshBasicMaterial({ color: room.accent, transparent: true, opacity: .55 }), [5.5, .025, .025], [0, 1.8, z - 5.2], group);
    group.userData.animated = { type: 'tide', object: horizon };
  }

  function addCoffee(group, room, z) {
    const copper = new THREE.MeshStandardMaterial({ color: room.accent, metalness: .72, roughness: .24 });
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2 + i * .6, .07, 10, 72), copper); ring.rotation.x = Math.PI / 2; ring.position.set(0, .4 + i * .38, z); group.add(ring);
    }
    const cup = mesh(CYL, new THREE.MeshStandardMaterial({ color: 0xe6ded2, roughness: .5 }), [1.15, .65, 1.15], [0, -1.2, z], group);
    mesh(CYL, new THREE.MeshStandardMaterial({ color: 0x241108, roughness: .15 }), [.92, .08, .92], [0, -.5, z], group);
    group.userData.animated = { type: 'coffee', object: cup };
    const light = new THREE.PointLight(room.accent, 13, 15, 2); light.position.set(0, 4, z + 1); group.add(light);
  }

  function addBelong(group, room, z) {
    const orb = new THREE.Mesh(SPHERE, new THREE.MeshPhysicalMaterial({ color: room.accent, emissive: room.accent, emissiveIntensity: .42, roughness: .02, metalness: .15, transmission: .35, thickness: 2, clearcoat: 1 }));
    orb.scale.set(1.6, 1.6, 1.6); orb.position.set(0, .8, z); group.add(orb);
    const colors = [0xff4aa2, 0xffbb3d, 0x43e0b7, 0x5ec7ff, 0x9f72ff];
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3 + i * .42, .035, 8, 96), new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: .85 }));
      ring.position.set(0, .8, z); ring.rotation.set(i * .22, i * .37, i * .16); group.add(ring);
    }
    const count = mobile ? 90 : 180; const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { positions[i * 3] = (Math.random() - .5) * 13; positions[i * 3 + 1] = Math.random() * 8 - 1.5; positions[i * 3 + 2] = z + (Math.random() - .5) * 18; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: room.accent, size: .045, transparent: true, opacity: .8 })); group.add(points);
    group.userData.animated = { type: 'belong', object: orb, points };
    const light = new THREE.PointLight(room.accent, 24, 20, 2); light.position.set(0, 3, z + 2); group.add(light);
  }

  const centerpieceBuilders = { forum: addForum, gem: addGem, table: addTable, pulse: addPulse, wine: addWine, bloom: addBloom, mirror: addMirror, tide: addTide, coffee: addCoffee, belong: addBelong };

  rooms.forEach((room, index) => {
    const z = -(index * ROOM_SPAN);
    const group = new THREE.Group(); group.userData = { room, z, index }; scene.add(group);
    const wallTexture = makeNoiseTexture(room.wall, room.palette[1]);
    const floorTexture = makeNoiseTexture(room.floor, room.palette[1]);
    const wallMat = new THREE.MeshStandardMaterial({ color: room.wall, map: wallTexture, roughness: .72, metalness: .05 });
    const floorMat = new THREE.MeshPhysicalMaterial({ color: room.floor, map: floorTexture, roughness: .22, metalness: .28, clearcoat: .72, clearcoatRoughness: .18 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: room.ceiling, roughness: .74, metalness: .08 });

    mesh(BOX, floorMat, [9.2, .12, 12], [0, -1.95, z], group);
    mesh(BOX, ceilingMat, [9.2, .15, 12], [0, 7.45, z], group);
    mesh(BOX, wallMat, [.18, 4.7, 12], [-9.15, 2.7, z], group);
    mesh(BOX, wallMat, [.18, 4.7, 12], [9.15, 2.7, z], group);
    addPortal(group, z + 11.85, room, true); addPortal(group, z - 11.85, room, false);
    addAmbientBars(group, room, z);

    const side = index % 2 === 0 ? 1 : -1;
    addFrame(group, textures[index], room, z - 2.4, side, 1.04);
    addFrame(group, textures[index], room, z + 5.7, -side, .65);

    const floorGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: shared.glowTexture, color: room.accent, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending }));
    floorGlow.scale.set(9, 9, 1); floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.set(0, -1.78, z); group.add(floorGlow);

    centerpieceBuilders[room.centerpiece](group, room, z);
    const ambient = new THREE.PointLight(room.palette[2], 4.2, 24, 2); ambient.position.set(side * -3.5, 5.7, z + 2); group.add(ambient);
    roomObjects.push(group);
  });

  // Lobby monolith and roof aperture establish a cinematic first frame.
  const lobby = new THREE.Group(); scene.add(lobby);
  const lobbyFloor = new THREE.MeshPhysicalMaterial({ color: 0x090909, roughness: .16, metalness: .35, clearcoat: .9 });
  mesh(BOX, lobbyFloor, [9.5, .12, 9], [0, -1.95, 13.5], lobby);
  const monolith = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 1), new THREE.MeshStandardMaterial({ color: 0x17130e, metalness: .62, roughness: .2, emissive: 0x7c5c2d, emissiveIntensity: .08 }));
  monolith.position.set(2.2, .05, 8.8); monolith.scale.y = 1.8; monolith.castShadow = true; lobby.add(monolith);
  const aperture = new THREE.Mesh(new THREE.TorusGeometry(3.5, .45, 20, 80), new THREE.MeshStandardMaterial({ color: 0x83735e, emissive: 0xc7a56a, emissiveIntensity: .13, roughness: .3 }));
  aperture.rotation.x = Math.PI / 2; aperture.position.set(2.2, 7, 8.8); lobby.add(aperture);
  const lobbyLight = new THREE.SpotLight(0xffe5bd, 26, 24, .4, .72, 1.2); lobbyLight.position.set(2.2, 7, 8.8); lobbyLight.target = monolith; lobby.add(lobbyLight, lobbyLight.target);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  addEventListener('pointermove', event => {
    pointerX = (event.clientX / innerWidth) * 2 - 1;
    pointerY = (event.clientY / innerHeight) * 2 - 1;
    mouse.set(pointerX, -pointerY);
    raycaster.setFromCamera(mouse, camera);
    document.body.style.cursor = raycaster.intersectObjects(interactive, false).length ? 'pointer' : '';
  }, { passive: true });
  addEventListener('pointerdown', event => {
    if (ui.index.classList.contains('on') || ui.study.classList.contains('on')) return;
    mouse.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(interactive, false)[0];
    if (hit?.object?.userData?.url) location.href = hit.object.userData.url;
  });

  function changeRoom(index) {
    if (index === currentIndex || !rooms[index]) return;
    currentIndex = index; updateRoomUI(index);
    ui.veil.classList.add('on'); setTimeout(() => ui.veil.classList.remove('on'), 520);
  }

  function animateObjects(time) {
    roomObjects.forEach((group, index) => {
      const distance = Math.abs(camera.position.z - group.userData.z);
      const visibility = clamp(1 - distance / 42, 0, 1);
      group.visible = distance < 58;
      group.children.forEach(child => { if (child.isPointLight || child.isSpotLight) child.intensity *= 1; });
      const animated = group.userData.animated;
      if (!animated) return;
      if (animated.type === 'gem') { animated.object.rotation.y = time * .35; animated.object.rotation.x = .2 + Math.sin(time * .35) * .12; }
      if (animated.type === 'pulse') { animated.object.rotation.x = time * .35; animated.object.rotation.y = time * .55; animated.object.scale.setScalar(1 + Math.sin(time * 2.4) * .055); }
      if (animated.type === 'wine') { animated.object.rotation.z = Math.sin(time * .3) * .16; }
      if (animated.type === 'bloom') { animated.object.rotation.y = Math.sin(time * .45) * .3; }
      if (animated.type === 'tide') { animated.object.scale.x = 5.5 + Math.sin(time * .5) * .4; }
      if (animated.type === 'coffee') { animated.object.rotation.y = time * .18; }
      if (animated.type === 'belong') { animated.object.rotation.y = time * .24; animated.object.position.y = .8 + Math.sin(time * .65) * .18; animated.points.rotation.y = time * .025; }
      group.traverse(child => { if (child.userData.flame) child.scale.y = 1 + Math.sin(time * 8 + child.position.z) * .15; });
      group.userData.visibility = visibility;
    });
  }

  addEventListener('scroll', () => { desiredScroll = clamp(scrollY / maxGalleryScroll(), 0, 1); }, { passive: true });
  desiredScroll = clamp(scrollY / maxGalleryScroll(), 0, 1); smoothScroll = desiredScroll;

  const clock = new THREE.Clock();
  const startZ = 15;
  const endZ = -((rooms.length - 1) * ROOM_SPAN) - 13;
  const fogColor = new THREE.Color('#090909');
  const targetFog = new THREE.Color('#090909');
  let cameraTargetX = 0;

  function frame() {
    requestAnimationFrame(frame);
    const time = clock.getElapsedTime();
    smoothScroll += (desiredScroll - smoothScroll) * (mobile ? .075 : .055);
    smoothPointerX += (pointerX - smoothPointerX) * .05;
    smoothPointerY += (pointerY - smoothPointerY) * .05;

    const z = lerp(startZ, endZ, smoothScroll);
    const roomIndex = clamp(Math.round(-z / ROOM_SPAN), 0, rooms.length - 1);
    const room = rooms[roomIndex];
    const roomZ = -(roomIndex * ROOM_SPAN);
    const distanceToRoom = Math.abs(z - roomZ);
    const side = roomIndex % 2 === 0 ? 1 : -1;
    const roomInfluence = clamp(1 - distanceToRoom / (ROOM_SPAN * .62), 0, 1);
    cameraTargetX = lerp(cameraTargetX, side * 1.45 * roomInfluence + smoothPointerX * .58, .035);

    camera.position.z = z;
    camera.position.x = cameraTargetX;
    camera.position.y = 1.55 - smoothPointerY * .22 + Math.sin(time * .22) * .025;
    camera.lookAt(cameraTargetX * .35 + smoothPointerX * .7, 1.35 - smoothPointerY * .3, z - 8.5);

    targetFog.set(room.fog);
    fogColor.lerp(targetFog, .025);
    scene.fog.color.copy(fogColor); scene.background.copy(fogColor);
    scene.fog.density = .021 + roomInfluence * .006;

    const entered = smoothScroll > .025;
    ui.hero.classList.toggle('hidden', entered);
    ui.roomLabel.classList.toggle('on', entered && smoothScroll < .985 && distanceToRoom < 13.2);
    ui.hint.style.opacity = entered ? '.55' : '0';
    if (entered) changeRoom(roomIndex);
    animateObjects(time);
    monolith.rotation.y = time * .12; monolith.rotation.x = Math.sin(time * .18) * .04;
    composer.render();
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); bloom.setSize(innerWidth, innerHeight);
  });

  updateRoomUI(0);
  ui.loaderBar.style.width = '100%'; ui.loaderStatus.textContent = 'The exhibition is ready';
  setTimeout(() => ui.loader.classList.add('done'), 420);
  frame();
}

init().catch(error => {
  console.error('Gallery initialization failed', error);
  ui.loader.classList.add('done'); ui.fallback.hidden = false;
});
