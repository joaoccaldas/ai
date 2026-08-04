/* ============================================================================
   views.js — rendering only. Nothing here computes a number.
   ========================================================================== */

import { MARKETS, BUS, CLASSES, MONTH_NAMES, CY_START, N_MONTHS, HIST_YEARS, label } from './data.js';
import { DRIVERS, LEVELLED, ovKey, inherited } from './model.js';
import * as ch from './charts.js';
import { eur, seur, pct, spp, C } from './charts.js';

const h = (t, cls, html) => { const e = document.createElement(t);
  if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmtDrv = (v, u) => (v > 0 ? '+' : '') + Number(v).toFixed(u === 'pp' ? 1 : 2) + u;

/* ========================== PAGE 1 — PLAN (input) ========================= */
export function renderPlan(root, ctx, A) {
  const { state } = ctx;
  root.innerHTML = '';

  /* --- calendar: where actuals stop and assumptions begin --- */
  const cal = h('section', 'panel');
  cal.appendChild(h('div', 'phead', `<h2>Calendar</h2>
    <p>Click a month to move the actuals cut-off. Everything to its left is locked from SAP;
       everything to its right is driven by the assumptions below.</p>`));
  const strip = h('div', 'cal');
  for (let m = 0; m < 12; m++) {
    const i = CY_START + m, closed = i <= state.cursor;
    const b = h('button', 'calm' + (closed ? ' closed' : '') + (i === state.cursor ? ' cut' : ''),
      `<b>${MONTH_NAMES[m]}</b><span>${closed ? 'actual' : 'open'}</span>`);
    b.onclick = () => A.setCursor(i);
    strip.appendChild(b);
  }
  cal.appendChild(strip);
  const cs = ctx.closedShare;
  cal.appendChild(h('p', 'note', `${state.cursor - CY_START + 1} months closed ·
    ${(cs*100).toFixed(0)}% of full-year margin already booked ·
    <b>${(100-cs*100).toFixed(0)}% still steerable</b>`));
  root.appendChild(cal);

  /* --- global mechanics --- */
  const mech = h('section', 'panel');
  mech.appendChild(h('div', 'phead', `<h2>Mechanics</h2>
    <p>How the open months are built before any driver is touched.</p>`));
  const mg = h('div', 'mech');

  const dial = (lab, help, val, min, max, step, fmt, on) => {
    const w = h('div', 'dial');
    w.innerHTML = `<div class="row"><span class="nm">${lab}</span>
      <span class="vl num">${fmt(val)}</span></div>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${val}">
      <p class="help">${help}</p>`;
    w.querySelector('input').oninput = e => on(parseFloat(e.target.value));
    return w;
  };
  mg.appendChild(dial('YTD trend carry',
    'How much of this year\'s run-rate versus last year carries into the open months. 0% = last year\'s shape repeats, 100% = the year-to-date gap persists to December.',
    state.carry, 0, 1, 0.05, v => (v*100).toFixed(0) + '%', A.setCarry));
  mg.appendChild(dial('Driver correlation ρ',
    'How much drivers move together in the bad case. 0 combines them in quadrature; 1 stacks them. Higher ρ widens worst and best.',
    ctx.rho, 0, 1, 0.05, v => v.toFixed(2), A.setRho));
  mg.appendChild(dial('Confidence k',
    'Sigmas either side of the forecast. 1.00 ≈ 68% of outcomes, 1.28 ≈ 80%, 1.64 ≈ 90%.',
    ctx.k, 0.5, 2, 0.01, v => v.toFixed(2) + 'σ', A.setK));
  const ramp = h('div', 'dial');
  ramp.innerHTML = `<div class="row"><span class="nm">Phase-in</span>
    <span class="vl num">${state.ramp ? '3 months' : 'immediate'}</span></div>
    <button class="ghost" style="margin-top:6px">${state.ramp ? 'Switch to immediate' : 'Switch to 3-month ramp'}</button>
    <p class="help">Price and cost decisions rarely land in full on day one. The ramp phases a change in over the first three open months.</p>`;
  ramp.querySelector('button').onclick = () => A.setRamp(!state.ramp);
  mg.appendChild(ramp);
  mg.appendChild(dial('Price elasticity',
    'How hard a price move pulls volume the other way. 0 ignores it (price drops straight to margin); 1 applies each business unit\'s own elasticity — laundry is stickier than small appliances. A "price action" that ignores elasticity always flatters the plan.',
    state.elast, 0, 1.5, 0.05, v => '×' + v.toFixed(2), A.setElast));
  mech.appendChild(mg);
  root.appendChild(mech);

  /* --- assumption levels --- */
  const lvl = h('section', 'panel');
  lvl.appendChild(h('div', 'phead', `<h2>Assumptions</h2>
    <p>Set once at the top, refine where you have a real view. The most specific
       number always wins: <b>SKU → market×BU → BU → market → Nordics</b>.
       Grey means inherited, red means someone made a decision.</p>`));
  const tabs = h('div', 'tabs');
  [['all','Portfolio'],['grid','Market × BU'],['sku','SKU exceptions']].forEach(([id, nm]) => {
    const b = h('button', 'tab' + (ctx.tab === id ? ' on' : ''), nm);
    b.onclick = () => A.setTab(id); tabs.appendChild(b);
  });
  lvl.appendChild(tabs);
  const body = h('div', 'tabbody');

  if (ctx.tab === 'all') {
    const g = h('div', 'sliders');
    DRIVERS.forEach(d => {
      const cur = state.ov[ovKey('all','ALL',d.id)] ?? 0;
      const sg = ctx.sig[d.id] ?? 0;
      const w = h('div', 'driver');
      w.innerHTML = `<div class="row"><span class="nm">${d.name}</span>
        <span class="vl num ${cur ? 'on' : ''}">${fmtDrv(cur, d.unit)}</span></div>
        <input type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${cur}">
        <div class="band"><span>${d.min}</span>
          <span>history ±${sg.toFixed(1)}${d.unit}</span><span>+${d.max}</span></div>
        ${Math.abs(cur) > sg * 2 ? `<p class="warn">More than 2σ from anything the
          history supports. Fine if there is a decision behind it — write it down.</p>` : ''}`;
      w.querySelector('input').oninput = e =>
        A.setOv('all','ALL',d.id, parseFloat(e.target.value) || null);
      g.appendChild(w);
    });
    body.appendChild(g);
  }

  if (ctx.tab === 'grid') {
    const sel = h('div', 'drvpick');
    LEVELLED.forEach(id => {
      const d = DRIVERS.find(x => x.id === id);
      const b = h('button', 'chip' + (ctx.gridDrv === id ? ' on' : ''), d.name);
      b.onclick = () => A.setGridDrv(id); sel.appendChild(b);
    });
    body.appendChild(sel);
    const d = DRIVERS.find(x => x.id === ctx.gridDrv);
    const t = h('table', 'grid');
    t.innerHTML = `<tr><th>Market</th>${BUS.map(b => `<th>${b.name}</th>`).join('')}
      <th class="edge">Market</th></tr>` +
      MARKETS.map(m => `<tr><td class="rowlab">${m.name}</td>` +
        BUS.map(b => {
          const k = ovKey('mktbu', `${m.id}~${b.id}`, d.id);
          const own = state.ov[k];
          const inh = inherited(state, 'mktbu', `${m.id}~${b.id}`, d.id);
          return `<td><input class="cellin ${own !== undefined ? 'own' : ''}"
            data-l="mktbu" data-s="${m.id}~${b.id}"
            value="${own !== undefined ? own : ''}"
            placeholder="${inh.v.toFixed(d.unit === 'pp' ? 1 : 2)}"
            title="${own !== undefined ? 'Overridden here' : 'Inherited from ' + inh.lvl}"></td>`;
        }).join('') +
        `<td class="edge"><input class="cellin ${state.ov[ovKey('mkt',m.id,d.id)] !== undefined ? 'own' : ''}"
          data-l="mkt" data-s="${m.id}"
          value="${state.ov[ovKey('mkt',m.id,d.id)] ?? ''}"
          placeholder="${inherited(state,'mkt',m.id,d.id).v.toFixed(2)}"></td></tr>`).join('') +
      `<tr class="edge"><td class="rowlab">Business unit</td>` +
        BUS.map(b => `<td><input class="cellin ${state.ov[ovKey('bu',b.id,d.id)] !== undefined ? 'own' : ''}"
          data-l="bu" data-s="${b.id}"
          value="${state.ov[ovKey('bu',b.id,d.id)] ?? ''}"
          placeholder="${inherited(state,'bu',b.id,d.id).v.toFixed(2)}"></td>`).join('') +
        `<td class="edge"><input class="cellin ${state.ov[ovKey('all','ALL',d.id)] !== undefined ? 'own' : ''}"
          data-l="all" data-s="ALL" value="${state.ov[ovKey('all','ALL',d.id)] ?? ''}"
          placeholder="0.00"></td></tr>`;
    t.querySelectorAll('input').forEach(inp => {
      inp.onchange = e => {
        const v = e.target.value.trim();
        A.setOv(e.target.dataset.l, e.target.dataset.s, d.id, v === '' ? null : parseFloat(v));
      };
    });
    body.appendChild(t);
    body.appendChild(h('p', 'note',
      `Values are ${d.unit === 'pp' ? 'percentage points' : 'percent'} applied to the open months.
       Blank inherits — the faded number is what it would be. Bottom row and right column are the
       BU and market roll-ups; the corner cell is Nordics.`));
  }

  if (ctx.tab === 'sku') {
    const bar = h('div', 'skubar');
    bar.innerHTML = `<input class="search" placeholder="Filter by SKU, business unit or class">`;
    body.appendChild(bar);
    const wrap = h('div', 'skulist');
    const draw = (q = '') => {
      const list = ctx.SKUS.filter(s => !q ||
        (s.code + s.bu + s.cls + s.name).toLowerCase().includes(q.toLowerCase()))
        .slice(0, 60);
      wrap.innerHTML = `<table class="grid"><tr><th>SKU</th><th>BU</th><th>Class</th>
        ${LEVELLED.map(id => `<th>${DRIVERS.find(d=>d.id===id).name}</th>`).join('')}</tr>` +
        list.map(s => `<tr><td class="rowlab">${s.code}${s.mapped ? '' :
          ' <em class="flag">unmapped</em>'}</td><td class="mini">${s.bu}</td>
          <td class="mini">${s.cls}</td>` +
          LEVELLED.map(id => {
            const own = ctx.state.ov[ovKey('sku', s.code, id)];
            const inh = inherited(ctx.state, 'sku', s.code, id);
            return `<td><input class="cellin ${own !== undefined ? 'own' : ''}"
              data-s="${s.code}" data-d="${id}" value="${own ?? ''}"
              placeholder="${inh.v.toFixed(2)}"></td>`;
          }).join('') + '</tr>').join('') + '</table>';
      wrap.querySelectorAll('input').forEach(inp => inp.onchange = e => {
        const v = e.target.value.trim();
        A.setOv('sku', e.target.dataset.s, e.target.dataset.d, v === '' ? null : parseFloat(v));
      });
    };
    bar.querySelector('input').oninput = e => draw(e.target.value);
    draw();
    body.appendChild(wrap);
    body.appendChild(h('p', 'note', `Use this level for things you actually know: a launch, a
      delist, a competitor price move. If more than a handful of SKUs are overridden, the
      decision probably belongs one level up.`));
  }

  lvl.appendChild(body);
  root.appendChild(lvl);
}

/* ======================== PAGE 2 — COCKPIT (output) ====================== */
export function renderCockpit(root, ctx, A) {
  root.innerHTML = '';
  const { br, sc, mc, torn, kpi, state } = ctx;

  /* controls */
  const ctl = h('section', 'ctlbar');
  const mk = (opts, cur, on) => {
    const g = h('div', 'seg');
    opts.forEach(([v, l]) => { const b = h('button', 'sgb' + (cur === v ? ' on' : ''), l);
      b.onclick = () => on(v); g.appendChild(b); });
    return g;
  };
  ctl.appendChild(mk([['BUD','Forecast vs budget'],['PY','Forecast vs prior year']], ctx.cmp, A.setCmp));
  ctl.appendChild(mk([['gm','Product margin'],['ns','Net sales']], ctx.measure, A.setMeasure));
  ctl.appendChild(mk([['ALL','Nordics'],...MARKETS.map(m => [m.id, m.name])], ctx.focusMkt, A.setFocusMkt));
  ctl.appendChild(mk([[false,'Detailed walk'],[true,'Isolate levers']], ctx.isolate, A.setIsolate));
  root.appendChild(ctl);

  /* hero bridge — detailed, or collapsed onto Volume / Mix / Pricing / Cost / Lifecycle / FX */
  const parts = ctx.isolate ? ctx.brGroups : br.parts;
  const hero = h('section', 'panel hero');
  hero.appendChild(h('div', 'phead', `<h2>${ctx.bridgeTitle}</h2>
    <p>${ctx.isolate
      ? 'Collapsed onto the levers. <b>Volume</b>, <b>Mix</b> and <b>Pricing</b> (list price net of discount and rebate) are the three the commercial team owns; cost, lifecycle and FX are held separate.'
      : 'Click any bucket to see which markets it came from.'}</p>`));
  const rd = h('div', 'readout');
  rd.innerHTML = `
    <div><span class="k">${ctx.fromLab}</span><span class="v num">${eur(br.from)}</span></div>
    <div><span class="k">${ctx.toLab}</span><span class="v num">${eur(br.to)}</span></div>
    <div><span class="k">Delta</span><span class="v num ${br.total>=0?'up':'down'}">${seur(br.total)}
      / ${(br.total/Math.abs(br.from)*100).toFixed(1)}%</span></div>
    <div class="${ctx.reconciled ? 'seal' : 'seal broken'}">
      <span class="ring">${ctx.reconciled ? '✓' : '!'}</span>
      <span>${ctx.reconciled ? 'Reconciled' : 'Residual'}<br><b class="num">Δ ${br.resid.toFixed(2)}</b></span>
    </div>`;
  hero.appendChild(rd);
  const wf = h('div', 'chart'); hero.appendChild(wf);
  root.appendChild(hero);
  ch.waterfall(wf, { from:br.from, to:br.to, parts,
    fromLab:ctx.fromLab, toLab:ctx.toLab, height:310, onPick: ctx.isolate ? null : A.pickBucket });

  if (ctx.pick && !ctx.isolate) {
    const dd = h('section', 'panel');
    const nm = br.parts.find(p => p.id === ctx.pick)?.lab ?? ctx.pick;
    dd.appendChild(h('div', 'phead', `<h2>${nm} by market</h2>
      <p>Same walk, cut four ways. <button class="ghost sm" id="closedd">Close</button></p>`));
    const t = h('table', 'grid');
    t.innerHTML = `<tr><th>Market</th><th>${nm}</th><th>Total delta</th><th>Share of ${nm}</th></tr>` +
      ctx.drill.map(d => `<tr><td class="rowlab">${MARKETS.find(m=>m.id===d.key)?.name ?? d.key}</td>
        <td class="num ${d.v>=0?'up':'down'}">${seur(d.v)}</td>
        <td class="num">${seur(d.total)}</td>
        <td class="num">${(d.v / (br.parts.find(p=>p.id===ctx.pick).v || 1) * 100).toFixed(0)}%</td></tr>`).join('');
    dd.appendChild(t);
    root.appendChild(dd);
    dd.querySelector('#closedd').onclick = () => A.pickBucket(null);
  }

  /* scenario compare strip */
  const scv = h('section', 'panel scenbar');
  const saved = ctx.savedScenarios;
  scv.innerHTML = `<div class="phead"><h2>Scenarios</h2>
    <p>Snapshot the current set of adjustments, then hold them side by side.</p></div>`;
  const scrow = h('div', 'scenrow');
  const cur = h('div', 'scard cur');
  cur.innerHTML = `<div class="eyebrow">Current</div>
    <div class="num big">${eur(kpi.gm)}</div><div class="mini">${ctx.assumptions.length ? ctx.assumptions.length + ' adjustment' + (ctx.assumptions.length>1?'s':'') : 'History on autopilot'}</div>
    <div class="mini">worst ${eur(sc.worst)} · best ${eur(sc.best)}</div>
    <button class="solid sm" id="savescen">Save snapshot</button>`;
  scrow.appendChild(cur);
  saved.forEach((s, i) => {
    const d = s.gm - kpi.gm;
    const c = h('div', 'scard');
    c.innerHTML = `<div class="eyebrow">${i + 1} · ${s.name}</div>
      <div class="num big">${eur(s.gm)}</div>
      <div class="mini num ${d>=0?'up':'down'}">${seur(d)} vs current</div>
      <div class="mini">P(≥bud) ${s.above!=null?(s.above*100).toFixed(0)+'%':'—'}</div>
      <div class="srow"><button class="ghost sm" data-load="${i}">Load</button>
        <button class="ghost sm" data-drop="${i}">✕</button></div>`;
    scrow.appendChild(c);
  });
  scv.appendChild(scrow);
  root.appendChild(scv);
  scv.querySelector('#savescen').onclick = A.saveScenario;
  scv.querySelectorAll('[data-load]').forEach(b => b.onclick = () => A.loadScenario(+b.dataset.load));
  scv.querySelectorAll('[data-drop]').forEach(b => b.onclick = () => A.dropScenario(+b.dataset.drop));

  /* KPI row */
  const kp = h('section', 'kpis');
  [['Net sales', eur(kpi.ns), kpi.nsD, kpi.nsS],
   ['Product margin', eur(kpi.gm), kpi.gmD, kpi.gmS],
   ['Margin rate', pct(kpi.rate), kpi.rateD, kpi.rateS],
   ['Units', Math.round(kpi.units/1000)+'k', kpi.unitsD, kpi.unitsS]].forEach(([k, v, d, s]) => {
    const c = h('div', 'kpi');
    c.innerHTML = `<div class="k">${k}</div><div class="v num">${v}</div>
      <div class="d num ${d.startsWith('−')?'down':'up'}">${d}</div>`;
    c.appendChild(ch.spark(s, 170, 28, d.startsWith('−') ? C.bad : C.good, state.cursor));
    kp.appendChild(c);
  });
  root.appendChild(kp);

  /* trajectory + scenarios */
  const g2 = h('div', 'g2');
  const traj = h('section', 'panel');
  traj.appendChild(h('div', 'phead', `<h2>Trajectory</h2>
    <p>Actual to the cut-off, forecast after it, budget dashed, shaded band is ±${sc.k}σ.</p>`));
  const tc = h('div', 'chart'); traj.appendChild(tc); g2.appendChild(traj);

  const risk = h('section', 'panel');
  risk.appendChild(h('div', 'phead', `<h2>Range of outcomes</h2>
    <p>5,000 draws, drivers correlated at ρ=${sc.rho.toFixed(2)}.</p>`));
  const rc = h('div', 'chart'); risk.appendChild(rc);
  risk.appendChild(h('div', 'scen', `
    <div><span class="k">Worst</span><span class="v num down">${eur(sc.worst)}</span></div>
    <div><span class="k">Likely</span><span class="v num">${eur(sc.likely)}</span></div>
    <div><span class="k">Best</span><span class="v num up">${eur(sc.best)}</span></div>
    ${mc.above != null ? `<div><span class="k">P(≥ budget)</span>
      <span class="v num ${mc.above>=.5?'up':'down'}">${(mc.above*100).toFixed(0)}%</span></div>` : ''}`));
  g2.appendChild(risk);
  root.appendChild(g2);
  ch.fan(tc, ctx.fanData);
  ch.histChart(rc, ctx.hist, ctx.histMarks);

  /* tornado + mix */
  const g3 = h('div', 'g2');
  const tn = h('section', 'panel');
  tn.appendChild(h('div', 'phead', `<h2>What moves it</h2>
    <p>Each driver swung ±${sc.k}σ of its own history, alone. Sigma shown at the right.</p>`));
  const tnc = h('div', 'chart'); tn.appendChild(tnc); g3.appendChild(tn);

  const mx = h('section', 'panel');
  mx.appendChild(h('div', 'phead', `<h2>Price-point mix</h2>
    <p>Share of net sales. Dashed line is the actuals cut-off.</p>`));
  const mxc = h('div', 'chart'); mx.appendChild(mxc);
  mx.appendChild(h('div', 'legend', CLASSES.map(c =>
    `<span><i style="background:${c.col}"></i>${c.id}</span>`).join('')));
  g3.appendChild(mx);
  root.appendChild(g3);
  ch.tornadoChart(tnc, torn, 220);
  ch.area(mxc, { series:ctx.mixSeries, cols:CLASSES.map(c => c.col), n:N_MONTHS,
    cursor:state.cursor, height:220 });

  /* scatter + heat */
  const g4 = h('div', 'g2');
  const sct = h('section', 'panel');
  sct.appendChild(h('div', 'phead', `<h2>Assumption check</h2>
    <p>Every SKU at its forecast price and margin. Bubble is margin. Shaded band is the price
       range actually observed in the closed months — anything ringed sits outside it.</p>`));
  const sc2 = h('div', 'chart'); sct.appendChild(sc2); g4.appendChild(sct);

  const ht = h('section', 'panel');
  ht.appendChild(h('div', 'phead', `<h2>Where it lands</h2>
    <p>Margin rate versus ${ctx.cmp === 'BUD' ? 'budget' : 'prior year'}, percentage points.</p>`));
  const htc = h('div', 'heatwrap'); ht.appendChild(htc); g4.appendChild(ht);
  root.appendChild(g4);
  ch.scatter(sc2, ctx.scatterData);
  ch.heat(htc, ctx.heatData);
}

/* ======================== PAGE 3 — REPORT (output) ======================= */
export function renderReport(root, ctx, A) {
  root.innerHTML = '';
  const { br, sc, mc, kpi } = ctx;

  const bar = h('section', 'exportbar');
  bar.innerHTML = `<div class="eyebrow">Take it with you</div>`;
  const btn = (lab, cls, fn) => { const b = h('button', cls, lab); b.onclick = fn; return b; };
  const row = h('div', 'ebtns');
  row.appendChild(btn('PowerPoint', 'solid', A.pptx));
  row.appendChild(btn('PDF', '', A.pdf));
  row.appendChild(btn('CSV · by SKU', '', () => A.csv('sku')));
  row.appendChild(btn('CSV · by BU', '', () => A.csv('bu')));
  row.appendChild(btn('CSV · assumptions', '', A.csvAssume));
  bar.appendChild(row);
  bar.appendChild(h('p', 'note', `The assumption register travels with the numbers. A forecast
    without the assumptions behind it is not reproducible, and will be argued with.`));
  root.appendChild(bar);

  const nar = h('section', 'panel report');
  nar.appendChild(h('div', 'phead', `<h2>The story</h2><p>Generated from the current scenario.</p>`));
  nar.appendChild(h('div', 'narrative', ctx.narrative));
  root.appendChild(nar);

  const wfp = h('section', 'panel');
  wfp.appendChild(h('div', 'phead', `<h2>${ctx.bridgeTitle}</h2>`));
  const wf = h('div', 'chart'); wfp.appendChild(wf); root.appendChild(wfp);
  ch.waterfall(wf, { from:br.from, to:br.to, parts:br.parts, fromLab:ctx.fromLab,
    toLab:ctx.toLab, height:300 });

  const vt = h('section', 'panel');
  vt.appendChild(h('div', 'phead', `<h2>Variance</h2>
    <p>Product margin against ${ctx.cmp === 'BUD' ? 'budget' : 'prior year'}, split by what is
       already closed and what is still open.</p>`));
  const t = h('table', 'grid rpt');
  t.innerHTML = `<tr><th>Business unit</th><th>Closed months</th><th>Open months</th>
    <th>Full year</th><th>Rate Δ</th></tr>` +
    ctx.varRows.map(r => `<tr><td class="rowlab">${r.name}</td>
      <td class="num ${r.ytd>=0?'up':'down'}">${seur(r.ytd)}</td>
      <td class="num ${r.ytg>=0?'up':'down'}">${seur(r.ytg)}</td>
      <td class="num ${r.fy>=0?'up':'down'}"><b>${seur(r.fy)}</b></td>
      <td class="num ${r.rate>=0?'up':'down'}">${spp(r.rate)}</td></tr>`).join('') +
    `<tr class="totrow"><td class="rowlab">Nordics</td>
      <td class="num">${seur(ctx.varTot.ytd)}</td><td class="num">${seur(ctx.varTot.ytg)}</td>
      <td class="num"><b>${seur(ctx.varTot.fy)}</b></td>
      <td class="num">${spp(ctx.varTot.rate)}</td></tr>`;
  vt.appendChild(t); root.appendChild(vt);

  const mv = h('section', 'panel');
  mv.appendChild(h('div', 'phead', `<h2>Movers</h2>
    <p>Biggest SKU-level margin swings against ${ctx.cmp === 'BUD' ? 'budget' : 'prior year'}.</p>`));
  const g = h('div', 'g2');
  const tbl = (title, rows, cls) => {
    const s = h('div');
    s.innerHTML = `<div class="eyebrow">${title}</div><table class="grid"><tr><th>SKU</th>
      <th>Market</th><th>Class</th><th>Δ margin</th></tr>` +
      rows.map(r => `<tr><td class="rowlab">${r.s}</td><td class="mini">${r.k}</td>
        <td class="mini">${r.cls}</td>
        <td class="num ${cls}">${seur(r.d)}</td></tr>`).join('') + '</table>';
    return s;
  };
  g.appendChild(tbl('Most favourable', ctx.movers.up, 'up'));
  g.appendChild(tbl('Least favourable', ctx.movers.down, 'down'));
  mv.appendChild(g); root.appendChild(mv);

  const ar = h('section', 'panel');
  ar.appendChild(h('div', 'phead', `<h2>Assumption register</h2>
    <p>Every deviation from history on autopilot, and where it was set.</p>`));
  const at = h('table', 'grid rpt');
  at.innerHTML = `<tr><th>Level</th><th>Scope</th><th>Driver</th><th>Value</th></tr>` +
    (ctx.assumptions.length
      ? ctx.assumptions.map(a => `<tr><td class="rowlab">${a[0]}</td><td class="mini">${a[1]}</td>
          <td>${a[2]}</td><td class="num">${a[3]}</td></tr>`).join('')
      : `<tr><td colspan="4" class="empty">No overrides. The forecast is history on autopilot —
          prior-year shape, year-to-date trend carried at ${(ctx.state.carry*100).toFixed(0)}%,
          last three months' price and cost held flat.</td></tr>`);
  ar.appendChild(at); root.appendChild(ar);
}

/* ======================== PAGE 0 — HISTORY (actuals) ===================== */
export function renderHistory(root, ctx, A) {
  root.innerHTML = '';
  const { histBr, yearSummary, histSeries, state } = ctx;

  const ctl = h('section', 'ctlbar');
  const mk = (opts, cur, on) => { const g = h('div', 'seg');
    opts.forEach(([v, l]) => { const b = h('button', 'sgb' + (cur === v ? ' on' : ''), l);
      b.onclick = () => on(v); g.appendChild(b); }); return g; };
  ctl.appendChild(mk([['gm','Product margin'],['ns','Net sales']], ctx.measure, A.setMeasure));
  ctl.appendChild(mk([['ALL','Nordics'],...MARKETS.map(m => [m.id, m.name])], ctx.focusMkt, A.setFocusMkt));
  ctl.appendChild(mk([[false,'Detailed walk'],[true,'Isolate levers']], ctx.isolate, A.setIsolate));
  root.appendChild(ctl);

  const intro = h('section', 'panel');
  intro.appendChild(h('div', 'phead', `<h2>Two years of actuals</h2>
    <p>${HIST_YEARS} full years of monthly history sit under the forecast. The walk below is the
       <b>year-on-year</b> product-margin bridge on pure actuals — prior year against the year
       before it — so the same volume / mix / pricing isolation applies to what already happened,
       before any assumption is touched.</p>`));
  root.appendChild(intro);

  /* per-year summary */
  const sumP = h('section', 'panel');
  sumP.appendChild(h('div', 'phead', `<h2>Year on year</h2>`));
  const st = h('table', 'grid rpt');
  st.innerHTML = `<tr><th>Year</th><th>Units</th><th>Net sales</th><th>Product margin</th><th>Margin rate</th></tr>` +
    yearSummary.map(y => `<tr><td class="rowlab">${y.lab}</td>
      <td class="num">${Math.round(y.units/1000)}k</td>
      <td class="num">${eur(y.ns)}</td><td class="num"><b>${eur(y.gm)}</b></td>
      <td class="num">${pct(y.rate)}</td></tr>`).join('');
  sumP.appendChild(st); root.appendChild(sumP);

  /* monthly margin trend across the whole calendar */
  const trP = h('section', 'panel');
  trP.appendChild(h('div', 'phead', `<h2>Monthly ${ctx.measure === 'gm' ? 'product margin' : 'net sales'}</h2>
    <p>Every month, oldest to newest. Solid is actual; dashed after the cut-off is forecast.</p>`));
  const spk = h('div', 'chart');
  spk.appendChild(ch.spark(histSeries.map(x => ctx.measure === 'gm' ? x.gm : x.ns),
    Math.max(640, 900), 96, C.good, state.cursor));
  trP.appendChild(spk);
  const yl = h('div', 'yearlabels');
  yl.innerHTML = yearSummary.map(y => `<span>${y.lab}</span>`).join('');
  trP.appendChild(yl);
  root.appendChild(trP);

  /* the YoY actuals bridge */
  if (histBr) {
    const parts = ctx.isolate ? groupPartsLocal(histBr.parts) : histBr.parts;
    const bp = h('section', 'panel hero');
    bp.appendChild(h('div', 'phead', `<h2>Prior year → year before · actuals</h2>
      <p>What actually drove the margin between the two most recent completed years.</p>`));
    const wf = h('div', 'chart'); bp.appendChild(wf); root.appendChild(bp);
    ch.waterfall(wf, { from:histBr.from, to:histBr.to, parts,
      fromLab:'Y-2', toLab:'PY', height:300 });
  }
}

/* mirror of bridge.groupParts, kept local so views stays render-only */
function groupPartsLocal(parts) {
  const order = ['Volume','Mix','Pricing','Cost','Lifecycle','FX'], by = {};
  for (const p of parts) (by[p.grp] ??= { id:p.grp.toLowerCase(), lab:p.grp, v:0, grp:p.grp }).v += p.v;
  return order.filter(g => by[g]).map(g => by[g]);
}

/* =========================== PAGE — P&L (to EBIT) ======================== */
const PNL_LINES = [
  { k:'units', name:'Volume',                     u:'k', fav:1 },
  { k:'gs',    name:'Gross sales',                 fav:1 },
  { k:'disc',  name:'Discounts',        neg:1, ind:1, fav:-1 },
  { k:'reb',   name:'Rebates & returns', neg:1, ind:1, fav:-1 },
  { k:'ns',    name:'Net sales',        sub:1, fav:1 },
  { k:'cogs',  name:'COGS',             neg:1, ind:1, fav:-1 },
  { k:'pm',    name:'Product margin',   sub:1, fav:1 },
  { k:'pmRate',name:'margin %',         pct:1, ind:1, mut:1, fav:1 },
  { k:'anp',   name:'Advertising & promotion', neg:1, ind:1, fav:-1 },
  { k:'sell',  name:'Selling & commercial',    neg:1, ind:1, fav:-1 },
  { k:'logi',  name:'Logistics & distribution',neg:1, ind:1, fav:-1 },
  { k:'sga',   name:'SG&A / overhead',         neg:1, ind:1, fav:-1 },
  { k:'da',    name:'Depreciation & amortisation', neg:1, ind:1, fav:-1 },
  { k:'ebit',  name:'EBIT',             tot:1, fav:1 },
  { k:'ebitRate', name:'EBIT %',        pct:1, ind:1, mut:1, fav:1 }
];
const money = v => v < 0 ? '−' + eur(-v) : eur(v);
const uk = v => Math.round(v/1000) + 'k';
const cellFmt = (o, l) => l.pct ? pct(o[l.k]) : l.u === 'k' ? uk(o[l.k]) : money(l.neg ? -o[l.k] : o[l.k]);
// dRaw already carries the P&L sign (deductions are flipped negative), so a
// positive dRaw is always favourable to EBIT — sales up OR cost down. No
// separate favourability multiplier is needed, or it double-counts.
const dRaw = (o, b, l) => l.pct ? (o[l.k]-b[l.k]) : ((l.neg?-o[l.k]:o[l.k]) - (l.neg?-b[l.k]:b[l.k]));
const dFmt = (o, b, l) => l.pct ? spp(o[l.k]-b[l.k]) : (l.u==='k' ? (dRaw(o,b,l)>=0?'+':'−')+uk(Math.abs(dRaw(o,b,l))) : seur(dRaw(o,b,l)));
const dCls = (o, b, l) => (dRaw(o,b,l) >= 0 ? 'up' : 'down');
const rowCls = l => [l.sub && 'sub', l.tot && 'tot', l.mut && 'mut', l.ind && 'ind'].filter(Boolean).join(' ');

export function renderPnl(root, ctx, A) {
  root.innerHTML = '';
  const P = ctx.pnl;
  const ctl = h('section', 'ctlbar');
  const mk = (opts, cur, on) => { const g = h('div', 'seg');
    opts.forEach(([v, l]) => { const b = h('button', 'sgb' + (cur === v ? ' on' : ''), l);
      b.onclick = () => on(v); g.appendChild(b); }); return g; };
  ctl.appendChild(mk([['fy','Full year'],['q','Quarterly'],['m','Monthly']], P.gran, A.setPnlGran));
  ctl.appendChild(mk([['ALL','Nordics'],...MARKETS.map(m => [m.id, m.name])], ctx.focusMkt, A.setFocusMkt));
  ctl.appendChild(mk([['ALL','All BUs'],...BUS.map(b => [b.id, b.name])], P.focusBu, A.setFocusBu));
  if (P.gran !== 'fy')
    ctl.appendChild(mk([['val','Values'],['bud','Δ vs budget'],['py','Δ vs prior year']], P.show, A.setPnlShow));
  root.appendChild(ctl);

  /* headline */
  const f = P.fy.fc, bud = P.fy.bud, py = P.fy.py;
  const kp = h('section', 'kpis');
  [['Net sales', money(f.ns), dFmt(f,bud,{k:'ns',fav:1}), dCls(f,bud,{k:'ns',fav:1})],
   ['Product margin', money(f.pm) + ` · ${pct(f.pmRate)}`, spp(f.pmRate-bud.pmRate), f.pmRate>=bud.pmRate?'up':'down'],
   ['Operating costs', money(f.opex), dFmt(f,bud,{k:'opex',neg:1,fav:-1}), dCls(f,bud,{k:'opex',neg:1,fav:-1})],
   ['EBIT', money(f.ebit) + ` · ${pct(f.ebitRate)}`, dFmt(f,bud,{k:'ebit',fav:1})+' vs bud', dCls(f,bud,{k:'ebit',fav:1})]
  ].forEach(([k, v, d, cls]) => {
    const c = h('div', 'kpi');
    c.innerHTML = `<div class="k">${k}</div><div class="v num">${v}</div>
      <div class="d num ${cls}">${d}</div>`;
    kp.appendChild(c);
  });
  root.appendChild(kp);

  /* statement */
  const st = h('section', 'panel');
  st.appendChild(h('div', 'phead', `<h2>Profit &amp; loss · volume to EBIT</h2>
    <p>${P.gran === 'fy'
      ? 'Full-year forecast against budget and prior year. Green is favourable to EBIT, red is not.'
      : `By ${P.gran === 'q' ? 'quarter' : 'month'}, showing ${P.show === 'val' ? 'values' : P.show === 'bud' ? 'variance vs budget' : 'variance vs prior year'}. Actuals to the cut-off, forecast after.`}</p>`));
  const t = h('table', 'grid pnl');

  if (P.gran === 'fy') {
    t.innerHTML = `<tr><th>Line</th><th>Forecast</th><th>Budget</th><th>Δ bud</th><th>Prior yr</th><th>Δ PY</th></tr>` +
      PNL_LINES.map(l => `<tr class="${rowCls(l)}"><td class="rowlab">${l.name}</td>
        <td class="num">${cellFmt(f, l)}</td>
        <td class="num soft">${cellFmt(bud, l)}</td>
        <td class="num ${dCls(f,bud,l)}">${dFmt(f,bud,l)}</td>
        <td class="num soft">${cellFmt(py, l)}</td>
        <td class="num ${dCls(f,py,l)}">${dFmt(f,py,l)}</td></tr>`).join('');
  } else {
    const per = P.periods, mode = P.show;
    const cell = (pd, l) => mode === 'val' ? `<td class="num">${cellFmt(pd.fc, l)}</td>`
      : `<td class="num ${dCls(pd.fc, mode==='bud'?pd.bud:pd.py, l)}">${dFmt(pd.fc, mode==='bud'?pd.bud:pd.py, l)}</td>`;
    const fyCell = l => mode === 'val' ? `<td class="num tot">${cellFmt(f, l)}</td>`
      : `<td class="num tot ${dCls(f, mode==='bud'?bud:py, l)}">${dFmt(f, mode==='bud'?bud:py, l)}</td>`;
    t.innerHTML = `<tr><th>Line</th>${per.map(p => `<th>${p.label}</th>`).join('')}<th>FY</th></tr>` +
      PNL_LINES.map(l => `<tr class="${rowCls(l)}"><td class="rowlab">${l.name}</td>` +
        per.map(pd => cell(pd, l)).join('') + fyCell(l) + `</tr>`).join('');
  }
  st.appendChild(t); root.appendChild(st);

  const nt = h('section', 'panel');
  nt.appendChild(h('p', 'note', `Operating costs below product margin — advertising & promotion,
    selling, logistics, SG&A and D&A — are modelled as business-unit-specific shares of net sales, so
    a shift toward small domestic appliances (heavier promotion, thinner margin) lowers EBIT even when
    product margin holds. Rates are constant across versions; every variance is a real change in volume,
    mix, price or cost, not re-planned overhead.`));
  root.appendChild(nt);
}

/* ============================ PAGE — BU MIX ============================== */
const BU_COL = { LAU:'#2F5D50', COO:'#B08A3E', REF:'#3f6d8a', DIS:'#8a6d3f', SDA:'#9E1B1B' };

export function renderMix(root, ctx, A) {
  root.innerHTML = '';
  const M = ctx.mix;
  const ctl = h('section', 'ctlbar');
  const mk = (opts, cur, on) => { const g = h('div', 'seg');
    opts.forEach(([v, l]) => { const b = h('button', 'sgb' + (cur === v ? ' on' : ''), l);
      b.onclick = () => on(v); g.appendChild(b); }); return g; };
  ctl.appendChild(mk([['BUD','vs budget'],['PY','vs prior year']], ctx.cmp, A.setCmp));
  ctl.appendChild(mk([['ALL','Nordics'],...MARKETS.map(m => [m.id, m.name])], ctx.focusMkt, A.setFocusMkt));
  root.appendChild(ctl);

  /* decomposition headline */
  const total = M.mixEff + M.rateEff + M.crossEff;
  const base = M.cmp === 'BUD' ? 'budget' : 'prior year';
  const intro = h('section', 'panel');
  intro.appendChild(h('div', 'phead', `<h2>What business-unit mix is doing to profitability</h2>
    <p>The blended product-margin rate moved <b>${spp(M.blendedF - M.blendedB)}</b> versus ${base}.
       That split into a <b>mix</b> effect — selling a different balance of business units — and a
       <b>rate</b> effect — each unit's own margin moving.</p>`));
  root.appendChild(intro);

  const kp = h('section', 'kpis');
  [['Blended margin Δ', spp(M.blendedF - M.blendedB), (M.blendedF-M.blendedB)>=0?'up':'down'],
   ['Mix effect', spp(M.mixEff), M.mixEff>=0?'up':'down'],
   ['Rate effect', spp(M.rateEff), M.rateEff>=0?'up':'down'],
   ['Interaction', spp(M.crossEff), M.crossEff>=0?'up':'down']].forEach(([k, v, cls]) => {
    const c = h('div', 'kpi'); c.innerHTML = `<div class="k">${k}</div><div class="v num ${cls}">${v}</div>`;
    kp.appendChild(c);
  });
  root.appendChild(kp);

  /* net-sales share bar */
  const shP = h('section', 'panel');
  shP.appendChild(h('div', 'phead', `<h2>Net-sales share by business unit</h2>
    <p>Forecast weight. Bar width is share; the number under each is its product-margin rate.</p>`));
  const bar = h('div', 'mixbar');
  bar.innerHTML = M.rows.map(r => `<div class="mseg" style="flex:${Math.max(0.001,r.wF)};background:${BU_COL[r.id]}"
    title="${r.name} ${pct(r.wF)}"><span>${r.name}</span><span class="mini">${pct(r.wF,0)}</span></div>`).join('');
  shP.appendChild(bar);
  root.appendChild(shP);

  /* the BU table */
  const tP = h('section', 'panel');
  tP.appendChild(h('div', 'phead', `<h2>Business units, isolated</h2>
    <p>Share, margin and pricing per unit, and each unit's contribution to the blended-margin move.</p>`));
  const t = h('table', 'grid');
  t.innerHTML = `<tr><th>Business unit</th><th>NS share</th><th>Δ share</th><th>Margin %</th>
    <th>EBIT %</th><th>Price vs ${base}</th><th>Mix effect</th><th>Rate effect</th></tr>` +
    M.rows.map(r => `<tr><td class="rowlab"><i class="dot" style="background:${BU_COL[r.id]}"></i>${r.name}</td>
      <td class="num">${pct(r.wF)}</td>
      <td class="num ${r.dW>=0?'up':'down'}">${(r.dW>=0?'+':'−')}${Math.abs(r.dW*100).toFixed(1)}pp</td>
      <td class="num">${pct(r.pmRate)}</td>
      <td class="num">${pct(r.ebitRate)}</td>
      <td class="num ${r.priceIdx>=0?'up':'down'}">${(r.priceIdx>=0?'+':'−')}${Math.abs(r.priceIdx*100).toFixed(1)}%</td>
      <td class="num ${r.me>=0?'up':'down'}">${spp(r.me)}</td>
      <td class="num ${r.re>=0?'up':'down'}">${spp(r.re)}</td></tr>`).join('');
  tP.appendChild(t); root.appendChild(tP);

  const nt = h('section', 'panel');
  nt.appendChild(h('p', 'note', `Read it as: a positive <b>mix effect</b> means the portfolio tilted toward
    higher-margin business units; a positive <b>rate effect</b> means units earned more within themselves.
    SDA is the swing factor — it carries the thinnest product margin and the heaviest promotion, so growing
    its share lifts volume but drags blended margin and EBIT.`));
  root.appendChild(nt);
}

/* ====================== PAGE 4 — SENSITIVITY (price) ===================== */
export function renderSensitivity(root, ctx, A) {
  root.innerHTML = '';
  const { priceSweep, torn, sc } = ctx;

  const ctl = h('section', 'ctlbar');
  const mk = (opts, cur, on) => { const g = h('div', 'seg');
    opts.forEach(([v, l]) => { const b = h('button', 'sgb' + (cur === v ? ' on' : ''), l);
      b.onclick = () => on(v); g.appendChild(b); }); return g; };
  ctl.appendChild(mk([['ALL','Nordics'],...MARKETS.map(m => [m.id, m.name])], ctx.focusMkt, A.setFocusMkt));
  const el2 = h('div', 'seg elasnote');
  el2.innerHTML = `<span class="mini">Elasticity ×${ctx.state.elast.toFixed(2)} — set on Plan</span>`;
  ctl.appendChild(el2);
  root.appendChild(ctl);

  /* price response curve */
  const cur = priceSweep.pts.find(p => p.p === Math.round(priceSweep.cur)) ?? priceSweep.u0;
  const best = priceSweep.best;
  const dVol = (best.units / (priceSweep.u0.units || 1) - 1) * 100;
  const dGm = best.gm - (cur.gm || 0);
  const pc = h('section', 'panel hero');
  pc.appendChild(h('div', 'phead', `<h2>Price sensitivity</h2>
    <p>Product margin (solid), net sales (dashed) and volume index (gold) as the portfolio price
       assumption sweeps from ${priceSweep.lo}% to +${priceSweep.hi}%. Volume responds through each
       business unit's elasticity. The green line marks the ${priceSweep.atCeiling
         ? 'best price <b>within the modelled range</b> — margin is still rising at the ceiling'
         : '<b>margin-maximising</b> price, where the price gain and volume loss cross'}.</p>`));
  const chart = h('div', 'chart'); pc.appendChild(chart); root.appendChild(pc);
  ch.priceCurve(chart, priceSweep, 300);

  const rd = h('section', 'kpis');
  [['Current price move', (priceSweep.cur>0?'+':'')+priceSweep.cur+'%', ''],
   ['Margin-max price', (best.p>0?'+':'')+best.p+'%', 'green'],
   ['Margin at optimum', eur(best.gm), dGm>=0?'green':'red'],
   ['Volume at optimum', (dVol>=0?'+':'')+dVol.toFixed(1)+'%', dVol>=0?'green':'red']].forEach(([k, v, col]) => {
    const c = h('div', 'kpi');
    c.innerHTML = `<div class="k">${k}</div><div class="v num ${col==='red'?'down':col==='green'?'up':''}">${v}</div>`;
    rd.appendChild(c);
  });
  root.appendChild(rd);

  const note = h('section', 'panel');
  note.appendChild(h('div', 'phead', `<h2>Reading it</h2>`));
  note.appendChild(h('p', 'narrative', priceSweep.atCeiling
    ? `<p>At the current setting the portfolio prices <b>${(priceSweep.cur>0?'+':'')+priceSweep.cur}%</b>.
      Across the modelled range product margin keeps rising with price — at these margin rates and
      elasticities the per-unit gain still outweighs the volume it sheds, so the best point sits at the
      <b>+${priceSweep.hi}%</b> ceiling (<b>${eur(best.gm)}</b>). That is a signal there may be untaken
      pricing power; it is <em>not</em> a mandate to raise list price ${priceSweep.hi}% — competitive
      response and cross-elasticity, not in this model, would bend the curve down first.</p>`
    : `<p>At the current setting the portfolio prices <b>${(priceSweep.cur>0?'+':'')+priceSweep.cur}%</b>.
      Pushing price lifts realised margin per unit but sheds volume through elasticity; the two cross at
      <b>${(best.p>0?'+':'')+best.p}%</b>, where product margin is highest at <b>${eur(best.gm)}</b>.
      Beyond that point the volume loss outweighs the price gain — the classic reason a blanket price
      rise can destroy margin even as it lifts the per-unit number.</p>`));
  root.appendChild(note);

  /* per-BU elasticity */
  const eP = h('section', 'panel');
  eP.appendChild(h('div', 'phead', `<h2>Elasticity by business unit</h2>
    <p>Δ units per Δ price. Big-ticket built-in appliances are stickier than small domestic ones.</p>`));
  const et = h('table', 'grid');
  et.innerHTML = `<tr><th>Business unit</th><th>Own-price elasticity</th><th>Read</th></tr>` +
    BUS.map(b => `<tr><td class="rowlab">${b.name}</td><td class="num">${b.elas.toFixed(2)}</td>
      <td class="mini">${b.elas > -0.8 ? 'inelastic — price has room' :
        b.elas > -1 ? 'near unit — price is roughly margin-neutral' :
        'elastic — price rises leak volume'}</td></tr>`).join('');
  eP.appendChild(et); root.appendChild(eP);

  /* sensitivity tornado */
  const tP = h('section', 'panel');
  tP.appendChild(h('div', 'phead', `<h2>What moves it</h2>
    <p>Each driver swung ±${sc.k}σ of its own history, alone. Sigma at the right.</p>`));
  const tc = h('div', 'chart'); tP.appendChild(tc); root.appendChild(tP);
  ch.tornadoChart(tc, torn, 220);
}
