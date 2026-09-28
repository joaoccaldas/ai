import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { rng, C, sky, glowTex, sprite, beam, stars, hot, canvasTex } from './kit.js';

// The two horror films. Their architecture and props are modelled in Blender
// (blender/build_horror_sets.py, CC0 textures and props from Poly Haven) and loaded as GLB;
// everything that moves or glows is added here: water, rain, lightning, torchlight, candles, dust.
// Coordinates are three.js (Y-up). The bike stands at the origin facing +X; the camera looks from +Z.

const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const decay = (v, dt, k = 1.4) => Math.max(0, v - dt * k);
const BIKE = new THREE.Vector3(.1, .55, 0);

function loadSet(name, onProgress) {
  const glb = new Promise((res, rej) => loader.load(`sets/${name}.glb`, res, e => { if (e.total) onProgress?.(e.loaded / e.total); }, rej));
  const fx = fetch(`sets/${name}.fx.json`).then(r => r.json());
  return Promise.all([glb, fx]);
}
function envFrom(url, renderer) {
  return new Promise(res => new THREE.TextureLoader().load(url, t => {
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); res(env);
  }, undefined, () => res(null)));
}
function findAll(root, re) { const out = []; root.traverse(o => { if (re.test(o.name) || (o.material && re.test(o.material.name))) out.push(o); }); return out; }

