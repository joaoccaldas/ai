# Margin Bridge

Driver-based forecasting and price–volume–mix decomposition for a multi-market,
multi-business-unit portfolio. Runs entirely in the browser. No build step, no
backend, no chart library.

Built against a Nordic appliance shape: **4 markets** (Sweden, Denmark, Finland,
Norway), **5 business units** (Laundry, Cooking, Refrigeration, Dishwashing, SDA),
**10–15 SKUs each** at three price points (Silver / Gold / Platinum), modelled in
local currency and consolidated in EUR.

```
npm start           # python3 -m http.server 8080
npm test            # engine assertions, including bridge reconciliation
```

Open `http://localhost:8080`. That serves the **landing page** — a visual
walkthrough of how the forecast and budget are built; the model itself lives at
`app.html` (the "Open the model" button). It must be served, not opened as a
`file://` URL — ES modules need an origin. GitHub Pages works as-is.

The model has two areas. The **monthly margin engine** — **History**, **Plan**,
**Cockpit**, **P&L** (volume to EBIT, by full year / quarter / month, with an EBIT
bridge and a Nordics→market→BU→SKU consolidation drill-down), **Mix**,
**Sensitivity** and **Report**. And the **long-term plan** —

- **MFP · Long-term** — the Miele Financial Plan. Four years of actuals, the 2026
  budget (actual through July) and a five-year plan (2027–2031) you own: net
  sales, product margin, margin % and volume, with **editable future years** and
  a breakdown by **sales channel** (ERT, KRT, Direct Projects, D2C, Customer
  Service) and by **business unit**, each with adjustable mix. Everything
  consolidates — Nordics = Σ channels = Σ (channel × BU) — for every year.
- **Budget 2027** — the long-term plan's 2027 slice spread to months, with a page
  per sales channel showing the monthly budget by business unit that ties back to
  the MFP.

---

## The one rule

**Nothing in the forecast is typed by a human.** Base values are derived from
history. Humans supply *deltas*, and deltas resolve by specificity. That is what
keeps a ~60-SKU × 4-market × 12-month plan maintainable and auditable at the same
time.

---

## 1. How data comes in

`src/data.js` is the only file that knows where numbers come from. Replace
`generateAll()` with a `fetch()` of your extract and nothing downstream changes.

The contract is one flat fact table:

| field | meaning |
|---|---|
| `k` | market id |
| `s` | SKU code |
| `bu`, `cls` | business unit, marketing class — attributes of the SKU, not dimensions |
| `i` | month index, 0–11 prior year, 12–23 current year |
| `units` | volume |
| `aspG` | gross ASP per unit, **local currency** |
| `discR` | on-invoice discount rate, 0–1 |
| `rebR` | off-invoice rebate + returns rate, 0–1 |
| `cogsU` | COGS per unit, local currency |
| `mapped` | false when the SKU has no clean BU/class link in the source system |

Gross-to-net is split in two on purpose: on-invoice discount is a list-price
decision the commercial team controls month to month, while rebates and returns
accrue against volume and settle later. Net sales = `units × aspG × (1 − discR −
rebR)`, and the bridge walks the two as separate buckets so a discount giveaway
is never confused with a rebate accrual.

Three things about that shape are deliberate:

**Marketing class is an attribute, not a dimension.** If class were its own
dimension the mix effect would double-count against the SKU dimension.

**Local currency, not EUR.** Translation happens at aggregation time against a
rate that varies by month and by version. That is the only way FX comes out as
its own bridge bucket instead of contaminating price. Three of the four markets
are non-EUR and two of them are volatile.

**`mapped` is carried, not filtered.** Given a source system with imperfect
product master data, unmapped SKUs stay in the model and get flagged in the SKU
table. Silently dropping them makes the model look cleaner than the business is.

---

## 2. Actual months, budget months, open months

This is the part that makes it a forecasting tool rather than a what-if toy.

