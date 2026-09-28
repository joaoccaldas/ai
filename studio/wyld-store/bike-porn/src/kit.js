import * as THREE from 'three';

// Shared building blocks for the movie sets (see sets.js).

export const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const C = h => new THREE.Color(h);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
export const fontsReady = document.fonts ? Promise.all(['400 80px Chewy', '700 80px Caveat', '400 80px "Inknut Antiqua"'].map(f => document.fonts.load(f).catch(() => { }))) : Promise.resolve();

// Gradient sky dome (not fogged) whose horizon matches the fog colour, so the floor melts into it.
export function sky(top, horizon, bottom) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: C(top) }, h: { value: C(horizon) }, b: { value: C(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 a, h, b; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(h, a, pow(smoothstep(0.0, 0.7, y), 0.8)) : mix(h, b, smoothstep(0.0, -0.3, y)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}',
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 24), m); s.renderOrder = -1;
  return s;
}
export function ground(color, o = {}) {
  const g = new THREE.Mesh(new THREE.CircleGeometry(22, 64), std(color, o));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; return g;
}
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  fontsReady.then(() => { draw(c.getContext('2d'), w, h); t.needsUpdate = true; });
  return t;
}
export function glowTex(color) {
  return canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
}
export function sprite(tex, size, o = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, ...o }));
  s.scale.set(size, size, 1); return s;
}
// Soft light shaft: an open cone, bright at the source and fading out.
export function beam(color, len, radius) {
  const geo = new THREE.ConeGeometry(radius, len, 32, 1, true); geo.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: C(color) }, k: { value: .22 } },
    vertexShader: 'varying float vY; varying vec3 vN, vV; void main(){ vY = uv.y; vec4 p = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix * p; }',
    fragmentShader: 'uniform vec3 c; uniform float k; varying float vY; varying vec3 vN, vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); gl_FragColor = vec4(c, k * pow(vY, 1.4) * edge); }',
  });
  return new THREE.Mesh(geo, m);
}
export function heartShape(s = 1) {
  const h = new THREE.Shape();
  h.moveTo(0, -.9 * s); h.bezierCurveTo(-.2 * s, -.7 * s, -1 * s, -.25 * s, -1 * s, .25 * s);
  h.bezierCurveTo(-1 * s, .75 * s, -.4 * s, 1 * s, 0, .55 * s); h.bezierCurveTo(.4 * s, 1 * s, 1 * s, .75 * s, 1 * s, .25 * s);
  h.bezierCurveTo(1 * s, -.25 * s, .2 * s, -.7 * s, 0, -.9 * s); return h;
}
export function stickerTextures(ids) {
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


export function stars(R, n = 1400, r = 21, size = .06) {
  const sp = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); sp.set([Math.cos(a) * s * r, Math.abs(u) * r * .95 + .5, Math.sin(a) * s * r], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size, fog: false }));
}

// Something that glows under bloom: an unlit colour pushed above 1.
export const hot = (color, k = 2, o = {}) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.color.set(color).multiplyScalar(k); return m; };

// Bare, twisted tree: a bent trunk with a few crooked branches.
export function makeTree(R, mat, h = 3.5 + R() * 2) {
  const g = new THREE.Group();
  const pts = [new THREE.Vector3()];
  for (let i = 1; i <= 4; i++) pts.push(new THREE.Vector3((R() - .5) * .5 * i * .5, h * i / 4, (R() - .5) * .5 * i * .5));
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .09 + R() * .05, 7), mat);
  trunk.castShadow = true; g.add(trunk);
  const flare = new THREE.Mesh(new THREE.ConeGeometry(.28, .6, 7, 1, true), mat); flare.position.y = .3; g.add(flare);
  const nb = 4 + Math.floor(R() * 4);
  for (let b = 0; b < nb; b++) {
    const s = pts[1 + Math.floor(R() * 3)].clone().lerp(pts[4], R() * .5);
    const a = R() * Math.PI * 2, len = .6 + R() * 1.2;
    const e = s.clone().add(new THREE.Vector3(Math.cos(a) * len, len * (.2 + R() * .6), Math.sin(a) * len));
    const m = s.clone().lerp(e, .5).add(new THREE.Vector3((R() - .5) * .3, -.15, (R() - .5) * .3));
    const br = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(s, m, e), 8, .025 + R() * .02, 5), mat);
    br.castShadow = true; g.add(br);
  }
  return g;
}

// Candle with a flickering flame sprite. Returns { group, flame }.
let flameT = null;
export function candle(h = .16, r = .025, wax = '#f3ead6') {
  flameT ||= glowTex('rgba(255,186,90,1)');
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), std(wax, { roughness: .6, emissive: '#ffb347', emissiveIntensity: .08 }));
  c.position.y = h / 2; g.add(c);
  const f = sprite(flameT, .11, { blending: THREE.AdditiveBlending, toneMapped: false });
  f.material.color.setScalar(2.2); f.position.y = h + .035; g.add(f);
  return { group: g, flame: f };
}
export function flicker(flames, t) {
  flames.forEach((f, i) => { const k = .85 + .15 * Math.sin(t * 13 + i * 7.1) + .08 * Math.sin(t * 29 + i); f.scale.set(.11 * k, .14 * k, 1); });
}

// Wind sway for instanced grass or wheat: bends each blade by its height.
export function swayMaterial(mat, amp = .06) {
  const u = { uT: { value: 0 } };
  mat.onBeforeCompile = sh => {
    sh.uniforms.uT = u.uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float hh = max(position.y, 0.0);
        transformed.x += sin(uT * 1.3 + instanceMatrix[3].x * .8 + instanceMatrix[3].z * .6) * ${amp.toFixed(3)} * hh;
        transformed.z += cos(uT * 1.1 + instanceMatrix[3].x * .5) * ${(amp * .5).toFixed(3)} * hh;
      #endif`);
  };
  mat.customProgramCacheKey = () => 'sway' + amp;
  return u.uT;
}

// Lightning: a cold light plus a sky flash, with a double flicker.
export function lightning(group, skyMesh, color = '#cfe3ff') {
  const L = new THREE.DirectionalLight(color, 0); L.position.set(-3, 8, -6); group.add(L);
  const base = skyMesh.material.uniforms.h.value.clone(), top = skyMesh.material.uniforms.a.value.clone(), flash = new THREE.Color(color);
  let v = 0, next = 6 + Math.random() * 6;
  return {
    strike() { v = 1; },
    update(t, dt, auto = true) {
      if (auto && (next -= dt) < 0) { v = 1; next = 7 + Math.random() * 8; }
      v = Math.max(0, v - dt * 2.2);
      const k = v > .75 ? 1 : v > .55 ? .15 : v > .35 ? .8 : v * 1.4;
      L.intensity = 7 * k;
      skyMesh.material.uniforms.h.value.copy(base).lerp(flash, k * .5);
      skyMesh.material.uniforms.a.value.copy(top).lerp(flash, k * .35);
      return k;
    },
  };
}
