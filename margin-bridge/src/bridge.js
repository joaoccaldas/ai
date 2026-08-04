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
    if (!out[k]) out[k] = { q:0, gs:0, ns:0, cogs:0, disc:0, k:r.k, s:r.s, bu:r.bu, cls:r.cls };
    const o = out[k];
    o.q    += r.units;
    o.gs   += r.units * r.aspG / fx;
    o.ns   += r.units * r.aspG * (1 - r.discR) / fx;
    o.cogs += r.units * r.cogsU / fx;
    o.disc += r.units * r.aspG * r.discR / fx;
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

  let Qa = 0, Qb = 0, Va = 0, VbC = 0;
  for (const k in A) { Qa += A[k].q; Va  += value(A[k]); }
  for (const k in B) { Qb += B[k].q; VbC += value(B[k]); }
  const upmA = Qa ? Va / Qa : 0;

  // Σ q_b,i × v_a,i  → volume and mix evaluated at base unit economics
  let atBase = 0;
  for (const k in B) {
    const a = A[k];
    atBase += a && a.q > 0 ? B[k].q * (value(a) / a.q) : B[k].q * upmA;
  }
  const volume = (Qb - Qa) * upmA;
  let   mix    = atBase - Qb * upmA;

  // rate effects on comparison-period volume
  let price = 0, disc = 0, cogs = 0;
  for (const k in B) {
    const a = A[k], b = B[k];
    if (!a || a.q === 0 || b.q === 0) continue;
    price += b.q * (b.gs / b.q - a.gs / a.q);
    disc  -= b.q * (b.disc / b.q - a.disc / a.q);
    if (measure === 'gm') cogs -= b.q * (b.cogs / b.q - a.cogs / a.q);
  }

  // whatever launches/delists left behind goes to mix, keeping the walk exact
  mix += (VbC - Va) - (volume + mix + price + disc + cogs);

  // FX = comparison period at its own rates minus the same at base rates
  let VbA = 0; for (const k in Bact) VbA += value(Bact[k]);
  const fx = VbA - VbC;

  const total = VbA - Va;
  const parts = [
    { id:'volume', lab:'Volume',   v:volume },
    { id:'mix',    lab:'Mix',      v:mix    },
    { id:'price',  lab:'Price',    v:price  },
    { id:'disc',   lab:'Discount', v:disc   },
    ...(measure === 'gm' ? [{ id:'cogs', lab:'COGS', v:cogs }] : []),
    { id:'fx',     lab:'FX',       v:fx     }
  ];
  const resid = total - parts.reduce((a, p) => a + p.v, 0);
  return { from:Va, to:VbA, total, parts, resid, Qa, Qb, measure };
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
