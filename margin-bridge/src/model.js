/* ============================================================================
   model.js — the planning engine.

   Three versions live side by side and never overwrite each other:
     ACT  actuals, immutable, months 0..cursor
     BUD  budget, locked before the year, all 12 CY months
     FC   forecast = ACT for closed months + driven for open months

   Nothing in FC is typed by a human. Base values are derived from history;
   humans only supply deltas, and those deltas resolve by specificity.
   ========================================================================== */

import { MARKETS, BUS, CLASSES, FX, N_MONTHS, CY_START, monthOf, isCY } from './data.js';

/* ------------------------------ driver spec ------------------------------ */
export const DRIVERS = [
  { id:'growth',  name:'Volume growth',    unit:'%',  min:-20, max:20, step:.5,  lvl:true  },
  { id:'price',   name:'Price',            unit:'%',  min:-10, max:15, step:.25, lvl:true  },
  { id:'disc',    name:'Discount rate',    unit:'pp', min:-6,  max:8,  step:.25, lvl:true  },
  { id:'cogs',    name:'COGS per unit',    unit:'%',  min:-12, max:18, step:.25, lvl:true  },
  { id:'premium', name:'Shift to Platinum',unit:'pp', min:-8,  max:12, step:.5,  lvl:true  },
  { id:'fxSE',    name:'SEK vs EUR',       unit:'%',  min:-15, max:15, step:.5,  lvl:false },
  { id:'fxNO',    name:'NOK vs EUR',       unit:'%',  min:-15, max:15, step:.5,  lvl:false }
];
export const LEVELLED = DRIVERS.filter(d => d.lvl).map(d => d.id);

/* State shape ------------------------------------------------------------- */
export const newState = () => ({
  cursor: 17,          // last closed CY month index (17 = Jun CY)
  carry: 0.5,          // how much YTD trend carries into the open months, 0..1
  ramp: true,          // price/COGS changes phase in over 3 months
  ov: {}               // overrides: key `${level}|${scope}|${driver}` -> number
});

/* --------------------------- override resolution -------------------------
   Specificity, most specific first:
     SKU  >  MARKET×BU  >  BU  >  MARKET  >  PORTFOLIO
   Only overrides are stored. Everything else inherits.                     */
export const ovKey = (level, scope, driver) => `${level}|${scope}|${driver}`;

export function resolve(state, driver, ctx) {
  const o = state.ov;
  const probes = [
    ['sku',  ctx.s],
    ['mktbu', `${ctx.k}~${ctx.bu}`],
    ['bu',   ctx.bu],
    ['mkt',  ctx.k],
    ['all',  'ALL']
  ];
  for (const [lvl, sc] of probes) {
    const v = o[ovKey(lvl, sc, driver)];
    if (v !== undefined && v !== null) return { v, lvl, sc };
  }
  return { v: 0, lvl: 'base', sc: null };
}
export const val = (state, driver, ctx) => resolve(state, driver, ctx).v;

/* Where does a cell get its number from, if it is not itself overridden? */
export function inherited(state, level, scope, driver) {
  const ctx = level === 'sku'   ? { s:scope }
            : level === 'mktbu' ? { k:scope.split('~')[0], bu:scope.split('~')[1] }
            : level === 'bu'    ? { bu:scope }
            : level === 'mkt'   ? { k:scope }
            : {};
  const order = ['sku','mktbu','bu','mkt','all'];
  const start = order.indexOf(level) + 1;
  for (let i = start; i < order.length; i++) {
    const l = order[i];
    const sc = l === 'mktbu' ? `${ctx.k}~${ctx.bu}` : l === 'all' ? 'ALL' : ctx[l === 'mkt' ? 'k' : l === 'bu' ? 'bu' : 's'];
    if (sc === undefined) continue;
    const v = state.ov[ovKey(l, sc, driver)];
    if (v !== undefined) return { v, lvl:l };
  }
  return { v: 0, lvl: 'base' };
}

/* ------------------------------- FX ------------------------------------- */
export function fxOf(state, k, i) {
  const f = FX[k];
  if (!isCY(i)) return f.py;
  let r = i <= state.cursor ? f.act : f.open;
  if (i > state.cursor) {                       // only open months can be re-planned
    if (k === 'SE') r = r / (1 + val(state,'fxSE',{}) / 100);
    if (k === 'NO') r = r / (1 + val(state,'fxNO',{}) / 100);
  }
  return r;
}

/* --------------------------- history summaries ---------------------------
   Derived once per dataset. These are the base assumptions: the forecast
   starts as "history on autopilot" before any human touches it.           */
