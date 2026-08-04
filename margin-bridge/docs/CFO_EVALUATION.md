# CFO evaluation

## Decision

**Approve as a controlled Nordic FP&A pilot. Do not yet treat it as a production planning system or system of record.**

The model is materially stronger than a dashboard mock-up. It has a coherent driver engine, version separation, an auditable override hierarchy, exact price-volume-mix reconciliation, uncertainty analysis and useful exports. It is suitable for validating financial definitions, workflow and decision usefulness with a small finance team.

## What is already decision-grade

- Actual, Budget and Forecast coexist without overwriting each other.
- Closed months are immutable; only open months respond to assumptions.
- Forecasts inherit seasonality from prior-year same-month history.
- Assumptions resolve by specificity: SKU, Market × BU, BU, Market, Nordics.
- Product-margin and net-sales bridges reconcile with no residual.
- FX is isolated rather than contaminating price and cost.
- Historical volatility, block-correlated scenario ranges and Monte Carlo probability are visible.
- PowerPoint, PDF and CSV outputs are available.
- Unmapped products remain visible instead of being silently discarded.

## Changes made during this review

These were implemented and are in the committed code and tests — not aspirational.

1. **The engine was committed.** The prior scaffold shipped `index.html` loading `src/app.js`, but `src/` and `test/` had never been committed, so the page 404'd on its own engine. All eight modules and the tests are now in the branch, and a new `test/static.test.js` fails the build if `index.html` ever again references a file that is not on disk.
2. **Premiumisation is now exactly unit-neutral** within each Market × BU × month — a reallocation of units between classes, not a per-class scaling. Drift is 0.0e+0%, asserted in the engine test. The earlier build drifted ~0.3% and the doc had claimed a fix that was not in the code.
3. **Gross-to-net was split** into on-invoice discount and off-invoice rebate/returns, carried as two fact fields and walked as two separate bridge buckets.
4. **Price elasticity** was added as a per-BU dial, so a price move carries a realistic volume response instead of dropping straight to margin.
5. **A lifecycle bucket** was added: launches and delists are separated out of Mix, and volume/mix/price/rate effects are measured on continuing SKUs only.
6. **Scenario volatility is now horizon-based** — h-step historical dispersion over the open-month window, replacing hand-tuned annualisation multipliers.
7. **Correlation is now a two-block structure** (demand vs macro) rather than a single scalar.
8. **Prior-year records are no longer double-counted** across versions in CSV exports, and periods are emitted as load-ready `YYYY-MM`.

Not done, and deliberately not claimed: a native XLSX workbook (the Excel path is BOM-tagged CSV), a CI pipeline, and full non-linearised Monte Carlo. These remain on the roadmap below.

## Material gaps before production

### Governance
- No SSO, role-based access, approvals, locking or named ownership.
- No server-side scenario/version repository. Browser state is ephemeral.
- No immutable audit log, comments or formal sign-off.

### Data integration
- Synthetic data only. SAP/SAC extraction and reconciliation are not implemented.
- No customer, channel, promotion, inventory or sell-out dimensions.
- Product hierarchy changes need effective dating and controlled mapping ownership.
- Forecast snapshots such as FC1, FC2 and FC3 are not persisted as separate historical versions.

### Model risk
- The Monte Carlo engine linearises driver response around the current point. This is appropriate for a prototype, but nonlinear interactions should be simulated through the full model for production.
- Correlation is now a two-block structure (demand vs macro), which is a better management simplification than a single scalar but is still not an estimated covariance matrix from history.
- Gross-to-net is now split into on-invoice discount and off-invoice rebate/returns. Real agreements may still require rebate, bonus, returns and accrual to be modelled as separate mechanics with their own timing, rather than a single off-invoice line.
- Price elasticity is a single per-BU coefficient applied linearly; it does not yet capture cross-elasticity, promotional lift or competitor response.

### Export and security
- PowerPoint generation loads a pinned third-party library from a CDN. A company deployment should vendor and security-review the library internally.
- PDF uses the browser print dialog. A governed server-side PDF service may be required for consistent pagination.
- The Excel path is BOM-tagged CSV, not a native XLSX workbook. Native XLSX can follow once the sheet structure is agreed.

## Pilot gates

1. Reconcile one market and one BU to official SAP/SAC Net Sales, COGS and Product Margin.
2. Explain 100% of the bridge, with any residual below the agreed materiality threshold.
3. Confirm every assumption has an owner, rationale and effective period.
4. Validate CSV loads in a non-production SAC model.
5. Run one forecast cycle in parallel with the existing process.
6. Measure cycle time, manual touches, forecast error and user adoption.

## CFO success criteria

- Forecast cycle time reduced by at least 30%.
- Reconciliation difference below €10k or explicitly explained.
- At least 95% of financial value mapped to governed product master data.
- Every manual override traceable to owner, timestamp and rationale.
- Forecast versions reproducible after close.
- No spreadsheet-only transformation between approved model output and SAC load.
