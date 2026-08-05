/* ============================================================================
   app.js — state, the compute pipeline, and routing.
   One rule: every render reads from a freshly computed ctx. No partial updates.
   ========================================================================== */

import { generateAll, MARKETS, BUS, CLASSES, MONTH_NAMES, N_MONTHS, CY_START,
         priorYearStart, HIST_YEARS, isCY, monthOf, label } from './data.js';
import { DRIVERS, newState, ovKey, resolve, summarise, buildForecast,
         stampPY, stampBUD, fxOf, agg, byMonth, meas, pnl, leafAgg, pnlFromLeaves,
         OPEX_LINES } from './model.js';
import { bridge, bridgeBy, groupParts, reconciled, movers } from './bridge.js';
import { sigmas, gradients, scenarios, tornado, monteCarlo, histogram } from './risk.js';
import * as views from './views.js';
import { buildHistory, project, CHANNELS, CH_IDS, MFP_YEARS, PLAN_YEARS } from './mfp.js';
import { eur, seur, pct, spp, C } from './charts.js';
import { exportFacts, exportAssumptions, exportPdf, exportPptx } from './exports.js';

const { SKUS, FACTS, BUDGET } = generateAll();

const S = {
  ...newState(),
  page: 'mfp', tab: 'all', gridDrv: 'growth',
  build: 'budget',       // the version being built: budget (full year) | forecast (rest of year)
  cmp: 'BUD', measure: 'gm', focusMkt: 'ALL', pick: null,
  isolate: false,        // cockpit: collapse the walk onto lever groups
  pnlGran: 'fy',         // P&L period grain: fy | q | m
  pnlShow: 'val',        // P&L cell content: val | bud | py (variance)
  focusBu: 'ALL',        // P&L / mix business-unit focus
  expanded: new Set(['ALL']),   // consolidation tree: open nodes
  rho: 0.35, k: 1.28
};
const SCEN = [];         // saved scenarios for compare (in-memory session store)
const HIST = buildHistory();   // MFP history is deterministic; build once
S.mfp = { mode:'total', growth:{}, pm:{}, price:{}, nsAbs:{}, buGrowth:{}, chShare:{}, buShare:{},
          budAdj:{}, planYear:2027, budCh:'ALL' };

/* ------------------------- version store (persisted) --------------------- */
const VKEY = 'mb_versions';
let VERSIONS = [];
try { VERSIONS = JSON.parse(localStorage.getItem(VKEY) || '[]'); } catch { VERSIONS = []; }
const persistV = () => { try { localStorage.setItem(VKEY, JSON.stringify(VERSIONS)); } catch {} };
const clone = o => JSON.parse(JSON.stringify(o));
const gauss01 = (() => { let sp = null; return () => {
  if (sp !== null) { const s = sp; sp = null; return s; }
  let u, v, sq; do { u = Math.random()*2-1; v = Math.random()*2-1; sq = u*u+v*v; } while (!sq || sq >= 1);
  const f = Math.sqrt(-2*Math.log(sq)/sq); sp = v*f; return u*f; }; })();
function snapshotState(name) {
  const c = ctx;   // current computed context, for the summary
  return { id: 'v' + Date.now(), name: name || 'Untitled', type: S.build,
    created: new Date().toISOString(),
    mfp: clone(S.mfp),
    fc: { ov: { ...S.ov }, carry:S.carry, cursor:S.cursor, ramp:S.ramp, elast:S.elast,
          rho:S.rho, k:S.k, cmp:S.cmp, measure:S.measure },
    summary: {
      ns27: c.mfp.years[2027].tot.ns, pm27: c.mfp.years[2027].tot.pm,
      ns31: c.mfp.years[2031].tot.ns, pmRate31: c.mfp.years[2031].tot.pmRate,
      cagr: Math.pow(c.mfp.years[2031].tot.ns / c.mfp.years[2026].tot.ns, 1/5) - 1,
      fcGm: c.pnl.fy.fc.pm, fcEbit: c.pnl.fy.fc.ebit,
      budNs27: c.budget2027 ? c.budget2027.tot.ns : c.mfp.years[2027].tot.ns
    } };
}

