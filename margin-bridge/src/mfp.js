/* ============================================================================
   mfp.js — Miele Financial Plan, long term.

   An annual planning model that sits above the monthly margin engine. It starts
   from real history, projects the plan horizon, and breaks the top line down two
   ways that must always reconcile:

       Nordics  =  Σ sales channels  =  Σ (channel × business unit)

   Everything is built top-down from Nordics net sales × a channel mix × a BU
   mix, so a parent is always the exact sum of its children. Future years are
   prepopulated from the trend and are fully overwritable — growth, margin,
   price, channel mix and BU mix are all assumptions the planner owns.

   Metrics carried per cell: net sales (external, EUR), product margin (EUR),
   product-margin %, and volume (units, derived from net sales ÷ ASP).
   ========================================================================== */

import { BUS } from './data.js';

/* --------------------------------- calendar ------------------------------- */
export const ACTUAL_YEARS = [2022, 2023, 2024, 2025];
export const BUD_YEAR   = 2026;                 // budget year, with actual YTD
export const YTD_MONTH  = 7;                     // 2026 actuals through July
export const PLAN_YEARS = [2027, 2028, 2029, 2030, 2031];
export const MFP_YEARS  = [...ACTUAL_YEARS, BUD_YEAR, ...PLAN_YEARS];
export const BASE_YEAR  = BUD_YEAR;              // plan is launched off the 2026 budget

export const CHANNELS = [
  { id:'ERT', name:'ERT',              long:'Electro retail trade',   col:'#2F5D50' },
  { id:'KRT', name:'KRT',              long:'Kitchen retail trade',   col:'#B08A3E' },
  { id:'DP',  name:'Direct Projects',  long:'Project & contract',     col:'#3f6d8a' },
  { id:'D2C', name:'D2C',              long:'Direct to consumer',     col:'#9E1B1B' },
  { id:'CS',  name:'Customer Service', long:'Service, parts & care',  col:'#8a6d3f' }
];
export const CH_IDS = CHANNELS.map(c => c.id);

/* ------------------------------- seeded base ------------------------------ */
const seed = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const TOTAL_2022 = 148e6;                         // Nordics net sales, external
const CH_SHARE_22 = { ERT:.34, KRT:.23, DP:.17, D2C:.14, CS:.12 };
const CH_GROWTH   = { ERT:.005, KRT:.03, DP:.07, D2C:.14, CS:.05 };  // ns CAGR by channel
const CH_PM       = { ERT:.27, KRT:.31, DP:.29, D2C:.38, CS:.42 };   // product-margin rate
const BU_SHARE = {                                 // BU split within each channel (Σ=1)
  ERT:{ LAU:.26, COO:.22, REF:.22, DIS:.16, SDA:.14 },
  KRT:{ LAU:.18, COO:.34, REF:.24, DIS:.18, SDA:.06 },
  DP: { LAU:.14, COO:.30, REF:.28, DIS:.22, SDA:.06 },
  D2C:{ LAU:.18, COO:.14, REF:.14, DIS:.14, SDA:.40 },
  CS: { LAU:.22, COO:.22, REF:.20, DIS:.18, SDA:.18 }
};
const ASP = { LAU:1180, COO:1450, REF:1320, DIS:980, SDA:395 };      // net €/unit, 2022
const PRICE_CAGR = 0.02;

/* Month seasonality for spreading an annual plan to a budget (appliance shape). */
export const SEAS = [.082,.078,.086,.088,.090,.083,.070,.078,.090,.092,.084,.079];

