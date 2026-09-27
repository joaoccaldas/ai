// Generative ambience: no audio files. Rain, wind, forge crackle, crickets, the ring's hum.
export class AmbientSound {
  constructor() { this.ctx = null; this.on = false; }
  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = noise;
    const layer = (type, freq, q) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(this.master); s.start(); return g; };
    this.rain = layer('bandpass', 2600, .5);
    this.rainLow = layer('lowpass', 500, .7);
    this.wind = layer('lowpass', 380, 1.2);
    // wind LFO
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = .04; lfo.connect(lg).connect(this.wind.gain); lfo.start();
    // ring hum
    this.hum = ctx.createGain(); this.hum.gain.value = 0; this.hum.connect(this.master);
    for (const [f, a] of [[55, .5], [82.4, .3], [110, .22], [164.8, .08]]) { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = a; o.connect(g).connect(this.hum); o.start(); }
    this.tick();
  }
  enable(v) {
    this.on = v; if (v) this.init(); if (!this.ctx) return;
    if (v && this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.setTargetAtTime(v ? .9 : 0, this.ctx.currentTime, .6);
  }
  setScene(env, weather, season) {
    this.env = env; this.weather = weather; this.season = season;
    if (!this.ctx) return;
    const t = this.ctx.currentTime, at = env === 'atelier';
    const r = at ? (weather === 'storm' ? .5 : weather === 'rain' ? .32 : 0) : 0;
    this.rain.gain.setTargetAtTime(r * .5, t, 1); this.rainLow.gain.setTargetAtTime(r, t, 1);
    this.wind.gain.setTargetAtTime(at ? (weather === 'storm' ? .35 : weather === 'snow' ? .16 : .07) : .02, t, 1.5);
    this.hum.gain.setTargetAtTime(env === 'vault' ? .05 : 0, t, 1.5);
  }
  blip(freq, dur, vol, type = 'sine') {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + .05);
  }
  tick() {
    const next = () => setTimeout(() => this.tick(), 60 + Math.random() * 180);
    if (!this.on || !this.ctx) return next();
    if (this.env === 'atelier') {
      if (Math.random() < .25) { // forge crackle
        const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800; const g = this.ctx.createGain(), t = this.ctx.currentTime;
        g.gain.setValueAtTime(.05 * Math.random(), t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); s.connect(f).connect(g).connect(this.master); s.start(t, Math.random() * 2, .04);
      }
      if (this.season === 'summer' && this.weather === 'clear' && Math.random() < .35) { for (let k = 0; k < 3; k++) setTimeout(() => this.on && this.blip(4200 + Math.random() * 300, .04, .012), k * 45); }
      if (Math.random() < .01) this.blip(1320 + Math.random() * 400, 2.6, .012, 'triangle'); // wind chime
    } else if (this.env === 'vault' && Math.random() < .02) this.blip([523, 659, 784, 988][Math.floor(Math.random() * 4)], 3.2, .015, 'sine');
    next();
  }
  thunder() {
    if (!this.on || !this.ctx) return;
    setTimeout(() => {
      const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; const g = this.ctx.createGain(), t = this.ctx.currentTime;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.9, t + .2); g.gain.exponentialRampToValueAtTime(.001, t + 3.5); s.connect(f).connect(g).connect(this.master); s.start(t, 0, 3.6);
    }, 700 + Math.random() * 1500);
  }
  swish() {
    if (!this.on || !this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4; const g = this.ctx.createGain(), t = this.ctx.currentTime;
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(4200, t + .12); f.frequency.exponentialRampToValueAtTime(700, t + .35);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .08); g.gain.exponentialRampToValueAtTime(.001, t + .4);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random(), .45);
    this.blip(2640, 1.8, .02, 'sine');
  }
  whoosh() {
    if (!this.on || !this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; const g = this.ctx.createGain(), t = this.ctx.currentTime;
    f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(3000, t + 1.6); f.frequency.exponentialRampToValueAtTime(300, t + 3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + 1.5); g.gain.exponentialRampToValueAtTime(.001, t + 3.2);
    s.connect(f).connect(g).connect(this.master); s.start(t, 0, 3.2);
    this.blip(98, 3.5, .08); this.blip(147, 3.5, .05);
  }
}
