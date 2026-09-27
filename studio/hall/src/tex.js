// Procedural material maps, generated at runtime so every finish can be customized live.
import * as THREE from 'three';

const TAU = Math.PI * 2;
function hash(x, y) { let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= .5; } return s; }
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, { srgb = false, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.needsUpdate = true;
  return t;
}
// height field (Float32Array w*h, wrap) -> tangent-space normal map canvas
function normalFromHeight(hf, w, h, strength) {
  const c = canvas(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const l = hf[j * w + (i - 1 + w) % w], r = hf[j * w + (i + 1) % w], u = hf[((j - 1 + h) % h) * w + i], b = hf[((j + 1) % h) * w + i];
    let nx = (l - r) * strength, ny = (u - b) * strength, nz = 1;
    const k = 1 / Math.hypot(nx, ny, nz), o = (j * w + i) * 4;
    d[o] = (nx * k * .5 + .5) * 255; d[o + 1] = (ny * k * .5 + .5) * 255; d[o + 2] = (nz * k * .5 + .5) * 255; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}

// ------------------------------------------------------------------ BLADE
// canvas rows: uv.y = 1 - hf (glTF flips V). hf = 0 edge, 1 mune.
export const HAMON = {
  notare: u => .245 + .045 * Math.sin(u * TAU * 8.5 + 1.3 * fbm(u * 6, 1)) + .012 * Math.sin(u * TAU * 31),
  suguha: u => .215 + .006 * Math.sin(u * TAU * 40) + .008 * (fbm(u * 30, 3) - .5),
  gunome: u => .205 + .075 * Math.pow(Math.abs(Math.sin(u * Math.PI * 34 + .4 * Math.sin(u * 9))), .55),
  choji: u => { const p = (u * 26) % 1; const k = Math.pow(Math.max(0, Math.sin(p * Math.PI)), .7); return .2 + .09 * k * (.7 + .3 * Math.sin(p * TAU * 3)) + .02 * fbm(u * 40, 2); },
  infinite: u => { const a = u * TAU * 11; return .245 + .05 * Math.sin(a) * Math.cos(a * .5) + .02 * Math.sin(a * 2); },
};

export function bladeMaps(style = 'notare', opt = {}) {
  const W = 4096, H = 256, c = canvas(W, H), r = canvas(W, H);
  const cx = c.getContext('2d'), rx = r.getContext('2d');
  const ci = cx.createImageData(W, H), ri = rx.createImageData(W, H), cd = ci.data, rd = ri.data;
  const fn = HAMON[style] || HAMON.notare, yok = .952, SH = .70;
  const line = new Float32Array(W);
  for (let i = 0; i < W; i++) {
    const u = i / (W - 1);
    let h = fn(u);
    h *= smooth(0, .03, u) * .6 + .4;                 // hamon rises out of the machi
    if (u > yok) { const q = (u - yok) / (1 - yok); h = h + (.52 - h) * smooth(.55, 1, q) * .8; } // boshi turns back
    line[i] = h;
  }
  const polish = opt.polish ?? .8, engr = opt.engraving || 'none';
  for (let j = 0; j < H; j++) {
    const hf = 1 - j / (H - 1);
    for (let i = 0; i < W; i++) {
      const u = i / (W - 1), h = line[i], o = (j * W + i) * 4;
      const grain = fbm(u * 380, hf * 22 + fbm(u * 60, hf * 4) * 3, 4);      // itame hada
      const dist = hf - h;
      const hamon = 1 - smooth(-.012, .018, dist);                          // below the line = hardened
      const nioi = Math.exp(-Math.pow(dist / .018, 2));
      const nie = hash(i * 1.7, j * 3.1) > .994 ? nioi * .22 : 0;
      const ashi = hamon * (style === 'choji' || style === 'gunome' ? Math.pow(Math.max(0, Math.sin(u * TAU * 34 + 1.2)), 24) * smooth(.05, h, hf) * .35 : 0);
      let v;
      if (hf > .905) v = .52;                                                // burnished mune
      else if (hf > SH) v = .44 + .04 * grain;                               // burnished shinogi-ji
      else v = .58 + .07 * (grain - .5);                                      // ji
      v = v * (1 - hamon) + (.84 + .05 * (grain - .5) - ashi * .25) * hamon; // frosty hamon
      v += nioi * .07 + nie;
      if (u > yok - .0009 && u < yok + .0009 && hf < SH + .02) v += .25;     // yokote
      if (hf < .018) v += .06;                                               // edge polish
      let tint = [.97, 1.0, 1.04];
      if (engr === 'sigil' && u > .03 && u < .12 && hf > .35 && hf < .66) {  // ∞ horimono near the base
        const x = (u - .075) / .042, y = (hf - .505) / .11;
        const t = Math.atan2(y, x), rr = Math.hypot(x, y);
        const lem = Math.sqrt(Math.max(0, Math.cos(2 * t))) * 1.0;
        if (Math.abs(rr - lem) < .09 && rr > .05) v *= .35;
      }
      if (engr === 'bohi' && u < .93 && hf > .74 && hf < .86) { const k = Math.sin((hf - .74) / .12 * Math.PI); v *= .72 + .1 * k; }
      const g = clamp(v) * 255;
      cd[o] = g * tint[0]; cd[o + 1] = g * tint[1]; cd[o + 2] = Math.min(255, g * tint[2]); cd[o + 3] = 255;
      // roughness (G) / metalness (B)
      let rough = hf > SH ? .05 : .09 + .04 * grain;
      rough = rough * (1 - hamon) + (.24 + .06 * grain) * hamon + nioi * .05;
      rough = rough * (1.35 - .6 * polish) + .01;
      rd[o] = 255; rd[o + 1] = clamp(rough) * 255; rd[o + 2] = 255; rd[o + 3] = 255;
    }
  }
  cx.putImageData(ci, 0, 0); rx.putImageData(ri, 0, 0);
  return { map: tex(c, { srgb: true, aniso: 16 }), rough: tex(r, { aniso: 16 }) };
}

// ------------------------------------------------------------------ SAYA lacquer
export const LACQUER = {
  aonami: { name: 'Aonami — cobalt tide', base: [2, 4, 9], deep: [6, 22, 70], glow: [40, 170, 255], line: [150, 200, 230] },
  kuro: { name: 'Kuro — ink black', base: [3, 3, 4], deep: [12, 12, 16], glow: [110, 120, 140], line: [200, 200, 205] },
  shu: { name: 'Shu — vermilion', base: [30, 3, 2], deep: [130, 14, 6], glow: [255, 90, 40], line: [240, 200, 140] },
  midori: { name: 'Midori — jade', base: [2, 10, 7], deep: [8, 60, 42], glow: [60, 230, 170], line: [180, 230, 210] },
  murasaki: { name: 'Murasaki — violet', base: [7, 3, 12], deep: [45, 16, 90], glow: [175, 110, 255], line: [215, 195, 245] },
  yuki: { name: 'Yuki — pearl', base: [150, 152, 158], deep: [205, 208, 214], glow: [240, 248, 255], line: [110, 130, 150] },
  mugen: { name: 'Mugen — infinite cyan', base: [1, 6, 9], deep: [0, 60, 80], glow: [60, 255, 240], line: [120, 255, 240] },
};

export function sayaMaps(o = {}) {
  const pal = LACQUER[o.lacquer] || LACQUER.aonami, pattern = o.pattern || 'waves', lum = o.luminous ?? .5, raden = o.raden ?? .6;
  const W = 4096, H = 512;
  const c = canvas(W, H), e = canvas(W, H), m = canvas(W, H);
  const cx = c.getContext('2d'), ex = e.getContext('2d'), mx = m.getContext('2d');
  const ci = cx.createImageData(W, H), ei = ex.createImageData(W, H), mi = mx.createImageData(W, H);
  const cd = ci.data, ed = ei.data, md = mi.data;
  // side-face bands: v≈.25 and v≈.75 are the flat faces; 0/.5 are spine/edge
  for (let j = 0; j < H; j++) {
    const v = j / H;
    const face = Math.min(Math.abs(v - .25), Math.abs(v - .75));      // distance from face centre
    for (let i = 0; i < W; i++) {
      const u = i / W, o = (j * W + i) * 4;
      // luminous streak like moonlight across water, strongest mid-saya
      const along = Math.exp(-Math.pow((u - .42) / .22, 2)) * (.6 + .4 * fbm(u * 5, v * 3));
      const band = Math.exp(-Math.pow((face - .02 - .03 * Math.sin(u * 9)) / .075, 2));
      const streak = along * band;
      const depth = .35 + .65 * Math.exp(-Math.pow(face / .16, 2));
      const sk = Math.min(1, streak * 1.5);
      let r = pal.base[0] + (pal.deep[0] - pal.base[0]) * Math.min(1, depth * sk * 1.8) + pal.glow[0] * sk * sk * .7;
      let g = pal.base[1] + (pal.deep[1] - pal.base[1]) * Math.min(1, depth * sk * 1.8) + pal.glow[1] * sk * sk * .7;
      let b = pal.base[2] + (pal.deep[2] - pal.base[2]) * Math.min(1, depth * sk * 1.8) + pal.glow[2] * sk * sk * .7;
      let em = sk * sk * (.35 + .65 * sk), metal = 0;
      // raden: mother-of-pearl flecks, like stars on night water
      const fr = hash(Math.floor(u * 2600), Math.floor(v * 340));
      const fleckP = raden * (.004 + .02 * streak);
      if (fr < fleckP) { const tw = .6 + .4 * hash(i, j); r += 150 * tw; g += 190 * tw; b += 220 * tw; em += .9 * tw; metal = .6; }
      // decorative line work
      let lw = 0;
      if (pattern === 'waves' && u > .74) {
        const k = smooth(.74, .82, u);
        for (let n = 0; n < 7; n++) {
          const ph = u * 70 + n * 1.1, crest = .06 * Math.sin(ph) + .025 * Math.sin(ph * 2.3 + n);
          const yy = .56 + n * .045 + crest + .02 * Math.pow(Math.max(0, Math.sin(u * 22 + n)), 8);
          const d = Math.abs(v - yy); if (d < .0035) lw = Math.max(lw, k * (1 - d / .0035));
          const yy2 = .06 + n * .045 + crest; const d2 = Math.abs(v - yy2); if (d2 < .0035) lw = Math.max(lw, k * (1 - d2 / .0035));
        }
        // spray dots on crests
        if (hash(Math.floor(u * 900), Math.floor(v * 160)) > .985 && Math.abs(face - .02) < .07) lw = Math.max(lw, k * .9);
      } else if (pattern === 'waves' && u < .14) {
        for (let n = 0; n < 3; n++) { const yy = .66 + n * .04 + .02 * Math.sin(u * 90 + n); if (Math.abs(v - yy) < .003) lw = .7; const y2 = .16 + n * .04 + .02 * Math.sin(u * 90 + n); if (Math.abs(v - y2) < .003) lw = .7; }
      } else if (pattern === 'sakura') {
        const cu = Math.floor(u * 34), cv = Math.floor(v * 9), hh = hash(cu, cv);
        if (hh > .55) {
          const pu = (u * 34 - cu - .5) * 1.0, pv = (v * 9 - cv - .5) * 34 / 9 * .25 * 4;
          const t = Math.atan2(pv, pu) + hh * 6, rr = Math.hypot(pu, pv);
          const petal = .32 * (.6 + .4 * Math.abs(Math.cos(t * 2.5)));
          if (Math.abs(rr - petal) < .03) lw = .9; if (rr < .05) lw = 1;
        }
      } else if (pattern === 'infinite') {
        const p = (u * 18) % 1, x = (p - .5) * 2.4;
        for (const cvv of [.25, .75]) {
          const y = (v - cvv) * 18;
          const t = Math.atan2(y, x), rr = Math.hypot(x, y), lem = Math.sqrt(Math.max(0, Math.cos(2 * t)));
          if (Math.abs(rr - lem) < .05) lw = .95;
        }
      }
      if (lw > 0) { r = r + (pal.line[0] - r) * lw; g = g + (pal.line[1] - g) * lw; b = b + (pal.line[2] - b) * lw; metal = Math.max(metal, lw); em += lw * .25; }
      cd[o] = clamp(r, 0, 255); cd[o + 1] = clamp(g, 0, 255); cd[o + 2] = clamp(b, 0, 255); cd[o + 3] = 255;
      const eg = clamp(em);
      ed[o] = pal.glow[0] * eg; ed[o + 1] = pal.glow[1] * eg; ed[o + 2] = pal.glow[2] * eg; ed[o + 3] = 255;
      md[o] = 255; md[o + 1] = (.12 + .1 * (1 - metal)) * 255 * (1 - lw * .5); md[o + 2] = metal * 255; md[o + 3] = 255;
    }
  }
  cx.putImageData(ci, 0, 0); ex.putImageData(ei, 0, 0); mx.putImageData(mi, 0, 0);
  return { map: tex(c, { srgb: true, aniso: 16 }), emissive: tex(e, { srgb: true, aniso: 16 }), mr: tex(m, { aniso: 16 }) };
}

// ------------------------------------------------------------------ tiles
function tile(w, h, fn) { const hf = new Float32Array(w * h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) hf[j * w + i] = fn(i / w, j / h, i, j); return hf; }
function greyCanvas(hf, w, h, lo = 0, hi = 1) { const c = canvas(w, h), x = c.getContext('2d'), im = x.createImageData(w, h); for (let k = 0; k < w * h; k++) { const g = (lo + (hi - lo) * hf[k]) * 255; im.data[k * 4] = im.data[k * 4 + 1] = im.data[k * 4 + 2] = g; im.data[k * 4 + 3] = 255; } x.putImageData(im, 0, 0); return c; }

// flat-braided silk: chevron ridges along the ribbon
export function silkMaps() {
  const w = 256, h = 64;
  const hf = tile(w, h, (u, v) => {
    const a = Math.abs(((u * 8 + Math.abs(v - .5) * 2.2) % 1) - .5) * 2;   // chevrons
    const fiber = .5 + .5 * Math.sin(v * TAU * 16 + u * 3);
    return .65 * (1 - Math.pow(a, 1.6)) + .2 * fiber + .15 * hash(Math.floor(u * 256), Math.floor(v * 64));
  });
  return { normal: tex(normalFromHeight(hf, w, h, 3.2), { repeat: [60, 1] }), ao: tex(greyCanvas(hf, w, h, .55, 1), { repeat: [60, 1] }) };
}
export function cordMaps() {
  const w = 128, h = 64;
  const hf = tile(w, h, (u, v) => { const a = Math.abs(((u * 4 + v * 2) % 1) - .5) * 2, b = Math.abs(((u * 4 - v * 2 + 10) % 1) - .5) * 2; return .5 * (1 - a * a) + .5 * (1 - b * b) * (v > .5 ? 1 : .6); });
  return { normal: tex(normalFromHeight(hf, w, h, 2.5), { repeat: [70, 2] }) };
}
// samegawa: irregular pearly nodules
export function samegawaMaps() {
  const w = 256, h = 256, pts = [];
  for (let k = 0; k < 110; k++) pts.push([hash(k, 1), hash(k, 2), .025 + .04 * hash(k, 3)]);
  const hf = tile(w, h, (u, v) => {
    let best = 0;
    for (const [x, y, r] of pts) for (const ox of [-1, 0, 1]) for (const oy of [-1, 0, 1]) {
      const d = Math.hypot(u - x - ox, v - y - oy); if (d < r) best = Math.max(best, Math.sqrt(1 - (d / r) ** 2));
    }
    return best * .9 + .1 * vnoise(u * 60, v * 60);
  });
  return { normal: tex(normalFromHeight(hf, w, h, 6), { repeat: [14, 5] }), ao: tex(greyCanvas(hf, w, h, .45, 1), { repeat: [14, 5] }) };
}
// tsuchime: hammered iron
export function hammeredMaps() {
  const w = 256, h = 256, pts = [];
  for (let k = 0; k < 70; k++) pts.push([hash(k, 7), hash(k, 8), .05 + .06 * hash(k, 9)]);
  const hf = tile(w, h, (u, v) => {
    let s = 0;
    for (const [x, y, r] of pts) for (const ox of [-1, 0, 1]) for (const oy of [-1, 0, 1]) { const d = Math.hypot(u - x - ox, v - y - oy); if (d < r) s -= (1 - (d / r) ** 2) * .5; }
    return s + .25 * fbm(u * 18, v * 18, 3);
  });
  return { normal: tex(normalFromHeight(hf, w, h, 4), { repeat: [7, 7] }), rough: tex(greyCanvas(hf.map(x => .5 + x * .4), w, h, .35, .8), { repeat: [7, 7] }) };
}
// karakusa scrollwork engraving for fittings
export function engravingMaps() {
  const w = 256, h = 256;
  const hf = tile(w, h, (u, v) => {
    let s = 0;
    for (let k = 0; k < 3; k++) {
      const cx = (k + .5) / 3, cy = .5 + .2 * Math.sin(k * 2.1);
      const dx = u - cx, dy = v - cy, t = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
      const spiral = Math.abs(Math.sin(t * 1 - r * 60));
      if (r < .2) s = Math.max(s, (1 - smooth(.0, .15, spiral)) * (1 - r / .2));
    }
    const vine = Math.abs(v - .5 - .18 * Math.sin(u * TAU * 3));
    s = Math.max(s, 1 - smooth(.004, .014, vine));
    return -s * .8 + .08 * vnoise(u * 90, v * 90);
  });
  return { normal: tex(normalFromHeight(hf, w, h, 5), { repeat: [3, 6] }), ao: tex(greyCanvas(hf.map(x => 1 + x * .6), w, h), { repeat: [3, 6] }) };
}
export function tangMaps() {
  const w = 512, h = 128, c = canvas(w, h), x = c.getContext('2d'), im = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w, v = j / h, file = .5 + .5 * Math.sin((u * 90 + v * 3) * TAU / 1), rust = fbm(u * 20, v * 8, 5);
    const o = (j * w + i) * 4, k = .45 + .35 * rust + .12 * file;
    im.data[o] = 70 * k; im.data[o + 1] = 45 * k; im.data[o + 2] = 30 * k; im.data[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); return { map: tex(c, { srgb: true }) };
}
export function woodMaps() {
  const w = 512, h = 64, c = canvas(w, h), x = c.getContext('2d'), im = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w, v = j / h, g = .5 + .5 * Math.sin(v * 50 + fbm(u * 6, v * 3) * 8), o = (j * w + i) * 4;
    im.data[o] = 120 + 50 * g; im.data[o + 1] = 85 + 35 * g; im.data[o + 2] = 50 + 20 * g; im.data[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); return { map: tex(c, { srgb: true }) };
}
// soft round sprite for particles
export function spriteTex(kind = 'dot') {
  const s = 64, c = canvas(s, s), x = c.getContext('2d');
  if (kind === 'petal') {
    x.translate(32, 32); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, -26); x.bezierCurveTo(22, -18, 18, 18, 0, 26); x.bezierCurveTo(-18, 18, -22, -18, 0, -26); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(0, -30, 7, 0, TAU); x.fill();
  } else if (kind === 'flower') {
    x.translate(32, 32);
    for (let k = 0; k < 5; k++) {
      x.save(); x.rotate(k / 5 * TAU);
      const g = x.createLinearGradient(0, 0, 0, -28); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,.85)');
      x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(13, -8, 12, -24, 3, -28); x.lineTo(0, -24); x.lineTo(-3, -28); x.bezierCurveTo(-12, -24, -13, -8, 0, 0); x.fill(); x.restore();
    }
    x.fillStyle = 'rgba(150,60,80,.9)'; x.beginPath(); x.arc(0, 0, 4, 0, TAU); x.fill();
  } else if (kind === 'tuft') {
    x.translate(32, 32); x.lineCap = 'round';
    for (let k = 0; k < 46; k++) { const a = Math.random() * TAU, r = 14 + Math.random() * 16; x.strokeStyle = `rgba(255,255,255,${.5 + Math.random() * .5})`; x.lineWidth = 1 + Math.random() * 1.2; x.beginPath(); x.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); x.lineTo(Math.cos(a) * r, Math.sin(a) * r * .8); x.stroke(); }
  } else if (kind === 'leaf') {
    x.translate(32, 32); x.fillStyle = '#fff'; x.beginPath();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .42, r = k % 2 ? 14 : 28; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.lineTo(0, 22); x.fill();
  } else if (kind === 'flake') {
    x.translate(32, 32); x.strokeStyle = '#fff'; x.lineWidth = 3; x.lineCap = 'round';
    for (let k = 0; k < 6; k++) { x.rotate(TAU / 6); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 26); x.moveTo(0, 14); x.lineTo(7, 21); x.moveTo(0, 14); x.lineTo(-7, 21); x.stroke(); }
  } else {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
