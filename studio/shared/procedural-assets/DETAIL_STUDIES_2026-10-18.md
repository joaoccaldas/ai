# Three environment detail studies — 18 October 2026

These are new procedural candidates in the existing library, not production or photoreal approvals. Originals, intermediate exports and failed checks remain available. No Blender image rendering was run on this Mac; geometry exports used the installed Blender 5.2.2 LTS, and visual inspection used the Atlas's existing Three.js inspector.

## Brief and results

| Candidate | Intended use and actual change | Measured output | Review judgment |
|---|---|---|---|
| `wall_mirror_gallery` | Reuse the existing ogee frame; add 360 individually modelled gilt beads, preserve separate mirror/backing materials and wall-centred anchor. | 456 → 17,736 triangles; final GLB 2,781,120 bytes including generated textures. | Beading is visible in the matched front view. Reflective PBR is present; a live room reflection is not demonstrated. |
| `reflecting_basin_fluted` | Adapt the existing turned basin with a finer circular outline and 48 shallow wall flutes; keep the upward water face separate. | 6,622 triangles in both comparison versions; final GLB 2,316,684 bytes. | Fluting is subtle at the review distance. Do not call this a major visual gain. Water remains a static inspection material. |
| `vase_fluted` | Create a hollow porcelain vessel using the existing lathe helper, 48 flutes and a separate brass lip; refine the initially coarse shoulder with the existing spline helper. | Plain control 13,248 triangles / 247,560 bytes; refined candidate 46,080 triangles / 838,540 bytes. | The flutes and smoother silhouette are visible. The extra geometry has a real cost; target-device performance and a consuming room remain untested. |

The first two families already existed. The vessel extends this same library; it does not create another generator registry. Cloud silhouettes and dawn/atmosphere code remain existing separate families. No new realistic-cloud or complete-sky capability is claimed.

## Fixes and failures

1. **Texture seed reuse.** The exporter previously cached surface materials by base material and texture kind, omitting the seed. Add the seed to that identity. The final batch contains different embedded colour-image hashes for gilt seeds 1/17 and stone seeds 1/27. The old failure was identified from code; a separate historical binary reproduction was not run.
2. **Zero-area backing faces.** A zero-bevel slab built duplicate edge/front rings. The first source geometry check failed although Khronos validation passed. The shared `panel` helper now emits one wall band for a plain slab. Keep that failed check; file-format validity is not a full geometry test.
3. **An incorrect test assumption.** A subsequent bound check assumed a mathematically exact rectangle, ignoring the existing spline's small moulding overshoot. The corrected check requires added beads to stay inside the actual unchanged plain-frame footprint. This was a test correction, not a claimed product improvement.
4. **Back-facing inspection.** Generic framing showed a mirror's backing. The registry/exporter now carry an explicit glTF-space `inspection_direction`; the existing inspector honors a finite, unambiguous hint. The original generic direction remains the fallback. Both compared versions use the same authored front view.
5. **Stale catalogue source.** Knowledge read an older pinned 66-entry recipe list. Its projection now merges the current source registry, overriding matching definitions while retaining eight earlier-only definitions. It has 79 distinct definitions: 71 current and eight historical. Those are not 79 finished or accepted objects.
6. **Incomplete model matching.** Associations now compare generator module/function, surface definitions, seed, UV scale and viewing hint as well as parameters, units, axes, anchor and output hash. The current registry's unit-description form is recognized explicitly. Wrong units/axes and changed seeds cannot silently borrow an earlier preview.
7. **Lost asset addresses.** A background Library selection replaced an open object's deep link. The callback now checks navigation ownership and leaves an asset address to its own route. All six matched comparison URLs retained their actual source identity.

## Evidence and repeatable procedure

All batch folders below are under `projects/gaudi-nexus/output/environment-kit-2026-10-18/`. They are private, ignored outputs and are never overwritten:

- `baseline/`, `detail-candidate/`, `detail-reviewed/`: early attempts, including failed source-check logs.
- `baseline-final/`: the three plain controls with authored viewing directions; its `registry-source.json` preserves their parameters.
- `detail-final/`: seven exports including reference objects and the detailed variants; its `iteration-one-source.patch` preserves the first vessel implementation before the curve refinement.
- `vase-refinement/`: the final spline-profile vessel, manifest, batch receipt, validation and geometry-check log.

Each executed batch's `batch-receipt.json` pins exporter, registry and source-module hashes, Blender version, elapsed time, exact IDs and output hashes. `productionAccepted` stays false. The final ten comparison/reference exports and the refined vessel all have Khronos reports with **zero errors and zero warnings**. Source geometry checks cover finite coordinates/positive face areas, mirror footprint, unchanged upward water surface, deterministic vase geometry/base/lip and rejected excessive detail density. These are bounded checks, not a watertightness, manufacture, optical or whole-library certification.

Use the existing `skills/spatial-asset-production/scripts/batch_assets.py` planner/runner from the company repository. Select known IDs and a fresh private directory. Do not use `--sheet` on this Mac. After export, use the existing `studio/scene_kit/validate_glb.cjs` with the declared validator dependency and run:

```sh
blender --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python studio/shared/procedural-assets/check_environment.py
```

For a new seed, run both seeds in the same batch and compare embedded image hashes; separate Blender processes would conceal a shared-cache defect. For a new outline, keep the comparison camera, environment, viewport and source dimensions fixed. The Atlas receipt retains six 980 × 450 model-view captures from a 1440 × 1000 CSS viewport/DPR 1, plus the refined vessel capture. Screenshot submission proves a displayed frame, not a cold-start or steady-state performance result.

Observed batch wall times include process startup and geometry export: 1.907 s for three plain controls, 6.624 s for seven detailed/reference exports, 1.391 s for the single refined vessel. Different batch composition and a single run prevent a speedup or throughput claim. There are **zero production-accepted assets** in this pilot, so cost per accepted asset and commercial delivery margins remain unmeasured.

## Reuse and next acceptance

Potential reusable work includes the parameterised geometry, generated surface workflow, source identity checks and documented failure fixes. A bounded next delivery is a small asset pack placed in an existing room, with agreed materials, reflection behavior and target devices. This is a proposed service format, not an existing customer result. Original procedural construction was inspected for these candidates; collection-wide licensing and a customer's intended use still require review.

Next: review close-ups with a human art director; integrate actual mirror/water behavior in one existing room; compare the 13k/46k vessel versions at intended viewing distances; record complete-frame GPU timing, loading, memory and phone behavior; accept or reject each derivative individually. Do not replace those gates with the words “hyper-detailed,” file size, a validator pass or this agent's own visual judgment.
