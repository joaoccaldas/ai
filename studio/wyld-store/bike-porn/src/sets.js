import * as THREE from 'three';

// Movie sets: one themed scene per livery persona. Everything is procedural (no extra downloads)
// except the sticker art, which is read from the Upcoming page's own sprite.
// Each set: { group, look, update(t, dt) }. The bike stands at the origin, wheels on y = 0.

const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const C = h => new THREE.Color(h);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
const fontsReady = document.fonts ? Promise.all(['400 80px Chewy', '700 80px Caveat', '400 80px "Inknut Antiqua"'].map(f => document.fonts.load(f).catch(() => { }))) : Promise.resolve();

// Gradient sky dome (not fogged) whose horizon matches the fog colour, so the floor melts into it.
function sky(top, horizon, bottom) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: C(top) }, h: { value: C(horizon) }, b: { value: C(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 a, h, b; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(h, a, pow(smoothstep(0.0, 0.7, y), 0.8)) : mix(h, b, smoothstep(0.0, -0.3, y)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}',
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 24), m); s.renderOrder = -1;
  return s;
}
function ground(color, o = {}) {
  const g = new THREE.Mesh(new THREE.CircleGeometry(22, 64), std(color, o));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; return g;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  fontsReady.then(() => { draw(c.getContext('2d'), w, h); t.needsUpdate = true; });
  return t;
}
function glowTex(color) {
  return canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
}
function sprite(tex, size, o = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, ...o }));
  s.scale.set(size, size, 1); return s;
}
// Soft light shaft: an open cone, bright at the source and fading out.
function beam(color, len, radius) {
  const geo = new THREE.ConeGeometry(radius, len, 32, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: C(color) }, k: { value: .22 } },
    vertexShader: 'varying float vY; varying vec3 vN, vV; void main(){ vY = uv.y; vec4 p = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'uniform vec3 c; uniform float k; varying float vY; varying vec3 vN, vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); gl_FragColor = vec4(c, k * pow(vY, 1.4) * edge); }',
  });
  return new THREE.Mesh(geo, m);
}
function heartShape(s = 1) {
  const h = new THREE.Shape();
  h.moveTo(0, -.9 * s); h.bezierCurveTo(-.2 * s, -.7 * s, -1 * s, -.25 * s, -1 * s, .25 * s);
  h.bezierCurveTo(-1 * s, .75 * s, -.4 * s, 1 * s, 0, .55 * s); h.bezierCurveTo(.4 * s, 1 * s, 1 * s, .75 * s, 1 * s, .25 * s);
  h.bezierCurveTo(1 * s, -.25 * s, .2 * s, -.7 * s, 0, -.9 * s); return h;
}
function stickerTextures(ids) {
  const out = {};
  const load = fetch('../upcoming/stickers.svg').then(r => r.text()).then(src => new DOMParser().parseFromString(src, 'image/svg+xml'));
  for (const id of ids) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; out[id] = t;
    load.then(doc => {
      const sym = doc.getElementById(id); if (!sym) return;
      const [, , vw, vh] = sym.getAttribute('viewBox').split(/\s+/).map(Number);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 ${vw + 12} ${vh + 12}" width="512" height="${Math.round(512 * (vh + 12) / (vw + 12))}">${sym.innerHTML}</svg>`;
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const img = new Image(); img.onload = () => {
        const x = c.getContext('2d'), s = Math.min(512 / img.width, 512 / img.height);
        const w = img.width * s, h = img.height * s;
        // White sticker border, like a real die-cut sticker.
        x.shadowColor = '#fff'; x.shadowBlur = 0;
        for (const [dx, dy] of [[-10, 0], [10, 0], [0, -10], [0, 10], [-7, -7], [7, 7], [-7, 7], [7, -7]]) { x.filter = 'brightness(0) invert(1)'; x.drawImage(img, (512 - w) / 2 + dx, (512 - h) / 2 + dy, w, h); }
        x.filter = 'none'; x.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
        t.needsUpdate = true; URL.revokeObjectURL(url);
      }; img.src = url;
    }).catch(() => { });
  }
  return out;
}

