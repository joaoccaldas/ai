/* ============================================================================
   data.js — the only file that knows where numbers come from.
   Swap generateAll() for a fetch() of your SAP/SAC extract and nothing
   downstream changes, as long as the shapes below are respected.

   FACT   { k, s, bu, cls, i, units, aspG, discR, rebR, cogsU }   local currency
   i      month index 0..23   (0-11 = PY, 12-23 = CY)
   aspG   gross ASP per unit, local
   discR  on-invoice discount rate, 0..1        (shown on the invoice line)
   rebR   off-invoice rebate + returns rate, 0..1 (accrued below the line)
   cogsU  COGS per unit, local

   Gross-to-net is split because the two halves behave differently: on-invoice
   discount is a list-price decision the commercial team controls month to
   month, while rebates and returns accrue against volume and settle later.
   Net sales = units × aspG × (1 − discR − rebR). The bridge walks them as two
   separate buckets so a discount giveaway is never confused with a rebate accrual.
   ========================================================================== */

const seed = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* Helioforge — fictional cloud-AI portfolio. Reporting currency is EUR.
   Regions bill in USD, EUR, JPY and BRL; weights are the synthetic sales mix.
   fx* is local currency per 1 EUR. */
export const PORTFOLIO = 'Helioforge';
export const GROUP = 'Global';

export const MARKETS = [
  { id:'NA', name:'North America', ccy:'USD', fxPY:1.08, fxAct:1.04, fxOpen:1.07, w:0.44 },
  { id:'EU', name:'Europe',        ccy:'EUR', fxPY:1.00, fxAct:1.00, fxOpen:1.00, w:0.28 },
  { id:'AP', name:'Asia Pacific',  ccy:'JPY', fxPY:158,  fxAct:164,  fxOpen:161,  w:0.18 },
  { id:'LA', name:'Latin America', ccy:'BRL', fxPY:5.70, fxAct:6.05, fxOpen:5.95, w:0.10 }
];

/* elas — own-price elasticity of demand (Δunits% per Δprice%). Negative by
   definition. Multi-year model-hosting commits are stickier than usage packs
   and developer eval seats, which switch more easily. Applied to open months
   so a price move carries a realistic volume response.
   cogK scales class COGS: usage and eval carry more hosting cost than
   dedicated platform seats. price is a gross EUR-equivalent plan unit. */
export const BUS = [
  { id:'INF', name:'Inference API', price:1200, vol:1.80, elas:-1.05, cogK:1.15,
    seas:[.98,.96,1.02,.99,1.00,1.04,.94,.92,1.03,1.04,1.06,1.02] },
  { id:'APP', name:'App Platform',  price:2600, vol:0.70, elas:-0.55, cogK:0.85,
    seas:[1.08,.96,1.06,.97,.98,1.04,.90,.88,1.00,1.02,1.06,1.05] },
  { id:'AGT', name:'Agent Runtime', price:9400, vol:0.28, elas:-0.75, cogK:0.95,
    seas:[.94,.92,1.04,.96,.98,1.08,.86,.88,1.02,1.06,1.12,1.14] },
  { id:'HST', name:'Model Hosting', price:39000, vol:0.09, elas:-0.45, cogK:0.80,
    seas:[.90,.88,1.02,.94,.98,1.16,.84,.86,1.04,1.08,1.14,1.16] },
  { id:'EVL', name:'Eval & Data',   price:780,  vol:1.10, elas:-1.25, cogK:1.35,
    seas:[1.14,1.02,.98,.96,.94,.90,.84,.88,1.08,1.02,1.10,1.14] }
];
export const ELAS = Object.fromEntries(BUS.map(b => [b.id, b.elas]));

/* Commercial tiers. pm is an ASP multiplier; cog is COGS as a share of gross
   ASP before the business-unit cogK. Software COGS is hosting and support,
   not a retail bill of materials. */
export const CLASSES = [
  { id:'Core',  pm:0.72, cog:0.34, col:'#B9BCB6' },
  { id:'Plus',  pm:1.00, cog:0.22, col:'#B08A3E' },
  { id:'Scale', pm:1.65, cog:0.15, col:'#1C1B1A' }
];

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/* Calendar: HIST_YEARS full years of monthly actuals, then the current year we
   forecast. Two prior years give a real historical base — a year-on-year walk,
   a trend to read, and enough series length for honest volatility. */
