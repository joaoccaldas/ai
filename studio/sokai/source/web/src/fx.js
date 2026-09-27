// Living atmosphere: dust, sparks, weather, seasons, mist, moonbeams, vault memories.
import * as THREE from 'three';
import { spriteTex } from './tex.js';

const rand = (a, b) => a + Math.random() * (b - a);

// GPU-animated particle field: positions wrap inside a box, all motion in the vertex shader.
function field({ count, box, size, color, sprite, fall = 0, sway = .2, drift = [0, 0, 0], additive = false, spin = 0, twinkle = 0, streak = 0, opacity = 1, sizeJitter = .5, colors = null }) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count * 4), c = new Float32Array(count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    p[i * 3] = rand(0, 1); p[i * 3 + 1] = rand(0, 1); p[i * 3 + 2] = rand(0, 1);
    s[i * 4] = rand(0, 100); s[i * 4 + 1] = 1 - sizeJitter + rand(0, sizeJitter * 2); s[i * 4 + 2] = rand(.6, 1.4); s[i * 4 + 3] = rand(0, 6.28);
    col.set(colors ? colors[i % colors.length] : color);
    c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(s, 4));
  g.setAttribute('tint', new THREE.BufferAttribute(c, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 }, uMin: { value: new THREE.Vector3(...box[0]) }, uMax: { value: new THREE.Vector3(...box[1]) },
      uSize: { value: size }, uFall: { value: fall }, uSway: { value: sway }, uDrift: { value: new THREE.Vector3(...drift) },
      uSprite: { value: sprite }, uOpacity: { value: opacity }, uSpin: { value: spin }, uTwinkle: { value: twinkle }, uStreak: { value: streak },
      uWind: { value: 0 }, uPx: { value: 1 },
    },
    vertexShader: `
      attribute vec4 seed; attribute vec3 tint;
      uniform float uTime,uSize,uFall,uSway,uSpin,uTwinkle,uWind,uPx; uniform vec3 uMin,uMax,uDrift;
      varying vec3 vTint; varying float vA, vRot;
      void main(){
        vec3 span=uMax-uMin; float t=uTime*seed.z+seed.x;
        vec3 q=position*span;
        q.y-=uFall*t; q+=uDrift*t;
        q.x+=sin(t*.7+seed.w)*uSway*(1.+uWind*2.)+uWind*t*.8;
        q.z+=cos(t*.53+seed.w*1.7)*uSway;
        q=mod(q,span)+uMin;
        vec4 mv=modelViewMatrix*vec4(q,1.);
        gl_Position=projectionMatrix*mv;
        float edge=smoothstep(0.,.08,(q.y-uMin.y)/span.y)*smoothstep(0.,.08,(uMax.y-q.y)/span.y);
        vA=edge*(1.-uTwinkle+uTwinkle*pow(.5+.5*sin(uTime*2.3*seed.z+seed.w*5.),3.));
        vRot=seed.w+uTime*uSpin*(seed.z-.9);
        vTint=tint;
        gl_PointSize=uSize*seed.y*uPx*(300./-mv.z);
      }`,
    fragmentShader: `
      uniform sampler2D uSprite; uniform float uOpacity,uStreak;
      varying vec3 vTint; varying float vA,vRot;
      void main(){
        vec2 c=gl_PointCoord-.5;
        if(uStreak>0.){ float a=exp(-pow(c.x/.012,2.))*smoothstep(.5,.0,abs(c.y))*.9; gl_FragColor=vec4(vTint,a*vA*uOpacity); return; }
        float cs=cos(vRot),sn=sin(vRot); c=mat2(cs,-sn,sn,cs)*c;
        vec4 s=texture2D(uSprite,c+.5);
        gl_FragColor=vec4(vTint*s.rgb,s.a*vA*uOpacity);
        if(gl_FragColor.a<.01) discard;
      }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

const MIST_FRAG = `
  uniform float uTime,uDensity; uniform vec3 uColor; varying vec2 vUv; varying vec3 vW;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
  void main(){
    vec2 p=vW.xz*.35+vec2(uTime*.03,uTime*.012);
    float f=fbm(p+fbm(p*1.7-uTime*.02));
    float edge=smoothstep(0.,.25,vUv.x)*smoothstep(1.,.75,vUv.x)*smoothstep(0.,.3,vUv.y)*smoothstep(1.,.5,vUv.y);
    gl_FragColor=vec4(uColor,smoothstep(.35,.85,f)*edge*uDensity);
  }`;
const V_UV = `varying vec2 vUv; varying vec3 vW; void main(){vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}`;

const BEAM_FRAG = `
  uniform float uTime,uStrength; uniform vec3 uColor; varying vec2 vUv; varying vec3 vW;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){
    float across=smoothstep(0.,.3,vUv.x)*smoothstep(1.,.7,vUv.x);
    float along=smoothstep(0.,.15,vUv.y)*(1.-vUv.y*.6);
    float dust=.75+.25*n(vec2(vUv.x*6.,vUv.y*3.-uTime*.05));
    gl_FragColor=vec4(uColor*across*along*dust*uStrength,1.);
  }`;

export class Atmosphere {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;
    this.dot = spriteTex('dot');
    this.A = new THREE.Group(); this.V = new THREE.Group(); this.W = new THREE.Group();
    scene.add(this.A, this.V, this.W);
    // --- interior dust in the lamplight
    this.dust = field({ count: 900, box: [[-3.5, .05, -3.4], [3.5, 2.6, 2]], size: .012, color: '#ffd9a8', sprite: this.dot, sway: .12, drift: [.004, .01, 0], additive: true, twinkle: .6, opacity: .55 });
    this.A.add(this.dust);
    // --- forge sparks (CPU, few, bursty)
    this.sparkN = 160;
    const sg = new THREE.BufferGeometry();
    this.sp = new Float32Array(this.sparkN * 3); this.sv = new Float32Array(this.sparkN * 3); this.sl = new Float32Array(this.sparkN);
    for (let i = 0; i < this.sparkN; i++) this.respawnSpark(i, true);
    sg.setAttribute('position', new THREE.BufferAttribute(this.sp, 3));
    this.sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(4, 1.4, .3), size: .018, map: this.dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.sparks.frustumCulled = false; this.A.add(this.sparks);
    // --- moonbeams through the open shoji
    this.beams = [];
    for (let k = 0; k < 3; k++) {
      const m = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uStrength: { value: .05 }, uColor: { value: new THREE.Color('#6d8fd8') } }, vertexShader: V_UV, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const b = new THREE.Mesh(new THREE.PlaneGeometry(.9 + k * .3, 5.2), m);
      b.position.set(-1.3 + k * .75, 1.4, -2.2 + k * .15);
      b.rotation.set(-.95, .35, .22);
      this.A.add(b); this.beams.push(b);
    }
    // --- mist layers in the garden and low inside
    this.mists = [];
    const mistAt = [[-1, .1, -7, 16, 6], [-1, .6, -10, 18, 7], [0, 1.4, -13, 22, 8], [-.5, .05, -1, 9, 7]];
    for (const [x, y, z, w, d] of mistAt) {
      const m = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uDensity: { value: .3 }, uColor: { value: new THREE.Color('#8ea5c8') } }, vertexShader: V_UV, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); pl.rotation.x = -Math.PI / 2; pl.position.set(x, y, z);
      this.A.add(pl); this.mists.push(pl);
    }
    this.mists[3].material.uniforms.uColor.value.set('#8a7058');
    // --- weather / season particle sets (outside + drifting in)
    const garden = [[-9, -.3, -17], [7, 7, -3.4]], blowIn = [[-2.6, -.02, -3.6], [1.2, 2.4, 1.2]];
    this.rain = field({ count: 6000, box: garden, size: .085, color: '#a9c2e6', sprite: this.dot, fall: 9, sway: .05, streak: 1, opacity: .5 });
    this.drip = field({ count: 260, box: [[-2.5, 0, -3.95], [.8, 2.35, -3.75]], size: .05, color: '#b9d0ee', sprite: this.dot, fall: 4, sway: 0, streak: 1, opacity: .6 });
    this.snow = field({ count: 3600, box: garden, size: .05, color: '#ffffff', sprite: spriteTex('flake'), fall: .45, sway: .6, spin: 1, opacity: .9 });
    this.snowIn = field({ count: 220, box: blowIn, size: .022, color: '#ffffff', sprite: this.dot, fall: .25, sway: .45, drift: [.05, 0, .08], opacity: .7 });
    const petalTex = spriteTex('petal'), leafTex = spriteTex('leaf');
    this.petals = field({ count: 900, box: garden, size: .045, colors: ['#f7c6d3', '#f3a9bf', '#fde2ea'], sprite: petalTex, fall: .28, sway: .9, drift: [.25, 0, .05], spin: 2.2, opacity: .95 });
    this.petalsIn = field({ count: 140, box: blowIn, size: .03, colors: ['#f7c6d3', '#fde2ea'], sprite: petalTex, fall: .12, sway: .5, drift: [.09, 0, .07], spin: 1.6, opacity: .95 });
    this.leaves = field({ count: 700, box: garden, size: .06, colors: ['#d24a12', '#e68a1c', '#9c2a10', '#f0b43a'], sprite: leafTex, fall: .5, sway: 1.1, drift: [.3, 0, .05], spin: 2.8 });
    this.leavesIn = field({ count: 90, box: blowIn, size: .04, colors: ['#d24a12', '#e68a1c'], sprite: leafTex, fall: .2, sway: .6, drift: [.1, 0, .08], spin: 2 });
    this.flies = field({ count: 180, box: [[-7, -.1, -14], [5, 2.2, -3.8]], size: .02, color: '#d9ff6a', sprite: this.dot, fall: 0, sway: .8, drift: [0, .02, 0], additive: true, twinkle: 1, opacity: 1.6 });
    this.fliesIn = field({ count: 16, box: [[-2.4, .3, -3.5], [.6, 1.6, -1]], size: .016, color: '#d9ff6a', sprite: this.dot, sway: .5, additive: true, twinkle: 1, opacity: 1.3 });
    for (const f of [this.rain, this.drip, this.snow, this.snowIn, this.petals, this.petalsIn, this.leaves, this.leavesIn, this.flies, this.fliesIn]) { f.visible = false; this.W.add(f); }
    // --- vault: rising memory motes and orbiting shards
    this.motes = field({ count: 1400, box: [[-9, 0, -18], [9, 9, 4]], size: .02, colors: ['#7ff3ff', '#7ff3ff', '#ffb36b'], sprite: this.dot, fall: -.12, sway: .35, additive: true, twinkle: .7, opacity: 1 });
    this.V.add(this.motes);
    const sh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.05, 0), new THREE.MeshPhysicalMaterial({ color: '#0b1a22', metalness: .9, roughness: .15, emissive: '#1bd6ff', emissiveIntensity: .6, clearcoat: 1 }), 90);
    this.shardData = [];
    for (let i = 0; i < 90; i++) this.shardData.push({ r: rand(1.2, 3.3), a: rand(0, 6.28), y: rand(-1.8, 1.8), s: rand(.4, 1.3), sp: rand(.03, .12) * (Math.random() < .5 ? -1 : 1), tilt: rand(0, 6.28) });
    this.shards = sh; this.V.add(sh);
    this.dummy = new THREE.Object3D();
    this.weather = { rain: 0, snow: 0, wind: 0 };
    this.flash = 0; this.nextBolt = 4;
  }
  respawnSpark(i, init = false) {
    this.sp[i * 3] = 3.85 + rand(-.25, .25); this.sp[i * 3 + 1] = .64; this.sp[i * 3 + 2] = -1.85 + rand(-.15, .15);
    this.sv[i * 3] = rand(-.15, .15); this.sv[i * 3 + 1] = rand(.4, 1.5); this.sv[i * 3 + 2] = rand(-.15, .15);
    this.sl[i] = init ? rand(-3, 1.5) : rand(.6, 1.8);
  }
  setSeason(season, weather) {
    const inside = weather !== 'storm';
    const sets = { rain: 0, snow: 0, petals: 0, leaves: 0, flies: 0 };
    if (weather === 'rain' || weather === 'storm') sets.rain = 1;
    if (weather === 'snow') sets.snow = 1;
    if (season === 'spring' && weather !== 'snow') sets.petals = 1;
    if (season === 'autumn' && weather !== 'snow') sets.leaves = 1;
    if (season === 'summer' && (weather === 'clear' || weather === 'mist')) sets.flies = 1;
    if (season === 'winter' && weather === 'clear') sets.snow = .35;
    this.rain.visible = this.drip.visible = sets.rain > 0;
    this.rain.material.uniforms.uOpacity.value = weather === 'storm' ? .7 : .45;
    this.rain.material.uniforms.uFall.value = weather === 'storm' ? 12 : 8;
    this.snow.visible = this.snowIn.visible = sets.snow > 0;
    this.snow.material.uniforms.uOpacity.value = .9 * sets.snow;
    this.snowIn.visible = sets.snow > .5;
    this.petals.visible = this.petalsIn.visible = !!sets.petals;
    this.leaves.visible = this.leavesIn.visible = !!sets.leaves;
    this.flies.visible = this.fliesIn.visible = !!sets.flies;
    this.weather.wind = weather === 'storm' ? 1 : weather === 'rain' ? .35 : .1;
    this.storm = weather === 'storm';
    for (const f of this.W.children) f.material.uniforms.uWind.value = this.weather.wind;
    const mist = { clear: .28, mist: 1, rain: .55, storm: .7, snow: .6 }[weather];
    this.mists.forEach((m, i) => m.material.uniforms.uDensity.value = (i === 3 ? .12 : .6) * mist * (season === 'winter' ? 1.2 : 1));
    const beam = { clear: .07, mist: .11, rain: .025, storm: .02, snow: .05 }[weather];
    this.beams.forEach(b => b.material.uniforms.uStrength.value = beam);
    void inside;
  }
  setTime(dawn) {
    this.beams.forEach(b => b.material.uniforms.uColor.value.set(dawn ? '#ffb07a' : '#6d8fd8'));
    this.mists.forEach((m, i) => m.material.uniforms.uColor.value.set(i === 3 ? (dawn ? '#9a7a64' : '#8a7058') : (dawn ? '#c9a3a0' : '#8ea5c8')));
    this.dust.material.uniforms.uOpacity.value = dawn ? .8 : .55;
  }
  setEnv(env) { this.A.visible = env === 'atelier'; this.W.visible = env === 'atelier'; this.V.visible = env === 'vault'; }
  setPixelRatio(pr) { this.scene.traverse(o => { if (o.material?.uniforms?.uPx) o.material.uniforms.uPx.value = pr; }); }
  update(dt, time, ambience = true) {
    const T = ambience ? time : 0;
    for (const g of [this.A, this.W, this.V]) g.traverse(o => { const u = o.material?.uniforms; if (u?.uTime) u.uTime.value = T; });
    if (this.A.visible && ambience) {
      for (let i = 0; i < this.sparkN; i++) {
        this.sl[i] -= dt;
        if (this.sl[i] < 0) { if (Math.random() < .03) this.respawnSpark(i); else { this.sp[i * 3 + 1] = -10; continue; } }
        this.sv[i * 3 + 1] -= dt * .35;
        this.sp[i * 3] += this.sv[i * 3] * dt; this.sp[i * 3 + 1] += this.sv[i * 3 + 1] * dt; this.sp[i * 3 + 2] += this.sv[i * 3 + 2] * dt;
      }
      this.sparks.geometry.attributes.position.needsUpdate = true;
    }
    if (this.V.visible) {
      for (let i = 0; i < this.shardData.length; i++) {
        const d = this.shardData[i], a = d.a + T * d.sp;
        this.dummy.position.set(Math.cos(a) * d.r, 4.1 + d.y + Math.sin(T * .4 + i) * .08, -9 + Math.sin(a) * d.r * .35 + .6);
        this.dummy.rotation.set(d.tilt + T * .3, a, T * .2);
        this.dummy.scale.setScalar(d.s);
        this.dummy.updateMatrix(); this.shards.setMatrixAt(i, this.dummy.matrix);
      }
      this.shards.instanceMatrix.needsUpdate = true;
    }
    // lightning
    this.flash *= Math.pow(.02, dt);
    if (this.storm && ambience && this.A.visible) {
      this.nextBolt -= dt;
      if (this.nextBolt < 0) { this.flash = 1; this.nextBolt = rand(3.5, 11); this.pendingDouble = Math.random() < .6 ? .12 : 0; this.onThunder?.(); }
      if (this.pendingDouble > 0) { this.pendingDouble -= dt; if (this.pendingDouble <= 0) this.flash = Math.max(this.flash, .7); }
    }
  }
}
