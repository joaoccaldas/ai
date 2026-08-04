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
- Historical volatility, correlated scenario ranges and Monte Carlo probability are visible.
- PowerPoint, Excel-compatible workbook, PDF and CSV outputs are available.
- Unmapped products remain visible instead of being silently discarded.

## Corrections made during review

1. Premium mix is now exactly unit-neutral within each Market × BU × month. The original implementation used fixed assumed class shares and could create or remove volume.
2. Prior-year records are no longer duplicated in CSV exports.
3. Export periods now use load-ready `YYYY-MM` values.
4. An Excel-compatible four-sheet workbook was added.
5. CI and static deployment checks were added.

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
- The single correlation parameter is a management simplification, not an estimated covariance matrix.
- Launches and delists fall into Mix to preserve reconciliation. They should eventually be shown as their own lifecycle bucket.
- Gross-to-net currently uses one discount/rebate rate. Real agreements may require separate rebate, bonus, returns and accrual mechanics.

### Export and security
- PowerPoint generation loads a pinned third-party library from a CDN. A company deployment should vendor and security-review the library internally.
- PDF uses the browser print dialog. A governed server-side PDF service may be required for consistent pagination.
- The Excel-compatible output is SpreadsheetML XML, not native XLSX. Native XLSX can follow after the workbook structure is agreed.

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
