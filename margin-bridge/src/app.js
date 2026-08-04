/* ============================================================================
   app.js — state, the compute pipeline, and routing.
   One rule: every render reads from a freshly computed ctx. No partial updates.
   ========================================================================== */

import { generateAll, MARKETS, BUS, CLASSES, MONTH_NAMES, N_MONTHS, CY_START,
         isCY, monthOf, label } from './data.js';
import { DRIVERS, newState, ovKey, resolve, summarise, buildForecast,
         stampPY, stampBUD, agg, byMonth, meas } from './model.js';
import { bridge, bridgeBy, reconciled, movers } from './bridge.js';
import { sigmas, gradients, scenarios, tornado, monteCarlo, histogram } from './risk.js';
import * as views from './views.js';
import { eur, seur, pct, spp, C } from './charts.js';
import { exportFacts, exportAssumptions, exportPdf, exportPptx } from './exports.js';

const { SKUS, FACTS, BUDGET } = generateAll();

const S = {
  ...newState(),
  page: 'plan', tab: 'all', gridDrv: 'growth',
  cmp: 'BUD', measure: 'gm', focusMkt: 'ALL', pick: null,
  rho: 0.35, k: 1.28
};

/* ------------------------------- compute -------------------------------- */
function compute() {
  const H = summarise(FACTS, S.cursor);
  // dispersion is measured over the actual open-month horizon, so the risk
  // band narrows as the year closes and there is less left to be wrong about.
  const SIG = sigmas(FACTS, 23 - S.cursor);
  const rowsFC  = buildForecast(FACTS, H, S);
  const rowsPY  = stampPY(FACTS, S);
  const rowsBUD = stampBUD(BUDGET, S);

  const mf = r => S.focusMkt === 'ALL' || r.k === S.focusMkt;
  const cy  = r => isCY(r.i) && mf(r);
  const FC  = rowsFC.filter(cy), PY = rowsPY.filter(mf), BUD = rowsBUD.filter(mf);
  const base = S.cmp === 'BUD' ? BUD : PY;

  const br = bridge(base, FC, S.measure);
  const drill = S.pick
    ? bridgeBy(base, FC, 'k', S.measure).map(b =>
        ({ key:b.key, v:b.parts.find(p => p.id === S.pick)?.v ?? 0, total:b.total }))
        .sort((a, b2) => Math.abs(b2.v) - Math.abs(a.v))
    : [];

  /* sensitivity: one gradient per driver, on the CY margin in focus */
  const evalFn = ovDelta => {
    const saved = { ...S.ov };
    for (const d in ovDelta) S.ov[ovKey('all','ALL',d)] = (saved[ovKey('all','ALL',d)] ?? 0) + ovDelta[d];
    const r = buildForecast(FACTS, H, S).filter(cy);
    S.ov = saved;
    return agg(r)[S.measure === 'gm' ? 'gm' : 'ns'];
  };
  const grad = gradients(evalFn, S);
  const sc   = scenarios(grad, SIG, { k:S.k, rho:S.rho });
  const torn = tornado(grad, SIG, S.k);
  const budTotal = agg(BUD)[S.measure === 'gm' ? 'gm' : 'ns'];
  const mc   = monteCarlo(grad, SIG, { n:5000, rho:S.rho, target:budTotal });
  const hist = histogram(mc.samples);

  /* headline */
  const aFC = agg(FC), aB = agg(base);
  const dp = (a, b) => (a - b) / Math.abs(b || 1);
  const sgn = v => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + '%';
  const cmpName = S.cmp === 'BUD' ? 'budget' : 'prior year';
  const mSeries = m => byMonth(rowsFC, r => mf(r) && (m ? true : true));
  const seriesFC = byMonth(rowsFC, mf);
  const kpi = {
    ns:aFC.ns, gm:aFC.gm, rate:aFC.rate, units:aFC.units,
    nsD:sgn(dp(aFC.ns, aB.ns)) + ' vs ' + cmpName,
    gmD:sgn(dp(aFC.gm, aB.gm)) + ' vs ' + cmpName,
    rateD:spp(aFC.rate - aB.rate) + ' vs ' + cmpName,
    unitsD:sgn(dp(aFC.units, aB.units)) + ' vs ' + cmpName,
    nsS:seriesFC.map(x => x.ns), gmS:seriesFC.map(x => x.gm),
    rateS:seriesFC.map(x => x.rate), unitsS:seriesFC.map(x => x.units)
  };

  /* trajectory: CY only, actual → forecast, with the risk band on open months */
  const cyIdx = Array.from({ length: 12 }, (_, m) => CY_START + m);
  const fcM  = cyIdx.map(i => agg(rowsFC, r => r.i === i && mf(r))[S.measure]);
  const budM = cyIdx.map(i => agg(rowsBUD, r => r.i === i && mf(r))[S.measure]);
  const openN = cyIdx.filter(i => i > S.cursor).length;
  const per = openN ? sc.band / openN : 0;
  const fanData = {
    months: 12, cursor: S.cursor - CY_START,
    actual:   cyIdx.map((i, m) => i <= S.cursor ? fcM[m] : null),
    forecast: cyIdx.map((i, m) => i >= S.cursor ? fcM[m] : null),
    budget:   budM,
    band:     cyIdx.map((i, m) => i > S.cursor
                ? [fcM[m] - per * (i - S.cursor) * 0.6, fcM[m] + per * (i - S.cursor) * 0.6]
                : [null, null]),
    height: 220
  };

  /* mix, scatter, heat */
  const mixSeries = CLASSES.map(c => Array.from({ length:N_MONTHS }, (_, i) => {
    const tot = agg(rowsFC, r => r.i === i && mf(r)).ns;
    return tot ? agg(rowsFC, r => r.i === i && mf(r) && r.cls === c.id).ns / tot : 0;
  }));

  const bySku = {};
  for (const r of rowsFC) {
    if (!isCY(r.i) || !mf(r)) continue;
    const o = bySku[r.s] ??= { cls:r.cls, q:0, ns:0, gm:0, open:0, oq:0, oNs:0 };
    const m = meas(r);
    o.q += m.units; o.ns += m.ns; o.gm += m.gm;
    if (!r.open) { o.oq += m.units; o.oNs += m.ns; }
  }
  const closedAsp = Object.values(bySku).filter(o => o.oq > 0).map(o => o.oNs / o.oq).sort((a,b)=>a-b);
  const band = closedAsp.length
    ? [closedAsp[Math.floor(closedAsp.length*0.05)], closedAsp[Math.floor(closedAsp.length*0.95)]]
    : [0, 1];
  const scatterData = { pts: Object.values(bySku).filter(o => o.q > 0).map(o => ({
      x:o.ns/o.q, y:o.gm/o.ns, z:o.gm, col:CLASSES.find(c => c.id === o.cls).col })),
    band, height:220 };

  const heatCells = BUS.map(b => {
    const row = MARKETS.map(m => {
      const a = agg(FC, r => r.bu === b.id && r.k === m.id);
      const z = agg(base, r => r.bu === b.id && r.k === m.id);
      return a.rate - z.rate;
    });
    row.push(agg(FC, r => r.bu === b.id).rate - agg(base, r => r.bu === b.id).rate);
    return row;
  });
  const heatData = { rows:BUS.map(b => b.name),
    cols:[...MARKETS.map(m => m.id), 'Nordics'], cells:heatCells };

  /* variance split closed / open */
  const varRows = BUS.map(b => {
    const f = q => agg(FC, r => r.bu === b.id && q(r))[S.measure];
    const z = q => agg(base, r => r.bu === b.id && q(r))[S.measure];
    const closed = r => r.i <= S.cursor, open = r => r.i > S.cursor;
    return { name:b.name, ytd:f(closed) - z(closed), ytg:f(open) - z(open),
             fy:f(() => true) - z(() => true),
             rate:agg(FC, r => r.bu === b.id).rate - agg(base, r => r.bu === b.id).rate };
  });
  const varTot = varRows.reduce((a, r) => ({ ytd:a.ytd+r.ytd, ytg:a.ytg+r.ytg, fy:a.fy+r.fy,
    rate:aFC.rate - aB.rate }), { ytd:0, ytg:0, fy:0, rate:0 });

  /* assumption register */
  const assumptions = Object.entries(S.ov)
    .filter(([, v]) => v !== null && v !== undefined && v !== 0)
    .map(([kk, v]) => {
      const [lvl, sc2, drv] = kk.split('|');
      const d = DRIVERS.find(x => x.id === drv);
      const lvlName = { all:'Nordics', mkt:'Market', bu:'Business unit',
                        mktbu:'Market × BU', sku:'SKU' }[lvl] ?? lvl;
      return [lvlName, sc2.replace('~',' · '), d?.name ?? drv,
              (v > 0 ? '+' : '') + v + (d?.unit ?? '')];
    });

  /* narrative */
  const sorted = [...br.parts].sort((a, b2) => Math.abs(b2.v) - Math.abs(a.v));
  const pos = sorted.filter(p => p.v > 0), neg = sorted.filter(p => p.v < 0);
  const closedShare = Math.abs(agg(FC, r => r.i <= S.cursor).gm /
                              (agg(FC).gm || 1));
  const dir = br.total >= 0 ? 'ahead of' : 'behind';
  const narrative = `
    <p>Forecast ${S.measure === 'gm' ? 'product margin' : 'net sales'} for
      ${S.focusMkt === 'ALL' ? 'the Nordics' : MARKETS.find(m => m.id === S.focusMkt).name}
      is <b>${eur(br.to)}</b>, ${eur(Math.abs(br.total))} ${dir} ${cmpName}
      (${(br.total / Math.abs(br.from) * 100).toFixed(1)}%).</p>
    <p>The walk is led by <b>${sorted[0].lab.toLowerCase()}</b> at ${seur(sorted[0].v)}.
      ${pos.length ? 'Helping: ' + pos.map(p => `${p.lab.toLowerCase()} ${seur(p.v)}`).join(', ') + '.'
                   : 'No bucket is positive.'}
      ${neg.length ? 'Working against it: ' + neg.map(p => `${p.lab.toLowerCase()} ${seur(p.v)}`).join(', ') + '.'
                   : 'No bucket is negative.'}</p>
    <p>${MONTH_NAMES[monthOf(S.cursor)]} is the last closed month, so
      <b>${(closedShare * 100).toFixed(0)}%</b> of the year is already booked and
      ${(100 - closedShare * 100).toFixed(0)}% is still open to influence. At
      ±${S.k.toFixed(2)}σ per driver combined at ρ=${S.rho.toFixed(2)}, the landing range is
      <b>${eur(sc.worst)}</b> to <b>${eur(sc.best)}</b>${mc.above != null
        ? `, with a ${(mc.above * 100).toFixed(0)}% chance of finishing at or above budget` : ''}.</p>`;

  return { state:S, SKUS, H, rowsFC, rowsPY, rowsBUD, FC, base,
    cmp:S.cmp, measure:S.measure, focusMkt:S.focusMkt, tab:S.tab, gridDrv:S.gridDrv,
    pick:S.pick, drill, rho:S.rho, k:S.k, sig:SIG,
    br, reconciled:reconciled(br), grad, sc, torn, mc, hist,
    histMarks: [
      { v:sc.likely, lab:'forecast', col:C.ink },
      { v:budTotal,  lab:'budget',   col:C.bad, dash:'3 3' }
    ],
    kpi, fanData, mixSeries, scatterData, heatData, varRows, varTot, assumptions,
    movers: movers(base, FC, 8), closedShare, narrative,
    fromLab: S.cmp === 'BUD' ? 'Budget' : 'Prior year',
    toLab: 'Forecast',
    bridgeTitle: `${S.measure === 'gm' ? 'Product margin' : 'Net sales'} bridge · ` +
                 `${S.cmp === 'BUD' ? 'budget' : 'prior year'} to forecast`,
    budTotal, meas, label
  };
}

