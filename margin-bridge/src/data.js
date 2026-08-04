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

export const MARKETS = [
  { id:'SE', name:'Sweden',  ccy:'SEK', fxPY:11.42, fxAct:11.06, fxOpen:11.15, w:0.36 },
  { id:'DK', name:'Denmark', ccy:'DKK', fxPY:7.46,  fxAct:7.46,  fxOpen:7.46,  w:0.22 },
  { id:'FI', name:'Finland', ccy:'EUR', fxPY:1.00,  fxAct:1.00,  fxOpen:1.00,  w:0.20 },
  { id:'NO', name:'Norway',  ccy:'NOK', fxPY:11.55, fxAct:11.88, fxOpen:11.80, w:0.22 }
];

/* elas — own-price elasticity of demand (Δunits% per Δprice%). Negative by
   definition; big-ticket built-in appliances are less elastic than small
   domestic appliances, which face more shelf competition. Applied to open
   months so a price move carries a realistic volume response. */
export const BUS = [
  { id:'LAU', name:'Laundry',       price:1180, vol:1.00, elas:-0.80,
    seas:[.95,.92,.98,1.00,1.02,.95,.86,.93,1.05,1.06,1.16,1.12] },
  { id:'COO', name:'Cooking',       price:1450, vol:0.78, elas:-0.70,
    seas:[.86,.84,.92,.95,.98,.92,.80,.88,1.06,1.14,1.38,1.27] },
  { id:'REF', name:'Refrigeration', price:1320, vol:0.72, elas:-0.75,
    seas:[.90,.88,.95,1.00,1.08,1.14,1.05,.98,.96,.98,1.14,.94] },
  { id:'DIS', name:'Dishwashing',   price:980,  vol:0.86, elas:-0.95,
    seas:[.94,.92,.99,1.02,1.00,.94,.84,.92,1.06,1.08,1.18,1.11] },
  { id:'SDA', name:'SDA',           price:395,  vol:2.60, elas:-1.30,
    seas:[1.12,1.02,1.00,.98,.94,.86,.78,.88,1.00,1.06,1.28,1.18] }
];
export const ELAS = Object.fromEntries(BUS.map(b => [b.id, b.elas]));

export const CLASSES = [
  { id:'Silver',   pm:0.70, cog:0.665, col:'#B9BCB6' },
  { id:'Gold',     pm:1.00, cog:0.600, col:'#B08A3E' },
  { id:'Platinum', pm:1.52, cog:0.515, col:'#1C1B1A' }
];

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const N_MONTHS = 24;
export const CY_START = 12;
export const isCY = i => i >= CY_START;
export const monthOf = i => i % 12;
export const label = i => MONTH_NAMES[i % 12] + (isCY(i) ? ' CY' : ' PY');

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
        baseCogsR: cls.cog * (0.96 + r() * 0.08),
        baseDisc: 0.09 + r() * 0.10,                 // total gross-to-net deduction
        rebShare: 0.24 + r() * 0.22,                 // of that, the off-invoice portion
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
      const mktVol   = s.vol * m.w * (0.80 + r() * 0.45) * 140;

      for (let i = 0; i < N_MONTHS; i++) {
        const y = isCY(i) ? 1 : 0, mo = monthOf(i);
        const units = mktVol * bu.seas[mo] * Math.pow(s.trend, y) * (0.88 + r() * 0.24);
        const aspG  = mktPrice * (y ? 1.028 : 1) * (0.985 + r() * 0.030);
        const deduct = s.baseDisc * (y ? 1.05 : 1) * (0.94 + r() * 0.12);
        const discR = deduct * (1 - s.rebShare);     // on-invoice
        const rebR  = deduct * s.rebShare * (y ? 1.06 : 1) * (0.97 + r() * 0.06); // off-invoice
        const cogsU = mktPrice * s.baseCogsR * (y ? 1.019 : 1) * (0.99 + r() * 0.02);
        FACTS.push({ k:m.id, s:s.code, bu:s.bu, cls:s.cls, i, units, aspG, discR, rebR, cogsU,
                     mapped:s.mapped });

        /* Budget: what was locked before the year started — PY plus the plan,
           deliberately a touch optimistic so the variance story has content. */
        if (y === 1) {
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
