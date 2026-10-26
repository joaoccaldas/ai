/* ============================================================================
   ltp.js — Helioforge long-term plan.

   Helioforge is a fictional cloud-AI company. This annual planning model sits
   above the monthly margin engine. It starts from synthetic history, projects
   the plan horizon, and breaks the top line down two ways that must always
   reconcile:

       Global  =  Σ go-to-market channels  =  Σ (channel × product line)

   Everything is built top-down from Global net sales × a channel mix × a
   product-line mix, so a parent is always the exact sum of its children.
   Future years are prepopulated from the trend and are fully overwritable —
   growth, margin, price, channel mix and product-line mix are assumptions
   the planner owns.

   Metrics carried per cell: net sales (external, EUR), product margin (EUR),
   product-margin %, and plan units (net sales ÷ ASP). A plan unit is a
   commercial commit — usage pack, seat-year, workspace or endpoint — not a
   single physical item. Figures are synthetic.
   ========================================================================== */

import { BUS } from './data.js';

/* --------------------------------- calendar ------------------------------- */
export const ACTUAL_YEARS = [2022, 2023, 2024, 2025];
export const BUD_YEAR   = 2026;                 // budget year, with actual YTD
export const YTD_MONTH  = 7;                     // 2026 actuals through July
export const PLAN_YEARS = [2027, 2028, 2029, 2030, 2031];
export const LTP_YEARS  = [...ACTUAL_YEARS, BUD_YEAR, ...PLAN_YEARS];
export const BASE_YEAR  = BUD_YEAR;              // plan is launched off the 2026 budget

export const CHANNELS = [
  { id:'ENT', name:'Enterprise',  long:'Named-account direct',  col:'#2F5D50' },
  { id:'SLF', name:'Self-serve',  long:'Product-led sign-up',   col:'#9E1B1B' },
  { id:'PTR', name:'Partners',    long:'SI & reseller',         col:'#3f6d8a' },
  { id:'MKT', name:'Marketplace', long:'Cloud marketplace',     col:'#B08A3E' },
  { id:'SVC', name:'Services',    long:'Success & delivery',    col:'#8a6d3f' }
];
export const CH_IDS = CHANNELS.map(c => c.id);

/* ------------------------------- seeded base ------------------------------ */
const seed = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const TOTAL_2022 = 72e6;                          // Global net sales, external EUR
const CH_SHARE_22 = { ENT:.40, SLF:.24, PTR:.14, MKT:.12, SVC:.10 };
const CH_GROWTH   = { ENT:.14, SLF:.26, PTR:.16, MKT:.20, SVC:.06 }; // ns CAGR by channel
const CH_PM       = { ENT:.74, SLF:.82, PTR:.68, MKT:.70, SVC:.42 }; // product-margin rate
const BU_SHARE = {                                 // product-line split within each channel (Σ=1)
  ENT:{ INF:.22, APP:.26, AGT:.24, HST:.20, EVL:.08 },
  SLF:{ INF:.40, APP:.22, AGT:.14, HST:.04, EVL:.20 },
  PTR:{ INF:.18, APP:.30, AGT:.22, HST:.18, EVL:.12 },
  MKT:{ INF:.36, APP:.24, AGT:.16, HST:.10, EVL:.14 },
  SVC:{ INF:.12, APP:.18, AGT:.28, HST:.30, EVL:.12 }
};
const ASP = { INF:1100, APP:2400, AGT:8600, HST:36000, EVL:720 };    // net €/plan unit, 2022
const PRICE_CAGR = 0.03;

/* Month weights for spreading an annual plan to a budget. SaaS shape:
   quarter-end closes, a mild summer dip, and a December enterprise flush.
   The twelve weights sum to 1. */
export const SEAS = [.080,.076,.088,.078,.080,.086,.074,.072,.082,.086,.090,.108];

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
 * @param ltpState { growth:{y:%}, pm:{y:%}, price:{y:%}, nsAbs:{y:€},
 *                   chShare:{y:{ch:%}}, buShare:{ch:{bu:%}} }  — all optional overrides
 * @returns { years:{y:{byChBu, tot, ch}}, base, defaults, editable flags }
 */