The dataset is **three years** of monthly history-plus-forecast: two full prior
years of actuals (a real base to read a trend and a year-on-year walk from) and
the current year we forecast. Three versions then coexist and never overwrite
each other:

- **ACT** — actuals, immutable, from the start of history through `cursor`
- **BUD** — budget, locked before the year started, all 12 current-year months
- **FC** — forecast = ACT for closed months **+** driven for open months

The **History** page surfaces the actuals directly: a year table, the monthly
trend across all three years, and a **year-on-year product-margin bridge on pure
actuals** (prior year vs the year before it) — the same volume / mix / pricing
isolation applied to what already happened, before any assumption is touched.

`cursor` is a single number: the last closed month. Everything to its left is
locked; everything to its right is built from assumptions. On the Plan page it is
a row of twelve buttons.

Moving that cursor is the most useful single interaction in the model. As it
moves right:

- the share of the year already booked rises, and the header says so
- the sensitivity tornado *shrinks* — there is less runway left to move anything
- the risk band on the trajectory chart narrows toward December

That is a real management message rendered as a chart: **the cost of deciding
late.**

### How open months are built

For each open month, each SKU, each market:

```
units  = prior-year same month × driftFactor × (1 + growth) × (1 + elasticity × priceΔ)
aspG   = last 3 closed months' weighted ASP × (1 + price × ramp)
discR  = last 3 closed months' weighted on-invoice discount + (discΔ × ramp)
rebR   = last 3 closed months' weighted rebate + (rebateΔ × ramp)
cogsU  = last 3 closed months' weighted COGS × (1 + cogsInflation × ramp)
```

Then premiumisation runs as a second pass: within each Market × BU × month it
moves a fixed number of units out of Silver into Platinum (or the reverse), so
the group volume is unchanged to the last decimal and only the margin-rate mix
shifts. It is a reallocation, not a scaling — premiumisation is exactly
units-neutral.

- **Anchoring to the same month last year** carries seasonality for free. Cooking
  peaks in November, SDA in January; nobody has to type a seasonal index.
- **`driftFactor`** = `1 + (YTD actual / YTD prior year − 1) × carry`. The `carry`
  dial (0–100%) is the judgement call every forecast cycle actually argues about:
  *does the year-to-date gap persist to December, or does the year revert to last
  year's shape?* Making it an explicit dial beats burying it in a formula.
- **Price elasticity** pulls volume against a price move, by business unit —
  laundry is stickier than small appliances. The dial runs 0 (ignore) to 1.5; at
  0 a price rise drops straight to margin, which always flatters the plan.
- **`ramp`** phases price and cost changes in over three months, because price
  decisions do not land in full on day one.

With every dial at zero, the forecast is *history on autopilot*. That is the
honest starting point, and it is what the assumption register says when it is
empty.

---

## 3. How assumptions get entered — the hybrid

Three levels, one resolution rule:

```
SKU  →  Market × BU  →  BU  →  Market  →  Nordics
```

Most specific wins. Only overrides are stored; everything else inherits.

| Level | Page | What it is for |
|---|---|---|
| **Portfolio** | sliders | The MD's number. One move, whole Nordics. |
| **Market × BU** | 4×5 editable grid | The working level. ~20 cells, one owner each. |
| **SKU** | filterable table | Exceptions only: a launch, a delist, a competitor price move. |

Why hybrid rather than pure top-down or pure bottom-up: several hundred
market-SKU combinations is too many for anyone to plan and defend. One number is too coarse
to be credible in front of commercial. **Market × BU is roughly 20 cells, which
is the level at which a named human can own each one.** SKU sits underneath for
the handful of things per quarter that are genuinely known.

In the grid, a blank cell shows its inherited value in grey; a typed cell turns
red and outlined. You can see at a glance which numbers are decisions and which
are inheritance. Clearing a cell reverts it — there is no such thing as an
un-removable override.

---

## 4. How worst / likely / best are calculated

Nobody types three scenarios. They are derived. `src/risk.js`.