// Tileable ripple normals for the lake, generated on the fly (no texture download).
function waterNormals() {
  const N = 256, R = rng(21), waves = Array.from({ length: 28 }, () => { const a = Math.round((R() - .5) * 16), b = Math.round((R() - .5) * 16); return [a || 1, b, R() * 6.28, 1 / Math.hypot(a || 1, b)]; });
  const h = (i, j) => { let v = 0; for (const [a, b, p, k] of waves) v += k * Math.sin((a * i + b * j) / N * 6.2832 + p); return v; };
  const c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = (h(i + 1, j) - h(i - 1, j)) * 6, dy = (h(i, j + 1) - h(i, j - 1)) * 6, l = Math.hypot(dx, dy, 1), o = (j * N + i) * 4;
    img.data[o] = (-dx / l * .5 + .5) * 255; img.data[o + 1] = (-dy / l * .5 + .5) * 255; img.data[o + 2] = (1 / l * .5 + .5) * 255; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Rain: streaks falling around the bike, wrapping in a box.
function makeRain(n) {
  const R = rng(9), pos = new Float32Array(n * 6), drops = [];
  for (let i = 0; i < n; i++) drops.push([(R() - .5) * 16, R() * 8, -8 + R() * 12, 7 + R() * 3]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#9fb0c4', transparent: true, opacity: .32, depthWrite: false }));
  lines.frustumCulled = false;
  return {
    mesh: lines,
    update(dt, gust) {
      for (let i = 0; i < n; i++) {
        const d = drops[i]; d[1] -= d[3] * dt; if (d[1] < 0) d[1] += 8;
        const lean = .06 + gust * .05;
        pos.set([d[0], d[1], d[2], d[0] + lean, d[1] + .28, d[2]], i * 6);
      }
      g.attributes.position.needsUpdate = true;
    },
  };
}

// Forked lightning: a jagged bolt in the sky, the key light blown out, the sky flashing.
function makeLightning(group, skyMesh, key, anchor) {
  const mat = new THREE.LineBasicMaterial({ toneMapped: false, transparent: true, fog: false }); mat.color.setScalar(7);
  const geo = new THREE.BufferGeometry(); const bolt = new THREE.LineSegments(geo, mat); bolt.visible = false; bolt.frustumCulled = false; group.add(bolt);
  const skyH = skyMesh.material.uniforms.h.value.clone(), skyA = skyMesh.material.uniforms.a.value.clone(), flash = C('#b9ccff');
  let v = 0, next = 5 + Math.random() * 5;
  const regen = () => {
    const pts = [], R = Math.random;
    const walk = (x, y, z, len, depth) => {
      let px = x, py = y;
      for (let i = 0; i < len; i++) {
        const nx = px + (R() - .5) * 1.4, ny = py - (.5 + R() * .6);
        pts.push(px, py, z, nx, ny, z); px = nx; py = ny;
        if (depth < 2 && R() < .18) walk(px, py, z, 3 + Math.floor(R() * 4), depth + 1);
        if (py < 1.5) break;
      }
    };
    walk(anchor.x + (Math.random() - .5) * 14, 16, anchor.z, 20, 0);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  };
  return {
    strike() { regen(); v = 1; },
    update(dt, base) {
      if ((next -= dt) < 0) { regen(); v = 1; next = 8 + Math.random() * 9; }
      v = Math.max(0, v - dt * 1.8);
      const k = v > .8 ? 1 : v > .65 ? .1 : v > .45 ? .85 : v * 1.2;
      bolt.visible = k > .3; mat.opacity = k;
      key.intensity = base + 11 * k;
      skyMesh.material.uniforms.h.value.copy(skyH).lerp(flash, k * .55);
      skyMesh.material.uniforms.a.value.copy(skyA).lerp(flash, k * .3);
      return k;
    },
  };
}

// ------------------------------------------------------------------ The Lake House
export function lakeHouse(ctx) {
  const g = new THREE.Group(), R = rng(17);
  const s = sky('#010208', '#0a141b', '#010203'); g.add(s, stars(R, 900, 21, .05));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), hot('#e6eef8', 1.6, { fog: false })); moon.position.set(-8, 8, -19.5); moon.lookAt(0, 0, 0); g.add(moon);
  const halo = sprite(glowTex('rgba(150,180,215,.55)'), 9, { fog: false }); halo.position.set(-8, 8, -19.3); g.add(halo);
  const cloudT = glowTex('rgba(4,8,12,.96)');
  const clouds = Array.from({ length: 7 }, (_, i) => { const c = sprite(cloudT, 5 + R() * 4, { fog: false }); c.position.set(-16 + i * 5, 6 + R() * 4, -19); c.userData.x = c.position.x; g.add(c); return c; });

  // the black lake: real reflections of the moon, the cabin and the bike
  const water = new Water(new THREE.PlaneGeometry(70, 44), {
    textureWidth: coarse ? 256 : 1024, textureHeight: coarse ? 256 : 1024, waterNormals: waterNormals(),
    sunDirection: new THREE.Vector3(-.4, .5, -.75).normalize(), sunColor: '#9fb4cc', waterColor: '#010608', distortionScale: .9, fog: true,
  });
  water.rotation.x = -Math.PI / 2; water.position.set(0, -.1, -22); water.material.uniforms.size.value = 3.5; g.add(water);

  const rain = makeRain(coarse ? 1400 : 3200); g.add(rain.mesh);
  const mistT = glowTex('rgba(150,170,185,.2)');
  const mist = Array.from({ length: 14 }, () => { const m = sprite(mistT, 3 + R() * 4); m.position.set((R() - .5) * 16, .2 + R() * .35, -1 - R() * 10); m.userData = { x: m.position.x, p: R() * 6, s: .08 + R() * .12 }; g.add(m); return m; });

  // the final girl's torch, sweeping across the bike from off-camera
  const torch = new THREE.SpotLight('#fff0d8', 32, 14, .3, .6, 1.4);
  torch.position.set(-2.4, 1.45, 3.6); torch.target.position.copy(BIKE);
  if (!coarse) { torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); torch.shadow.bias = -.0005; torch.shadow.normalBias = .02; }
  g.add(torch, torch.target);

  const lantern = new THREE.PointLight('#ffae55', 0, 7, 1.5); g.add(lantern);
  const lanternFlame = sprite(glowTex('rgba(255,170,80,1)'), .22, { blending: THREE.AdditiveBlending, toneMapped: false }); lanternFlame.material.color.setScalar(3); lanternFlame.visible = false; g.add(lanternFlame);
  const windowL = new THREE.PointLight('#ff9d45', 0, 8, 1.4); g.add(windowL);
  let windowM = null, rocker = null, rockerQ = null, door = null, doorQ = null;
  const bolt = makeLightning(g, s, ctx.key, new THREE.Vector3(0, 0, -18));

  const ready = Promise.all([loadSet('lakehouse', ctx.onProgress), envFrom('sets/lake_env.jpg', ctx.renderer)]).then(([[gltf, fx], env]) => {
    const root = gltf.scene;
    root.traverse(o => {
      if (!o.isMesh) return;
      o.receiveShadow = true;
      o.castShadow = !/ground|pines/i.test(o.name);
      if (o.material?.map) o.material.map.anisotropy = 8;
    });
    g.add(root);
    set.envTex = env;
    const lp = fx.fx_lantern?.[0]; if (lp) { lantern.position.set(...lp); lanternFlame.position.set(...lp); lanternFlame.visible = true; }
    windowM = findAll(root, /fx_window_glow/)[0];
    if (windowM) { windowM.material = hot('#e0701c', .75); const wp = new THREE.Vector3(); windowM.getWorldPosition(wp); windowL.position.copy(wp).add(new THREE.Vector3(-.5, .1, 1.1)); }
    findAll(root, /Lantern_01_glass/).forEach(o => { o.material = o.material.clone(); o.material.emissive = C('#ffae55'); o.material.emissiveIntensity = 2; });
    rocker = root.getObjectByName('Rockingchair_01'); if (rocker) rockerQ = rocker.quaternion.clone();
    door = root.getObjectByName('cabin_door'); if (door) doorQ = door.quaternion.clone();
  });

  let dark = 0;
  const axis = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion();
  const set = {
    group: g, ready, envTex: null,
    look: { fog: ['#060c10', 5, 26], env: .45, key: ['#9fb8d8', 1.2], keyPos: [-5, 7, -7], shadowBox: 7, rim: ['#ff9d45', 1.1], hemi: ['#1c2a38', '#040506', .3], shadow: .6, exp: 1.2, bloom: .7, thr: 1.35, horror: true },
    cue() { bolt.strike(); dark = 1.6; },
    update(t, dt) {
      dark = decay(dark, dt, .5);
      const k = bolt.update(dt, set.look.key[1]);
      water.material.uniforms.time.value += dt * .35;
      rain.update(dt, .5 + .5 * Math.sin(t * .3));
      const drop = Math.random() < .02 ? .15 : 1;                     // the torch sputters
      torch.intensity = 32 * drop * (1 - Math.min(1, dark) * .92);
      torch.target.position.set(BIKE.x + Math.sin(t * .35) * .35, BIKE.y + Math.sin(t * .5) * .06, 0);
      const fl = .8 + .2 * Math.sin(t * 13) * Math.sin(t * 7.3);
      lantern.intensity = 3.2 * fl; lanternFlame.scale.setScalar(.22 * fl);
      const wOut = Math.min(1, dark);
      windowL.intensity = (3 + Math.sin(t * 9) * .5) * (1 - wOut);
      if (windowM) windowM.material.color.set('#e0701c').multiplyScalar(.75 * (1 - wOut * .95) * (Math.random() < .03 ? .4 : 1));
      if (rocker) { q.setFromAxisAngle(axis, Math.sin(t * 1.6) * .11); rocker.quaternion.copy(rockerQ).multiply(q); }
      if (door) { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t * .6) * .05 + k * .15); door.quaternion.copy(doorQ).multiply(q); }
      mist.forEach(m => { m.position.x = m.userData.x + Math.sin(t * m.userData.s + m.userData.p) * 1.5; });
      clouds.forEach(c => { c.position.x = ((c.userData.x + t * .2 + 18) % 36) - 18; });
    },
  };
  return set;
}

