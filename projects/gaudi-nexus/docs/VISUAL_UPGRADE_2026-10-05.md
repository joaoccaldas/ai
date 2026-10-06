# Living Threshold visual upgrade — 5 October 2026

## Scope and authority

Worktree: `/Users/joao/Developer/gaudi-nexus-visual`.
Branch: `codex/gaudi-visual-quality-20261005`, based on `gaudi-nexus` at `142b440`.
Canonical world configuration and competition approval gates are unchanged.
Original scenes, earlier renders, and proxy objects are retained.

This is an editable visual candidate. It is not a promoted Rev 18, a survey
sign-off, an engineer-certified scheme, or a >=9/10 hero approval.

## Existing work discovery and baseline

**Extend existing**, rather than create another repository. Local `ai` main was
old and had unrelated untracked files; an isolated worktree avoids disturbing it.
The fetched `gaudi-nexus` branch and latest GitHub Actions survey were inspected.

Knowledge Hub MCP was unavailable. The Desktop CLI did not respond, but the
relocated runtime under `Library/Application Support/CaldasAI/services/knowledge_hub/app`
worked. Discovery searched `Gaudi scene` and `Blender rendering` across indexed
projects. Evidence `1fe750a3799364df60559248a9fd48a8e5ba2e682b170e20655b0974187e6a9f`
from HoldingCo proved to concern Kona terrain, not this competition. No Gaudí
reuse was inferred from that match. Project-scoped preflight returned no hits;
that is a coverage limitation, not proof of no prior work.

Current repository files were the stronger reuse evidence:

- `studio2/docs/ARCHITECTURE.md`: streaming, LOD and measured device targets.
- Gaudí `TECH_STACK.md`, `RENDER_PIPELINE.md`, `CANONICAL_SCENE_CONTRACT.md`:
  rendering authority, immutable context, retained proxies and real units.
- Official Spanish briefing PDF: downloaded and extracted; program and jury
  requirements agree with the machine-readable repository contract.

Input scenes:

| Source | GitHub Actions run | SHA-256 |
| --- | --- | --- |
| Registered aligned Rev 17 | 37259743278 | `78cd3253881f07178e7878711a6dc11efced02d7e45e0e5ee5f7ae655ac10fd5` |
| Latest committed survey artifact | 37265636228 | `fbe674a0573bac16e8ca0ae8f4b0546e802b354ff171530685d3135cca9270ce` |

The survey preserves all 1600 non-camera objects from registered Rev 17 under
the geometry/transform signature comparison. The pasted Linux exposure test
script and its frames were not independently available; they were not presented
as archived input evidence.

## Changes

The competition adapter consumes the shared `studio/scene_kit` components.

- Physical-scale slab joints, limestone courses, mineral variation, chestnut
  grain, linen weave, glazed ceramic and brass roughness/anisotropy.
- Clear-sky Barcelona solar direction with explicit location, date, local time,
  UTC offset and exposure. Warm practical lights with visible lenses.
- Thirteen procedural evergreen oaks, three shared mesh variants, actual branch
  hierarchy and individual leaves. Previous overlapping tree representations
  remain hidden in the candidate.
- Civic entourage with shoes, tapered limbs, hair, hands, collars and bags.
  Existing locations are retained; near-camera crops and duplicate occupancy
  are hidden. These are architectural figures, not photoreal scans.
- Twenty open-front stalls in the source footprints. Original solid stall
  blocks hid the counters and produce: they now remain as hidden proxies.
  New kits have metal frames, cabinet doors, handles, back slats, shelves,
  footplates and visible fixings. The primary structure/program is retained.
- Non-destructive edge bevels and food silhouette smoothing.
- Six proposed Mediterranean planted islands with herbs, lavender, low stone
  curbs and repairable timber seats (460 mm height, 550 mm depth). Every footprint
  vertex is checked over the actual plaza mesh; the F3 view axis is kept clear.
  A failed first placement was moved after the mesh check rejected it.
- Supported produce crates replace floating source fruit; original counters
  and fruit are retained and hidden. Counter tops are at 1.10 m, with cabinetry
  beneath. The library includes the display as a separate reusable asset.
- Separate low-poly static collision meshes for 13 trunks, 20 stall kits and
  six seating islands. These carry suggested friction/restitution parameters;
  they require engine integration and route testing before physics acceptance.