**Step 1 — measure each driver's own volatility over the horizon you are
forecasting.** If seven months are open, the model looks at how much volume, ASP,
on-invoice discount, rebate and COGS actually drifted over *seven-month* windows
in the history it holds — the h-step dispersion, not a one-month number multiplied
by a hand-tuned annualisation factor. The uncertainty is derived, not assumed, and
it narrows as the year closes and there is less horizon left to be wrong about.
Volume is volatile; DKK is pegged and is not. The observed sigma is printed under
every slider, so an input outside it is visible while it is being typed.

**Step 2 — measure the model's response.** One central finite difference per
driver gives EUR of margin per unit of driver. The model is close to linear over
sensible ranges, which makes everything downstream effectively free.

**Step 3 — combine, and do not just add up.** Worst case is *not* every driver at
its worst simultaneously. That is the classic error and it produces numbers
nobody believes and everybody discounts. Drivers are combined in quadrature with
a correlation *structure*, not a single number:

```
band = √( Σ eᵢ² + 2 · Σᵢ<ⱼ ρᵢⱼ · eᵢeⱼ )
```

Drivers sit in two blocks. **Demand** — volume, price, discount, rebate, premium
mix — co-moves in a downturn at `ρ`. **Macro** — COGS inflation, FX — co-moves at
`ρ` too. But across the two blocks the correlation is only `ρ · cross` (default
`cross = 0.4`): a soft landing and input-cost inflation are related, not the same
event. `ρ = 0` treats everything as independent; `ρ = 1` stacks the demand block
linearly. Default **0.35**, and in the shipped dataset the quadrature band comes
out roughly a quarter narrower than naive stacking — defensible rather than
theatrical.

`k` sets how many sigmas: 1.00 ≈ 68% of outcomes, **1.28 ≈ 80%**, 1.64 ≈ 90%.

**Step 4 — Monte Carlo, for the sentence that lands.** 5,000 draws with a demand
factor, a macro factor and a weak common factor over the linearised response —
reproducing the block correlation above exactly. Gives P10/P50/P90 and, more
usefully in a review: *"there is a 23% chance of finishing at or above budget."*
That is a better answer than any single point estimate.

`ρ` and `k` are both dials on the Plan page. When someone in the room says "that
range looks too narrow," you change ρ in front of them rather than arguing.

---

## 5. The bridge

Convention, stated once so nobody has to guess — it is also printed on the
PowerPoint slide:

| Bucket | Measured as |
|---|---|
| Volume | ΔQ at base-period mix and base-period unit margin, continuing SKUs |
| Mix | remainder within volume, at base-period unit economics |
| Price | Δ gross ASP on comparison-period volumes |
| Discount | Δ on-invoice discount per unit on comparison-period volumes, sign flipped |
| Rebate | Δ off-invoice rebate + returns per unit on comparison-period volumes, sign flipped |
| COGS | Δ COGS per unit on comparison-period volumes, sign flipped |
| Lifecycle | net margin of SKUs live in exactly one period — launches minus delists |
| FX | comparison period retranslated, base rates → actual rates |

Volume, mix, price and every rate effect are measured on **continuing** SKUs —
those present with volume in both periods. SKUs that live in only one period have
no unit economics to compare, so a launch or a delist goes to its own **Lifecycle**
bucket instead of hiding inside Mix, where a big launch would otherwise read as
favourable mix with no visibility. Any remaining continuing-SKU nonlinearity lands
in Mix, which keeps the walk exact.

**The seal in the header is not decoration.** It recomputes the residual on every
recalculation and turns red if the buckets do not sum to the delta. `npm test`
asserts it too, for margin and net sales, against budget and against prior year.
Current residual: exactly zero, or ~1e-10 from floating point.

Two bridges, not one: net sales and product margin walk differently, and the
selector at the top switches between them. Clicking any bucket cuts that same
walk by market.

---

## 6. Visuals, and the job each one does