// ------------------------------------------------------------------ 1 · The Rockstar — main stage
function stage() {
  const g = new THREE.Group(), R = rng(1);
  g.add(sky('#0a0310', '#2a0718', '#050205'), ground('#0e070b', { roughness: .5 }));
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.2, .1, 64), std('#140c12', { roughness: .28, metalness: .3 }));
  deck.position.y = -.049; deck.receiveShadow = true; g.add(deck);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(2.15, .012, 8, 96), new THREE.MeshBasicMaterial({ color: '#ff2f92' }));
  edge.rotation.x = Math.PI / 2; edge.position.y = .002; g.add(edge);
  // LED wall
  const led = canvasTex(1024, 440, (x, w, h) => {
    x.fillStyle = '#12020b'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,47,146,.12)'; for (let i = 0; i < w; i += 8) for (let j = 0; j < h; j += 8) x.fillRect(i, j, 5, 5);
    x.font = '400 250px Chewy'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = '#ff2f92'; x.shadowBlur = 40; x.fillStyle = '#ff8cc0'; x.fillText('RIOT', w / 2, h / 2 + 12);
    x.shadowBlur = 0; x.lineWidth = 6; x.strokeStyle = '#fff6d8'; x.strokeText('RIOT', w / 2, h / 2 + 12);
  });
  const wallM = new THREE.MeshBasicMaterial({ map: led, toneMapped: false });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.75), wallM); wall.position.set(0, 1.55, -2.9); g.add(wall);
  // truss
  const steel = std('#2a2a30', { metalness: .8, roughness: .35 });
  for (const x of [-3.4, 3.4]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.18, 3.4, .18), steel); t.position.set(x, 1.7, -2.3); t.castShadow = true; g.add(t); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(7, .18, .18), steel); top.position.set(0, 3.35, -2.3); g.add(top);
  // speaker stacks
  const box = std('#0b0b0d', { roughness: .6 }), cone = std('#1c1c20', { roughness: .4, metalness: .3 });
  for (const sx of [-3.1, 3.1]) for (let k = 0; k < 2; k++) {
    const s = new THREE.Group(); s.position.set(sx, .45 + k * .9, -2.1); s.rotation.y = -Math.sign(sx) * .35;
    const b = new THREE.Mesh(new THREE.BoxGeometry(.8, .88, .6), box); b.castShadow = true; s.add(b);
    for (const [cy, r] of [[-.16, .26], [.26, .11]]) { const w = new THREE.Mesh(new THREE.CircleGeometry(r, 32), cone); w.position.set(0, cy, .301); s.add(w); const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + .025, 32), new THREE.MeshBasicMaterial({ color: '#ff2f92' })); ring.position.set(0, cy, .302); s.add(ring); }
    g.add(s);
  }
  // beams
  const beams = [];
  [-2.6, -1.2, 1.2, 2.6].forEach((x, i) => { const b = beam(i % 2 ? '#c9b6f4' : '#ff2f92', 4.2, .75); b.position.set(x, 3.3, -2.2); g.add(b); beams.push(b); });
  // confetti
  const N = 260, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(.035, .02), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), N);
  const cols = ['#ff2f92', '#ff8cc0', '#c9b6f4', '#f8ebae', '#fff6d8'].map(C), P = [];
  for (let i = 0; i < N; i++) { P.push({ x: (R() - .5) * 6, y: R() * 3.4, z: (R() - .5) * 4, s: .25 + R() * .35, r: R() * 6 }); conf.setColorAt(i, cols[i % cols.length]); }
  g.add(conf);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  return {
    group: g,
    look: { fog: ['#2a0718', 5, 16], env: .55, key: ['#ffd6ea', 2.4], rim: ['#ff2f92', 3.2], hemi: ['#ff8cc0', '#120510', .25], shadow: .6, exp: 1.05 },
    update(t, dt) {
      beams.forEach((b, i) => { b.rotation.z = Math.sin(t * .7 + i * 1.7) * .45; b.rotation.x = .35 + Math.sin(t * .5 + i) * .2; b.material.uniforms.k.value = .16 + .08 * Math.sin(t * 3 + i * 2); });
      wallM.color.setScalar(.8 + .2 * Math.sin(t * 4));
      P.forEach((p, i) => { p.y -= p.s * dt; if (p.y < 0) p.y = 3.4; e.set(t * 2 + p.r, t * 3 + p.r, 0); q.setFromEuler(e); m4.compose(v.set(p.x + Math.sin(t + p.r) * .15, p.y, p.z), q, one); conf.setMatrixAt(i, m4); });
      conf.instanceMatrix.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------ 2 · The Surfer — golden hour beach
function beach() {
  const g = new THREE.Group(), R = rng(2);
  g.add(sky('#3a7de0', '#ffd9b0', '#8fe7dc'), ground('#efd9ab', { roughness: 1 }));
  const sun = sprite(glowTex('rgba(255,214,150,1)'), 7, { fog: false }); sun.position.set(-3, 2.2, -18); g.add(sun);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48), new THREE.MeshBasicMaterial({ color: '#fff1c9', fog: false })); disc.position.set(-3, 2.2, -18.5); g.add(disc);
  const seaGeo = new THREE.PlaneGeometry(40, 18, 80, 36); seaGeo.rotateX(-Math.PI / 2); seaGeo.translate(0, .02, -11);
  const base = seaGeo.attributes.position.array.slice();
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhysicalMaterial({ color: '#2fb6c4', roughness: .12, metalness: .1, clearcoat: 1, transparent: true, opacity: .92 }));
  sea.receiveShadow = true; g.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(40, .35), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, .03, -2.05); g.add(foam);
  // palms
  const trunkM = std('#8a6440', { roughness: .9 }), leafM = std('#3f8f4a', { roughness: .7, side: THREE.DoubleSide });
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(.25, .5, 0, 1.3); leafShape.quadraticCurveTo(-.25, .5, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 8); leafGeo.rotateX(-Math.PI / 2 + .5);
  [[-3.4, -2.9, .25], [3.8, -3.6, -.2], [-5.6, -4.8, .15]].forEach(([x, z, lean], k) => {
    const p = new THREE.Group(); p.position.set(x, 0, z);
    let y = 0, px = 0;
    for (let i = 0; i < 10; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(.075 - i * .003, .085 - i * .003, .32, 10), trunkM); px += lean * .06 * i * .3; seg.position.set(px, y + .16, 0); seg.rotation.z = -lean * .5; seg.castShadow = true; p.add(seg); y += .3; }
    for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(leafGeo, leafM); l.position.set(px, y, 0); l.rotation.y = i / 9 * Math.PI * 2 + k; l.scale.setScalar(1 + R() * .3); l.castShadow = true; p.add(l); }
    g.add(p);
  });
  // surfboard, leaning up
  const board = new THREE.Mesh(new THREE.CapsuleGeometry(.24, 1.5, 8, 24), new THREE.MeshPhysicalMaterial({ color: '#fff6ea', roughness: .2, clearcoat: 1 }));
  board.scale.z = .12; board.position.set(-2.4, .95, -2.3); board.rotation.set(.1, .5, .12); board.castShadow = true; g.add(board);
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(.07, 1.5, 6, 12), new THREE.MeshPhysicalMaterial({ color: '#55d8d3', roughness: .2, clearcoat: 1 }));
  stripe.scale.z = .5; stripe.position.copy(board.position); stripe.rotation.copy(board.rotation); stripe.translateZ(.02); g.add(stripe);
  return {
    group: g,
    look: { fog: ['#ffd9b0', 7, 22], env: 1, key: ['#ffe2b8', 2.6], rim: ['#8fe7dc', 1.4], hemi: ['#bfe6ff', '#e0c48e', .5], shadow: .38, exp: 1.02 },
    update(t) {
      const a = seaGeo.attributes.position;
      for (let i = 0; i < a.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; a.array[i * 3 + 1] = .02 + .05 * Math.sin(x * .9 + t * 1.1) * Math.cos(z * .7 - t * .8) + .03 * Math.sin(z * 2.2 + t * 1.7); }
      a.needsUpdate = true; seaGeo.computeVertexNormals();
      foam.position.z = -2.05 + Math.sin(t * .9) * .18; foam.material.opacity = .55 + .3 * Math.sin(t * .9 + 1);
    },
  };
}

