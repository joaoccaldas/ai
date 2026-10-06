# Gaudí scene evaluation and remote pilot — 6 October 2026

The upstream Gaudí work through `e783204` has been merged into the isolated
`codex/gaudi-visual-quality-20261005` branch. Living Threshold A+ remains the
selected concept. Original scene files and canonical competition gates are
preserved. The latest user constraint is **no rendering on this Mac**.

## Reuse decision

Extend `studio/shared/procedural-assets` for generic props and placement.
Use `studio/scene_kit` for scene contracts, PBR helpers, colliders, oak variants
and validators. There is no third prop library. The historical knowledge-hub
lead `3def0d16b82d61077752d416c625b50eef764109030e49acd5abab6bdbaf80c7`
records intent, not implementation proof. Current source and the checks below
support this decision.

## Validated improvements

- Frustum, figure and furniture cap normals now face outward.
- Supported fabric retains fixed perimeter vertices and sags along world
  gravity, including nonuniform scale and tilted transforms. The test measures
  0.05 m maximum sag. This is a visual membrane approximation, not stress analysis.
- All **80 counter produce assets** now fit inside their assigned counter tops
  and rest at 1 mm static vertex contact. Bounded corrections measured up to
  0.186 m horizontally and 0.196 m vertically. Original source objects remain
  unchanged. This is deterministic placement, not a rigid-body simulation.
- The 52 reusable GLBs total **46,882 triangles and 1,982,196 bytes**. All pass
  Khronos validation with zero errors and zero warnings. Hashes and per-node
  asset ID, anchor and metre-unit metadata match the manifest. Runtime frame
  rate and mobile performance have not been measured.
- Every view uses one frozen people layout and material state. The previous
  camera-specific population and aerial puddle changes are removed.
- The municipal cathedral remains massing. Invented windows and string-course
  shading are disabled by default. Indirect lighting comes from Cycles rather
  than an unshadowed opposite-side sun. The hero uses f/8 rather than f/2.8;
  the weaker haze is a declared design-weather choice.
- The prepared candidate preserves **1,600 source geometry/transform
  signatures** and the **113,584-face municipal mesh**. Preparation invoked
  zero renders. The source file SHA remains
  `fbe674a0573bac16e8ca0ae8f4b0546e802b354ff171530685d3135cca9270ce`.

Local receipts are in `output/evaluation-2026-10-06/` and
`output/procassets-audit-2026-10-06/`. The current prepared candidate is
`prepared-scene-contact-v2.blend`; its SHA is
`913d75c10b0b897568227cc745d42d037fa36c8119d074281e7b03a5871e043b`.
No new images have been produced since the user's no-Mac-render instruction.

## Competition gaps found in the current source

The selected dimensional contract describes 1,736 m² over two levels and
approximately 9 m height. Both source roofs span Z = 4.9924–6.15 m. The naming
inventory finds only `AccessibleFloorMarker` among floor/stair/lift candidates.
This does not establish absence of unnamed geometry, but it does establish
that the contract lacks an inspectable floor-area polygon schedule here.
**Measured GFA remains unknown.** Roof bounding boxes must not substitute for GFA.

Two teaching-kitchen islands and eight administration desks exist. Their
labels do not validate capacities, independent kitchen operation, clearances,
ventilation or access/egress. Those gates remain open. The next architectural
pass must reconcile actual floors, access and programme with the selected A+
contract before final competition drawings or area claims.

The existing Higgsfield project is revision 16, has 1,601 objects and lacks
`geometry_0`. Its proxy-only scene cannot verify the latest municipal candidate.
No cloud scene was edited and no remote renders were submitted during this pass.

## Concrete remote job

`.github/workflows/gaudi-remote-visual-pilot.yml` runs on an Ubuntu GitHub Actions
runner. Pushing this isolated branch with the new workflow triggers the pilot.
It retrieves existing artifact **11326907149** from run **37265636228**;
verifies the scene SHA; verifies the official Blender 5.2.2 Linux binary SHA;
assembles one candidate; and renders hero, market and plaza from that same file.
Every image gets camera, source/candidate hashes, solar inputs, settings and
timing receipts. Logs and partial outputs survive failure.

The job is limited to **65 runner minutes**, with 17-minute bounds per image,
32 maximum samples, a 640×900 hero and 960×540 market/plaza frames. It can consume
the account's GitHub Actions allowance. No paid render service is configured.
The workflow has read-only repository permissions. Local checks cover YAML,
embedded Python and shell syntax, source assembly and the Mac render guard;
the remote workflow has **not yet run**.

The pilot is a visual evaluation, not a competition deliverable. Inspect its
actual pixels for material scale, cathedral primacy, contacts, people and plaza
composition before approving a high-resolution pass. The A1/A4, structural,
environmental, site-promotion and brief-closure gates remain pending.

## Learning record

The knowledge hub now contains outcome `6f565471-cc5b-4844-8519-6a50403403d5`
and reusable flow `af466fa5-17c4-40d0-a711-5ebbb900798a`, with four individually
cited evidence events. These are agent-reported results and an agent-authored
recipe, not independent validation. The later produce-contact correction has
its own receipts and is recorded separately to preserve the earlier evidence:
outcome `8976ad84-2803-4aee-a6fc-8fb47f099a94`, reusable flow
`ec3b5c88-1d31-4eb9-bf38-84d1b6d9c6e3`, evidence
`d5caeb23052525c2b87963fce321959b4c3adf800545ae61750d61bf8253f676`.