export function project(hist, ltpState = {}) {
  const { H, bud } = hist;
  const ov = { mode:'total', growth:{}, pm:{}, price:{}, nsAbs:{}, buGrowth:{}, chShare:{}, buShare:{}, ...ltpState };

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

  const defaults = { growth:{}, pm:{}, price:{}, chShare:{}, buShare:{}, buGrowth:{}, buCagr:{} };

  // ---- BU-mode precompute: BU totals, per-BU CAGR, and each BU's channel split ----
  const mode = ov.mode === 'bu' ? 'bu' : 'total';
  const buTot = (yr) => Object.fromEntries(BUS.map(b => [b.id,
    CH_IDS.reduce((s,c) => s + years[yr].byChBu[c][b.id].ns, 0)]));
  const buBase = buTot(BASE_YEAR), bu22 = buTot(2022), bu25 = buTot(2025);
  for (const b of BUS) defaults.buCagr[b.id] = Math.pow(bu25[b.id]/bu22[b.id], 1/3) - 1;
  const chWithinBu = {};                                   // how each BU splits across channels (2025)
  for (const b of BUS) { chWithinBu[b.id] = {}; const t = bu25[b.id] || 1;
    for (const c of CH_IDS) chWithinBu[b.id][c] = years[2025].byChBu[c][b.id].ns / t; }

  let prevNs = base.ns, prevBu = { ...buBase };
  for (const y of PLAN_YEARS) {
    const gDef = histCagr, pmDef = basePm + (y - BASE_YEAR) * 0.002, prDef = PRICE_CAGR;
    defaults.growth[y] = gDef; defaults.pm[y] = pmDef; defaults.price[y] = prDef;
    const pm = ov.pm[y]     != null ? ov.pm[y]/100     : pmDef;
    const pr = ov.price[y]  != null ? ov.price[y]/100  : prDef;

    /* ---- BU-growth mode: plan each BU's growth, allocate to channels by history ---- */
    if (mode === 'bu') {
      defaults.buGrowth[y] = {};
      const buNsY = {};
      for (const b of BUS) { const gd = defaults.buCagr[b.id]; defaults.buGrowth[y][b.id] = gd;
        const gb = (ov.buGrowth[y]||{})[b.id] != null ? ov.buGrowth[y][b.id]/100 : gd;
        buNsY[b.id] = prevBu[b.id] * (1 + gb); }
      prevBu = buNsY;
      const byChBu = {}; for (const c of CH_IDS) byChBu[c] = {};
      const chNs = Object.fromEntries(CH_IDS.map(c => [c,
        BUS.reduce((s,b) => s + buNsY[b.id]*chWithinBu[b.id][c], 0)]));
      const totNs = BUS.reduce((s,b) => s + buNsY[b.id], 0);
      const histBlend = totNs ? CH_IDS.reduce((a,c) => a + chNs[c]/totNs * CH_PM[c], 0) : 0;
      const pmScale = histBlend ? pm/histBlend : 1;
      for (const c of CH_IDS) { const rate = CH_PM[c]*pmScale;
        for (const b of BUS) { const cellNs = buNsY[b.id]*chWithinBu[b.id][c];
          const asp = ASP[b.id]*Math.pow(1+pr, y-2022);
          byChBu[c][b.id] = { ns:cellNs, pm:cellNs*rate, pmRate:rate, vol: asp ? cellNs/asp : 0 }; } }
      years[y] = { ...rollup(byChBu), byChBu, kind:'plan', mode:'bu' };
      continue;
    }

    /* ---- total-growth mode: plan the top line, break down by channel & BU mix ---- */
    const g  = ov.growth[y] != null ? ov.growth[y]/100 : gDef;
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

/* Convenience: pull a Global-total series across all years for one metric. */
export const totalSeries = (proj, key) => LTP_YEARS.map(y => proj.years[y].tot[key]);
export const isActual = y => y <= BUD_YEAR;
export const yearKind = y => ACTUAL_YEARS.includes(y) ? 'actual' : y === BUD_YEAR ? 'budget' : 'plan';