// ------------------------------------------------------------------ 3 · The Astronaut — moon base
function moon() {
  const g = new THREE.Group(), R = rng(3);
  g.add(sky('#040210', '#1b0d38', '#020106'));
  const geo = new THREE.PlaneGeometry(44, 44, 110, 110); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, craters = Array.from({ length: 26 }, () => [(R() - .5) * 20, (R() - .5) * 20, .3 + R() * 1.1]);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), d0 = Math.hypot(x, z);
    let y = .06 * Math.sin(x * 1.3) * Math.cos(z * 1.1) + .04 * Math.sin(x * 3.1 + z * 2.3);
    for (const [cx, cz, r] of craters) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.4) y += d < 1 ? -.18 * r * (1 - d * d) : .06 * r * Math.sin((d - 1) / .4 * Math.PI); }
    pos.setY(i, y * THREE.MathUtils.smoothstep(d0, 1.3, 3.2));
  }
  geo.computeVertexNormals();
  const floor = new THREE.Mesh(geo, std('#4d4a5a', { roughness: 1 })); floor.receiveShadow = true; g.add(floor);
  const N = 1400, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, r = 21, s = Math.sqrt(1 - u * u); sp.set([Math.cos(a) * s * r, Math.abs(u) * r * .95 + .5, Math.sin(a) * s * r], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: .06, fog: false, sizeAttenuation: true })); g.add(stars);
  for (const [c, x, y, s] of [['rgba(111,76,217,.8)', -6, 6, 16], ['rgba(255,95,162,.55)', 5, 4.5, 12], ['rgba(169,139,255,.5)', 0, 9, 18]]) { const n = sprite(glowTex(c), s, { fog: false, blending: THREE.AdditiveBlending }); n.position.set(x, y, -19); g.add(n); }
  const planetM = new THREE.ShaderMaterial({
    fog: false, uniforms: { a: { value: C('#a98bff') }, b: { value: C('#ff5fa2') } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a, b; varying vec3 vN; varying vec3 vP; void main(){ float band = 0.5 + 0.5 * sin(vP.y * 5.0 + sin(vP.x * 2.0) * 1.5); vec3 c = mix(a, b, band * 0.6); float l = clamp(dot(vN, normalize(vec3(0.6, 0.5, 0.6))), 0.0, 1.0); gl_FragColor = vec4(c * (0.12 + 0.95 * l), 1.0);\n#include <colorspace_fragment>\n}',
  });
  const planet = new THREE.Group(); planet.position.set(-7, 3.4, -16);
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(2.6, 48, 32), planetM));
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.3, 4.6, 96), new THREE.MeshBasicMaterial({ color: '#ffd1ea', transparent: true, opacity: .45, side: THREE.DoubleSide, fog: false }));
  ring.rotation.set(1.2, .3, 0); planet.add(ring); g.add(planet);
  const rocks = [], rockM = std('#8a8698', { roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.08 + R() * .16, 0), rockM); r.position.set((R() - .5) * 7, .5 + R() * 1.4, -1.8 - R() * 2.5); r.castShadow = true; r.userData = { y: r.position.y, p: R() * 6 }; rocks.push(r); g.add(r); }
  // flag with a heart
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.5, 8), std('#d7d7de', { metalness: .9, roughness: .3 })); pole.position.set(1.9, .75, -1.4); pole.castShadow = true; g.add(pole);
  const flagT = canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#6f4cd9'; x.fillRect(0, 0, w, h); x.font = '400 70px Chewy'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ff5fa2'; x.lineWidth = 8; x.strokeStyle = '#1e1826'; x.strokeText('WYLD', w / 2, h / 2 + 4); x.fillText('WYLD', w / 2, h / 2 + 4); });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.52, .32, 12, 1), new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide, roughness: .8 }));
  flag.geometry.translate(.26, 0, 0); flag.position.set(1.9, 1.34, -1.4); flag.castShadow = true; g.add(flag);
  return {
    group: g,
    look: { fog: ['#1b0d38', 8, 22], env: .45, key: ['#f4f0ff', 3.0], rim: ['#a98bff', 2.6], hemi: ['#6f4cd9', '#050308', .12], shadow: .75, exp: 1.05 },
    update(t) {
      planet.rotation.y = t * .05; stars.rotation.y = t * .004;
      rocks.forEach(r => { r.position.y = r.userData.y + Math.sin(t * .6 + r.userData.p) * .08; r.rotation.x = t * .2 + r.userData.p; r.rotation.y = t * .15; });
      const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 9 - t * 3) * .03 * x / .52); } p.needsUpdate = true;
    },
  };
}