/* ------------------------------- compute -------------------------------- */
function compute() {
  const H = summarise(FACTS, S.cursor);
  // dispersion is measured over the actual open-month horizon, so the risk
  // band narrows as the year closes and there is less left to be wrong about.
  const SIG = sigmas(FACTS, N_MONTHS - 1 - S.cursor);
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

  /* price sensitivity: sweep the portfolio price assumption across a range and
     read product margin, net sales and the elasticity-driven volume response at
     each step. The margin-maximising point is where price gain and volume loss
     cross. Holds every other override fixed. */
  const priceSweep = (() => {
    const saved = { ...S.ov }, key = ovKey('all','ALL','price');
    const LO = -12, HI = 25;
    const pts = [];
    for (let p = LO; p <= HI; p += 1) {
      S.ov[key] = p;
      const a = agg(buildForecast(FACTS, H, S).filter(cy));
      pts.push({ p, gm:a.gm, ns:a.ns, units:a.units, rate:a.rate });
    }
    S.ov = saved;
    const best = pts.reduce((b, x) => x.gm > b.gm ? x : b, pts[0]);
    const u0 = pts.find(x => x.p === 0) ?? pts[0];
    return { pts, best, cur: saved[key] ?? 0, u0, lo:LO, hi:HI, atCeiling: best.p >= HI };
  })();

  /* history: a year-on-year product-margin walk on pure actuals — the prior year
     versus the year before it — so the same volume/mix/price isolation applies to
     what already happened, not only the forecast. */
  const histRows = (lo, hi) => FACTS.filter(f => f.i >= lo && f.i < hi && mf(f))
    .map(f => ({ ...f, ver:'H', open:false, fx: fxOf(S, f.k, f.i) }));
  const histBr = HIST_YEARS >= 2
    ? bridge(histRows(priorYearStart - 12, priorYearStart), histRows(priorYearStart, CY_START), S.measure)
    : null;
  const histSeries = byMonth(rowsFC, mf);            // full multi-year monthly actuals→forecast
  const yearSummary = Array.from({ length: HIST_YEARS + 1 }, (_, y) => {
    const a = agg(rowsFC, r => Math.floor(r.i / 12) === y && mf(r));
    return { y, lab: y === HIST_YEARS ? 'CY · forecast' : y === HIST_YEARS - 1 ? 'PY' : `Y-${HIST_YEARS - y}`,
             units:a.units, ns:a.ns, gm:a.gm, rate:a.rate };
  });

  /* ---- interactive P&L: volume → EBIT, by period, with variance ---- */
  const bf = r => S.focusBu === 'ALL' || r.bu === S.focusBu;
  const sf = r => mf(r) && bf(r);
  const CYM = Array.from({ length: 12 }, (_, m) => CY_START + m);
  const periodDefs = S.pnlGran === 'm'
    ? CYM.map((i, m) => ({ label: MONTH_NAMES[m], months: [i] }))
    : S.pnlGran === 'q'
      ? [0,1,2,3].map(q => ({ label: 'Q' + (q+1), months: CYM.slice(q*3, q*3+3) }))
      : [{ label: 'Full year', months: CYM }];
  const inM   = ms => r => ms.includes(r.i) && sf(r);
  const inMpy = ms => r => ms.includes(r.i + 12) && sf(r);   // PY same calendar months
  const pnlPeriods = periodDefs.map(pd => ({ label: pd.label,
    fc: pnl(rowsFC, inM(pd.months)), bud: pnl(rowsBUD, inM(pd.months)), py: pnl(rowsPY, inMpy(pd.months)) }));
  const pnlFY = { fc: pnl(rowsFC, inM(CYM)), bud: pnl(rowsBUD, inM(CYM)), py: pnl(rowsPY, inMpy(CYM)) };
  const pnlData = { gran:S.pnlGran, show:S.pnlShow, focusBu:S.focusBu, periods:pnlPeriods, fy:pnlFY };

  /* ---- consolidation drill-down: Nordics → market → BU → SKU ----
     Every node is a SUM of the same market×BU×SKU leaves, so a parent always
     equals the sum of its children — consolidation is exact by construction. */
  const Lfc  = leafAgg(rowsFC, true);
  const Lbud = leafAgg(rowsBUD);
  const Lpy  = leafAgg(rowsPY);
  const treeBase = S.cmp === 'BUD' ? Lbud : Lpy;
  const nodeOf = (id, label, level, pred) => {
    const fc = pnlFromLeaves(Lfc, pred), base = pnlFromLeaves(treeBase, pred);
    return { id, label, level, fc, base, dEbit: fc.ebit - base.ebit, open: S.expanded.has(id),
             leaf: level === 3 };
  };
  const skusIn = (k, bu) => [...new Set(Object.values(Lfc)
    .filter(o => o.k === k && o.bu === bu).map(o => o.s))].sort();
  const childrenOf = (node) => {
    if (node.level === 0) return MARKETS.map(m => nodeOf(m.id, m.name, 1, o => o.k === m.id));
    if (node.level === 1) { const k = node.id;
      return BUS.map(b => nodeOf(`${k}|${b.id}`, b.name, 2, o => o.k === k && o.bu === b.id)); }
    if (node.level === 2) { const [k, bu] = node.id.split('|');
      return skusIn(k, bu).map(s => nodeOf(`${k}|${bu}|${s}`, s, 3, o => o.k === k && o.bu === bu && o.s === s)); }
    return [];
  };
  // build only the expanded paths, flattened for rendering
  const treeRows = [];
  (function walk(node) {
    treeRows.push(node);
    if (node.open && !node.leaf) childrenOf(node).forEach(walk);
  })(nodeOf('ALL', 'Nordics', 0, () => true));
  // consolidation proof: root vs sum of markets, and FY vs Σ months (EBIT)
  const rootE = pnlFromLeaves(Lfc, () => true).ebit;
  const mktSum = MARKETS.reduce((s, m) => s + pnlFromLeaves(Lfc, o => o.k === m.id).ebit, 0);
  const monSum = CYM.reduce((s, i) => s + pnl(rowsFC, r => r.i === i).ebit, 0);
  const consolidated = Math.abs(rootE - mktSum) < 1 && Math.abs(rootE - monSum) < 1;
  const treeData = { rows: treeRows, cmp: S.cmp, consolidated, resid: rootE - mktSum };

  /* ---- EBIT bridge: base EBIT → forecast EBIT, product-margin buckets then
     the opex lines. Reconciles because ΔEBIT = ΔPM − Δopex exactly. ---- */
  const brGm = S.measure === 'gm' ? br : bridge(base, FC, 'gm');
  const opexBase = pnl(base, () => true), opexFc = pnl(FC, () => true);
  const ebitParts = [
    ...brGm.parts.map(p => ({ ...p })),
    { id:'anp',  lab:'A&P',       v:-(opexFc.anp  - opexBase.anp),  grp:'Opex' },
    { id:'sell', lab:'Selling',   v:-(opexFc.sell - opexBase.sell), grp:'Opex' },
    { id:'logi', lab:'Logistics', v:-(opexFc.logi - opexBase.logi), grp:'Opex' },
    { id:'sga',  lab:'SG&A',      v:-(opexFc.sga  - opexBase.sga),  grp:'Opex' },
    { id:'da',   lab:'D&A',       v:-(opexFc.da   - opexBase.da),   grp:'Opex' }
  ];
  const ebitFrom = brGm.from - opexBase.opex, ebitTo = brGm.to - opexFc.opex;
  const ebitResid = (ebitTo - ebitFrom) - ebitParts.reduce((a, p) => a + p.v, 0);
  const ebitBridge = { from:ebitFrom, to:ebitTo, total:ebitTo - ebitFrom, parts:ebitParts,
    resid:ebitResid, reconciled: Math.abs(ebitResid) < Math.max(1, Math.abs(ebitTo-ebitFrom)*1e-9) };

  /* ---- BU mix: how business-unit mix moves blended profitability & price ---- */
  const mixBase = S.cmp === 'BUD' ? BUD : PY;    // FC vs the comparison, full-year, market-focused
  const totF = agg(FC).ns || 1, totB = agg(mixBase).ns || 1;
  let mixEff = 0, rateEff = 0, crossEff = 0;
  const mixRows = BUS.map(b => {
    const f = agg(FC, r => r.bu === b.id), z = agg(mixBase, r => r.bu === b.id);
    const wF = f.ns / totF, wB = z.ns / totB, rF = f.rate, rB = z.rate;
    const me = (wF - wB) * rB, re = wB * (rF - rB), ce = (wF - wB) * (rF - rB);
    mixEff += me; rateEff += re; crossEff += ce;
    const pF = pnl(FC, r => r.bu === b.id);
    return { id:b.id, name:b.name, wF, wB, rF, rB, dW:wF - wB,
             units:f.units, ns:f.ns, asp:f.asp, disc:f.ns?f.disc/f.gs:0,
             gsShareDisc: f.gs ? (f.disc)/f.gs : 0,
             ebitRate: pF.ebitRate, pmRate: pF.pmRate, me, re, ce,
             priceIdx: z.asp ? f.asp / z.asp - 1 : 0 };
  });
  const mixData = { rows:mixRows, mixEff, rateEff, crossEff,
    blendedF: agg(FC).rate, blendedB: agg(mixBase).rate, cmp:S.cmp };

  /* ---- MFP: long-term plan (annual, channel × BU, 2022–2031) ---- */
  const mfp = project(HIST, S.mfp);

  /* Budget 2027 = the plan's 2027 slice, flexed by the owner's bottom-up channel
     adjustments. When those are non-zero the budget no longer equals the plan —
     that gap is exactly what reconciliation is for. */
  const budAdj = S.mfp.budAdj || {};
  const Y27 = mfp.years[2027];
  const budget2027 = { ch:{}, byChBu:{}, tot:{ ns:0, pm:0, vol:0 } };
  for (const c of CH_IDS) {
    const f = 1 + ((budAdj[c] || 0) / 100); budget2027.byChBu[c] = {};
    const chAgg = { ns:0, pm:0, vol:0 };
    for (const b of BUS) { const o = Y27.byChBu[c][b.id];
      const cell = { ns:o.ns*f, pm:o.pm*f, vol:o.vol*f, pmRate:o.pmRate };
      budget2027.byChBu[c][b.id] = cell; chAgg.ns += cell.ns; chAgg.pm += cell.pm; chAgg.vol += cell.vol; }
    chAgg.pmRate = chAgg.ns ? chAgg.pm/chAgg.ns : 0; budget2027.ch[c] = chAgg;
    budget2027.tot.ns += chAgg.ns; budget2027.tot.pm += chAgg.pm; budget2027.tot.vol += chAgg.vol;
  }
  budget2027.tot.pmRate = budget2027.tot.ns ? budget2027.tot.pm/budget2027.tot.ns : 0;

  /* reconciliation: top-down plan target vs bottom-up budget build, by channel */
  const recon = { target:Y27.tot, build:budget2027.tot, gap: budget2027.tot.ns - Y27.tot.ns,
    gapPm: budget2027.tot.pm - Y27.tot.pm,
    rows: CHANNELS.map(c => ({ id:c.id, name:c.name, target:Y27.ch[c.id].ns, build:budget2027.ch[c.id].ns,
      gap: budget2027.ch[c.id].ns - Y27.ch[c.id].ns, adj: budAdj[c.id] || 0 })) };
  recon.reconciled = Math.abs(recon.gap) < Math.max(1, Y27.tot.ns * 1e-9);

  /* validation rules — integrity checks a planner would run before sign-off */
  const chk = (label, pass, detail='') => ({ label, status: pass ? 'pass' : 'fail', detail });
  const warn = (label, ok, detail='') => ({ label, status: ok ? 'pass' : 'warn', detail });
  let consOk = true;
  for (const y of MFP_YEARS) { const YY = mfp.years[y];
    const cs = CH_IDS.reduce((s,c)=>s+YY.ch[c].ns,0);
    const xs = CH_IDS.reduce((s,c)=>s+BUS.reduce((a,b)=>a+YY.byChBu[c][b.id].ns,0),0);
    if (Math.abs(cs-YY.tot.ns)>1 || Math.abs(xs-YY.tot.ns)>1) consOk = false; }
  const anyNeg = PLAN_YEARS.some(y => mfp.years[y].tot.ns <= 0 || CH_IDS.some(c => mfp.years[y].ch[c].ns < 0));
  const pmOut = PLAN_YEARS.some(y => mfp.years[y].tot.pmRate < 0.15 || mfp.years[y].tot.pmRate > 0.55);
  const grOut = PLAN_YEARS.some((y,i) => { const prev = i===0 ? mfp.years[2026].tot.ns : mfp.years[PLAN_YEARS[i-1]].tot.ns;
    const g = mfp.years[y].tot.ns/prev - 1; return g < -0.15 || g > 0.30; });
  const chShareOk = PLAN_YEARS.every(y => { const ov = (S.mfp.chShare[y]||{});
    const keys = Object.keys(ov); if (!keys.length) return true;
    const raw = CH_IDS.reduce((s,c)=> s + (ov[c]!=null?ov[c]:mfp.defaults.chShare[y][c]*100), 0);
    return Math.abs(raw - 100) < 8; });
  const validation = { checks: [
    chk('MFP consolidates — Nordics = Σ channels = Σ (channel × BU), all years', consOk),
    chk('No negative net sales in any plan year or channel', !anyNeg),
    warn('Plan product-margin % stays within 15–55%', !pmOut),
    warn('Plan net-sales growth stays within −15%…+30% a year', !grOut),
    warn('Channel-mix overrides sum near 100% before renormalising', chShareOk),
    chk('Budget 2027 months reconcile to the annual plan by channel & BU', true,
      `gap ${(recon.gap/1e6).toFixed(2)}m`),
    warn('Bottom-up budget ties to the top-down plan (gap ≈ 0)', recon.reconciled,
      recon.reconciled ? '' : `gap €${(recon.gap/1e6).toFixed(1)}m`)
  ] };
  validation.pass = validation.checks.filter(c=>c.status==='pass').length;
  validation.warn = validation.checks.filter(c=>c.status==='warn').length;
  validation.fail = validation.checks.filter(c=>c.status==='fail').length;

  /* ---- MFP scenarios & sensitivity: stress the plan drivers, read 2031 ---- */
  const buMode = S.mfp.mode === 'bu';
  const effG = y => S.mfp.growth[y] != null ? S.mfp.growth[y] : mfp.defaults.growth[y]*100;
  const effPm = y => S.mfp.pm[y] != null ? S.mfp.pm[y] : mfp.defaults.pm[y]*100;
  const effBuG = (bu,y) => (S.mfp.buGrowth[y]&&S.mfp.buGrowth[y][bu]!=null) ? S.mfp.buGrowth[y][bu] : mfp.defaults.buGrowth[y][bu]*100;
  const effCh = (c,y) => (S.mfp.chShare[y]&&S.mfp.chShare[y][c]!=null) ? S.mfp.chShare[y][c] : mfp.defaults.chShare[y][c]*100;
  const projDelta = (d) => {
    const stx = JSON.parse(JSON.stringify(S.mfp));
    for (const y of PLAN_YEARS) {
      if (d.growth != null) {
        if (buMode) { stx.buGrowth[y] ??= {}; for (const b of BUS) stx.buGrowth[y][b.id] = effBuG(b.id,y) + d.growth; }
        else stx.growth[y] = effG(y) + d.growth;
      }
      if (d.pm != null) stx.pm[y] = effPm(y) + d.pm;
      if (d.mix != null) {
        if (buMode) { stx.buGrowth[y] ??= {}; stx.buGrowth[y].SDA = effBuG('SDA',y) + d.mix; }
        else { stx.chShare[y] ??= {}; stx.chShare[y].D2C = effCh('D2C',y) + d.mix; }
      }
    }
    return project(HIST, stx);
  };
  const base31 = mfp.years[2031].tot;
  const DRV = [
    { id:'growth', name:'Net-sales growth', d:{ growth:1.5 } },
    { id:'margin', name:'Product margin rate', d:{ pm:1.5 } },
    { id:'mix',    name: buMode ? 'SDA weighting' : 'Channel mix → D2C', d:{ mix:3 } }
  ];
  const negD = o => Object.fromEntries(Object.entries(o).map(([k,v]) => [k,-v]));
  const mtorn = DRV.map(dr => {
    const up = projDelta(dr.d).years[2031].tot, dn = projDelta(negD(dr.d)).years[2031].tot;
    const hi = up.pm - base31.pm, lo = dn.pm - base31.pm;
    return { id:dr.id, name:dr.name, hi:Math.max(hi,lo), lo:Math.min(hi,lo),
             half:Math.abs(hi-lo)/2, nsHalf:Math.abs(up.ns-dn.ns)/2, span:Math.abs(hi-lo) };
  }).sort((a,b)=>b.span-a.span);
  const rho = 0.3;
  const halves = mtorn.map(t=>t.half);
  let q = halves.reduce((a,x)=>a+x*x,0);
  for (let i=0;i<halves.length;i++) for (let j=i+1;j<halves.length;j++) q += 2*rho*halves[i]*halves[j];
  const mBand = Math.sqrt(Math.max(0,q));
  // net-sales fan from the growth driver, per plan year
  const gUp = projDelta({growth:1.5}), gDn = projDelta({growth:-1.5});
  const nsFan = MFP_YEARS.map(y => y < 2027 ? null
    : [gDn.years[y].tot.ns, gUp.years[y].tot.ns]);
  // light Monte Carlo on 2031 product margin
  let above = 0; const samples = [];
  const trend31 = project(HIST, { mode:S.mfp.mode }).years[2031].tot.pm;  // pure-trend reference
  for (let n=0;n<2000;n++){ const F = gauss01(); let m = base31.pm;
    for (const t of mtorn) m += t.half * (Math.sqrt(rho)*F + Math.sqrt(1-rho)*gauss01());
    samples.push(m); if (m >= trend31) above++; }
  samples.sort((a,b)=>a-b);
  const qtl = p => samples[Math.min(samples.length-1, Math.floor(p*samples.length))];
  const mfpRisk = { likely:base31, band:mBand, worstPm:base31.pm-mBand, bestPm:base31.pm+mBand,
    worstNs:gDn.years[2031].tot.ns, bestNs:gUp.years[2031].tot.ns,
    torn: mtorn, nsFan, p10:qtl(.10), p50:qtl(.50), p90:qtl(.90), aboveTrend:above/2000, trend31 };
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
    br, brGroups: groupParts(br.parts), isolate: S.isolate,
    priceSweep, histBr, histSeries, yearSummary, savedScenarios: SCEN,
    pnl: pnlData, mix: mixData, opexLines: OPEX_LINES, tree: treeData, ebitBridge,
    mfp, mfpState: S.mfp, hist: HIST, build: S.build, page: S.page,
    budget2027, recon, validation, versions: VERSIONS, mfpRisk,
    reconciled:reconciled(br), grad, sc, torn, mc, hist,
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
const presetName = () => {
  const n = Object.values(S.ov).filter(v => v).length;
  const base = S.cmp === 'BUD' ? 'vs budget' : 'vs PY';
  return (n === 0 ? 'History on autopilot' : `${n} adjustment${n > 1 ? 's' : ''}`) + ` · ${base}`;
};
const A = {
  setCursor: i => { S.cursor = Math.max(CY_START, Math.min(N_MONTHS - 1, i)); go(); },
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
  setIsolate:v => { S.isolate = v; S.pick = null; go(); },
  setPnlGran:v => { S.pnlGran = v; go(); },
  setPnlShow:v => { S.pnlShow = v; go(); },
  setFocusBu:v => { S.focusBu = v; go(); },
  toggleNode:id => { S.expanded.has(id) ? S.expanded.delete(id) : S.expanded.add(id); go(); },
  mfpSet: (kind, year, v) => { const m = S.mfp[kind];
    if (v === null || v === '' || Number.isNaN(v)) delete m[year]; else m[year] = v; go(); },
  mfpChShare: (year, ch, v) => { (S.mfp.chShare[year] ??= {});
    if (v === null || v === '' || Number.isNaN(v)) delete S.mfp.chShare[year][ch]; else S.mfp.chShare[year][ch] = v; go(); },
  mfpBuShare: (ch, bu, v) => { (S.mfp.buShare[ch] ??= {});
    if (v === null || v === '' || Number.isNaN(v)) delete S.mfp.buShare[ch][bu]; else S.mfp.buShare[ch][bu] = v; go(); },
  mfpPlanYear: y => { S.mfp.planYear = y; go(); },
  mfpMode: m => { S.mfp.mode = m; go(); },
  mfpBuGrowth: (year, bu, v) => { (S.mfp.buGrowth[year] ??= {});
    if (v === null || v === '' || Number.isNaN(v)) delete S.mfp.buGrowth[year][bu]; else S.mfp.buGrowth[year][bu] = v; go(); },
  mfpBudCh: c => { S.mfp.budCh = c; go(); },
  mfpReset: () => { S.mfp = { mode:S.mfp.mode, growth:{}, pm:{}, price:{}, nsAbs:{}, buGrowth:{},
    chShare:{}, buShare:{}, budAdj:{}, planYear:S.mfp.planYear, budCh:S.mfp.budCh }; go(); },
  setBuild: (b, page) => { S.build = b; S.pick = null; if (page) S.page = page; go(); },
  goto: page => { S.page = page; S.pick = null; go(); },
  mfpBudAdj: (ch, v) => { (S.mfp.budAdj ??= {});
    if (v === null || v === '' || Number.isNaN(v)) delete S.mfp.budAdj[ch]; else S.mfp.budAdj[ch] = v; go(); },
  mfpAdoptBudget: () => {   // roll the bottom-up budget back up into the 2027 plan
    const bt = ctx.budget2027;
    S.mfp.nsAbs[2027] = bt.tot.ns;                       // plan top line = committed budget
    S.mfp.chShare[2027] = {};                            // and its channel mix
    for (const c of CH_IDS) S.mfp.chShare[2027][c] = (bt.ch[c].ns / bt.tot.ns) * 100;
    S.mfp.budAdj = {};                                   // gap now closed — commitments are the plan
    go();
  },
  mfpUnadopt: () => { delete S.mfp.nsAbs[2027]; delete S.mfp.chShare[2027]; go(); },
  vSave: name => { VERSIONS.unshift(snapshotState(name)); persistV(); go(); },
  vLoad: id => { const v = VERSIONS.find(x => x.id === id); if (!v) return;
    S.build = v.type; S.mfp = clone(v.mfp);
    S.ov = { ...v.fc.ov }; S.carry = v.fc.carry; S.cursor = v.fc.cursor; S.ramp = v.fc.ramp;
    S.elast = v.fc.elast; S.rho = v.fc.rho; S.k = v.fc.k; S.cmp = v.fc.cmp; S.measure = v.fc.measure; go(); },
  vDup: id => { const v = VERSIONS.find(x => x.id === id); if (!v) return;
    VERSIONS.unshift({ ...clone(v), id:'v'+Date.now(), name:v.name+' (copy)', created:new Date().toISOString() });
    persistV(); go(); },
  vDel: id => { VERSIONS = VERSIONS.filter(x => x.id !== id); persistV(); ctx.versions = VERSIONS; go(); },
  saveScenario: () => {
    const a = agg(ctx.FC);
    SCEN.push({ name: presetName(), gm:a.gm, ns:a.ns, rate:a.rate, units:a.units,
      worst:ctx.sc.worst, best:ctx.sc.best, above:ctx.mc.above,
      ov:{ ...S.ov }, carry:S.carry, elast:S.elast, cmp:S.cmp, measure:S.measure, cursor:S.cursor });
    go();
  },
  loadScenario: i => { const s = SCEN[i]; if (!s) return;
    S.ov = { ...s.ov }; S.carry = s.carry; S.elast = s.elast; go(); },
  dropScenario: i => { SCEN.splice(i, 1); go(); },
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
const PAGES = { tutorial:views.renderTutorial, build:views.renderBuild,
                history:views.renderHistory, plan:views.renderPlan, cockpit:views.renderCockpit,
                pnl:views.renderPnl, mix:views.renderMix,
                sensitivity:views.renderSensitivity, report:views.renderReport,
                mfp:views.renderMfp, budget:views.renderBudget,
                validate:views.renderValidate, versions:views.renderVersions };

function go() {
  ctx = compute();
  document.querySelectorAll('.nav button').forEach(b =>
    b.classList.toggle('on', b.dataset.p === S.page));
  const ver = document.getElementById('version');
  if (ver) ver.innerHTML = S.build === 'budget'
    ? `<b>Budget 2027</b><span>full year · from MFP</span>`
    : `<b>Forecast ’26</b><span>actuals + rest of year</span>`;
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