/** Build the historical actuals, the 2026 budget and the 2026 YTD actual. */
export function buildHistory() {
  const r = seed(20260811);
  const H = {};                                    // H[year][ch][bu] = {ns,pm,vol,pmRate}
  const cell = (chNs, ch, bu, t, noise) => {
    const ns = chNs * BU_SHARE[ch][bu.id] * noise;
    const pmRate = CH_PM[ch] * (1 + t * 0.004) * (0.99 + r() * 0.02);
    const asp = ASP[bu.id] * Math.pow(1 + PRICE_CAGR, t);
    return { ns, pm: ns * pmRate, pmRate, vol: ns / asp };
  };
  for (const y of ACTUAL_YEARS) {
    const t = y - 2022; H[y] = {};
    for (const c of CHANNELS) {
      const chNs = TOTAL_2022 * CH_SHARE_22[c.id] * Math.pow(1 + CH_GROWTH[c.id], t) * (0.99 + r() * 0.02);
      H[y][c.id] = {};
      for (const bu of BUS) H[y][c.id][bu.id] = cell(chNs, c.id, bu, t, 0.98 + r() * 0.04);
    }
  }
  // 2026 budget: 2025 plus a modest plan uplift per channel; margin a touch better
  const bud = {}; const t26 = 2026 - 2022;
  for (const c of CHANNELS) {
    bud[c.id] = {};
    for (const bu of BUS) {
      const p = H[2025][c.id][bu.id];
      const ns = p.ns * (1 + CH_GROWTH[c.id] + 0.01);
      const pmRate = p.pmRate + 0.003;
      const asp = ASP[bu.id] * Math.pow(1 + PRICE_CAGR, t26);
      bud[c.id][bu.id] = { ns, pm: ns * pmRate, pmRate, vol: ns / asp };
    }
  }
  // 2026 YTD (Jan–Jul actual): budget prorated by seasonality, pacing slightly behind
  const ytdFrac = SEAS.slice(0, YTD_MONTH).reduce((a, b) => a + b, 0);
  const ytd = {};
  for (const c of CHANNELS) { ytd[c.id] = {};
    for (const bu of BUS) { const b = bud[c.id][bu.id];
      ytd[c.id][bu.id] = { ns:b.ns*ytdFrac*0.985, pm:b.pm*ytdFrac*0.975,
        pmRate:b.pmRate*0.99, vol:b.vol*ytdFrac*0.99 }; }
  }
  return { H, bud, ytd, ytdFrac };
}

/* ------------------------------ aggregation ------------------------------- */
export const zero = () => ({ ns:0, pm:0, vol:0 });
export function rollup(byChBu) {                   // {ch:{bu:{ns,pm,vol}}} → totals
  const tot = zero(), ch = {};
  for (const c of CH_IDS) {
    ch[c] = zero();
    for (const bu of BUS) { const o = byChBu[c][bu.id];
      ch[c].ns += o.ns; ch[c].pm += o.pm; ch[c].vol += o.vol;
      tot.ns += o.ns; tot.pm += o.pm; tot.vol += o.vol; }
    ch[c].pmRate = ch[c].ns ? ch[c].pm / ch[c].ns : 0;
  }
  tot.pmRate = tot.ns ? tot.pm / tot.ns : 0;
  return { tot, ch };
}

/* ----------------------------- default drift ------------------------------ */
/** Channel mix drifts toward the faster-growing channels, from the 2026 base. */
function defaultChShare(baseShare, y) {
  const t = y - BASE_YEAR, raw = {};
  let s = 0;
  for (const c of CH_IDS) { raw[c] = baseShare[c] * Math.pow(1 + CH_GROWTH[c], t); s += raw[c]; }
  const out = {}; for (const c of CH_IDS) out[c] = raw[c] / s;
  return out;
}

/* ------------------------------- projection ------------------------------- */
/**
 * @param mfpState { growth:{y:%}, pm:{y:%}, price:{y:%}, nsAbs:{y:€},
 *                   chShare:{y:{ch:%}}, buShare:{ch:{bu:%}} }  — all optional overrides
 * @returns { years:{y:{byChBu, tot, ch}}, base, defaults, editable flags }
 */
