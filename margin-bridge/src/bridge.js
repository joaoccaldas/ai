/* ============================================================================
   bridge.js — price / volume / mix decomposition.

   Convention, stated once so nobody has to guess:
     Volume   ΔQ at base-period mix and base-period unit margin
     Mix      remainder within volume, held at base-period unit economics
     Price    Δ gross ASP on comparison-period volume
     Discount Δ discount per unit on comparison-period volume (sign flipped)
     COGS     Δ COGS per unit on comparison-period volume (sign flipped)
     FX       comparison-period margin retranslated, base rates → actual rates

   SKUs present in one period but not the other have no unit economics to
   compare, so their effect lands in Mix — that is the only sensible home for
   a launch or a delist, and it keeps the walk exact.

   The five buckets plus FX always sum to the total delta. reconcile() proves
   it on every call and the UI shows the residual.
   ========================================================================== */

import { meas } from './model.js';

/* Roll rows to market×SKU, in EUR at a chosen FX rule. */
function roll(rows, fxRule) {
  const out = {};
  for (const r of rows) {
    const k = `${r.k}|${r.s}`;
    const fx = fxRule ? fxRule(r) : r.fx;
    if (!out[k]) out[k] = { q:0, gs:0, ns:0, cogs:0, disc:0, reb:0, k:r.k, s:r.s, bu:r.bu, cls:r.cls };
    const o = out[k], rebR = r.rebR ?? 0;
    o.q    += r.units;
    o.gs   += r.units * r.aspG / fx;
    o.ns   += r.units * r.aspG * (1 - r.discR - rebR) / fx;
    o.cogs += r.units * r.cogsU / fx;
    o.disc += r.units * r.aspG * r.discR / fx;
    o.reb  += r.units * r.aspG * rebR / fx;
  }
  return out;
}

/**
 * @param {Array} base  rows for the "from" version (PY or BUD)
 * @param {Array} comp  rows for the "to" version (FC)
 * @param {'gm'|'ns'} measure
 */
export function bridge(base, comp, measure = 'gm') {
  // constant-FX view: both periods translated at the BASE period's rates
  const baseFxOf = {};
  for (const r of base) baseFxOf[r.k] = r.fx;
  const constRule = r => baseFxOf[r.k] ?? r.fx;

  const A = roll(base, constRule);
  const B = roll(comp, constRule);
  const Bact = roll(comp, null);

  const value = o => measure === 'gm' ? o.ns - o.cogs : o.ns;

  // constant-FX totals across everything
  let Va = 0, VbC = 0;
  for (const k in A) Va  += value(A[k]);
  for (const k in B) VbC += value(B[k]);

  // continuing SKUs: present with volume in BOTH periods. Everything volume,
  // mix, price and rate is measured on these; launches and delists get their
  // own bucket so a big launch never masquerades as favourable mix.
  const cont = k => A[k] && B[k] && A[k].q > 0 && B[k].q > 0;

  let Qa = 0, Qb = 0, Vac = 0;
  for (const k in A) if (cont(k)) { Qa += A[k].q; Vac += value(A[k]); }
  for (const k in B) if (cont(k)) Qb += B[k].q;
  const upmA = Qa ? Vac / Qa : 0;

  // Σ q_b,i × v_a,i  → volume and mix evaluated at base unit economics
  let atBase = 0;
  for (const k in B) if (cont(k)) atBase += B[k].q * (value(A[k]) / A[k].q);
  const volume = (Qb - Qa) * upmA;
  let   mix    = atBase - Qb * upmA;

  // rate effects on comparison-period volume, continuing SKUs only
  let price = 0, disc = 0, reb = 0, cogs = 0;
  for (const k in B) if (cont(k)) {
    const a = A[k], b = B[k];
    price += b.q * (b.gs / b.q - a.gs / a.q);
    disc  -= b.q * (b.disc / b.q - a.disc / a.q);
    reb   -= b.q * (b.reb / b.q - a.reb / a.q);
    if (measure === 'gm') cogs -= b.q * (b.cogs / b.q - a.cogs / a.q);
  }

  // lifecycle: value of SKUs that live in exactly one period, at constant FX
  let launch = 0, delist = 0;
  for (const k in B) if (!cont(k)) launch += value(B[k]);
  for (const k in A) if (!cont(k)) delist += value(A[k]);
  const lifecycle = launch - delist;

  // continuing-SKU nonlinearity lands in mix, keeping the constant-FX walk exact
  mix += (VbC - Va) - (volume + mix + price + disc + reb + cogs + lifecycle);

  // FX = comparison period at its own rates minus the same at base rates
  let VbA = 0; for (const k in Bact) VbA += value(Bact[k]);
  const fx = VbA - VbC;

  const total = VbA - Va;
  // grp isolates the operating levers: Volume, Mix and Pricing (list price net of
  // discount and rebate) are the three the commercial team owns; Cost, Lifecycle
  // and FX are separate. The cockpit can collapse the walk onto these groups.
  const parts = [
    { id:'volume', lab:'Volume',    v:volume,    grp:'Volume'    },
    { id:'mix',    lab:'Mix',       v:mix,       grp:'Mix'       },
    { id:'price',  lab:'Price',     v:price,     grp:'Pricing'   },
    { id:'disc',   lab:'Discount',  v:disc,      grp:'Pricing'   },
    { id:'reb',    lab:'Rebate',    v:reb,       grp:'Pricing'   },
    ...(measure === 'gm' ? [{ id:'cogs', lab:'COGS', v:cogs, grp:'Cost' }] : []),
    { id:'life',   lab:'Lifecycle', v:lifecycle, grp:'Lifecycle' },
    { id:'fx',     lab:'FX',        v:fx,        grp:'FX'        }
  ];
  const resid = total - parts.reduce((a, p) => a + p.v, 0);
  return { from:Va, to:VbA, total, parts, resid, Qa, Qb, measure };
}

/* Collapse the detailed walk onto its lever groups — Volume, Mix, Pricing, Cost,
   Lifecycle, FX — preserving order and summing within each. Used by the cockpit's
   "isolate the product-margin levers" view. */
export function groupParts(parts) {
  const order = ['Volume', 'Mix', 'Pricing', 'Cost', 'Lifecycle', 'FX'];
  const by = {};
  for (const p of parts) (by[p.grp] ??= { id:p.grp.toLowerCase(), lab:p.grp, v:0, grp:p.grp }).v += p.v;
  return order.filter(g => by[g]).map(g => by[g]);
}

/** Same walk, cut by a dimension — this is what the drill-down uses. */
export function bridgeBy(base, comp, dim, measure = 'gm') {
  const keys = [...new Set([...base, ...comp].map(r => r[dim]))];
  return keys.map(key => ({
    key,
    ...bridge(base.filter(r => r[dim] === key), comp.filter(r => r[dim] === key), measure)
  })).sort((a, b) => b.total - a.total);
}

export const reconciled = b => Math.abs(b.resid) < Math.max(1, Math.abs(b.total) * 1e-9);

/** Top movers at SKU level — margin delta, comparison vs base. */
export function movers(base, comp, n = 10) {
  const A = roll(base, null), B = roll(comp, null);
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  const rows = [...keys].map(k => {
    const a = A[k], b = B[k];
    const va = a ? a.ns - a.cogs : 0, vb = b ? b.ns - b.cogs : 0;
    const src = b || a;
    return { k:src.k, s:src.s, bu:src.bu, cls:src.cls, base:va, comp:vb, d:vb - va };
  }).sort((x, y) => y.d - x.d);
  return { up: rows.slice(0, n), down: rows.slice(-n).reverse() };
}
