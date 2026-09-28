import * as THREE from 'three';

// WYLD liveries as a procedural frame shader. The pattern lives in the bike's own 3D space
// (no UVs needed), normalised to the bike's bounding box. Three looks share one program:
//   0 dye     – five colours flowing in soft diagonal waves (a hand-dyed jersey)
//   1 checker – two-colour checkerboard with a thin outline, gently warped like the Upcoming print
//   2 spots   – wild animal spots: base colour, spot colour and an outline ring
//   3 mosaic  – stained glass: Voronoi panes in five colours joined by dark lead lines

const lin = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
const MODES = { dye: 0, checker: 1, spots: 2, mosaic: 3 };

export function applyDye(material, bike, livery) {
  const box = new THREE.Box3().setFromObject(bike);
  const size = box.getSize(new THREE.Vector3());
  const u = {
    uWMin: { value: box.min.clone() }, uWSize: { value: size },
    uWK: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector3()) },
    uWMode: { value: 0 }, uWDark: { value: 0 }, uWScale: { value: 1.5 }, uWFlow: { value: 1 }, uWCells: { value: 9 },
    uWDir: { value: new THREE.Vector2(1, 0) }, uWLead: { value: new THREE.Vector3() },
  };
  material.color.set(0xffffff);
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWPos;
uniform vec3 uWMin, uWSize, uWK[5], uWLead;
uniform float uWMode, uWDark, uWScale, uWFlow, uWCells;
uniform vec2 uWDir;
vec3 wRamp(float c) {
  c = fract(c) * 8.0;
  vec3 k[9]; k[0]=uWK[0]; k[1]=uWK[0]; k[2]=uWK[1]; k[3]=uWK[2]; k[4]=uWK[3]; k[5]=uWK[4]; k[6]=uWK[2]; k[7]=uWK[1]; k[8]=uWK[0];
  int i = int(floor(c)); float f = smoothstep(0.0, 1.0, fract(c));
  vec3 a = k[0], b = k[1];
  for (int j = 0; j < 8; j++) { if (j == i) { a = k[j]; b = k[j + 1]; } }
  return mix(a, b, f);
}
float wHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
vec2 wHash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float wNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i), wHash(i + vec3(1,0,0)), f.x), mix(wHash(i + vec3(0,1,0)), wHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0,0,1)), wHash(i + vec3(1,0,1)), f.x), mix(wHash(i + vec3(0,1,1)), wHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 q = (vWPos - uWMin) / max(uWSize.x, max(uWSize.y, uWSize.z));
  float wave = 0.10 * sin(q.x * 7.3 + q.y * 3.1) + 0.07 * sin(q.y * 11.0 - q.z * 6.0 + 1.7) + 0.05 * sin((q.x - q.y) * 17.0);
  vec3 col;
  if (uWMode < 0.5) {
    col = wRamp(dot(q.xy, uWDir) * 1.35 * uWScale + wave * uWFlow);
  } else if (uWMode < 1.5) {
    vec2 g = q.xy * uWCells + vec2(sin(q.y * 9.0), sin(q.x * 7.0)) * 0.35 * uWFlow;
    float s = mod(floor(g.x) + floor(g.y), 2.0);
    vec2 e = abs(fract(g) - 0.5);
    col = mix(uWK[0], uWK[1], s);
    col = mix(col, uWK[2], smoothstep(0.455, 0.475, max(e.x, e.y)));
  } else if (uWMode > 2.5) {
    vec2 g = q.xy * uWCells + vec2(q.z * 3.0, 0.0);
    vec2 ci = floor(g), cf = fract(g);
    float d1 = 8.0, d2 = 8.0; vec2 best = vec2(0.0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y)); vec2 pt = o + 0.15 + 0.7 * wHash2(ci + o) - cf;
      float d = dot(pt, pt);
      if (d < d1) { d2 = d1; d1 = d; best = ci + o; } else if (d < d2) { d2 = d; }
    }
    int k = int(floor(wHash2(best + 17.0).x * 5.0));
    col = uWK[0];
    for (int j = 1; j < 5; j++) { if (j == k) col = uWK[j]; }
    col *= 0.85 + 0.3 * wHash2(best + 3.0).y;
    col = mix(col, uWLead, 1.0 - smoothstep(0.03, 0.1, sqrt(d2) - sqrt(d1)));
  } else {
    float n = wNoise(q * uWCells * 2.0) * 0.7 + wNoise(q * uWCells * 5.0 + 3.1) * 0.3;
    col = mix(uWK[0], uWK[4], smoothstep(0.2, 0.8, dot(q.xy, uWDir) * uWScale + wave));
    col = mix(col, uWK[2], smoothstep(0.54, 0.56, n));
    col = mix(col, uWK[1], smoothstep(0.6, 0.62, n));
    col = mix(col, uWK[3], smoothstep(0.7, 0.72, n));
  }
  col *= mix(1.0, 0.1, pow(uWDark, 0.75));
  diffuseColor.rgb = col;
}`);
  };
  material.customProgramCacheKey = () => 'wyld-dye-v2';
  material.needsUpdate = true;

  return {
    set(l) {
      l.stops.forEach((h, i) => u.uWK.value[i].copy(lin(h)));
      u.uWMode.value = MODES[l.pattern] ?? 0; u.uWLead.value.copy(lin(l.lead || '#111111'));
      u.uWDark.value = l.darkness ?? 0; u.uWScale.value = l.scale ?? 1.5; u.uWFlow.value = l.flow ?? 1; u.uWCells.value = l.cells ?? 9;
      const a = (l.angle ?? 32) * Math.PI / 180; u.uWDir.value.set(Math.cos(a), Math.sin(a));
    },
  };
}
