# NOEMA Audit — Ingestion + Analysis V2 Foundation

Date: 2026-09-10
Status: `IMPLEMENTED_FOUNDATION_WITH_OPEN_GAPS`

## Executive finding

This pass materially strengthens NOEMA's ingestion semantics and robustness diagnostics, but it does **not** yet constitute a complete production source federation or calibrated causal-inference engine.

The dedicated `NOEMA Ingestion and Analysis V2 Contract` passed its first CI run with 14 focused tests plus a separate epistemic-invariant audit. The full `NOEMA CI` also passed after the README integration commit.

## Implemented in this pass

### Richer ingestion primitives

File: `src/noema/evidence_ingestion_v2.py`

Implemented:

- typed assertions: observation, measurement, chronology, entity, relationship claim, interpretation, limitation
- explicit nonbinary observation states including unknown, absent-after-search and preservation-unlikely
- source locator required for every structured assertion
- interpretation requires at least one alternative explanation
- restricted material requires sensitivity flagging
- extraction confidence separated from evidential confidence
- Crossref integrity envelope retaining publication/index/update dates separately
- Crossref correction/retraction/update/relation flags
- multi-extractor reconciliation with disagreement routed to human review
- extractor agreement explicitly prohibited from being treated as truth
- automatic promotion always blocked

### Analysis V2 foundation

File: `src/noema/analysis_v2.py`

Implemented:

- complete-case binary phi summary
- stratified association diagnostics
- unknown-stratum accounting
- leave-one-source-family-out sensitivity
- descriptive observed chronological ordering
- explicit warning that earliest observed evidence is not necessarily earliest historical presence
- robustness profile that declares stronger models still required

The module defines the intended stage ladder through adjusted, spatial, phylogenetic, temporal and causal-candidate analysis, but only the foundation diagnostics above are implemented in this pass.

### Tests

Files:

- `tests/test_evidence_ingestion_v2.py`
- `tests/test_analysis_v2.py`

Focused cases cover:

- correction metadata
- retraction metadata
- publication vs indexing vs update dates
- interpretation-without-alternatives rejection
- restricted-material sensitivity requirement
- extraction/evidential confidence separation
- unknown vs absence semantics
- extractor disagreement review routing
- agreement-is-not-truth invariant
- complete-case association
- unknown strata
- source-family perturbation
- temporal-ordering caveat
- temporal abstention without dates
- required-next-model declarations

Result in dedicated workflow: `14 passed`.

### Documentation and CI

- `docs/INGESTION_ANALYSIS_V2.md`
- `.github/workflows/noema-ingestion-analysis-v2.yml`
- README updated to register new modules, active contract and next milestones

## Audit: what is NOT yet implemented

The following must not be described as production-complete:

1. `StructuredAssertion` persistence into the Postgres/Neon schema.
2. Operational Crossref integrity polling across the existing evidence corpus.
3. Automatic propagation of correction/retraction events to dependent claim review.
4. Europe PMC structured full-text adapter.
5. Full version-pinned D-PLACE federation beyond the controlled benchmark/projections already present.
6. Seshat production adapter/crosswalk.
7. ARIADNE production adapter/crosswalk.
8. Pleiades / World Historical Gazetteer time-aware place reconciliation.
9. Full calibrated radiocarbon posterior handling; current generic scientific primitive remains an approximation interface.
10. Spatial autocorrelation model.
11. Phylogenetic comparative model.
12. Historical contact-network adjustment.
13. Missingness/detectability sensitivity integrated into pattern outputs.
14. Multilevel/hierarchical regression layer.
15. Formal causal identification or calibrated causal probabilities.
16. Gold-standard NOEMA-EVAL based on manually/expert-adjudicated historical cases.
17. Live pattern-candidate pipeline integration with `analysis_v2.robustness_profile`.
18. UI exposure of robustness perturbations and source-family fragility.

## Existing pattern engine assessment

`src/noema/patterns.py` remains useful as Stage 0 pattern nomination. It should be preserved rather than replaced with generic Pearson correlation. It already uses pair-specific complete cases, exact fixed-marginal hypergeometric enrichment, phi effect size, Benjamini-Hochberg correction, provenance-origin dependence exclusion and unresolved-confounder tracking.

V2 diagnostics should sit **after** that nomination layer.

Recommended inference progression:

`nomination -> stratified diagnostics -> adjusted/hierarchical -> spatial -> phylogenetic -> temporal -> competing mechanism models -> sensitivity/replication -> human adjudication`

## Deployment/CI anomaly discovered during audit

A separate workflow named `Legacy Pages Build and Public Verification` failed on an intermediate V2 commit. Its job log showed:

- Pages mode: legacy, source `main/`
- legacy build request accepted with HTTP 201
- latest build returned `status=errored`, `error=Page build failed`
- public Caldas Studio Effects Lab verification independently succeeded `10/10`

This failure is therefore recorded as a legacy Pages build/infrastructure diagnostic anomaly, not evidence that the V2 Python modules or their tests failed. It remains an operational issue worth cleaning up separately so global repository status is less noisy.

## Scientific maturity judgment after this pass

Improved:

- ingestion granularity
- integrity-event awareness
- negative-evidence semantics
- model/extraction epistemic separation
- source-dependence sensitivity foundation
- temporal overclaim protection
- deterministic regression testing

Still limiting:

- source federation breadth at structured-data level
- spatial and phylogenetic adjustment
- chronology calibration
- source-dependence graph integration
- live robustness re-analysis
- externally adjudicated evaluation

## Next build order

1. Durable `StructuredAssertion` schema + persistence + review projection.
2. Crossref integrity watcher over all DOI-backed sources, with dependency impact queue.
3. Europe PMC structured full-text candidate adapter.
4. Full pinned D-PLACE crosswalk into civilization context dimensions.
5. Spatial distance/autocorrelation diagnostics with null/permutation tests.
6. Language-family/phylogenetic adjustment interface.
7. Probabilistic chronology samples and overlap/order calculations.
8. Source-dependence graph and effective evidence families.
9. Seshat + ARIADNE federation.
10. NOEMA-EVAL expert/manual benchmark before any calibrated causal probability UI.

## Release rule

Passing deterministic tests demonstrates that specified contracts hold for tested cases. It is **not** a measured estimate of real-world historical accuracy, completeness or causal validity.
