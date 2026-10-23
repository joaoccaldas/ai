# Gaudí source-bound render workflow

Current guidance: `../docs/REALISM_PLAYBOOK.md`, `../docs/CIVIC_VISUAL_REVIEW.md`
and `../docs/COMPETITION_COMPLETION_AUDIT.md`. The Linux pilot workflow owns
actual rendering. Mac Blender use is geometry/inspection/export only. Source
and candidate receipts are mandatory; no shader-invented cathedral detail.

The optional realism study uses six reviewed 2k CC0 maps for our paving and
roof, authored UVs/tangent normals, member-aligned timber and small edge bevels.
`fetch_textures.py --ids concrete_pavers_02 clay_roof_tiles_02 --lock
textures-reviewed-20261021.json` extends the existing download path with exact
map identity checks. It does not replace the municipal model. Packed source
images are checked by `../scripts/check_realism_materials.py`.

The notes below are historical. Their old source paths, timing estimates,
`ENRICH_SAGRADA` suggestion and Mac invocation are not current instructions.
The current guard rejects Mac image rendering and the competition workflow
rejects invented context enrichment.

## Historical pipeline notes

# Gaudí Nexus render pipeline (derived render copy)

`build.py` assembles and renders a camera from a **derived local copy** of the Rev17 aligned municipal comparison build. It never edits canonical geometry and no `.blend` is committed.

Input: `rev17_aligned.blend` from the Actions artifact `gaudi-rev16-comparison` (run 37263579194, branch `gaudi-nexus-rev16-build-tmp`; file SHA-256 `dca0d7ac…`). Verify ancestry (Rev15 `cc1179cd…` + municipal GLB `f5c32414…`), not the derived hash.

```
blender -b rev17_aligned.blend --python build.py -- HERO_F3 19.25 1200 1600 128 out.png
```
Cameras: `HERO_F3` (selected geometry candidate), `SEARCH_MARKET_EDGE_E` (under-vault), `AERIAL`, `MARKET_WIDE`, `MARKET_CLOSE`, `TOP_MARKET` (diagnostic).

Sun is derived, not chosen: Barcelona 41.4036°N 2.1744°E, 2026-09-21, UTC+2. 17:00 = 29.3°/240°; 19:15 = 5.3°/265° (azimuth clockwise from north).

Disclosure: `ENRICH_SAGRADA` adds window recesses and pointed arches to the municipal Sagrada massing as a **shader-only visual enrichment**; geometry is unchanged. Say so in any caption.

Assets: `studio/shared/procedural-assets`. Scene-specific materials: `surf2.py` (vault tile, produce, fabrics), `surf3.py` (plaza slabs, inlay, fin hardware), `surf4.py` (puddles, fin glaze).
CPU-only Cycles: a 1200×1600 / 128-sample frame takes ~20–30 min on 4 cores; iterate at 900×1200 / 48.

Finishing: `python3 finish.py in.png out.png` applies a declared photographic finish (bloom/halation, vignette, slight chromatic aberration, filmic curve, grain). Needs `pip install pillow numpy`. Disclose in captions.
Entourage: figures are procedural and illustrative (no real or AI-generated people); caption accordingly.

Scanned PBR base: `python3 fetch_textures.py` downloads the CC0 Poly Haven textures listed in `textures.json` (sandstone_blocks_08, concrete_pavers_02, clay_roof_tiles_02) into `_tex/` (git-ignored) and writes `_tex/provenance.json` with URL, SHA-256, author and licence per file. `build.py` box-projects them in object space at real-world scale and layers the procedural weathering on top; without the textures it falls back to the procedural look. Rights: CC0.
