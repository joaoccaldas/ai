# NOEMA Analysis V3 Audit — 2026-09-10

Status: `IMPLEMENTED_ROBUSTNESS_FOUNDATION_WITH_OPEN_MODELS`

## Executive finding

Analysis V3 materially improves NOEMA's ability to detect fragility in descriptive cross-cultural associations. It does not implement causal inference and must not be presented as spatially or phylogenetically adjusted causal estimation.

## Implemented

- great-circle geographic distance calculation
- geography-required spatial diagnostics
- local-neighbor joint-state agreement vs global agreement
- deterministic geocoded permutation screening for phi
- language-family stratification and leave-one-family-out sensitivity
- model-survival profile combining baseline association, regional stratification, source-family perturbation, spatial diagnostics and language-family sensitivity
- explicit fragility flags
- explicit abstention for insufficient geographic or language-family coverage
- no aggregate magic score
- automatic causal promotion prohibited everywhere

## Scientific interpretation

The spatial layer is a diagnostic screen. It can reveal that nearby observations resemble each other unusually often, but it does not identify diffusion, migration or environmental causation.

The language-family layer is a sensitivity analysis. It is not a phylogenetic comparative model and does not establish inheritance.

The permutation screen provides a reproducible null comparison for the observed binary association among geocoded observations, but does not model spatial covariance, historical contact, temporal dependence or linguistic phylogeny.

## Required next models

1. explicit spatial covariance model such as spatial lag/error or Gaussian-process structure
2. explicit phylogenetic comparative model using versioned language/cultural trees
3. historical contact-network adjustment
4. probabilistic chronology rather than point-date ordering
5. missingness/detectability sensitivity integrated into analysis outputs
6. multilevel adjusted regression with source-family and regional structure
7. out-of-sample replication across independently harmonized cohorts
8. expert/manual NOEMA-EVAL before calibrated causal probability UI

## Release rule

Passing Analysis V3 CI proves only that tested contracts and epistemic safeguards behave as specified. It is not an empirical estimate of historical accuracy and does not license a claim of causal identification.
