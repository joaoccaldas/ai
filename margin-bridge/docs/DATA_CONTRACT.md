# Data contract

Replace the mock generator in `src/data.js` with a controlled extract that supplies one row per market, SKU and month.

## Required source fields

| Field | Meaning |
|---|---|
| `k` | Region code: NA, EU, AP, LA |
| `s` | Stable canonical SKU identifier |
| `bu` | Product line |
| `cls` | Core, Plus or Scale |
| `i` | Model month index |
| `units` | Units |
| `aspG` | Gross ASP per unit in local currency |
| `discR` | On-invoice discount rate, 0–1 |
| `rebR` | Off-invoice credits and usage true-up rate, 0–1 |
| `cogsU` | COGS per unit in local currency |
| `mapped` | Master-data mapping status |

Net sales = `units × aspG × (1 − discR − rebR)`. Keep the two gross-to-net
components separate at source: on-invoice discount and off-invoice rebate/returns
are different decisions with different timing, and the bridge walks them as two
buckets. If your extract only has a single blended deduction, split it on an
agreed rebate share until the source can supply both.

## Production additions

Add source-system identifiers, company code, local currency, actual calendar period, extraction timestamp, data lineage, mapping version and accounting adjustment category. Keep unmapped financial value in the model and expose it as an exception.

## Reconciliation controls

- Net Sales, COGS and Product Margin to official reporting.
- Units to the agreed commercial source.
- Local currency to EUR translation by approved monthly rates.
- Duplicate key and effective-date checks.
- Closed-month immutability.
