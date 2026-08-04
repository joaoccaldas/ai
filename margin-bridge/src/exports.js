/* ============================================================================
   exports.js — getting the work out of the browser.

   CSV   two files: the fact extract at your chosen grain, and the assumption
         register. The register is what makes a scenario reproducible; a
         number without the assumptions behind it is not an answer.
   PDF   print stylesheet plus window.print(). No dependency, no drift
         between what you see and what prints.
   PPTX  pptxgenjs, loaded on demand. The bridge goes in as a NATIVE stacked
         bar chart, not a picture, so whoever gets the deck can edit it.
   ========================================================================== */

import { MARKETS, BUS } from './data.js';
import { DRIVERS } from './model.js';
import { eur, pct, spp } from './charts.js';

const dl = (blob, name) => {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
};
const csvEsc = v => typeof v === 'string' && /[",\n;]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v;
const toCsv = (head, rows) =>
  [head.join(';'), ...rows.map(r => r.map(csvEsc).join(';'))].join('\n');

/* ------------------------------- CSV: facts ------------------------------ */
export function exportFacts(ctx, grain = 'sku') {
  const { rowsFC, rowsPY, rowsBUD, meas, label } = ctx;
  const keyOf = r => grain === 'sku' ? [r.k, r.bu, r.cls, r.s]
                   : grain === 'bu'  ? [r.k, r.bu]
                   : [r.k];
  const bucket = {};
  const add = (r, ver) => {
    const k = [...keyOf(r), r.i, ver].join('|');
    const m = meas(r);
    if (!bucket[k]) bucket[k] = { key:keyOf(r), i:r.i, ver, u:0, gs:0, ns:0, cogs:0, gm:0, open:r.open };
    const b = bucket[k];
    b.u += m.units; b.gs += m.gs; b.ns += m.ns; b.cogs += m.cogs; b.gm += m.gm;
  };
  rowsPY.forEach(r => add(r, 'PY'));
  rowsBUD.forEach(r => add(r, 'BUD'));
  rowsFC.forEach(r => add(r, r.open ? 'FC-open' : (r.i >= 12 ? 'ACT' : 'PY-act')));

  const cols = grain === 'sku' ? ['market','bu','class','sku'] :
               grain === 'bu'  ? ['market','bu'] : ['market'];
  const head = [...cols, 'month', 'version', 'units', 'gross_sales_eur', 'net_sales_eur',
                'cogs_eur', 'product_margin_eur', 'margin_rate'];
  const rows = Object.values(bucket).map(b => [...b.key, label(b.i), b.ver,
    b.u.toFixed(1), b.gs.toFixed(2), b.ns.toFixed(2), b.cogs.toFixed(2), b.gm.toFixed(2),
    (b.ns ? b.gm/b.ns : 0).toFixed(4)]);
  dl(new Blob(['\ufeff' + toCsv(head, rows)], { type:'text/csv;charset=utf-8' }),
     `margin-bridge_facts_${grain}.csv`);
}

/* --------------------------- CSV: assumptions ---------------------------- */
export function exportAssumptions(state, meta) {
  const head = ['level','scope','driver','unit','value','set_by'];
  const rows = Object.entries(state.ov).map(([k, v]) => {
    const [lvl, sc, drv] = k.split('|');
    const d = DRIVERS.find(x => x.id === drv);
    return [lvl, sc, d?.name ?? drv, d?.unit ?? '', v, 'user'];
  });
  rows.unshift(['global','ALL','Actuals through','month', meta.cursorLabel,'user']);
  rows.push(['global','ALL','YTD trend carry','%', (state.carry*100).toFixed(0),'user']);
  rows.push(['global','ALL','Phase-in ramp','bool', state.ramp ? '3 months':'immediate','user']);
  rows.push(['global','ALL','Driver correlation','ρ', meta.rho,'user']);
  rows.push(['global','ALL','Confidence k','σ', meta.k,'user']);
  dl(new Blob(['\ufeff' + toCsv(head, rows)], { type:'text/csv;charset=utf-8' }),
     'margin-bridge_assumptions.csv');
}

/* ---------------------------------- PDF ---------------------------------- */
export function exportPdf() {
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing');
                       window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 120);
}

/* --------------------------------- PPTX ---------------------------------- */
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js',
  'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
];
async function loadPptx() {
  if (window.PptxGenJS) return window.PptxGenJS;
  for (const src of CDN) {
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      if (window.PptxGenJS) return window.PptxGenJS;
    } catch { /* try next */ }
  }
  throw new Error('offline');
}

const INK = '1C1B1A', RED = '9E1B1B', GREEN = '2F5D50', STEEL = '8A8B87', RULE = 'D6D6D1';

