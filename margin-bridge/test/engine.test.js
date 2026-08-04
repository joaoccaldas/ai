import { generateAll, CY_START, isCY, label } from '../src/data.js';
import { newState, summarise, buildForecast, stampPY, stampBUD, agg, ovKey } from '../src/model.js';
import { bridge, reconciled } from '../src/bridge.js';
import { sigmas, gradients, scenarios, monteCarlo } from '../src/risk.js';

let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };
const eur = v => '€' + (v/1e6).toFixed(3) + 'm';

const { SKUS, FACTS, BUDGET } = generateAll();
console.log(`\ndataset: ${SKUS.length} SKUs, ${FACTS.length} facts, ${BUDGET.length} budget rows`);
ok(SKUS.length >= 50 && SKUS.length <= 75, `SKU count in range (${SKUS.length})`);
ok(SKUS.every(s => s.code && s.bu && s.cls), 'every SKU has bu + class');

const S = newState();
const H = summarise(FACTS, S.cursor);
const FC = buildForecast(FACTS, H, S).filter(r => isCY(r.i));
const PY = stampPY(FACTS, S);
const BUD = stampBUD(BUDGET, S);

console.log(`\nbase case (actuals through ${label(S.cursor)}):`);
console.log(`  FC  margin ${eur(agg(FC).gm)}   ns ${eur(agg(FC).ns)}   rate ${(agg(FC).rate*100).toFixed(2)}%`);
console.log(`  BUD margin ${eur(agg(BUD).gm)}`);
console.log(`  PY  margin ${eur(agg(PY).gm)}`);

for (const [nm, base] of [['vs BUD', BUD], ['vs PY', PY]]) {
  for (const meas of ['gm','ns']) {
    const b = bridge(base, FC, meas);
    const sum = b.parts.reduce((a,p)=>a+p.v,0);
    console.log(`\n  bridge ${nm} (${meas}): ${eur(b.from)} -> ${eur(b.to)}  Δ ${eur(b.total)}`);
    b.parts.forEach(p => console.log(`     ${p.lab.padEnd(9)} ${(p.v>=0?'+':'')}${(p.v/1e6).toFixed(3)}m`));
    ok(reconciled(b), `${nm}/${meas} reconciles (resid ${b.resid.toExponential(2)})`);
    ok(Math.abs(sum - b.total) < 1, `${nm}/${meas} parts sum to total`);
  }
}

// cursor movement: forecast should converge on actuals as the year closes
console.log('\ncursor sweep (FC margin, EUR m):');
const path = [];
for (let c = 12; c <= 23; c++) {
  const s2 = { ...newState(), cursor: c };
  const hh = summarise(FACTS, c);
  const f = buildForecast(FACTS, hh, s2).filter(r => isCY(r.i));
  path.push(agg(f).gm);
  process.stdout.write(` ${(agg(f).gm/1e6).toFixed(2)}`);
}
console.log('');
ok(path.every(v => v > 0 && isFinite(v)), 'forecast finite at every cut-off');
const spread = (Math.max(...path) - Math.min(...path)) / path[0];
ok(spread < 0.20, `forecast stable across cut-offs (spread ${(spread*100).toFixed(1)}%)`);

// overrides
const S2 = { ...newState(), ov: { [ovKey('all','ALL','price')]: 3 } };
const FC2 = buildForecast(FACTS, summarise(FACTS, S2.cursor), S2).filter(r => isCY(r.i));
ok(agg(FC2).gm > agg(FC).gm, 'portfolio +3% price raises margin');

const S3 = { ...newState(), ov: { [ovKey('mkt','SE','price')]: 3 } };
const FC3 = buildForecast(FACTS, summarise(FACTS, S3.cursor), S3).filter(r => isCY(r.i));
ok(agg(FC3, r=>r.k==='SE').gm > agg(FC, r=>r.k==='SE').gm, 'market override lifts Sweden');
ok(Math.abs(agg(FC3, r=>r.k==='DK').gm - agg(FC, r=>r.k==='DK').gm) < 1, 'market override leaves Denmark untouched');

