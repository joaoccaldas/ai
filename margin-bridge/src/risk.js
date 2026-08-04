/* ============================================================================
   risk.js — where worst / likely / best come from.

   Nobody types three scenarios. They are derived:

   1. sigma(): for each driver, measure how much that driver actually moved
      over the *planning horizon we are forecasting*, in the history we hold.
      If seven months are open, we look at how much each driver drifted over
      seven-month windows in the past — not one month, and not a hand-tuned
      annualisation factor. That h-step dispersion IS the planning uncertainty,
      derived rather than assumed. Volume drifts a lot; DKK is pegged and barely
      moves. (The earlier build multiplied a one-month σ by fixed fudge factors
      of 0.55 and 1.60 — those are gone.)

   2. gradient(): move each driver one unit and read the margin response.
      The model is close to linear over sensible ranges, so one gradient per
      driver is enough and it makes everything below effectively free.

   3. combine(): worst case is NOT the sum of every driver at its worst.
      That is the classic error and it produces numbers nobody believes.
      Drivers are combined in quadrature with a correlation STRUCTURE, not a
      single number:

          band = sqrt( Σ eᵢ² + 2 · Σᵢ<ⱼ ρᵢⱼ · eᵢeⱼ )

      Drivers sit in two blocks. Demand (volume, price, discount, rebate,
      premium mix) co-moves in a downturn at ρ. The macro block (COGS
      inflation, FX) co-moves at ρ too, but across the two blocks the
      correlation is only ρ·cross (default cross = 0.4) — a soft landing and
      input-cost inflation are related, not the same event.

   4. monteCarlo(): a demand factor and a macro factor plus a weak common
      factor and idiosyncratic noise, 5,000 draws on the linearised model.
      Reproduces the block correlation exactly and gives P10/P50/P90 and,
      more usefully, "what is the probability we land above budget".
   ========================================================================== */

import { DRIVERS } from './model.js';
import { isCY, monthOf, CY_START } from './data.js';

/* Which block each driver belongs to, for the correlation structure. */
export const BLOCK = { growth:'demand', price:'demand', disc:'demand', rebate:'demand',
                       premium:'demand', cogs:'macro', fxSE:'macro', fxNO:'macro' };
/** Pairwise correlation: ρ within a block, ρ·cross across blocks, 1 on the diagonal. */
export const corrOf = (a, b, rho, cross = 0.4) =>
  a === b ? 1 : (BLOCK[a] === BLOCK[b] ? rho : rho * cross);

/* ------------------------- 1. historical dispersion ---------------------- */
export function sigmas(FACTS, horizon = 6) {
  const h = Math.max(1, Math.min(11, Math.round(horizon)));   // open-month planning window
  const key = f => `${f.k}|${f.s}`;
  const H = {};
  for (const f of FACTS) {
    (H[key(f)] ??= [])[f.i] = f;
  }
  const pull = (get) => {
    const xs = [];
    for (const k in H) {
      const a = H[k];
      for (let i = h; i < a.length; i++) if (a[i] && a[i-h]) {
        const v = get(a[i], a[i-h]);              // h-step change, not 1-step
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
  const s = {
    growth:  sd(pull((b,a) => (b.units/a.units - 1) * 100)),
    price:   sd(pull((b,a) => (b.aspG/a.aspG - 1) * 100)),
    disc:    sd(pull((b,a) => (b.discR - a.discR) * 100)),
    rebate:  sd(pull((b,a) => ((b.rebR??0) - (a.rebR??0)) * 100)),
    cogs:    sd(pull((b,a) => (b.cogsU/a.cogsU - 1) * 100)),
    // class-share and FX are not on the per-SKU fact; documented annual vols
    // scaled to the open-month horizon by the √time rule.
    premium: 2.2 * Math.sqrt(h/12),
    fxSE:    4.8 * Math.sqrt(h/12),
    fxNO:    5.4 * Math.sqrt(h/12)
  };
  s.disc   = Math.max(0.2, s.disc);
  s.rebate = Math.max(0.2, s.rebate);
  return s;
}

/* Sign convention: which direction of each driver is GOOD for margin. */
export const FAVOURABLE = { growth:+1, price:+1, disc:-1, rebate:-1, cogs:-1, premium:+1, fxSE:+1, fxNO:+1 };

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
export function combine(effects, rho, cross = 0.4) {
  const ids = Object.keys(effects);
  let q = ids.reduce((a, id) => a + effects[id] ** 2, 0);
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      q += 2 * corrOf(ids[i], ids[j], rho, cross) * effects[ids[i]] * effects[ids[j]];
  return Math.sqrt(Math.max(0, q));
}

/**
 * @returns { likely, best, worst, effects, k, rho } all in EUR margin
 */
export function scenarios(grad, sig, { k = 1.28, rho = 0.35, cross = 0.4 } = {}) {
  const effects = {};
  for (const d of DRIVERS) {
    effects[d.id] = Math.abs((grad.g[d.id] ?? 0) * (sig[d.id] ?? 0) * k);
  }
  const band = combine(effects, rho, cross);
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

export function monteCarlo(grad, sig, { n = 5000, rho = 0.35, cross = 0.4, target = null } = {}) {
  const ids = DRIVERS.map(d => d.id);
  // z = √(cross·ρ)·G + √(ρ−cross·ρ)·F_block + √(1−ρ)·idio  → unit variance,
  // within-block corr ρ, cross-block corr cross·ρ, exactly matching combine().
  const g0 = Math.sqrt(Math.max(0, cross * rho));
  const gb = Math.sqrt(Math.max(0, rho - cross * rho));
  const gi = Math.sqrt(Math.max(0, 1 - rho));
  const out = new Float64Array(n);
  for (let t = 0; t < n; t++) {
    const G = gauss(), Fdem = gauss(), Fmac = gauss();
    let m = grad.base;
    for (const id of ids) {
      const z = g0 * G + gb * (BLOCK[id] === 'demand' ? Fdem : Fmac) + gi * gauss();
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