export async function exportPptx(ctx) {
  const P = await loadPptx();
  const p = new P();
  p.defineLayout({ name:'W16', width:13.333, height:7.5 });
  p.layout = 'W16';
  const { br, kpi, sc, mkts, bus, meta, mc } = ctx;

  const shell = (s, eyebrow, title) => {
    s.background = { color:'F7F7F5' };
    s.addText(eyebrow.toUpperCase(), { x:0.5, y:0.34, w:9, h:0.24, fontSize:9, color:STEEL,
      bold:true, charSpacing:2, fontFace:'Arial' });
    s.addText(title, { x:0.5, y:0.58, w:12.3, h:0.6, fontSize:30, bold:true, color:INK,
      fontFace:'Arial' });
    s.addShape(p.ShapeType.line, { x:0.5, y:7.02, w:12.33, h:0, line:{ color:RULE, width:1 } });
    s.addText(meta.footer, { x:0.5, y:7.06, w:12.33, h:0.3, fontSize:8, color:STEEL });
  };

  /* 1 — headline */
  let s = p.addSlide(); shell(s, meta.eyebrow, 'Forecast headline');
  const cards = [
    ['Net sales', eur(kpi.ns), kpi.nsD], ['Product margin', eur(kpi.gm), kpi.gmD],
    ['Margin rate', pct(kpi.rate), kpi.rateD], ['Units', Math.round(kpi.units/1000)+'k', kpi.unitsD]
  ];
  cards.forEach(([k, v, d], i) => {
    const x = 0.5 + i*3.13;
    s.addShape(p.ShapeType.rect, { x, y:1.5, w:2.95, h:1.5, fill:{ color:'FFFFFF' },
      line:{ color:RULE, width:1 } });
    s.addText(k.toUpperCase(), { x:x+0.18, y:1.66, w:2.6, h:0.24, fontSize:9, color:STEEL,
      bold:true, charSpacing:1.6 });
    s.addText(v, { x:x+0.18, y:1.94, w:2.6, h:0.5, fontSize:26, bold:true, color:INK });
    s.addText(d, { x:x+0.18, y:2.46, w:2.6, h:0.3, fontSize:11,
      color: d.startsWith('−') || d.startsWith('-') ? RED : GREEN });
  });
  s.addText(meta.narrative, { x:0.5, y:3.3, w:12.33, h:1.6, fontSize:14, color:INK,
    lineSpacing:22 });
  s.addText([
    { text:'Likely  ', options:{ bold:true } }, { text:eur(sc.likely)+'      ' },
    { text:'Best  ',   options:{ bold:true, color:GREEN } }, { text:eur(sc.best)+'      ' },
    { text:'Worst  ',  options:{ bold:true, color:RED } }, { text:eur(sc.worst) }
  ], { x:0.5, y:5.1, w:12.33, h:0.4, fontSize:13, color:INK });
  s.addText(`Range is ±${sc.k}σ per driver combined at ρ=${sc.rho}. `
    + (mc.above != null ? `Probability of landing at or above budget: ${(mc.above*100).toFixed(0)}%.` : ''),
    { x:0.5, y:5.5, w:12.33, h:0.4, fontSize:10, color:STEEL });

  /* 2 — bridge as a native editable stacked bar */
  s = p.addSlide(); shell(s, meta.eyebrow, meta.bridgeTitle);
  const labels = [meta.fromLab, ...br.parts.map(x => x.lab), meta.toLab];
  const base = [], up = [], dn = [], tot = [];
  let run = 0;
  labels.forEach((_, i) => {
    if (i === 0) { tot.push(br.from); base.push(0); up.push(0); dn.push(0); run = br.from; return; }
    if (i === labels.length - 1) { tot.push(br.to); base.push(0); up.push(0); dn.push(0); return; }
    const v = br.parts[i-1].v;
    tot.push(0);
    base.push(v >= 0 ? run : run + v);
    up.push(v >= 0 ? v : 0);
    dn.push(v < 0 ? -v : 0);
    run += v;
  });
  s.addChart(p.ChartType.bar, [
    { name:'base',     labels, values:base },
    { name:'Increase', labels, values:up },
    { name:'Decrease', labels, values:dn },
    { name:'Total',    labels, values:tot }
  ], { x:0.5, y:1.45, w:12.33, h:4.6, barGrouping:'stacked',
       chartColors:['FFFFFF', GREEN, RED, INK], chartColorsOpacity:[0, 100, 100, 100],
       showLegend:false, showValue:false, catAxisLabelFontSize:10, valAxisLabelFontSize:10,
       valAxisTitle:'EUR product margin', showValAxisTitle:true, valGridLine:{ color:RULE } });
  s.addText(meta.bridgeNote, { x:0.5, y:6.15, w:12.33, h:0.7, fontSize:10, color:STEEL });

  /* 3 — variance table */
  s = p.addSlide(); shell(s, meta.eyebrow, 'Where the variance sits');
  const head = [{ text:'Business unit', options:{ bold:true } },
    ...MARKETS.map(m => ({ text:m.name, options:{ bold:true, align:'right' } })),
    { text:'Nordics', options:{ bold:true, align:'right' } }];
  const body = bus.map(r => [{ text:r.name },
    ...r.cells.map(v => ({ text:spp(v), options:{ align:'right',
      color: v >= 0 ? GREEN : RED } }))]);
  s.addTable([head, ...body], { x:0.5, y:1.5, w:12.33, fontSize:11, color:INK,
    border:{ type:'solid', color:RULE, pt:0.5 }, rowH:0.42,
    fill:{ color:'FFFFFF' } });
  s.addText('Margin rate change versus budget, percentage points.',
    { x:0.5, y:5.0, w:12.33, h:0.3, fontSize:10, color:STEEL });

  /* 4 — assumption register */
  s = p.addSlide(); shell(s, meta.eyebrow, 'Assumptions behind these numbers');
  const rows = meta.assumptions.length ? meta.assumptions
    : [['—','—','No overrides. Forecast is history on autopilot.','']];
  s.addTable([
    [{ text:'Level', options:{ bold:true } }, { text:'Scope', options:{ bold:true } },
     { text:'Driver', options:{ bold:true } }, { text:'Value', options:{ bold:true, align:'right' } }],
    ...rows.map(r => [{ text:r[0] }, { text:r[1] }, { text:r[2] },
                      { text:r[3], options:{ align:'right' } }])
  ], { x:0.5, y:1.5, w:12.33, fontSize:11, color:INK, rowH:0.36,
       border:{ type:'solid', color:RULE, pt:0.5 }, fill:{ color:'FFFFFF' } });

  await p.writeFile({ fileName: meta.fileName });
}
