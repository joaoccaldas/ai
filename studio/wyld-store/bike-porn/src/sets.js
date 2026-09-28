import * as THREE from 'three';
import { lakeHouse as lake, chapel as church } from './horror.js';
import { rng, C, std, sky, ground, canvasTex, glowTex, sprite, beam, stickerTextures, stars, hot, makeTree, candle, flicker, swayMaterial } from './kit.js';

// Movie sets: one themed scene per film. Everything is procedural (no extra downloads)
// except the sticker art, which comes from the Upcoming page's own sprite.
// Each set: { group, look, update(t, dt), cue() }. cue() fires the trailer's climax moment.
// The bike stands at the origin facing +x, wheels on y = 0; the camera mostly looks from +z.

const decay = (v, dt, k = 1.4) => Math.max(0, v - dt * k);

// ------------------------------------------------------------------ Aero Glam · The Alien — crop circle abduction
function ufo() {
  const g = new THREE.Group(), R = rng(11);
  const s = sky('#010308', '#0b2416', '#010201'); g.add(s, stars(R, 1600), ground('#121a0b', { roughness: 1 }));
  for (const r of [1.55, 2.35, 3.15]) { const ring = new THREE.Mesh(new THREE.RingGeometry(r - .14, r, 128), std('#3d4a1b', { roughness: 1 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .003; ring.receiveShadow = true; g.add(ring); }
  // wheat field, swaying
  const N = 3200, wheatM = std('#ffffff', { roughness: 1 }), uT = swayMaterial(wheatM, .08);
  const wg = new THREE.BoxGeometry(.014, .55, .014); wg.translate(0, .275, 0);
  const wheat = new THREE.InstancedMesh(wg, wheatM, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const a = R() * Math.PI * 2, d = 3.5 + Math.pow(R(), .7) * 9;
    e.set((R() - .5) * .25, R() * 3, (R() - .5) * .25); q.setFromEuler(e);
    wheat.setMatrixAt(i, m4.compose(v.set(Math.cos(a) * d, 0, Math.sin(a) * d), q, sc.set(1, .7 + R() * .7, 1)));
    wheat.setColorAt(i, C(['#8c8a3c', '#a39a4a', '#6e7430'][i % 3]));
  }
  wheat.receiveShadow = true; g.add(wheat);
  // the saucer
  const ship = new THREE.Group(); ship.position.set(.3, 2.6, -.6); g.add(ship);
  const hull = new THREE.Mesh(new THREE.LatheGeometry([[0, .14], [.5, .11], [1.05, .03], [1.18, 0], [1.05, -.05], [.6, -.13], [0, -.17]].map(p => new THREE.Vector2(...p)), 64),
    new THREE.MeshPhysicalMaterial({ color: '#b9c4cc', metalness: 1, roughness: .18, clearcoat: 1 }));
  hull.castShadow = true; ship.add(hull);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#39ff88', emissive: '#1a8f4a', emissiveIntensity: 1.2, roughness: .05, transparent: true, opacity: .85 }));
  dome.position.y = .12; ship.add(dome);
  const belly = new THREE.Mesh(new THREE.CircleGeometry(.5, 48), hot('#39ff88', 3)); belly.rotation.x = Math.PI / 2; belly.position.y = -.172; ship.add(belly);
  const bulbs = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), hot(['#39ff88', '#ff5fa2', '#a98bff'][i % 3], 3)); b.position.set(Math.cos(a) * 1.1, -.01, Math.sin(a) * 1.1); ship.add(b); bulbs.push(b); }
  const tractor = beam('#39ff88', 2.55, 1.35); tractor.position.copy(ship.position); tractor.position.y -= .17; g.add(tractor);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.35, 64), new THREE.MeshBasicMaterial({ map: glowTex('rgba(57,255,136,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(.3, .006, -.6); g.add(pool);
  const green = new THREE.PointLight('#39ff88', 5, 7, 1.4); green.position.set(.3, 2.2, -.6); g.add(green);
  // particles drifting up the beam
  const P = 160, pp = new Float32Array(P * 3), seeds = [];
  for (let i = 0; i < P; i++) seeds.push([R() * Math.PI * 2, Math.sqrt(R()) * 1.1, R() * 2.4, .2 + R() * .4]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  g.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: '#b6ff5a', size: .03, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })));
  let flare = 0;
  return {
    group: g,
    look: { fog: ['#0b2416', 6, 20], env: .35, key: ['#d9ffe0', 1.6], rim: ['#7b4fd6', 2.6], hemi: ['#39ff88', '#050805', .2], shadow: .55, exp: 1.05, bloom: 1.0 },
    cue() { flare = 1.4; },
    update(t, dt) {
      flare = decay(flare, dt, .7);
      uT.value = t;
      ship.position.y = 2.6 + Math.sin(t * .8) * .06; ship.rotation.y = t * .6; ship.rotation.z = Math.sin(t * .5) * .04;
      bulbs.forEach((b, i) => b.material.color.set(['#39ff88', '#ff5fa2', '#a98bff'][i % 3]).multiplyScalar(.6 + 2.6 * Math.max(0, Math.sin(t * 6 - i * .9)) + flare * 3));
      tractor.material.uniforms.k.value = .16 + .06 * Math.sin(t * 5) + flare * .35;
      green.intensity = 5 + Math.sin(t * 5) * 1.2 + flare * 30;
      pool.material.opacity = .8 + flare * .2;
      for (let i = 0; i < P; i++) { const [a, r, y0, sp] = seeds[i]; const y = (y0 + t * sp * (1 + flare * 3)) % 2.4; pp.set([.3 + Math.cos(a + t * .3) * r * (1 - y / 3), y, -.6 + Math.sin(a + t * .3) * r * (1 - y / 3)], i * 3); }
      pg.attributes.position.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------ Couture · The Supermodel — the runway
function runway() {
  const g = new THREE.Group(), R = rng(12);
  g.add(sky('#050408', '#140c12', '#030203'), ground('#0b090c', { roughness: .25, metalness: .4 }));
  const walk = new THREE.Mesh(new THREE.BoxGeometry(18, .1, 1.5), new THREE.MeshPhysicalMaterial({ color: '#f3eee8', roughness: .18, clearcoat: 1, clearcoatRoughness: .05 }));
  walk.position.y = -.05; walk.receiveShadow = true; g.add(walk);
  for (const z of [-.77, .77]) { const strip = new THREE.Mesh(new THREE.BoxGeometry(18, .015, .025), hot('#ffd9a0', 2.4)); strip.position.set(0, .004, z); g.add(strip); }
  const wall = canvasTex(1600, 640, (x, w, h) => {
    const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#120a10'); bg.addColorStop(1, '#050305'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
    const gold = x.createLinearGradient(0, h * .2, 0, h * .8); gold.addColorStop(0, '#fff1c9'); gold.addColorStop(.5, '#e3b76a'); gold.addColorStop(1, '#9a6b1f');
    x.font = '400 300px "Inknut Antiqua"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = gold; x.fillText('WYLD', w / 2, h * .46);
    x.font = '700 120px Caveat'; x.fillStyle = '#ff8fbf'; x.fillText('couture', w / 2 + 330, h * .8);
    x.font = '600 26px system-ui'; x.fillStyle = 'rgba(255,241,201,.6)'; x.fillText('S S  2 7   ·   T H E   S P E E D   C O L L E C T I O N', w / 2, h * .93);
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshBasicMaterial({ map: wall, toneMapped: false })); back.position.set(0, 2, -4.4); g.add(back);
  // tiered front rows on the far side
  const seatM = std('#140f13', { roughness: .7 }), bodyM = std('#1a1418', { roughness: .8 }), skinM = std('#2a2226', { roughness: .8 });
  const body = new THREE.CapsuleGeometry(.13, .38, 4, 8), head = new THREE.SphereGeometry(.1, 12, 10), heads = [];
  for (let r = 0; r < 3; r++) {
    const z = -1.45 - r * .6, y = r * .28;
    const tier = new THREE.Mesh(new THREE.BoxGeometry(14, y + .02, .6), seatM); tier.position.set(0, y / 2, z); tier.receiveShadow = true; g.add(tier);
    for (let x = -6.6; x <= 6.6; x += .55 + R() * .1) {
      const b = new THREE.Mesh(body, bodyM); b.position.set(x, y + .42, z); b.castShadow = true; g.add(b);
      const hd = new THREE.Mesh(head, skinM); hd.position.set(x, y + .8, z + .02); g.add(hd); heads.push(hd);
    }
  }
  // paparazzi flashes
  const flashT = glowTex('rgba(255,255,255,1)'), flashes = [];
  for (let i = 0; i < 12; i++) { const f = sprite(flashT, .5, { blending: THREE.AdditiveBlending, toneMapped: false }); f.material.color.setScalar(4); f.visible = false; g.add(f); flashes.push({ f, t: 0 }); }
  const pop = new THREE.PointLight('#ffffff', 0, 9, 1.2); g.add(pop);
  const spots = [-1.6, 0, 1.6].map((x, i) => { const b = beam(i === 1 ? '#fff3e0' : '#ffd1e6', 4.4, .7); b.position.set(x, 4.2, .2); b.rotation.z = -x * .12; g.add(b); return b; });
  let storm = 0;
  const fire = () => {
    const slot = flashes.find(s => s.t <= 0); if (!slot) return;
    const hd = heads[Math.floor(R() * heads.length)];
    slot.f.position.copy(hd.position).add(new THREE.Vector3(.12, .02, .15)); slot.f.visible = true; slot.t = .07;
    pop.position.copy(slot.f.position); pop.intensity = 26;
  };
  return {
    group: g,
    look: { fog: ['#140c12', 6, 18], env: .5, key: ['#fff1dc', 2.4], rim: ['#ffd1e6', 2.6], hemi: ['#ffd1e6', '#050305', .18], shadow: .55, exp: 1.05, bloom: .8, thr: 1.8 },
    cue() { storm = 2.2; },
    update(t, dt) {
      storm = decay(storm, dt, 1);
      if (Math.random() < dt * (1.6 + storm * 30)) fire();
      flashes.forEach(s => { if (s.t > 0 && (s.t -= dt) <= 0) s.f.visible = false; });
      pop.intensity = Math.max(0, pop.intensity - dt * 260);
      spots.forEach((b, i) => { b.material.uniforms.k.value = .17 + .03 * Math.sin(t * 1.3 + i); b.rotation.x = Math.sin(t * .4 + i * 2) * .08; });
    },
  };
}

// ------------------------------------------------------------------ Offshore · The Surfer — golden hour beach
function beach() {
  const g = new THREE.Group(), R = rng(2);
  g.add(sky('#3a7de0', '#ffd9b0', '#8fe7dc'), ground('#efd9ab', { roughness: 1 }));
  const sun = sprite(glowTex('rgba(255,214,150,1)'), 7, { fog: false, toneMapped: false }); sun.position.set(-3, 2.2, -18); g.add(sun);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48), hot('#fff1c9', 1.6, { fog: false })); disc.position.set(-3, 2.2, -18.5); g.add(disc);
  const seaGeo = new THREE.PlaneGeometry(40, 18, 80, 36); seaGeo.rotateX(-Math.PI / 2); seaGeo.translate(0, .02, -11);
  const base = seaGeo.attributes.position.array.slice();
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhysicalMaterial({ color: '#2fb6c4', roughness: .12, metalness: .1, clearcoat: 1, transparent: true, opacity: .92 }));
  sea.receiveShadow = true; g.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(40, .35), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, .03, -2.05); g.add(foam);
  const trunkM = std('#8a6440', { roughness: .9 }), leafM = std('#3f8f4a', { roughness: .7, side: THREE.DoubleSide });
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(.25, .5, 0, 1.3); leafShape.quadraticCurveTo(-.25, .5, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 8); leafGeo.rotateX(-Math.PI / 2 + .5);
  const fronds = [];
  [[-3.4, -2.9, .25], [3.8, -3.6, -.2], [-5.6, -4.8, .15]].forEach(([x, z, lean], k) => {
    const p = new THREE.Group(); p.position.set(x, 0, z);
    let y = 0, px = 0;
    for (let i = 0; i < 10; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(.075 - i * .003, .085 - i * .003, .32, 10), trunkM); px += lean * .06 * i * .3; seg.position.set(px, y + .16, 0); seg.rotation.z = -lean * .5; seg.castShadow = true; p.add(seg); y += .3; }
    const crown = new THREE.Group(); crown.position.set(px, y, 0); p.add(crown); fronds.push(crown);
    for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(leafGeo, leafM); l.rotation.y = i / 9 * Math.PI * 2 + k; l.scale.setScalar(1 + R() * .3); l.castShadow = true; crown.add(l); }
    g.add(p);
  });
  const board = new THREE.Mesh(new THREE.CapsuleGeometry(.24, 1.5, 8, 24), new THREE.MeshPhysicalMaterial({ color: '#fff6ea', roughness: .2, clearcoat: 1 }));
  board.scale.z = .12; board.position.set(-2.4, .95, -2.3); board.rotation.set(.1, .5, .12); board.castShadow = true; g.add(board);
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(.07, 1.5, 6, 12), new THREE.MeshPhysicalMaterial({ color: '#55d8d3', roughness: .2, clearcoat: 1 }));
  stripe.scale.z = .5; stripe.position.copy(board.position); stripe.rotation.copy(board.rotation); stripe.translateZ(.02); g.add(stripe);
  // gulls
  const gullM = new THREE.MeshBasicMaterial({ color: '#2a2a33', side: THREE.DoubleSide });
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, .18, .04, -.05, .18, .04, .05], 3));
  const gulls = Array.from({ length: 6 }, () => { const b = new THREE.Group(), l = new THREE.Mesh(wing, gullM), r = new THREE.Mesh(wing, gullM); r.scale.x = -1; b.add(l, r); b.userData = { l, r, a: R() * 6, rad: 4 + R() * 5, h: 3 + R() * 2, s: .15 + R() * .1 }; g.add(b); return b; });
  let flare = 0;
  return {
    group: g,
    look: { fog: ['#ffd9b0', 7, 22], env: 1, key: ['#ffe2b8', 2.6], rim: ['#8fe7dc', 1.4], hemi: ['#bfe6ff', '#e0c48e', .5], shadow: .38, exp: 1.02, bloom: .35, thr: 2.2 },
    cue() { flare = 1; },
    update(t, dt) {
      flare = decay(flare, dt, .5);
      const a = seaGeo.attributes.position;
      for (let i = 0; i < a.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; a.array[i * 3 + 1] = .02 + (.05 + flare * .08) * Math.sin(x * .9 + t * 1.1) * Math.cos(z * .7 - t * .8) + .03 * Math.sin(z * 2.2 + t * 1.7); }
      a.needsUpdate = true; seaGeo.computeVertexNormals();
      foam.position.z = -2.05 + Math.sin(t * .9) * .18 + flare * .4; foam.material.opacity = .55 + .3 * Math.sin(t * .9 + 1);
      sun.scale.setScalar(7 + flare * 9);
      fronds.forEach((f, i) => { f.rotation.z = Math.sin(t * .9 + i) * .05; f.rotation.x = Math.cos(t * .7 + i) * .04; });
      gulls.forEach(b => { const u = b.userData, an = u.a + t * u.s; b.position.set(Math.cos(an) * u.rad, u.h + Math.sin(t + u.a) * .2, -5 + Math.sin(an) * u.rad * .5); b.rotation.y = -an; u.l.rotation.x = Math.sin(t * 9 + u.a) * .5; u.r.rotation.x = u.l.rotation.x; });
    },
  };
}