/* ------------------------------- actions -------------------------------- */
let ctx;
const A = {
  setCursor: i => { S.cursor = Math.max(CY_START, Math.min(23, i)); go(); },
  setCarry:  v => { S.carry = v; go(); },
  setRamp:   v => { S.ramp = v; go(); },
  setElast:  v => { S.elast = v; go(); },
  setRho:    v => { S.rho = v; go(); },
  setK:      v => { S.k = v; go(); },
  setTab:    t => { S.tab = t; go(); },
  setGridDrv:d => { S.gridDrv = d; go(); },
  setCmp:    c => { S.cmp = c; S.pick = null; go(); },
  setMeasure:m => { S.measure = m; S.pick = null; go(); },
  setFocusMkt:m => { S.focusMkt = m; go(); },
  pickBucket:b => { S.pick = S.pick === b ? null : b; go(); },
  setOv: (lvl, scope, drv, v) => {
    const key = ovKey(lvl, scope, drv);
    if (v === null || Number.isNaN(v)) delete S.ov[key]; else S.ov[key] = v;
    go();
  },
  reset: () => { Object.assign(S, newState(), { page:S.page, tab:S.tab, gridDrv:S.gridDrv,
    cmp:S.cmp, measure:S.measure, focusMkt:S.focusMkt, rho:0.35, k:1.28 }); go(); },
  preset: name => {
    S.ov = {};
    const set = (d, v) => S.ov[ovKey('all','ALL',d)] = v;
    if (name === 'down') { set('growth',-6); set('price',-1.5); set('cogs',4.5);
                           set('premium',-2); set('fxSE',-5); set('fxNO',-4); }
    if (name === 'up')   { set('growth',5); set('price',2.5); set('cogs',-1);
                           set('premium',3); }
    if (name === 'price'){ set('price',3.5); set('growth',-2); }
    go();
  },
  csv: g => exportFacts(ctx, g),
  csvAssume: () => exportAssumptions(S, { cursorLabel:label(S.cursor), rho:S.rho, k:S.k }),
  pdf: exportPdf,
  pptx: async () => {
    const btn = document.querySelector('.exportbar .solid');
    if (btn) { btn.disabled = true; btn.textContent = 'Building…'; }
    try {
      await exportPptx({
        br: ctx.br, kpi: ctx.kpi, sc: ctx.sc, mc: ctx.mc,
        mkts: MARKETS, bus: BUS.map((b, i) => ({ name:b.name, cells:ctx.heatData.cells[i] })),
        meta: {
          eyebrow:'Miele Nordics · FP&A',
          footer:`Margin Bridge · actuals through ${label(S.cursor)} · ρ=${S.rho} · k=${S.k}σ · EUR`,
          bridgeTitle: ctx.bridgeTitle,
          bridgeNote:'Volume at base-period mix and unit margin. Mix is the remainder within '
            + 'volume. Price, discount and COGS on forecast volumes. FX is the forecast '
            + 'retranslated. Buckets sum to the delta with no residual.',
          fromLab: ctx.fromLab, toLab: ctx.toLab,
          narrative: ctx.narrative.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          assumptions: ctx.assumptions,
          fileName: `Miele-Nordics-Margin-Bridge-${label(S.cursor).replace(' ','-')}.pptx`
        }
      });
    } catch (e) {
      alert('PowerPoint export needs a network connection the first time, to load the '
          + 'generator. CSV and PDF work offline.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'PowerPoint'; }
    }
  }
};

/* -------------------------------- routing ------------------------------- */
const PAGES = { plan:views.renderPlan, cockpit:views.renderCockpit, report:views.renderReport };

function go() {
  ctx = compute();
  document.querySelectorAll('.nav button').forEach(b =>
    b.classList.toggle('on', b.dataset.p === S.page));
  document.getElementById('cutlabel').textContent = 'actuals through ' + label(S.cursor);
  const stat = document.getElementById('status');
  stat.className = 'seal' + (ctx.reconciled ? '' : ' broken');
  stat.innerHTML = `<span class="ring">${ctx.reconciled ? '✓' : '!'}</span>
    <span>${ctx.reconciled ? 'Bridge reconciled' : 'Residual found'}<br>
    <b class="num">Δ ${ctx.br.resid.toFixed(2)}</b></span>`;
  PAGES[S.page](document.getElementById('view'), ctx, A);
}

document.querySelectorAll('.nav button').forEach(b =>
  b.onclick = () => { S.page = b.dataset.p; S.pick = null; go(); });
document.querySelectorAll('[data-preset]').forEach(b =>
  b.onclick = () => A.preset(b.dataset.preset));
document.getElementById('btnReset').onclick = A.reset;
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(go, 160); });

go();