export function project(hist, mfpState = {}) {
  const { H, bud } = hist;
  const ov = { growth:{}, pm:{}, price:{}, nsAbs:{}, chShare:{}, buShare:{}, ...mfpState };

  // --- actual + budget years, straight from history ---
  const years = {};
  for (const y of ACTUAL_YEARS) years[y] = { ...rollup(H[y]), byChBu: H[y], kind:'actual' };
  years[BUD_YEAR] = { ...rollup(bud), byChBu: bud, kind:'budget' };

  // base 2026 metrics
  const base = years[BASE_YEAR].tot;
  const baseShare = {}; for (const c of CH_IDS) baseShare[c] = years[BASE_YEAR].ch[c].ns / base.ns;
  const basePm = base.pmRate;
  // default annual growth = blended historical net-sales CAGR 2022→2025
  const histCagr = Math.pow(years[2025].tot.ns / years[2022].tot.ns, 1/3) - 1;

  // BU share within channel — default from 2025 actual, overridable (held across plan)
  const buShareOf = (c) => {
    const o = ov.buShare[c]; const base25 = years[2025].ch[c].ns;
    const def = {}; for (const bu of BUS) def[bu.id] = years[2025].byChBu[c][bu.id].ns / base25;
    if (!o) return { val:def, edited:false };
    let s = 0; const merged = {};
    for (const bu of BUS) { merged[bu.id] = (o[bu.id] != null ? o[bu.id]/100 : def[bu.id]); s += merged[bu.id]; }
    for (const bu of BUS) merged[bu.id] /= (s || 1);
    return { val:merged, edited:true };
  };

  const defaults = { growth:{}, pm:{}, price:{}, chShare:{}, buShare:{} };
  let prevNs = base.ns;
  for (const y of PLAN_YEARS) {
    const gDef = histCagr, pmDef = basePm + (y - BASE_YEAR) * 0.002, prDef = PRICE_CAGR;
    defaults.growth[y] = gDef; defaults.pm[y] = pmDef; defaults.price[y] = prDef;
    const g  = ov.growth[y] != null ? ov.growth[y]/100 : gDef;
    const pm = ov.pm[y]     != null ? ov.pm[y]/100     : pmDef;
    const pr = ov.price[y]  != null ? ov.price[y]/100  : prDef;
    const ns = ov.nsAbs[y] != null ? ov.nsAbs[y] : prevNs * (1 + g);
    prevNs = ns;

    // channel share: default drift, overridden per channel then renormalised
    const shDef = defaultChShare(baseShare, y);
    defaults.chShare[y] = shDef;
    const shOv = ov.chShare[y] || {};
    let ss = 0; const sh = {};
    for (const c of CH_IDS) { sh[c] = shOv[c] != null ? shOv[c]/100 : shDef[c]; ss += sh[c]; }
    for (const c of CH_IDS) sh[c] /= (ss || 1);

    // channel PM rate scaled so the blend hits the target pm%
    const histBlend = CH_IDS.reduce((a, c) => a + sh[c] * CH_PM[c], 0);
    const pmScale = histBlend ? pm / histBlend : 1;

    const byChBu = {};
    for (const c of CH_IDS) {
      const chNs = ns * sh[c], rate = CH_PM[c] * pmScale;
      const bs = buShareOf(c).val;
      defaults.buShare[c] = bs;
      byChBu[c] = {};
      for (const bu of BUS) {
        const cellNs = chNs * bs[bu.id];
        const asp = ASP[bu.id] * Math.pow(1 + pr, y - 2022);
        byChBu[c][bu.id] = { ns:cellNs, pm:cellNs * rate, pmRate:rate, vol: asp ? cellNs / asp : 0 };
      }
    }
    years[y] = { ...rollup(byChBu), byChBu, kind:'plan', share:sh };
  }
  return { years, base, defaults, histCagr };
}

/* Convenience: pull a Nordics-total series across all years for one metric. */
export const totalSeries = (proj, key) => MFP_YEARS.map(y => proj.years[y].tot[key]);
export const isActual = y => y <= BUD_YEAR;
export const yearKind = y => ACTUAL_YEARS.includes(y) ? 'actual' : y === BUD_YEAR ? 'budget' : 'plan';
