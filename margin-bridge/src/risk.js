/* ============================================================================
   risk.js — where worst / likely / best come from.

   Nobody types three scenarios. They are derived:

   1. sigma(): for each driver, measure how much that driver actually moved,
      month on month, in the history we hold. That dispersion is the driver's
      own uncertainty. Volume is volatile, DKK is pegged and is not.

   2. gradient(): move each driver one unit and read the margin response.
      The model is close to linear over sensible ranges, so one gradient per
      driver is enough and it makes everything below effectively free.

   3. combine(): worst case is NOT the sum of every driver at its worst.
      That is the classic error and it produces numbers nobody believes.
      Drivers are combined in quadrature with a correlation term:

          band = sqrt( Σ eᵢ² + 2ρ · Σᵢ<ⱼ eᵢeⱼ )

      ρ = 0 treats drivers as independent, ρ = 1 stacks them linearly.
      Default 0.35: in a downturn volume and mix do move together, but FX
      and COGS inflation are not the same event.

   4. monteCarlo(): one common factor plus idiosyncratic noise, 5,000 draws
      on the linearised model. Gives P10/P50/P90 and, more usefully,
      "what is the probability we land above budget".
   ========================================================================== */

import { DRIVERS } from './model.js';
import { isCY, monthOf, CY_START } from './data.js';

/* ------------------------- 1. historical dispersion ---------------------- */
export function sigmas(FACTS) {
  const key = f => `${f.k}|${f.s}`;
  const H = {};
  for (const f of FACTS) {
    (H[key(f)] ??= [])[f.i] = f;
  }
  const pull = (get) => {
    const xs = [];
    for (const k in H) {
      const a = H[k];
      for (let i = 1; i < a.length; i++) if (a[i] && a[i-1]) {
        const v = get(a[i], a[i-1]);
        if (isFinite(v)) xs.push(v);
      }
    }
    return xs;
  };
  const sd = xs => {
    if (!xs.length) return 0;
    const m = xs.reduce((a,b)=>a+b,0) / xs.length;
    return Math.sqrt(xs.reduce((a,b)=>a+(b-m)**2,0) / xs.length);
  };
  // annualised-ish: monthly dispersion scaled to a full-year planning move
  const s = {
    growth:  sd(pull((b,a) => (b.units/a.units - 1) * 100)) * 0.55,
    price:   sd(pull((b,a) => (b.aspG/a.aspG - 1) * 100))   * 1.60,
    disc:    sd(pull((b,a) => (b.discR - a.discR) * 100))   * 1.60,
    cogs:    sd(pull((b,a) => (b.cogsU/a.cogsU - 1) * 100)) * 1.60,
    premium: 2.2,      // observed class-share drift, pp per year
    fxSE:    4.8,      // SEK annual vol vs EUR
    fxNO:    5.4       // NOK annual vol vs EUR
  };
  s.disc = Math.max(0.4, s.disc);
  return s;
}

/* Sign convention: which direction of each driver is GOOD for margin. */
export const FAVOURABLE = { growth:+1, price:+1, disc:-1, cogs:-1, premium:+1, fxSE:+1, fxNO:+1 };

/* ------------------------------ 2. gradients ----------------------------- */
/** @param evalFn (overrideMap) => margin in EUR */
export function gradients(evalFn, state) {
  const base = evalFn({});
  const g = {};
  for (const d of DRIVERS) {
    const h = d.unit === 'pp' ? 1 : 1;               // one unit = 1% or 1pp
    const up = evalFn({ [d.id]: +h }), dn = evalFn({ [d.id]: -h });
    g[d.id] = (up - dn) / (2 * h);                   // EUR per unit of driver
  }
  return { base, g };
}

/* ---------------------------- 3. scenario bands -------------------------- */
export function combine(effects, rho) {
  const e = Object.values(effects);
  let q = e.reduce((a, x) => a + x * x, 0);
  for (let i = 0; i < e.length; i++)
    for (let j = i + 1; j < e.length; j++) q += 2 * rho * e[i] * e[j];
  return Math.sqrt(Math.max(0, q));
}

/**
 * @returns { likely, best, worst, effects, k, rho } all in EUR margin
 */
export function scenarios(grad, sig, { k = 1.28, rho = 0.35 } = {}) {
  const effects = {};
  for (const d of DRIVERS) {
    effects[d.id] = Math.abs((grad.g[d.id] ?? 0) * (sig[d.id] ?? 0) * k);
  }
  const band = combine(effects, rho);
  return { likely: grad.base, best: grad.base + band, worst: grad.base - band,
           effects, band, k, rho };
}

/** Per-driver tornado: independent ±k·σ swing, ordered by magnitude. */
export function tornado(grad, sig, k = 1.28) {
  return DRIVERS.map(d => {
    const swing = (grad.g[d.id] ?? 0) * (sig[d.id] ?? 0) * k;
    return { id:d.id, name:d.name, unit:d.unit,
             sigma:sig[d.id] ?? 0, hi:Math.abs(swing), lo:-Math.abs(swing),
             span:Math.abs(swing) * 2 };
  }).sort((a, b) => b.span - a.span);
}

/* ---------------------------- 4. Monte Carlo ----------------------------- */
const gauss = (() => {
  let spare = null;
  return () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u, v, sq;
    do { u = Math.random()*2-1; v = Math.random()*2-1; sq = u*u+v*v; } while (!sq || sq >= 1);
    const f = Math.sqrt(-2*Math.log(sq)/sq); spare = v*f; return u*f;
  };
})();

export function monteCarlo(grad, sig, { n = 5000, rho = 0.35, target = null } = {}) {
  const ids = DRIVERS.map(d => d.id);
  const a = Math.sqrt(rho), b = Math.sqrt(1 - rho);
  const out = new Float64Array(n);
  for (let t = 0; t < n; t++) {
    const F = gauss();
    let m = grad.base;
    for (const id of ids) {
      const z = a * F + b * gauss();
      m += (grad.g[id] ?? 0) * (sig[id] ?? 0) * z;
    }
    out[t] = m;
  }
  out.sort();
  const q = p => out[Math.min(n - 1, Math.floor(p * n))];
  const above = target === null ? null : out.filter(x => x >= target).length / n;
  return { p05:q(.05), p10:q(.10), p50:q(.50), p90:q(.90), p95:q(.95),
           mean:out.reduce((x,y)=>x+y,0)/n, above, samples:out };
}

/* Histogram bins for the distribution chart. */
export function histogram(samples, bins = 34) {
  const lo = samples[0], hi = samples[samples.length - 1], w = (hi - lo) / bins || 1;
  const h = new Array(bins).fill(0);
  for (const s of samples) h[Math.min(bins - 1, Math.floor((s - lo) / w))]++;
  return { lo, hi, w, h, max: Math.max(...h) };
}
