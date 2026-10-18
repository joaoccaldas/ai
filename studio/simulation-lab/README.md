# Spatial Simulation Lab (evidence-first)

Public, read-only prototype: `/ai/studio/simulation-lab/`. This is a research **registry/dashboard**, not a new renderer.

## Reuse findings before creating this module
- Existing dynamic effects: `studio/effects/` (10 motion experiments and Playwright CI).
- Existing procedural registry: `studio/shared/procedural-assets/registry.json`.
- Existing world streaming contract: `joaoccaldas/konam/docs/WORLD_STREAMING_V1.md`.
- Existing numerical evidence utility: `joaoccaldas/konam/tools/evidence-metrics.mjs`.
- Existing skill maturity authority: `joaoccaldas/konam/docs/SKILL_EVIDENCE_CONTRACT.md`.
This module adds research *experiment lifecycle and visibility* only, and should eventually consume a canonical spatial-platform research API when accessible.

## Implemented in this PR
- `experiments.json`: 6 **planned** experiments; no invented performance, physics or preference scores.
- `core.mjs`: browser-safe validation of provenance, environment comparability, metric values, review state and duplicate IDs.
- `verify.mjs`: Node validation command.
- `test/core.test.mjs`: deterministic node:test coverage.
- `index.html`: accessible, responsive, read-only filterable evidence portfolio.

Run:
```sh
node studio/simulation-lab/verify.mjs
node --test studio/simulation-lab/test/*.test.mjs
```

## Measurement / claim maturity
- planned/running: methods and protocols, no measured values.
- measured: pinned 40-hex Git commit and scene SHA, device, date, protocol, evidence URI; each metric has values and source URI.
- independently-reviewed: above plus 3+ raters, review protocol and review evidence.
- matched baseline/candidate environments and nonzero baseline are mandatory for an improvement percentage.
- independent status documents *review existence*, not statistical power, scientific truth, buyer preference or product-market fit.

Never infer a VR-comfort pass from browser metrics. Hardware tests, rights-cleared scene references, independent perceptual rating, and financial proof are separate gates.

## Next tested vertical slices
1. Audit canonical `HoldingCo-spatial-platform` when accessible, resolve 48 desktop route QA findings from supplied report before publication.
2. Attach a real rights-cleared architectural fixture, locked camera and asset SHA.
3. Run EXP-01 full mesh vs optimized mesh/baking/impostors/splats at matched device settings and report p50/p95/p99 frame times, bytes, VRAM proxy, production minutes and blind-review results.
4. Use the existing procedural registry for EXP-02, recording repair effort, acceptance, build hash, size and consumer compatibility.
5. Verify persistence/caching/streaming/VR only after EXP-01/02 provide valid receipts.
6. Connect read-only data from the canonical research registry; do not create parallel truth.

No public performance improvement claim is authorized until an independent review of experiment data and rights.