// ------------------------------------------------------------------ 4 · The Raver — jungle rave
function jungle() {
  const g = new THREE.Group(), R = rng(4);
  g.add(sky('#050a03', '#1b2a0c', '#040602'), ground('#26331a', { roughness: 1 }));
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(.55, .2, .6, .9, 0, 1.2); leafShape.bezierCurveTo(-.6, .9, -.55, .2, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 10);
  const greens = ['#1f4d1c', '#2e6b25', '#3d7f2a', '#4f5a1f', '#6b8f2a'].map(c => std(c, { roughness: .65, side: THREE.DoubleSide }));
  for (let i = 0; i < 160; i++) {
    const a = R() * Math.PI * 2, d = 2.3 + R() * 3.5;
    const x = Math.cos(a) * d, z = Math.sin(a) * d - (Math.sin(a) > 0 ? 0 : .6);
    if (z > .2) continue;                                          // keep the camera side open
    const l = new THREE.Mesh(leafGeo, greens[i % greens.length]);
    l.position.set(x, R() * .4, z); l.rotation.set(-.3 - R() * .9, a + Math.PI / 2 + (R() - .5), (R() - .5) * .8);
    l.scale.setScalar(.8 + R() * 1.6); l.castShadow = true; g.add(l);
  }
  for (let i = 0; i < 7; i++) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.09, .16, 5, 10), std('#1d1a10')); tr.position.set((R() - .5) * 9, 2.5, -3 - R() * 3); tr.castShadow = true; g.add(tr); }
  const rockM = std('#3b3f2c', { roughness: .95, flatShading: true });
  for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.15 + R() * .3, 0), rockM); r.position.set((R() - .5) * 6, .05, -1.4 - R() * 1.8); r.scale.y = .6; r.castShadow = r.receiveShadow = true; g.add(r); }
  const lasers = [];
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 14, 6), new THREE.MeshBasicMaterial({ color: i % 3 === 2 ? '#ff5fa2' : '#d9ff3f', transparent: true, opacity: .85, blending: THREE.AdditiveBlending, fog: false }));
    l.geometry.translate(0, 7, 0); l.position.set(-2.5 + i, .1, -3.2); g.add(l); lasers.push(l);
  }
  const N = 90, fp = new Float32Array(N * 3), base = [];
  for (let i = 0; i < N; i++) { base.push([(R() - .5) * 7, .2 + R() * 2.2, (R() - .5) * 5 - .8, R() * 6]); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const flies = new THREE.Points(fg, new THREE.PointsMaterial({ color: '#e8ff7a', size: .045, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(flies);
  return {
    group: g,
    look: { fog: ['#1b2a0c', 3.5, 11], env: .5, key: ['#f2ffd0', 2.2], rim: ['#d9ff3f', 3.0], hemi: ['#b6ff5a', '#0b1206', .22], shadow: .6, exp: 1.08 },
    update(t) {
      lasers.forEach((l, i) => { l.rotation.z = Math.sin(t * .9 + i) * .7; l.rotation.x = .5 + Math.sin(t * .6 + i * 2) * .35; l.material.opacity = .5 + .4 * Math.max(0, Math.sin(t * 6 + i)); });
      for (let i = 0; i < N; i++) { const b = base[i]; fp[i * 3] = b[0] + Math.sin(t * .5 + b[3]) * .3; fp[i * 3 + 1] = b[1] + Math.sin(t * .8 + b[3] * 2) * .2; fp[i * 3 + 2] = b[2] + Math.cos(t * .4 + b[3]) * .3; }
      fg.attributes.position.needsUpdate = true;
      flies.material.opacity = .6 + .4 * Math.sin(t * 2);
    },
  };
}

// ------------------------------------------------------------------ 5 · The Weirdo — sticker dream
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
  return {
    group: g,
    look: { fog: ['#f8ebae', 7, 20], env: .9, key: ['#fff8e6', 1.7], rim: ['#ff8cc0', 1.6], hemi: ['#ffffff', '#c9b6f4', .4], shadow: .3, exp: .95 },
    update(t) { floaters.forEach(s => { s.position.y = s.userData.y + Math.sin(t * .9 + s.userData.p) * .12; s.material.rotation = Math.sin(t * .7 + s.userData.p) * .15; }); },
  };
}

// ------------------------------------------------------------------ 6 · The Dreamer — cotton candy sky
function clouds() {
  const g = new THREE.Group(), R = rng(6);
  g.add(sky('#ff8fbf', '#f5dcee', '#8fe7dc'), ground('#fbeef6', { roughness: .35, metalness: 0 }));
  const puff = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffd6ea', emissiveIntensity: .25 });
  const cloud = (x, y, z, s) => { const c = new THREE.Group(); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.35 + R() * .3, 20, 14), puff); b.position.set((i - 3) * .32, (R() - .3) * .2 + (3 - Math.abs(i - 3)) * .07, (R() - .5) * .3); b.castShadow = b.receiveShadow = true; c.add(b); } c.position.set(x, y, z); c.scale.setScalar(s); c.userData = { y, p: R() * 6 }; g.add(c); return c; };
  const cl = [cloud(-3.6, .1, -2.6, 1.1), cloud(3.6, .1, -2.8, 1.2), cloud(-4.5, 1.8, -4, 1.4), cloud(4.4, 2.4, -4.4, 1.3), cloud(0, 3.4, -5.2, 1.6), cloud(-2.2, .05, 1.8, .7), cloud(2.6, .05, 1.6, .6)];
  // rainbow in the WYLD dye colours
  const bow = new THREE.Group();
  ['#ff3d8e', '#ff8fbf', '#e9cde8', '#8fe7dc', '#5fd8d3'].forEach((c, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(3.2 - i * .18, .09, 12, 96, Math.PI), new THREE.MeshStandardMaterial({ color: c, roughness: .4, emissive: c, emissiveIntensity: .35 })); bow.add(r); });
  bow.position.set(0, 0, -3.6); g.add(bow);
  const hg = new THREE.ExtrudeGeometry(heartShape(.14), { depth: .06, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 3 }); hg.center();
  const hm = new THREE.MeshPhysicalMaterial({ color: '#ff5fa2', roughness: .2, clearcoat: 1 });
  const hearts = Array.from({ length: 14 }, () => { const h = new THREE.Mesh(hg, hm); h.position.set((R() - .5) * 6, .6 + R() * 2, -1 - R() * 2.6); h.scale.setScalar(.7 + R() * .9); h.castShadow = true; h.userData = { y: h.position.y, p: R() * 6 }; g.add(h); return h; });
  return {
    group: g,
    look: { fog: ['#f5dcee', 6, 18], env: 1.05, key: ['#fff4fa', 1.9], rim: ['#8fe7dc', 1.8], hemi: ['#ffd1e6', '#bff4ee', .6], shadow: .28, exp: 1.0 },
    update(t) {
      cl.forEach(c => { c.position.y = c.userData.y + Math.sin(t * .4 + c.userData.p) * .05; });
      hearts.forEach(h => { h.position.y = h.userData.y + Math.sin(t * .8 + h.userData.p) * .12; h.rotation.y = t * .8 + h.userData.p; });
    },
  };
}

const BUILDERS = { stage, beach, moon, jungle, stickers, clouds };
const cache = {};
export function getSet(name) { return cache[name] ||= BUILDERS[name](); }
