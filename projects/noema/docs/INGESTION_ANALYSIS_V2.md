# NOEMA Ingestion + Analysis V2

Status: `ACTIVE_GUARDRAIL`

## Objective

Increase source breadth and analytical power without allowing ingestion volume, model agreement, statistical significance, or visual salience to masquerade as historical truth.

## Ingestion contract

NOEMA V2 decomposes sources into typed assertions rather than treating a paper or dataset as one indivisible evidence object.

Assertion kinds:

- `OBSERVATION`
- `MEASUREMENT`
- `CHRONOLOGY`
- `ENTITY`
- `RELATIONSHIP_CLAIM`
- `INTERPRETATION`
- `LIMITATION`

Every assertion requires source provenance and a source locator. Interpretations require alternative explanations. Restricted assertions must be marked culturally/sensitivity relevant. All newly extracted assertions remain candidate-only and cannot auto-promote.

### Absence semantics

Absence is not binary. Supported states distinguish:

- `PRESENT`
- `ABSENT_AFTER_SEARCH`
- `UNKNOWN`
- `NOT_RECORDED`
- `NOT_APPLICABLE`
- `CONTESTED`
- `PRESERVATION_UNLIKELY`
- `SOURCE_UNAVAILABLE`

This prevents non-recovery and missingness from becoming historical absence.

### Confidence semantics

`extraction_confidence` answers: did the extractor correctly recover what the source says?

`evidential_confidence` answers: how strongly should the assertion contribute to an adjudicated evidential assessment?

They are deliberately separate quantities.

### Literature integrity

Crossref records are normalized with publication, indexing and deposit/update timestamps kept separately. Relations, licenses, corrections, retractions and other update events are retained as integrity metadata. An update is not itself evidence for or against the historical claim, but it can trigger reassessment of dependent claims.

### Multi-extractor reconciliation

Agreement among extractors is not truth. Disagreement creates human-review work and cannot auto-promote. Agreement can reduce extraction uncertainty only after provenance and source-text checks.

## Analysis ladder

1. `NOMINATION` — exact fixed-marginal enrichment / effect size / BH correction from current pattern engine.
2. `STRATIFIED` — rerun association within relevant region, language-family, chronology or other strata.
3. `ADJUSTED` — multivariable/hierarchical model with explicit covariates.
4. `SPATIAL` — account for geographic autocorrelation.
5. `PHYLOGENETIC` — account for shared ancestry using appropriate cultural/linguistic phylogenies.
6. `TEMPORAL` — establish probabilistic ordering or event-time structure where data permit.
7. `CAUSAL_CANDIDATE` — compare competing mechanisms after the preceding diagnostics.

No stage automatically becomes `CAUSAL_SUPPORTED`. That status requires a domain-appropriate identification strategy and human scientific adjudication.

## Robustness diagnostics implemented in V2 foundation

- pairwise complete-case binary association summary
- stratified association summaries
- leave-one-source-family-out sensitivity
- descriptive chronological direction
- explicit next-model requirements

These are diagnostics, not substitutes for spatial, phylogenetic, hierarchical, missingness or calibrated chronological models.

## Source expansion order

Recommended priority:

1. Crossref integrity/update enrichment
2. Europe PMC structured full text where licensing permits
3. full version-pinned D-PLACE federation
4. Seshat polity-time federation
5. ARIADNE archaeological context federation
6. historical place reconciliation via Pleiades / World Historical Gazetteer
7. paleoclimate and aDNA domain-specific projections

The source registry remains authoritative for whether an adapter is active, planned or discovery-only.

## Audit principles

- More sources do not automatically increase independent evidence.
- Citation count is not evidential strength.
- Extractor agreement is not truth.
- Earliest observed evidence is not necessarily first historical presence.
- Correlation does not establish diffusion, ancestry or causation.
- Statistical significance without effect size, comparable denominator and multiplicity handling is insufficient.
- Visualizations may not imply a relationship that the graph has not earned.
- Unknown remains a valid result.
