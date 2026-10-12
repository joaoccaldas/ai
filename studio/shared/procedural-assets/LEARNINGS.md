# 3D learnings and cross-project enhancements

Source: the Gaudí Nexus render work (`projects/gaudi-nexus/render/`, `projects/gaudi-nexus/docs/REALISM_PLAYBOOK.md`). "Observed" = seen in this repo's renders. "Proposed" = reasoned, not measured here.

## Recipes that transfer (and why)

| Recipe | Why it works | Observed in | Reuse in |
|---|---|---|---|
| **Thin glass = Principled transmission + `Is Shadow Ray` -> Transparent mix** | Alpha-blend panes read as milky film; transmissive glass lets the interior show, and the shadow-ray bypass stops it casting a black shadow | Market partition: milky sheet became see-through glazing with lit café behind | any scene with shopfronts, museum cases, greenhouse, car windows |
| **Mirror coat on puddles / wet floors**: fade bump to 0 where wet, `Coat Weight` = wet mask, `Coat Roughness` 0, `Coat IOR` 1.33 | Standing water is flat; a coat has its own geometric normal, so the reflection stays crisp while the stone below keeps its relief | Puddle reflected chairs, a figure and the façade | wet streets, lobbies after cleaning, rain scenes |
| **Per-cell white-noise tint**: `floor(objectCoord / cellSize)` -> White Noise -> colour ramp -> multiply | Real masonry, pavers, windows and tiles are never one colour; cell-hash variation is cheap and stable (no UV needed) | Ashlar façade, plaza pavers, per-pane window tint | any tiled/blocked surface |
| **Scanned CC0 PBR as base + procedural weathering on top, box-projected in object space at real scale** | Scans supply believable micro-detail; procedural layers supply large-scale wear; object-space projection avoids UV stretching on imported meshes | Sandstone, pavers, roof tile | imported municipal / CAD meshes anywhere |
| **Sun derived from place + date + clock time** | Removes "arbitrary angle" doubt; makes shadow studies defensible | 19:15 CEST low warm sun | any architectural visualisation |
| **Sun-side-aware sky**: clouds facing the camera get the low-sun colour when the sun is behind the camera | Colour of sky and stone then agree; this was the biggest single colour gain late in the work | Sunset cloud faces | exterior hero shots at golden hour |
| **Depth of field on hero + near-field prop cull** | A soft foreground reads as a lens; a stray prop inside ~1 m reads as a blob | Hero DOF; vault tomatoes | any eye-level camera |
| **Bounded haze cube** instead of world volume | Unbounded world volume rendered black; bounded cube is cheap and controllable | Hero/aerial haze | any exterior with atmosphere |
| **Procedural asset library + GLB export + per-asset `build-meta.json`** | One generator -> many scenes; metadata makes intake and budget checks possible | 66 assets | Konam rooms, museum, jewelry, gallery, cafe |
| **Photographic finish pass** (bloom, vignette, edge-safe CA, filmic curve, shadow-weighted grain) | Matches camera response; must be disclosed | all finals | any still |

## Process learnings

- Iterate at 450-640 px wide, 12-24 samples; spend final-quality samples only on a change already judged good. A hero final costs tens of minutes on 4 CPU cores.
- One Blender process at a time on a small worker; chain finals with a single script that waits for the previous process.
- Read pixels before claiming a change worked. Two changes (figure softening, tomato blur) were visually negligible and were reported as such.
- Honest scoring beat flattering scoring: hero ~8/10, vault ~7.5/10, and the project's own 9/10 hero gate is not met.
- Check hook claims against git (`git fetch origin +refs/heads/<b>:refs/remotes/origin/<b>`); a stale tracking ref produced false "unpushed commits".

## What caps realism (so future projects budget for it)

1. **Imported massing geometry** with no architectural detail (open-top tubes, no tracery). Shaders can add windows and tone, not silhouette. Plan a detail layer or a licensed model early.
2. **People.** Procedural figures stay blocky at any shader quality; photoreal people need scans or licensed assets.
3. **CPU-only rendering.** A GPU worker would make final-quality iteration practical.

## Proposed enhancements, by project type (not yet measured)

- **Konam / real-time web:** bake AO and lighting where a shader trick (coat puddles, thin glass) has no WebGL equivalent; compress textures (KTX2); LOD per asset using the triangle count already in `build-meta.json`; keep `representation` honest (`geometry-study` vs `concept`).
- **Museum / jewelry / gallery:** glass display cases need the thin-glass recipe plus caustic-free shadow bypass; per-cell tint for stone plinths; HDRI-free area-light rigs for product shots.
- **Cafe / hotel / retail:** pendant lamps hung by raycast, parasol/umbrella and hanging-basket assets, wall shelving and kraft bags give shop-front life.
- **Any exterior:** derive the sun; make the sky consistent with the sun side; add a cheap wet-ground mask for contrast.
- **Library hygiene:** promote the node recipes above into a shared `.blend` node-group library (REUSE before CREATE) instead of re-pasting Python; register every camera (id, position, target, lens, time/date, engine, samples) in a camera registry.

## Asset batches added in this phase

- Market detail (6): chalkboard easel, hanging scale, preserve jar, cheese wheel, bunting string, olive tin.
- Street/shop-front (8): manhole cover, kerb stone, cafe parasol, wall shelf, paper bag, hanging basket, step ladder, milk-crate stack. All export headlessly; dimensions checked against real-world sizes.