const S4 = { ...newState(), ov: { [ovKey('all','ALL','price')]: 3, [ovKey('bu','SDA','price')]: 0 } };
const FC4 = buildForecast(FACTS, summarise(FACTS, S4.cursor), S4).filter(r => isCY(r.i));
ok(Math.abs(agg(FC4, r=>r.bu==='SDA').gm - agg(FC, r=>r.bu==='SDA').gm) < 1, 'BU override beats portfolio (SDA held flat)');
ok(agg(FC4, r=>r.bu==='LAU').gm > agg(FC, r=>r.bu==='LAU').gm, 'other BUs still inherit portfolio price');

// mix must be EXACTLY units-neutral now (reallocation, not scaling)
const S5 = { ...newState(), ov: { [ovKey('all','ALL','premium')]: 3 } };
const FC5 = buildForecast(FACTS, summarise(FACTS, S5.cursor), S5).filter(r => isCY(r.i));
const du = Math.abs(agg(FC5).units / agg(FC).units - 1);
ok(du < 1e-9, `premiumisation is exactly units-neutral (${(du*100).toExponential(1)}% drift)`);
ok(agg(FC5).rate > agg(FC).rate, 'premiumisation lifts margin rate');

// price elasticity: a price rise should cost volume, and more with elasticity on
const Sp0 = { ...newState(), elast: 0, ov: { [ovKey('all','ALL','price')]: 5 } };
const Sp1 = { ...newState(), elast: 1, ov: { [ovKey('all','ALL','price')]: 5 } };
const FCp0 = buildForecast(FACTS, H, Sp0).filter(r => isCY(r.i));
const FCp1 = buildForecast(FACTS, H, Sp1).filter(r => isCY(r.i));
ok(agg(FCp1).units < agg(FCp0).units, 'price rise with elasticity sells fewer units than without');
ok(agg(FCp1).units < agg(FC).units, 'price rise with elasticity nets below base volume');

// rebate is a genuine gross-to-net lever, separate from on-invoice discount
const Sr = { ...newState(), ov: { [ovKey('all','ALL','rebate')]: 2 } };
const FCr = buildForecast(FACTS, summarise(FACTS, Sr.cursor), Sr).filter(r => isCY(r.i));
ok(agg(FCr).ns < agg(FC).ns, 'higher rebate accrual reduces net sales');
ok(Math.abs(agg(FCr).units - agg(FC).units) < 1, 'rebate does not move volume');

// risk
const SIG = sigmas(FACTS);
console.log('\nhistorical sigma per driver:');
for (const k in SIG) console.log(`  ${k.padEnd(9)} ${SIG[k].toFixed(2)}`);
ok(Object.values(SIG).every(v => isFinite(v) && v >= 0), 'all sigmas finite and non-negative');

const evalFn = d => {
  const s2 = { ...newState(), ov: Object.fromEntries(Object.entries(d).map(([k,v]) => [ovKey('all','ALL',k), v])) };
  return agg(buildForecast(FACTS, H, s2).filter(r => isCY(r.i))).gm;
};
const grad = gradients(evalFn, S);
const sc = scenarios(grad, SIG, { k:1.28, rho:0.35 });
console.log(`\nscenarios: worst ${eur(sc.worst)}  likely ${eur(sc.likely)}  best ${eur(sc.best)}`);
console.log(`  band ±${eur(sc.band)}  (linear sum would be ±${eur(Object.values(sc.effects).reduce((a,b)=>a+b,0))})`);
ok(sc.worst < sc.likely && sc.likely < sc.best, 'scenario ordering holds');
ok(sc.band < Object.values(sc.effects).reduce((a,b)=>a+b,0), 'quadrature band is tighter than linear stacking');

const mc = monteCarlo(grad, SIG, { n:20000, rho:0.35, target: agg(BUD).gm });
console.log(`  MC p10 ${eur(mc.p10)}  p50 ${eur(mc.p50)}  p90 ${eur(mc.p90)}  P(>=budget) ${(mc.above*100).toFixed(1)}%`);
ok(Math.abs(mc.p50 - sc.likely) / sc.likely < 0.03, 'MC median lands on the forecast');
ok(mc.above >= 0 && mc.above <= 1, 'probability is a probability');

console.log(fails ? `\n${fails} FAILED\n` : '\nall green\n');
process.exit(fails ? 1 : 0);