| Visual | Job |
|---|---|
| Waterfall, drillable | **Explanation.** Opens the page, because in a review nobody asks what net sales is — they ask why it moved. **Isolate levers** collapses it onto Volume / Mix / Pricing / Cost / Lifecycle / FX so the three commercial levers stand alone. |
| Price-response curve (**Sensitivity** page) | **The price question.** Margin, net sales and volume as price sweeps a range; marks the margin-maximising price, with the elasticity volume offset made explicit. |
| Scenario compare strip | **Holding options side by side.** Snapshot the current adjustments, then compare each saved scenario's margin, band and P(≥ budget) against the live one. |
| Interactive **P&L** to EBIT | **The whole statement.** Volume → gross sales → net sales → product margin → operating costs → EBIT, by full year / quarter / month, with variance vs budget and prior year and favourable/unfavourable colouring. |
| **EBIT bridge** | **The full variance walk.** Base EBIT to forecast EBIT through the product-margin buckets and then each operating-cost line — ΔEBIT = Δ product margin − Δ opex, reconciled to the cent. |
| **Consolidation drill-down** | **Totals that tie out.** Nordics → market → BU → SKU, every level the exact sum of the one beneath (built from shared leaves, proven in the tests and shown by a consolidation seal). Click any row to open it. |
| **Mix** decomposition + visuals | **BU mix vs profitability.** Splits the blended-margin move into a mix effect and a rate effect, with a net-sales share bar, a per-BU contribution chart (mix vs rate, in points) and a share-vs-margin bubble landscape sized by net sales. |
| KPI strip with split sparklines | Orientation. Solid to the cut-off, dashed after. |
| Trajectory + risk band | Where the year is going, and how confidently. |
| Outcome distribution | Range, and P(≥ budget). |
| Tornado | **Where to spend attention.** Ordered by each driver's own sigma, not by an arbitrary ±10%. |
| Price/margin scatter with observed band | **Assumption validation.** A forecast price outside the range ever actually achieved gets ringed in red. |
| Class mix area | Is the portfolio premiumising or drifting down? |
| Market × BU heatmap | Where to act. |
| Variance table, closed vs open | **What is still fixable**, which is a different question from what went wrong. |

---

## 7. Exports

| Button | What it produces |
|---|---|
| **PowerPoint** | 4 slides. The bridge goes in as a **native editable stacked bar chart**, not a picture — whoever receives the deck can change it. Loads `pptxgenjs` on demand from CDN. |
| **PDF** | Print stylesheet + `window.print()`. No dependency, no drift between screen and paper. |
| **CSV · by SKU / by BU** | Fact extract at the chosen grain, all three versions, EUR, semicolon-delimited with BOM so Excel opens it correctly in a Nordic locale. |
| **CSV · assumptions** | The assumption register: every override, its level, its scope, plus cursor, carry, ramp, ρ and k. |

CSV periods are emitted as load-ready `YYYY-MM`, and prior-year facts appear once
only — no version double-counts prior year in a target that sums across versions.
(A native XLSX workbook export is on the roadmap, not in the build; today the path
out to Excel is the BOM-tagged CSV.)

That last one matters more than it looks. **A forecast without the assumptions
behind it is not reproducible, and it will be argued with.** The register is what
makes the number defensible three weeks later.

---

## 8. Demoing it live

A seven-minute run that does not require anything to be pre-cooked:

1. **Plan → calendar.** "Actuals run through June. 48% of the year is booked;
   52% is still steerable." Click **Sep**. Watch the steerable share collapse.
   Click back to **Jun**.
2. **Portfolio slider — Price +2%.** Go to Cockpit. The price bucket moves; the
   seal still reads zero. Point at the seal.
3. **Grid tab.** Set Cooking × Sweden volume to −8. Only that cell turns red;
   everything else stays grey and inherited. Back to Cockpit, focus **Sweden** —
   the volume bucket moved. Focus **Denmark** — it did not.
