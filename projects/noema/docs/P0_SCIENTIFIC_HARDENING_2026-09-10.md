# NOEMA P0 Scientific Hardening — 2026-09-10

Status: `PR_VALIDATION`

## Objective

Make automation truth and scientific progress independently auditable before expanding NOEMA's causal inference surface.

## Landed in this change

1. `data/automation-registry-v2.json` becomes the canonical automation inventory.
2. Every current `.github/workflows/noema-*.yml` workflow is explicitly registered and cron schedules are reconciled in tests.
3. `src/noema/epistemic_stage.py` defines a single epistemic ladder shared by workflow observability and future public research outputs.
4. Run manifests may report `max_epistemic_stage`, while discovery/triage/media jobs remain valid with `null` because workflow success is not evidence.
5. Automation Pulse reports both the configured authority ceiling and any run-reported epistemic stage.
6. `data/evals/noema-eval-001.json` introduces adversarial invariant tests without pretending to be a historical gold standard.
7. The legacy `automation-contract-v1.json` is retained temporarily as a deprecated compatibility mirror.

## Scientific ladder

`OBSERVED -> REVIEWED -> NOMINATION -> STRATIFIED -> ADJUSTED -> SPATIAL -> PHYLOGENETIC -> TEMPORAL -> CAUSAL_CANDIDATE`

`CAUSAL_SUPPORTED` is deliberately absent. It requires a domain-appropriate identification strategy plus human scientific adjudication and must not be produced automatically by this ladder.

## Acceptance gates

The change is acceptable only if repository CI demonstrates that:

- every current NOEMA workflow is registered exactly once;
- registered cron schedules match workflow source;
- recurring tasks retain bounded authority;
- epistemic stage values are canonical;
- the existing cognition, publication, missingness and anti-retrodiagnosis guardrails still pass;
- existing NOEMA tests remain green.

## Next P0/P1 work after this PR

1. Verify and promote database migrations 001-006 on the canonical runtime database.
2. Build the first manually adjudicated `NOEMA-EVAL` domain corpus using real sources and gold assertions.
3. Migrate remaining compatibility consumers from automation contract v1 to registry v2, then retire v1.
4. Add explicit epistemic stage fields to public analysis projections and render them in the Observatory/Research UI.
5. Add a source-dependence graph, probabilistic chronology, spatial models, phylogenetic models, contact-network models and missingness sensitivity before exposing stronger relationship confidence.
