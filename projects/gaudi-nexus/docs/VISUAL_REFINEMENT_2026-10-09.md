# Municipal scene refinement — 9 October 2026

This is a derived visual candidate, not canonical promotion or a competition quality approval. Upstream `gaudi-nexus` at `9a46fbb` has been merged with the existing scene kit and contact fixes preserved.

## Evidence and reuse

The first remote pilot, [run 37431307311](https://github.com/joaoccaldas/ai/actions/runs/37431307311), completed in about five runner minutes. The three images were inspected. The portrait F3 cropped the cathedral and barely showed the proposal; broad procedural puddle stains overwhelmed the plaza; saturated mosaic fins dominated; the market interior lacked activity. Technical completion did not pass visual review.

The current source is the checksum-pinned Rev18 municipal candidate from [run 37567330603](https://github.com/joaoccaldas/ai/actions/runs/37567330603), artifact `11459725641`, SHA-256 `2cef25d126a17cd653422d778367c73561093972fc8eace190114b80a7584875`. It remains unpromoted. Site levels, street furniture and tree inventory remain open. Upstream sightline and seasonal shadow evidence do not constitute annual environmental certification.

Reuse/extend: `studio/scene_kit` supplies metre-based materials, three seeded oak variants, shared tree meshes and batched seating gardens. `studio/shared/procedural-assets` supplies figures, market assets, cloth sag and bounded support-contact correction. Knowledge Hub discovery evidence `50441e3fa5100d27ab1daa78c1616bd68411f541c6cb66bfaa43701ddc2cf902` identifies the existing project lineage; current files and actual headless checks establish what works. No parallel asset library was created.

## Changes

- Dry civic stone replaces the procedural puddle field. Asphalt is distinct from the plaza.
- Honey ceramic glaze, warm mineral piers and terracotta vaults form a restrained palette. Municipal context uses quiet mineral massing; invented cathedral detailing stays disabled.
- Six seating gardens and thirteen oak instances use three shared variants. These are design proposals, not a surveyed tree inventory.
- Ten additional market figures occupy fixed world positions, with 1 mm static ground contact. People remain illustrative; no crowd simulation or foreground photorealism is claimed.
- `HERO_ARRIVAL`, `MARKET_AISLE` and `PLAZA_OBLIQUE` complement the preserved F3. The arrival eye is 1.56 m, lens 32 mm. Camera projection diagnostics are geometric checks, not proof of occlusion or quality.
- All four remote views load one prepared scene and record the same candidate hash. Representative light uses 21 September 2026 at 18:30 CEST, Barcelona coordinates; computed altitude 13.6°, azimuth 257.5°. This is a declared design condition, not observed weather.

## Validation before remote rendering

Blender 5.2.2 prepare-only assembly completed in 3.82 seconds on the Mac: zero render invocations; all 1,600 original geometry/transform signatures preserved; 80 counter-fruit support contacts preserved; all ten added figure contacts settled. Six garden footprints fit existing plaza geometry. The source binary checksum remains unchanged.

All 13 project contract tests and Phase-0 validation pass. Nine asset geometry/contact checks and seven floor/stair checks pass. These establish limited geometric invariants; they do not certify structure, accessibility, runtime frame rate or hero quality.

The remote job is capped at 55 minutes, within the previously approved 65-minute total runner allowance after the approximately five-minute first pilot. No image rendering is permitted on the Mac. Image results and failures must be inspected before any final-resolution pass.

## Architectural coordination remains separate

`scripts/build_architecture_coordination.py` demonstrates measured floor plates, real stair voids, four switchback stair cores and two hollow lift reservations. Its prototype envelope is 1,736 m²; actual horizontal slab surface after holes is 1,644.295745 m². Neither is a certified programme GFA. The prototype GLB has 30 nodes/meshes, 269,084 bytes, zero Khronos errors or warnings.

The prototype detects a material source conflict: a 4.5 m upper floor cannot fit below the existing approximately 5 m roof underside. Twenty 3 m stall frontages also do not fit alongside the 11 m service head and end stairs; twenty 2.5 m modules fit the prototype. The current source/configuration remains unchanged. Do not portray this coordination study as the resolved architectural scheme.

Remaining competition work includes programme/GFA reconciliation, site truth promotion, structural and annual environmental evidence, final visual approval, A1/A4 composition and anonymous release checks. No winning score is asserted.

## Shared asset intake validation

The six upstream props initially failed export because ten materials were missing from the catalogue. Their definitions are now supplied. All 58 registered assets export: 2,058,604 bytes combined, 49,406 triangles, zero Khronos errors or warnings. Build metadata matches GLB hashes and includes metre units and anchors. The shared scene-kit exporter now respects per-object material overrides while sharing identical unmodified meshes; six direct export checks pass and restore source selection. These are portable geometry/PBR approximations; procedural Cycles textures are not baked.

The [organizer page](https://fundacionantoniogaudi.org/concurso-de-arquitectura-y-diseno-ai-x-gaudi/) was checked on 9 October and still lists 16 December 2026 as the submission date. Upload time-zone details still need a final organizer check.

## V2 pixels and camera correction

[Run 37917747029](https://github.com/joaoccaldas/ai/actions/runs/37917747029) completed in 7m37s. F3 and plaza images confirm restrained fins and dry paving; the proposal and municipal context remain low-detail. Arrival was black and market was almost uniform brown. Geometry diagnosis finds all nine arrival rays hit municipal geometry within 0.59 m; market rays hit the opaque `ServiceHead` within 2.61 m. These frames failed despite job success.

V3 moves arrival to (-75,-25,1.56), looking at (5,58,25) at 32 mm in a 4:3 frame, and moves aisle camera beyond the service head. Nine sampled clearance rays now gate all views before rendering. The viewport state is restored after this geometry check. Remote outputs also require a non-collapsed pixel range, which detects empty/opaque frames without pretending to score quality. The source geometry is retained. The next remote job is capped at 45 minutes: previous approved work used about 12m39s total, leaving the combined worst-case below 65 minutes.

## V3 review and research intake

[Run 37919606164](https://github.com/joaoccaldas/ai/actions/runs/37919606164)
completed in 9m38s. Actual combined runner usage is approximately 22m17s of the
approved 65 minutes. No additional render was dispatched for the research intake.
All four receipts share candidate SHA-256
`b48581d976d46ecb01995e42e5e80f82ed4dbac03e222e16a911f39d4f7712f1`
and the pinned Rev18 source hash. Local file checks confirm both binaries.

The four PNGs were inspected. Arrival is now unobstructed and includes the full
municipal tower massing with the proposal at the left. Market now reveals stalls,
pendant lights, produce and occupants. Both camera failures are resolved. F3
still crops the cathedral and gives little space to the proposal. The market
people remain stylized, the floor has distracting dark lines, and the plaza is
too sparsely occupied to tell a strong civic story. Municipal massing remains
visibly coarse. All four pixel-range gates pass, but **visual quality is not
competition-approved**. The technical completion receipt remains historical;
this document records the subsequent review.

The [frontier research intake](FRONTIER_RESEARCH_INTAKE_2026-10-09.md) extends the
existing structural audit with separate equilibrium, historical evidence and
creative-design claims. Six new analytical tests pass; nineteen project tests
pass in total. Allocation caching is deferred until an actual workload benchmark
shows useful savings. These research findings do not justify a production upgrade
or a claim that the current roof has been structurally validated.