// ------------------------------------------------------------------ Hex · The Witch — moonlit woods
function forest() {
  const g = new THREE.Group(), R = rng(14);
  const s = sky('#040208', '#1a0f2a', '#020104'); g.add(s, stars(R, 700), ground('#120d16', { roughness: 1 }));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), hot('#f6f0d8', 1.5, { fog: false })); moon.position.set(4.5, 6, -19); g.add(moon);
  const halo = sprite(glowTex('rgba(200,190,255,.7)'), 9, { fog: false }); halo.position.set(4.5, 6, -18.8); g.add(halo);
  const bark = std('#0e0a10', { roughness: 1 });
  for (let i = 0; i < 16; i++) { const a = Math.PI * (1.05 + R() * .9), d = 3.2 + R() * 5; const tr = makeTree(R, bark); tr.position.set(Math.cos(a) * d * 1.3, 0, Math.sin(a) * d); tr.rotation.y = R() * 6; g.add(tr); }
  for (const x of [-5.5, 5.8]) { const tr = makeTree(R, bark, 5); tr.position.set(x, 0, .8); g.add(tr); }
  // cauldron on a fire
  const cz = new THREE.Group(); cz.position.set(-1.9, 0, -1.5); g.add(cz);
  const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, .08], [.3, .1], [.42, .28], [.4, .48], [.33, .56], [.38, .6], [.36, .62]].map(p => new THREE.Vector2(...p)), 32), std('#141414', { metalness: .6, roughness: .45, side: THREE.DoubleSide }));
  pot.castShadow = true; cz.add(pot);
  const brew = new THREE.Mesh(new THREE.CircleGeometry(.34, 32), hot('#b6ff5a', 2.2)); brew.rotation.x = -Math.PI / 2; brew.position.y = .56; cz.add(brew);
  for (let i = 0; i < 5; i++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .6, 6), std('#2a1a10')); log.rotation.set(Math.PI / 2, 0, i / 5 * Math.PI); log.position.y = .05; cz.add(log); }
  const fireT = glowTex('rgba(255,140,50,1)'), fire = [];
  for (let i = 0; i < 4; i++) { const f = sprite(fireT, .35, { blending: THREE.AdditiveBlending, toneMapped: false }); f.material.color.setScalar(2); f.position.set((i - 1.5) * .1, .12, 0); cz.add(f); fire.push(f); }
  const potion = new THREE.PointLight('#b6ff5a', 4, 5, 1.3); potion.position.set(-1.9, 1, -1.5); g.add(potion);
  const B = 70, bp = new Float32Array(B * 3), bs = Array.from({ length: B }, () => [R() * 6, (R() - .5) * .5, (R() - .5) * .5, .3 + R() * .5]);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  g.add(new THREE.Points(bg, new THREE.PointsMaterial({ color: '#d9ff9a', size: .035, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  // floating candles
  const flames = [], candles = [];
  for (let i = 0; i < 18; i++) { const c = candle(.12 + R() * .1); c.group.position.set((R() - .5) * 6, 1.4 + R() * 1.4, -.6 - R() * 2.4); c.group.userData = { y: c.group.position.y, p: R() * 6 }; g.add(c.group); flames.push(c.flame); candles.push(c.group); }
  // broom
  const broom = new THREE.Group(); broom.position.set(1.9, 0, -1.3); broom.rotation.z = .32; g.add(broom);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, 1.5, 8), std('#5a3a22')); stick.position.y = .95; broom.add(stick);
  const bristle = new THREE.Mesh(new THREE.ConeGeometry(.14, .35, 12, 1, true), std('#b08a4a', { side: THREE.DoubleSide })); bristle.position.y = .17; broom.add(bristle);
  // bats
  const batM = new THREE.MeshBasicMaterial({ color: '#050307', side: THREE.DoubleSide });
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, .16, .05, -.06, .12, -.02, .06, 0, 0, 0, .12, -.02, .06, .05, 0, .07], 3));
  const bats = Array.from({ length: 9 }, () => { const b = new THREE.Group(), l = new THREE.Mesh(wing, batM), r = new THREE.Mesh(wing, batM); r.scale.x = -1; b.add(l, r); b.userData = { l, r, a: R() * 6, rad: 2.5 + R() * 3, h: 2.6 + R() * 1.6, s: .5 + R() * .5 }; g.add(b); return b; });
  // purple ground mist
  const mistT = glowTex('rgba(140,110,200,.28)');
  const mist = Array.from({ length: 8 }, () => { const m = sprite(mistT, 3 + R() * 3); m.position.set((R() - .5) * 10, .3, -1 - R() * 5); m.userData = { x: m.position.x, p: R() * 6 }; g.add(m); return m; });
  let boom = 0;
  return {
    group: g,
    look: { fog: ['#1a0f2a', 4, 15], env: .35, key: ['#c9c2ff', 1.8], rim: ['#b6ff5a', 2.3], hemi: ['#7b4fd6', '#050308', .22], shadow: .6, exp: 1.08, bloom: .9 },
    cue() { boom = 1.5; },
    update(t, dt) {
      boom = decay(boom, dt, .8);
      flicker(flames, t);
      candles.forEach(c => { c.position.y = c.userData.y + Math.sin(t * .8 + c.userData.p) * .08; });
      fire.forEach((f, i) => f.scale.set(.3 + .08 * Math.sin(t * 11 + i * 2), .4 + .12 * Math.sin(t * 13 + i), 1));
      potion.intensity = 4 + Math.sin(t * 9) * .6 + boom * 28;
      brew.material.color.set('#b6ff5a').multiplyScalar(2.2 + boom * 4);
      for (let i = 0; i < B; i++) { const [o, x, z, sp] = bs[i]; const y = ((o + t * sp * (1 + boom * 4)) % 1.6); bp.set([-1.9 + x * (1 + y), .6 + y, -1.5 + z * (1 + y)], i * 3); }
      bg.attributes.position.needsUpdate = true;
      bats.forEach(b => { const u = b.userData, an = u.a + t * u.s; b.position.set(Math.cos(an) * u.rad, u.h + Math.sin(t * 2 + u.a) * .25, -2 + Math.sin(an) * u.rad * .6); b.rotation.y = -an; u.l.rotation.z = Math.sin(t * 16 + u.a) * .7; u.r.rotation.z = -u.l.rotation.z; });
      mist.forEach(m => { m.position.x = m.userData.x + Math.sin(t * .1 + m.userData.p) * .8; });
    },
  };
}