export const HIST_YEARS = 2;
export const N_MONTHS = 12 * (HIST_YEARS + 1);
export const CY_START = 12 * HIST_YEARS;
export const isCY = i => i >= CY_START;
export const monthOf = i => i % 12;
export const yearOf = i => Math.floor(i / 12);               // 0 … HIST_YEARS
/* years before current: 0 = CY, 1 = PY (prior), 2 = PY-2 … */
export const yearsBack = i => HIST_YEARS - yearOf(i);
export const label = i => {
  const yb = yearsBack(i);
  return MONTH_NAMES[i % 12] + ' ' + (yb === 0 ? 'CY' : yb === 1 ? 'PY' : `Y-${yb}`);
};
/* the immediately-prior year's index for the same month */
export const priorYearStart = CY_START - 12;

/* --------------------------------- build --------------------------------- */
function buildSkus(r) {
  const skus = [];
  for (const bu of BUS) {
    const n = 10 + Math.floor(r() * 6);              // 10–15 SKUs per BU
    for (let j = 0; j < n; j++) {
      const x = r();
      const cls = x < 0.42 ? CLASSES[0] : x < 0.80 ? CLASSES[1] : CLASSES[2];
      skus.push({
        code: `${bu.id}-${1000 + j * 7 + Math.floor(r() * 6)}`,
        name: `${bu.name} ${cls.id} ${String.fromCharCode(65 + j)}`,
        bu: bu.id, cls: cls.id,
        basePrice: bu.price * cls.pm * (0.86 + r() * 0.28),
        baseCogsR: Math.min(0.72, cls.cog * (bu.cogK ?? 1) * (0.96 + r() * 0.08)),
        baseDisc: 0.03 + r() * 0.07,                 // commit discount / marketplace fee
        rebShare: 0.18 + r() * 0.16,                 // of that, credits and usage true-ups
        vol: bu.vol * (0.55 + r() * 0.95) / n * 10,
        trend: 0.955 + r() * 0.13,
        mapped: r() > 0.035                          // masterdata gaps, on purpose
      });
    }
  }
  return skus;
}

export function generateAll() {
  const r = seed(20260804);
  const SKUS = buildSkus(r);
  const FACTS = [];
  const BUDGET = [];

  for (const m of MARKETS) {
    for (const s of SKUS) {
      const bu = BUS.find(b => b.id === s.bu);
      const localFx = m.ccy === 'EUR' ? 1 : m.fxPY;
      const mktPrice = s.basePrice * (0.93 + r() * 0.15) * localFx;
      // Volume scalar is chosen so the current-year book sits near the 2026
      // long-term plan (about €140m), not a separate retail-sized history.
      const mktVol   = s.vol * m.w * (0.80 + r() * 0.45) * 90;

      for (let i = 0; i < N_MONTHS; i++) {
        const y = yearOf(i), mo = monthOf(i);        // 0 … HIST_YEARS, year over year
        // each year compounds a little price, cost and discount inflation, so the
        // history has a real trend to read rather than two flat blocks.
        const units = mktVol * bu.seas[mo] * Math.pow(s.trend, y) * (0.88 + r() * 0.24);
        const aspG  = mktPrice * Math.pow(1.024, y) * (0.985 + r() * 0.030);
        const deduct = s.baseDisc * Math.pow(1.03, y) * (0.94 + r() * 0.12);
        const discR = deduct * (1 - s.rebShare);     // on-invoice
        const rebR  = deduct * s.rebShare * Math.pow(1.04, y) * (0.97 + r() * 0.06); // off-invoice
        const cogsU = mktPrice * s.baseCogsR * Math.pow(1.017, y) * (0.99 + r() * 0.02);
        FACTS.push({ k:m.id, s:s.code, bu:s.bu, cls:s.cls, i, units, aspG, discR, rebR, cogsU,
                     mapped:s.mapped });

        /* Budget: what was locked before the year started — prior year plus the
           plan, deliberately a touch optimistic so the variance story has content. */
        if (isCY(i)) {
          const p = FACTS[FACTS.length - 1 - 12];    // same month, prior year
          BUDGET.push({ k:m.id, s:s.code, bu:s.bu, cls:s.cls, i,
            units: p.units * 1.035,
            aspG:  p.aspG  * 1.030,
            discR: p.discR * 0.98,
            rebR:  p.rebR  * 0.99,
            cogsU: p.cogsU * 1.015,
            mapped: s.mapped });
        }
      }
    }
  }
  return { SKUS, FACTS, BUDGET };
}

export const FX = Object.fromEntries(MARKETS.map(m =>
  [m.id, { py:m.fxPY, act:m.fxAct, open:m.fxOpen }]));
