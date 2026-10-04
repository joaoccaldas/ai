# Gaudí Nexus

Evidence-driven computational architecture entry for the 2026 AI × Gaudí / The Gaudí Nexus competition.

## Core rule
**Truth before form.** No architectural geometry becomes authoritative until its requirement, evidence, and evaluation path are traceable.

## Phase 0 objective
Build the competition operating system before designing the building:
1. Freeze the official brief into machine-readable requirements.
2. Build a verified site/evidence model.
3. Encode the 100-point rubric as a review instrument, not a design generator.
4. Establish deterministic Blender → render → glTF → Three.js pipelines.
5. Create concept experiments only after the site and constraints are real.

## Reuse policy
- `studio-kona`: GIS/site/digital-twin patterns.
- `bellagio`: procedural architecture, Blender, Cycles, evidence-ledger patterns.
- `konam`: Three.js 0.186.1, esbuild, meshoptimizer, glTF tooling, visual/CI validation patterns.
- `jarvisOS`: research/evaluation orchestration only. Human architectural judgment remains authoritative.

## Immediate next milestone
`M0_SITE_TRUTH`: verified Sagrada Família plaza coordinate system, Cerdà block geometry, context massing, view corridors, sun path, and provenance ledger.

## Current build status — 2026-10-04
- Phase-0 contract: built.
- M0 site-truth scaffold: built and testable.
- Real municipal/competition boundary ingestion: **blocked pending authoritative dataset retrieval**.
- Architectural concept generation: intentionally not started.

Run:
```bash
python3 scripts/validate_project.py
python3 scripts/generate_site_truth.py
python3 scripts/check_m0.py
python3 -m unittest discover -s tests -v
```