// ------------------------------------------------------------------ Stay Weird · The Weirdo — sticker dream
function stickers() {
  const g = new THREE.Group(), R = rng(5);
  g.add(sky('#b9a2f0', '#f8ebae', '#c9b6f4'));
  const chk = canvasTex(256, 256, (x) => { x.fillStyle = '#f8ebae'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#c9b6f4'; x.fillRect(0, 0, 128, 128); x.fillRect(128, 128, 128, 128); });
  chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(24, 24);
  const fgeo = new THREE.PlaneGeometry(44, 44, 120, 120); fgeo.rotateX(-Math.PI / 2);
  const fp = fgeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), z = fp.getZ(i); fp.setY(i, .25 * Math.sin(x * .8) * Math.sin(z * .7) * THREE.MathUtils.smoothstep(Math.hypot(x, z), 2, 5)); }
  fgeo.computeVertexNormals();
  const floor = new THREE.Mesh(fgeo, new THREE.MeshStandardMaterial({ map: chk, roughness: .55 })); floor.receiveShadow = true; g.add(floor);
  const tex = stickerTextures(['alien', 'ghost', 'witch', 'doll', 'star', 'heart', 'smile', 'flower']);
  const spots = [['alien', -2.6, 1.5, -2.6, 1.3], ['ghost', 2.8, 1.35, -2.4, 1.45], ['witch', -1.2, 2.5, -3.6, 1.2], ['doll', 1.4, 2.5, -3.4, 1.15], ['star', -3.8, .7, -1.4, .75], ['heart', 3.9, .7, -1.2, .7], ['smile', 0, 3.3, -4.4, .9], ['flower', -4.2, 2.3, -3.8, .85], ['star', 4.2, 2.5, -3.6, .6]];
  const floaters = spots.map(([id, x, y, z, s]) => { const sp = sprite(tex[id], s); sp.position.set(x, y, z); sp.userData = { y, p: R() * 6 }; g.add(sp); return sp; });
  const banner = canvasTex(1024, 300, (x, w, h) => {
    x.font = '400 190px Chewy'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineJoin = 'round'; x.lineWidth = 26; x.strokeStyle = '#1e1826'; x.strokeText('STAY WEIRD', w / 2, h / 2 + 16);
    x.fillStyle = '#ff5fa2'; x.fillText('STAY WEIRD', w / 2, h / 2 + 8);
  });
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.35), new THREE.MeshBasicMaterial({ map: banner, transparent: true, depthWrite: false })); ban.position.set(0, 1.9, -5.4); g.add(ban);
  const note = canvasTex(512, 160, (x, w, h) => { x.font = '700 76px Caveat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ff5fa2'; x.fillText('i am warning you ♡', w / 2, h / 2); });
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .5), new THREE.MeshBasicMaterial({ map: note, transparent: true, depthWrite: false })); nm.position.set(2.3, .35, .9); nm.rotation.set(-.5, -.5, .08); g.add(nm);
  let spin = 0;
  return {
    group: g,
    look: { fog: ['#f8ebae', 7, 20], env: .9, key: ['#fff8e6', 1.7], rim: ['#ff8cc0', 1.6], hemi: ['#ffffff', '#c9b6f4', .4], shadow: .3, exp: .95, bloom: .15, thr: 2.4 },
    cue() { spin = 1.2; },
    update(t, dt) {
      spin = decay(spin, dt, .6);
      floaters.forEach(s => { s.position.y = s.userData.y + Math.sin(t * .9 + s.userData.p) * (.12 + spin * .4); s.material.rotation = Math.sin(t * .7 + s.userData.p) * .15 + spin * Math.sin(t * 6 + s.userData.p) * 1.2; });
      ban.scale.setScalar(1 + spin * .15 * Math.sin(t * 12));
    },
  };
}

