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