4. **Click the FX bucket.** The market split appears underneath. "Norway is
   two-thirds of the FX drag."
5. **Downside preset.** The whole page flips red at once, P(≥ budget) drops to
   0%, and the seal still reads zero. That is the moment people believe the
   model.
6. **Move ρ from 0.35 to 0.7.** The range widens. "If you think these all move
   together, this is what you are underwriting."
7. **Report → PowerPoint.** Open the deck. Right-click the bridge chart, *Edit
   data*. It is a real chart.

The three things that make it credible in the room, in order: the seal reading
zero after every change, one cell turning red while the others stay grey, and
the bridge chart being editable in the deck.

---

## 9. Layout

```
index.html            landing page — the visual method walkthrough
app.html              the model: shell + nav
assets/style.css      tokens, layout, print rules
src/
  data.js             dimensions, calendar, actuals, budget, FX  ← swap this for real data
  mfp.js              long-term plan: annual channel×BU history + editable projection
  model.js            calendar split, driver inheritance, forecast build, opex→EBIT, aggregation
  bridge.js           PVM decomposition + reconciliation + drill + movers
  risk.js             historical sigma, gradients, scenario bands, Monte Carlo
  charts.js           SVG primitives — no chart library
  views.js            the three pages. Renders only; computes nothing.
  exports.js          CSV, PDF, native PPTX
  app.js              state, compute pipeline, routing
test/engine.test.js   assertions, including bridge reconciliation
```

Input, engine, output and reporting are separate on purpose. `views.js` computes
no numbers; `model.js`, `bridge.js` and `risk.js` touch no DOM. The engine runs
under Node with no browser, which is why `npm test` can assert the bridge
reconciles without launching anything.

---

## 10. Not built yet

Honest list, in the order I would do them:

- **Full (non-linearised) Monte Carlo.** The draws still run over the gradient
  response, not the full model resimulated. Fine over ±2σ; it will understate a
  convex tail if pushed to extremes. Production should resimulate the engine.
- **Estimated covariance.** Correlation is now a two-block structure (demand vs
  macro) rather than a single scalar — better, but still management judgement, not
  an estimated covariance matrix from history.
- **Native XLSX export.** The Excel path today is BOM-tagged CSV; a real workbook
  with typed cells and multiple sheets is the obvious next step.
- **Nested drill.** Bucket → market works; bucket → market → BU → SKU does not.
- **Monthly FX curve.** Currently one rate for closed months and one for open,
  per market. Real hedging policy needs a monthly curve.
- **Rolling horizon.** The calendar is now generalised to `HIST_YEARS` prior
  years plus the current one (set to 2), but it is still anchored to whole
  calendar years — a true 18-month rolling view is the next step.
- **Persistent scenarios.** Scenarios can be snapshotted and compared **within a
  session**, but the store is in memory and the assumption register exports
  without re-importing. A saved, named, reloadable scenario library persisted to
  disk or a backend is the obvious next step.

Landed since the first cut: exactly units-neutral premiumisation, a split
gross-to-net (on-invoice discount vs off-invoice rebate) as two bridge buckets, a
per-BU price-elasticity dial, a dedicated lifecycle bucket for launches and
delists, horizon-based volatility, a two-block correlation structure, three
years of history with a year-on-year actuals bridge, a price-sensitivity view,
in-session scenario compare, a product-margin lever isolation, **a landing-page
method walkthrough, an interactive P&L from volume to EBIT with quarter/month
granularity and variance vs budget and prior year, a business-unit mix
decomposition (mix effect vs rate effect) with a contribution chart and a
share-vs-margin bubble, an EBIT bridge, and a Nordics → market → BU → SKU
consolidation drill-down where every level provably sums to its parent**.

---

MIT. Synthetic data throughout — no real figures, from any company, anywhere in
this repository.


## Governance review

See [`docs/CFO_EVALUATION.md`](docs/CFO_EVALUATION.md), [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md) and [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md).