// ------------------------------------------------------------------ Sunny Side · The Babysitter — midsummer meadow
function meadow() {
  const g = new THREE.Group(), R = rng(16);
  const s = sky('#7cc8ff', '#fff6d6', '#bfe3a0'); g.add(s, ground('#86b84f', { roughness: 1 }));
  const sun = sprite(glowTex('rgba(255,250,220,1)'), 8, { fog: false, toneMapped: false }); sun.position.set(6, 9, -16); g.add(sun);
  const grassM = std('#ffffff', { roughness: .9 }), uT = swayMaterial(grassM, .05);
  const gg = new THREE.ConeGeometry(.028, .26, 4); gg.translate(0, .13, 0);
  const G = 3200, grass = new THREE.InstancedMesh(gg, grassM, G), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < G; i++) { const a = R() * Math.PI * 2, d = 1.25 + Math.pow(R(), .8) * 11; e.set((R() - .5) * .3, 0, (R() - .5) * .3); q.setFromEuler(e); grass.setMatrixAt(i, m4.compose(v.set(Math.cos(a) * d, 0, Math.sin(a) * d), q, sc.setScalar(.6 + R() * .9))); grass.setColorAt(i, C(['#6fa83f', '#86b84f', '#5a9434', '#9cc45a'][i % 4])); }
  g.add(grass);
  const F = 900, flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(.022, 8, 6), std('#ffffff', { roughness: .6 }), F);
  for (let i = 0; i < F; i++) { const a = R() * Math.PI * 2, d = 1.3 + Math.pow(R(), .8) * 9; flowers.setMatrixAt(i, m4.compose(v.set(Math.cos(a) * d, .18 + R() * .12, Math.sin(a) * d), q.identity(), sc.setScalar(.7 + R() * .8))); flowers.setColorAt(i, C(['#ffffff', '#ff8fbf', '#ffd84a', '#8fc7ff', '#e9cde8'][i % 5])); }
  g.add(flowers);
  // maypole, turning slowly with no one dancing
  const pole = new THREE.Group(); pole.position.set(3.3, 0, -3.8); g.add(pole);
  const pm = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 3.4, 12), std('#f7f3ea')); pm.position.y = 1.7; pm.castShadow = true; pole.add(pm);
  const leafy = std('#3f7f2a', { roughness: .8 });
  for (const [y, r] of [[3.25, .22], [2.4, .6]]) { const w = new THREE.Mesh(new THREE.TorusGeometry(r, .06, 8, 32), leafy); w.rotation.x = Math.PI / 2; w.position.y = y; pole.add(w); for (let i = 0; i < 10; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), std(['#ff8fbf', '#ffffff', '#ffd84a'][i % 3])); const a = i / 10 * Math.PI * 2; fl.position.set(Math.cos(a) * r, y + .04, Math.sin(a) * r); pole.add(fl); } }
  const ribbons = new THREE.Group(); pole.add(ribbons);
  ['#ff8fbf', '#8fe7dc', '#ffd84a', '#e9cde8', '#ffffff', '#ff3d8e', '#5fd8d3', '#c9b6f4'].forEach((c, i) => {
    const a = i / 8 * Math.PI * 2, end = new THREE.Vector3(Math.cos(a) * 1.5, .05, Math.sin(a) * 1.5);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 3.2, 0), new THREE.Vector3(end.x * .6, 1.6, end.z * .6), end);
    ribbons.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .012, 4), std(c, { roughness: .5 })));
  });
  // Falu-red cottage with one window that should not be lit
  const house = new THREE.Group(); house.position.set(-2.6, 0, -5.2); house.rotation.y = .35; g.add(house);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.7), std('#8e1f1b', { roughness: .85 })); walls.position.y = .8; walls.castShadow = walls.receiveShadow = true; house.add(walls);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-1.05, 0); roofShape.lineTo(0, .85); roofShape.lineTo(1.05, 0); roofShape.lineTo(-1.05, 0);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 2.6, bevelEnabled: false }), std('#2b2b2e', { roughness: .7 }));
  roof.rotation.y = Math.PI / 2; roof.position.set(-1.3, 1.6, 0); roof.castShadow = true; house.add(roof);
  const white = std('#f7f3ea');
  for (const x of [-1.2, 1.2]) for (const z of [-.85, .85]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.62, .08), white); c.position.set(x, .8, z); house.add(c); }
  const glassM = std('#1a2230', { roughness: .1, metalness: .2 }), ghostM = hot('#fff6e6', .6);
  [[-.6, 1], [.6, 1]].forEach(([x, y], i) => { const fr = new THREE.Mesh(new THREE.BoxGeometry(.5, .56, .04), white); fr.position.set(x, y, .86); house.add(fr); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.4, .46), i ? ghostM : glassM); gl.position.set(x, y, .885); house.add(gl); });
  const door = new THREE.Mesh(new THREE.BoxGeometry(.5, .95, .04), white); door.position.set(0, .475, .86); house.add(door);
  // the swing that swings by itself
  const swing = new THREE.Group(); swing.position.set(1.4, 0, -2.4); swing.rotation.y = -.2; g.add(swing);
  const wood = std('#7a5a3a', { roughness: .9 });
  for (const x of [-.7, .7]) for (const z of [-.35, .35]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.1, 6), wood); l.position.set(x, 1, z * .5); l.rotation.x = z > 0 ? -.33 : .33; l.castShadow = true; swing.add(l); }
  const beamTop = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.6, 8), wood); beamTop.rotation.z = Math.PI / 2; beamTop.position.y = 1.98; swing.add(beamTop);
  const seat = new THREE.Group(); seat.position.y = 1.98; swing.add(seat);
  for (const x of [-.22, .22]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1.55, 4), std('#d8cfbf')); r.position.set(x, -.78, 0); seat.add(r); }
  const board = new THREE.Mesh(new THREE.BoxGeometry(.55, .04, .2), wood); board.position.y = -1.56; board.castShadow = true; seat.add(board);
  // the pram
  const pram = new THREE.Group(); pram.position.set(-1.5, 0, -1.6); pram.rotation.y = .5; g.add(pram);
  const tub = new THREE.Mesh(new THREE.BoxGeometry(.62, .3, .36), std('#f4f0ea', { roughness: .5 })); tub.position.y = .45; tub.castShadow = true; pram.add(tub);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .36, 16, 1, false, 0, Math.PI), std('#e9cde8', { side: THREE.DoubleSide })); hood.rotation.x = Math.PI / 2; hood.rotation.y = Math.PI / 2; hood.position.set(-.22, .6, 0); pram.add(hood);
  for (const x of [-.22, .22]) for (const z of [-.2, .2]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.1, .018, 6, 20), std('#1e1e22')); w.position.set(x, .12, z); pram.add(w); }
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .5, 6), std('#c9ccd1', { metalness: .8, roughness: .3 })); handle.position.set(.42, .7, 0); handle.rotation.z = -.6; pram.add(handle);
  const bright = { a: s.material.uniforms.a.value.clone(), h: s.material.uniforms.h.value.clone() }, dusk = { a: C('#3a0a14'), h: C('#ff7a4a') };
  let stare = 0;
  return {
    group: g,
    look: { fog: ['#fff6d6', 8, 26], env: 1.05, key: ['#fffbe8', 2.6], rim: ['#ffd1e6', 1.4], hemi: ['#e6f6ff', '#86b84f', .6], shadow: .38, exp: 1.03, bloom: .22, thr: 2.4 },
    cue() { stare = 1.6; },
    update(t, dt) {
      stare = decay(stare, dt, .6);
      const k = Math.min(1, stare);
      uT.value = t;
      ribbons.parent.rotation.y = t * .25;
      seat.rotation.x = Math.sin(t * 1.5) * .45 * (1 - k) + k * .5;
      pram.rotation.z = Math.sin(t * 2.2) * .03;
      ghostM.color.set('#fff6e6').multiplyScalar(.5 + .35 * Math.max(0, Math.sin(t * .7)) + k * 2.5);
      s.material.uniforms.a.value.copy(bright.a).lerp(dusk.a, k * .85); s.material.uniforms.h.value.copy(bright.h).lerp(dusk.h, k * .7);
    },
  };
}

const BUILDERS = { ufo, runway, beach, forest, stickers, meadow, lake, church };
const cache = {};
export function getSet(name, ctx) { return cache[name] ||= BUILDERS[name](ctx); }