- Registered F3 preserved as a comparison camera. Additional candidate views
  show the market, full municipal massing and urban overview.

All original source coordinates/topology and world transforms are checked
again after generation. Material assignments, render visibility and modifiers
change in the derived scene; original input files remain byte-identical.

## Reuse and learning

`studio/scene_kit/contract.json` extends the existing standards. The library
compiler runs without the Gaudí scene and emits standalone GLBs and a Blender
material library. Project-specific cameras, coordinate registration and
approval gates stay in the project adapter.

Reusable components have stable asset IDs, seeds, metre units and original
procedural provenance. glTF is the portable boundary; procedural Cycles graphs
are explicitly labelled as constant PBR approximations in the export.

Lessons captured in source/docs:

1. Blender 5.2.2 renamed Principled anisotropy and sky properties; probe the
   installed API instead of assuming an older build script remains compatible.
2. glTF export must limit itself to the active scene: selection in another
   scene otherwise leaked the startup Cube into standalone asset exports.
3. A rendered camera can be inside geometry. Inspect pixels, not just job status.
4. Opaque massing placeholders can conceal completed program detail. Open kit
   replacements reveal daily use while preserving the original footprints.
5. Pole topology and face winding require geometric checks, beyond glTF syntax.
6. Footplates must fit the nominal kit footprint; the integration check caught
   a 3 cm overrun and the source was corrected.

## Reproduction

Use Blender 5.2.2 LTS and authenticated GitHub CLI for source retrieval.
The pinned artifacts are also retained locally; Actions retention is finite.

```sh
gh run download 37259743278 --repo joaoccaldas/ai --name gaudi-rev16-comparison --dir projects/gaudi-nexus/output/source-rev17
gh run download 37265636228 --repo joaoccaldas/ai --name gaudi-rev16-comparison --dir projects/gaudi-nexus/output/source-latest-survey
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 --python projects/gaudi-nexus/scripts/build_visual_world.py -- --output projects/gaudi-nexus/output/full-world-final-2026-10-05 --width 1600 --samples 96 --views DESIGN MARKET CONTEXT AERIAL F3 --export-glb
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 --python studio/scene_kit/build_assets.py -- --output projects/gaudi-nexus/output/scene-kit-final-v1
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 --python studio/scene_kit/check_components.py
```

Run the downloads into empty folders when reproducing, never over an input you
need to preserve. The adapter rejects unexpected hashes and ancestry differences.
`manifest.json` pins generator source hashes and contains measured render times.

## Acceptance limits

### Measured final candidate

Outputs: `output/full-world-final-2026-10-05`; portable library:
`output/scene-kit-final-v1`. Both are retained locally outside git's binary history.
`review.html` presents five actual 1600 × 900 Cycles renders and the source baseline.
Measured render durations: Design 11.32 s, Market 15.34 s, Context 7.70 s,
Aerial 9.48 s, registered F3 13.85 s. These are render-call durations, not runtime FPS.

Validation: 13 existing repository contract tests, Phase-0 consistency, focused
component integration checks and 10 saved-scene checks passed. Khronos validator
reported zero errors and zero warnings across 12 standalone assets, the full
scene and static collision layer. All review links resolve locally. Both source
`.blend` hashes were checked again after the final build. Receipts and validator
outputs are in the candidate folder. These are agent-run checks, not jury approval.

The full desktop GLB is 49,882,024 bytes; the collision layer is 177,076 bytes.
Neither file size nor an offline GPU render establishes mobile suitability.
Actual scene GFA/program closure remains unresolved by this visual pass; the
existing program allocation contract must not be confused with geometry proof.

The user chose to continue with municipal context. No third-party cathedral
model was imported. A free CC BY model by wareFLO was researched, but its
official download requires authentication; it remains only a candidate.

Municipal massing still lacks the Passion façade's sculptural detail. The plaza
landscape combines existing positions with six proposed planting islands; it
is not a completed municipal tree survey. No structural/CFD/annual-energy claims
follow from these renders.
The full desktop GLB is not a mobile budget pass; low-detail assets are available,
but scene streaming, texture baking, navigation and device FPS need separate
runtime implementation and measurement. The official program, geometry, A1
anonymity and evidence requirements remain governed by existing project gates.
