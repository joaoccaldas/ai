# Material room study — 18 October 2026

Candidate composition experiment, not a new runtime or a competition submission.
Five original GLBs form six placements. Two architectural finishes retain the
same geometry. The repeated lantern links one mesh. Native walking/collision,
live mirror, physical-phone/headset and independent appearance acceptance remain
open. The charcoal finish is a pigment variant, not a night-light simulation.

## Source and replay

The existing Scene Kit owns geometry/material helpers. The existing procedural
library owns the assets and generated texture helpers. Exact source hashes,
metres/axes, anchors, placements and REUSE decisions are pinned in
`projects/gaudi-nexus/config/material-room-study-v1.json`.

Inspect that manifest and all input sources first. Use the installed Blender for
geometry preparation only; image rendering on this Mac remains prohibited.
Choose a fresh ignored output directory. Preserve originals and failed candidates.

```sh
blender --background --factory-startup --python projects/gaudi-nexus/scripts/build_material_room.py -- \
  --manifest projects/gaudi-nexus/config/material-room-study-v1.json \
  --variant daylight --output projects/gaudi-nexus/output/FRESH_ROOM/daylight.blend
```

Repeat with `--variant nocturne` and a fresh filename. The builder checks source
identity, evaluated geometry and contact, saves a derived BLEND and an assembly
receipt. It does not render images. Then use the existing private Atlas
`prepare_world.py` exporter against each fresh BLEND, with `--preserve-extras`
and `--tangents` after reviewing custom metadata. Do not introduce another
exporter just to move this study. Run the current Khronos validator separately
and retain its nonzero exit status. Finally:

```sh
python3 projects/gaudi-nexus/scripts/check_material_room.py \
  --directory projects/gaudi-nexus/output/FRESH_ROOM
```

The check expects the existing validator's `NAME.glb.validation.json` files. It
checks input hashes, source placement hashes, camera/marker identities, shared
lantern mesh, all normal-mapped primitives' UV/tangent coverage, no local Mac path
in glTF JSON, embedded images and identical geometry across finishes. This does
not judge realism or prove the absence of every possible private datum.

## Current evidence and failures

The local `output/material-room-2026-10-18/uv-fixed/` directory has the two final
candidate GLBs, assembly/export receipts, contract check and validation reports.
Both are 7,005,080 bytes, 12 unique meshes, 13 mesh nodes, three cameras and seven
images; both validate with zero errors/warnings. Their common geometry-buffer
digest is `5c9a90c0e7b4d749fe3c7c32029228a5dd9ca5bd956a9c6cd64bc23634af86b6`.
This is a targeted experiment, not an approved mobile payload budget.

Earlier exports lost custom properties; opt-in extras preserve reviewed markers
without changing the exporter's safe default. Normal maps also needed tangents.
An intermediate texture candidate had three errors and two warnings: a mapped
material was shared by bench/window meshes without UVs. Ensure every material
user has a UV map, not only the original floor/wall. Preserve the failed
`refined/` files. Do not overwrite them with corrected files.

The private Atlas uses its existing renderer to compare live shadows, cached
static shadows and a small optional diffuse-probe bake. Three 90-frame runs at
980 × 450/DPR 1 recorded 48 live vs 24 cached draws. GPU timing ranges overlap;
there is no reliable percentage speedup claim. Probe bake had a 1.45-second
first-compilation step despite incremental scheduling; keep it opt-in.

Actual source-bound screenshots and raw browser receipts stay in the private
Atlas review folder. Do not copy that private research or source paths into this
public GitHub remote. No push or deployment is part of the experiment.

## Visual status and next test

Placed objects, material response and edge highlights can be inspected. Timber
side grain and wall bump need a subtler scale. The mirror samples an environment,
not the room, and the exterior is blank. A reusable scene recipe is demonstrated;
photorealism, cinematic composition and production scalability are not proven.

Next: calibrate grain/normal strength; add one story-relevant exterior from existing
assets; test a host-owned planar mirror including its pass cost; invalidate cached
shadows on object/light changes; reproduce on a physical phone and a second host.
Use independent review before promotion. This recipe remains agent-authored.