export function summarise(FACTS, cursor) {
  const key = f => `${f.k}|${f.s}`;
  const H = {};
  for (const f of FACTS) {
    const kk = key(f);
    if (!H[kk]) H[kk] = { py:Array(12).fill(null), cy:Array(12).fill(null),
                          bu:f.bu, cls:f.cls, k:f.k, s:f.s };
    (isCY(f.i) ? H[kk].cy : H[kk].py)[monthOf(f.i)] = f;
  }
  for (const kk in H) {
    const h = H[kk];
    const closed = h.cy.filter((_, m) => CY_START + m <= cursor && h.cy[m]);
    const pyMatch = h.py.filter((_, m) => CY_START + m <= cursor);
    h.ytdUnits   = closed.reduce((a, f) => a + f.units, 0);
    h.ytdUnitsPY = pyMatch.reduce((a, f) => a + f.units, 0);
    h.drift      = h.ytdUnitsPY > 0 ? h.ytdUnits / h.ytdUnitsPY : 1;
    const last3 = closed.slice(-3);
    const w = last3.reduce((a, f) => a + f.units, 0) || 1;
    h.lastAsp  = last3.length ? last3.reduce((a,f)=>a+f.aspG*f.units,0)/w : (h.py[11]?.aspG ?? 0);
    h.lastDisc = last3.length ? last3.reduce((a,f)=>a+f.discR*f.units,0)/w : (h.py[11]?.discR ?? 0);
    h.lastCogs = last3.length ? last3.reduce((a,f)=>a+f.cogsU*f.units,0)/w : (h.py[11]?.cogsU ?? 0);
  }
  return H;
}

/* ------------------------------ forecast build ---------------------------
   Open months only. Everything anchors to the same month last year, which
   carries seasonality for free, then bends by YTD drift and the assumption. */
export function buildForecast(FACTS, H, state) {
  const rows = [];
  const rampF = (i) => {
    if (!state.ramp) return 1;
    const n = i - state.cursor;                 // 1,2,3,... months into the open period
    return Math.min(1, n / 3);
  };
  const clsShift = {};                          // zero-sum premiumisation per BU×market

  for (const f of FACTS) {
    if (!isCY(f.i)) { rows.push({ ...f, ver:'FC', open:false, fx:fxOf(state,f.k,f.i) }); continue; }
    if (f.i <= state.cursor) { rows.push({ ...f, ver:'FC', open:false, fx:fxOf(state,f.k,f.i) }); continue; }

    const h = H[`${f.k}|${f.s}`];
    const ctx = { k:f.k, bu:f.bu, s:f.s };
    const g = val(state,'growth',ctx) / 100;
    const p = val(state,'price',ctx) / 100 * rampF(f.i);
    const dc = val(state,'disc',ctx) / 100 * rampF(f.i);
    const cg = val(state,'cogs',ctx) / 100 * rampF(f.i);
    const pm = val(state,'premium',ctx) / 100;

    const py = h.py[monthOf(f.i)];
    const drift = 1 + (h.drift - 1) * state.carry;
    let units = (py ? py.units : f.units) * drift * (1 + g);

    // premiumisation: move share out of Silver into Platinum, units conserved
    if (pm !== 0) {
      if (f.cls === 'Silver')   units *= Math.max(0, 1 - pm / 0.42);
      if (f.cls === 'Platinum') units *= 1 + pm / 0.20;
    }

    rows.push({ ...f, ver:'FC', open:true, fx:fxOf(state,f.k,f.i),
      units,
      aspG:  h.lastAsp  * (1 + p),
      discR: Math.max(0, Math.min(0.6, h.lastDisc + dc)),
      cogsU: h.lastCogs * (1 + cg)
    });
  }
  return rows;
}

/* Stamp PY / BUD rows with the same shape so every consumer is identical. */
export const stampPY  = (FACTS, state) => FACTS.filter(f => !isCY(f.i))
  .map(f => ({ ...f, ver:'PY', open:false, fx:fxOf(state,f.k,f.i) }));
export const stampBUD = (BUDGET, state) => BUDGET
  .map(f => ({ ...f, ver:'BUD', open:false, fx:FX[f.k].py }));   // budget FX is plan FX

/* ------------------------------ measures -------------------------------- */
export function meas(r) {
  const nsL = r.units * r.aspG * (1 - r.discR);
  const cgL = r.units * r.cogsU;
  return { units:r.units, gs:r.units*r.aspG/r.fx, ns:nsL/r.fx, cogs:cgL/r.fx,
           gm:(nsL - cgL)/r.fx, disc:r.units*r.aspG*r.discR/r.fx };
}

export function agg(rows, pred) {
  const o = { units:0, gs:0, ns:0, cogs:0, gm:0, disc:0 };
  for (const r of rows) {
    if (pred && !pred(r)) continue;
    const m = meas(r);
    o.units += m.units; o.gs += m.gs; o.ns += m.ns;
    o.cogs += m.cogs; o.gm += m.gm; o.disc += m.disc;
  }
  o.rate = o.ns ? o.gm / o.ns : 0;
  o.asp  = o.units ? o.ns / o.units : 0;
  o.upm  = o.units ? o.gm / o.units : 0;
  o.real = o.gs ? o.ns / o.gs : 0;
  return o;
}

export function byMonth(rows, pred) {
  return Array.from({ length: N_MONTHS }, (_, i) => agg(rows, r => r.i === i && (!pred || pred(r))));
}