// ------------------------------------------------------------------ Sanctuary
function stainedGlass() {
  return canvasTex(512, 1024, (x, w, h) => {
    const cols = ['#8e0f24', '#1740b8', '#d9a33a', '#237a47', '#5a3aa8', '#b8471f'], R = rng(4);
    x.fillStyle = '#060405'; x.fillRect(0, 0, w, h);
    for (let j = 0; j < 22; j++) for (let i = 0; i < 6; i++) {
      const px = i * w / 6, py = j * h / 22, jit = (R() - .5) * 10;
      x.fillStyle = cols[Math.floor(R() * cols.length)];
      x.globalAlpha = .75 + R() * .25;
      x.fillRect(px + 4, py + 4 + jit * .2, w / 6 - 8, h / 22 - 8);
    }
    x.globalAlpha = 1; x.strokeStyle = '#060405'; x.lineWidth = 7;
    for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(w / 2, h * (.2 + i * .15), w * .3, 0, Math.PI * 2); x.stroke(); }
  });
}

export function chapel(ctx) {
  const g = new THREE.Group(), R = rng(18);
  const s = sky('#020101', '#050303', '#010101'); g.add(s);
  // moonlight through the lancets: shafts of dusty light, one of them landing on the bike
  const moonDir = new THREE.Vector3(3, -9, 14).normalize();
  const rays = [-6.5, -2.5, 1.5, 5.5].map(x => {
    const b = beam('#9fb4ff', 11, .65); b.position.set(x, 4.4, -5.8);
    b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), moonDir); b.material.uniforms.k.value = .05; g.add(b); return b;
  });
  const shaft = new THREE.SpotLight('#c4d0ff', 170, 16, .2, .45, 1.2);
  const shaftDir = new THREE.Vector3(1.2, -9, 3.2).normalize();
  shaft.position.copy(BIKE).addScaledVector(shaftDir, -8.5); shaft.target.position.copy(BIKE).setY(0);
  if (!coarse) { shaft.castShadow = true; shaft.shadow.mapSize.set(1024, 1024); shaft.shadow.bias = -.0005; shaft.shadow.normalBias = .02; }
  g.add(shaft, shaft.target);
  const shaftBeam = beam('#c9d4ff', 8.6, 1.35); shaftBeam.position.copy(shaft.position);
  shaftBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), shaftDir);
  const fill = new THREE.PointLight('#ffae5c', 3.5, 6, 1.6); fill.position.set(-1.6, .9, 1.9); g.add(fill); shaftBeam.material.uniforms.k.value = .06; g.add(shaftBeam);
  // dust drifting in the light
  const D = coarse ? 400 : 900, dp = new Float32Array(D * 3), ds = Array.from({ length: D }, () => [(R() - .5) * 9, R() * 5, -4.5 + R() * 6, R() * 6]);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#e8dcc4', size: .012, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); dust.frustumCulled = false; g.add(dust);

  const flameT = glowTex('rgba(255,178,90,1)'), flames = [], candleLights = [];
  const chand = new THREE.PointLight('#ffb35a', 0, 8, 1.4), oil = new THREE.PointLight('#ffb35a', 0, 5, 1.6); g.add(chand, oil);
  let glassM = null, lampFlames = [];
  const bolt = makeLightning(g, s, ctx.key, new THREE.Vector3(0, 0, -12));

  const ready = Promise.all([loadSet('chapel', ctx.onProgress), envFrom('sets/chapel_env.jpg', ctx.renderer)]).then(([[gltf, fx], env]) => {
    const root = gltf.scene;
    root.traverse(o => { if (!o.isMesh) return; o.castShadow = !/floor|runner|glass|outside|ceiling/i.test(o.name); o.receiveShadow = true; if (o.material?.map) o.material.map.anisotropy = 8; });
    g.add(root);
    set.envTex = env;
    const glassT = stainedGlass();
    glassM = new THREE.MeshBasicMaterial({ map: glassT, toneMapped: false, side: THREE.DoubleSide }); glassM.color.setScalar(1.2);
    glassT.wrapS = glassT.wrapT = THREE.RepeatWrapping;
    findAll(root, /^fx_glass/).forEach(o => {
      // planar UVs from world position: panes facing +Z use x, panes facing +X use z (the rose and end lancets)
      o.updateWorldMatrix(true, false);
      const g2 = o.geometry, P = g2.attributes.position, N = g2.attributes.normal, uv = new Float32Array(P.count * 2), v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(N, i).applyMatrix3(nm);
        uv[i * 2] = (Math.abs(n.x) > Math.abs(n.z) ? v.z : v.x) * .85; uv[i * 2 + 1] = v.y * .42;
      }
      g2.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      o.material = glassM; o.castShadow = false;
    });
    findAll(root, /chapel_brick/).forEach(o => { if (o.material?.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(.42); } });
    lampFlames = findAll(root, /(candleholders_flame|oil_lamp_flame)/).filter(o => o.isMesh);
    lampFlames.forEach(o => { o.material = hot('#ffb35a', 3); o.castShadow = false; });
    (fx.fx_flame || []).forEach(p => { const f = sprite(flameT, .1, { blending: THREE.AdditiveBlending, toneMapped: false }); f.material.color.setScalar(2.4); f.position.set(...p); g.add(f); flames.push(f); });
    // one warm light per cluster of candles
    const buckets = {};
    (fx.fx_flame || []).forEach(p => { const k = Math.round(p[0] / 2) + ',' + Math.round(p[2] / 2); (buckets[k] ||= []).push(p); });
    Object.values(buckets).slice(0, coarse ? 3 : 6).forEach(ps => {
      const c = ps.reduce((a, p) => a.add(new THREE.Vector3(...p)), new THREE.Vector3()).divideScalar(ps.length);
      const L = new THREE.PointLight('#ffa64d', 1.2 + ps.length * .25, 4.5, 1.6); L.position.copy(c).y += .25; g.add(L); candleLights.push(L);
    });
    const cp = fx.fx_chandelier?.[0]; if (cp) chand.position.set(...cp);
    const op = fx.fx_oil_lamp?.[0]; if (op) oil.position.set(...op);
  });

  let hush = 0;
  const set = {
    group: g, ready, envTex: null,
    look: { fog: ['#050303', 8, 24], env: .35, key: ['#8fa6d8', 1.6], keyPos: [-3, 9, -14], shadowBox: 11, rim: ['#ffb35a', .8], hemi: ['#221820', '#030202', .14], shadow: .6, exp: 1.25, bloom: .95, thr: 1.0, horror: true },
    cue() { bolt.strike(); hush = 1.4; },
    update(t, dt) {
      hush = decay(hush, dt, .6);
      const k = bolt.update(dt, set.look.key[1]);
      const dim = 1 - Math.min(1, hush) * .85;                         // the candles gutter when the storm hits
      flames.forEach((f, i) => { const a = (.85 + .15 * Math.sin(t * 13 + i * 7.1) + .08 * Math.sin(t * 29 + i)) * (.35 + .65 * dim); f.scale.set(.1 * a, .14 * a, 1); });
      candleLights.forEach((L, i) => { L.userData.b ??= L.intensity; L.intensity = L.userData.b * (.85 + .15 * Math.sin(t * 11 + i * 3)) * dim; });
      fill.intensity = (3.5 + Math.sin(t * 10) * .35) * dim;
      chand.intensity = (3 + Math.sin(t * 9) * .3) * dim; oil.intensity = (1.6 + Math.sin(t * 12) * .2) * dim;
      if (glassM) glassM.color.setScalar(1.2 + k * 3.5);
      rays.forEach((b, i) => { b.material.uniforms.k.value = .045 + .012 * Math.sin(t * .5 + i) + k * .25; });
      shaft.intensity = 170 + k * 300; shaftBeam.material.uniforms.k.value = .08 + .012 * Math.sin(t * .7) + k * .2;
      for (let i = 0; i < D; i++) { const [x, y, z, p] = ds[i]; dp.set([x + Math.sin(t * .15 + p) * .3, (y + t * .025) % 5 + .05, z + Math.cos(t * .12 + p) * .3], i * 3); }
      dg.attributes.position.needsUpdate = true;
    },
  };
  return set;
}
