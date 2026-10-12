# Realism & render-efficiency playbook (Gaudí Nexus)

Status: working notes from the Rev17-derived render pipeline (`projects/gaudi-nexus/render/`). Everything under "Measured" was observed in this repo's renders; everything under "Recommended, not yet measured" is untested here and labelled as such. Not a claim that the world is photoreal: the latest honest scores are hero ≈ 7.5/10 and vault ≈ 7.5/10.

## 1. What moved the image, in order of impact

| Lever | Evidence | Where |
|---|---|---|
| Sun derived from place + date + clock time, low and warm | Directional cast shadow across the façade is the single biggest "reads as real" cue | `build.py` (sun block), `README.md` |
| Scanned CC0 PBR as the base layer, procedural weathering on top | Stone/paving/tile stopped looking like flat colour | `fetch_textures.py`, `textures.json`, `pbr.py` |
| Real-world-scale box projection (object space) | No stretched UVs on imported municipal mesh | `pbr.py` |
| Mirror coat on puddles + flat normals inside them | Puddle went from a dark stain to a visible reflection of chairs/figure/façade | `surf4.py` |
| Real thin glass (transmission, transparent to shadow rays) | Milky alpha pane became see-through glazing showing the lit café | `build.py` glazing block |
| Glazed lancet windows (mullion + transom, sky-reflecting) | Black cut-outs became windows | `build.py` (`ENRICH_SAGRADA`) |
| Per-ashlar tone variation | Removes the single-colour sandstone look | `build.py` stone block |
| Structured sky (Nishita + cloud noise, lit core / grey underside) | Flat gradient became cloud structure | `build.py` sky block |
| Hero depth of field (32 mm, f/2.8, focus 18 m) | Foreground softens, subject stays sharp | `build.py` camera block |
| Catenary sag on awnings, pendant lamps hung from the vault by raycast | Gravity cues in the market | `build.py` |
| Finishing pass (bloom, vignette, edge-safe CA, filmic curve, shadow-weighted grain) | Photographic response | `finish.py` |

## 2. What still gives it away (open, honest)

1. **Sagrada silhouette.** The municipal massing is open-top tubes; the spires read as pipes. Geometry is immutable by project rule, so shader-only tricks have hit their ceiling here.
2. **People.** Procedural figures are blocky. Photoreal people need scans or consented photography; a decision was made not to use real or AI-generated people. Caption them as illustrative.
3. **Vault brick** is dark and low in relief; **foreground produce** is a saturated blob when close to the lens.
4. **Municipal context** is massing-level only.

## 3. Efficiency (Measured)

- CPU-only Cycles on 4 cores: a 1200×1600 / 128-sample hero takes on the order of tens of minutes; 600×800 / 24-sample tests take a few minutes. Iterate at 450×600–600×800 and 12–24 samples; only run finals once a change is judged on a test frame.
- Run **one** Blender process at a time; a second one on the same four cores slows both.
- Never poll in a tight loop; use a background "until file exists" watcher.
- A bounded `HAZE` cube is cheap atmosphere; an unbounded world volume rendered black.
- Instancing (shared mesh data) keeps the 58-asset library and the scene light; assets export to GLB headlessly with per-asset `build-meta.json`.

## 4. Recommended, not yet measured

- Cycles render **border/region** on the area being tuned (windows, puddle) to cut test time further.
- Check Cycles light-tree and adaptive-sampling settings (Blender defaults are currently in use, not tuned) and try a lower noise threshold with a lower sample cap.
- Use GPU (OptiX/HIP/Metal) for finals if a GPU worker is available; this container has none.
- Compare Eevee for iteration only; finals stay Cycles per `RENDER_PIPELINE.md`.
- Per-camera record (id, position, target, focal length, sensor, time/date, engine, samples, denoiser, colour transform) as the camera-registry rule requires.

## 5. Pitfalls already hit (do not repeat)

- A file saved in Blender 5.2 cannot be opened by Blender 4.0.
- `pkill -f` can kill its own shell; use character-class patterns (`[b]uild.py`).
- A hook can report "unpushed commits" from a stale tracking ref; refresh with `git fetch origin +refs/heads/gaudi-nexus:refs/remotes/origin/gaudi-nexus` before assuming.
- `__pycache__` was staged by mistake once; keep it ignored.
- Chromatic aberration without scale-and-crop leaves edge fringes.
- Do not commit `.blend` binaries; the derived render copy stays local.

## 6. Reuse (REUSE → ADAPT → RESTYLE → COMPOSE → CREATE)

`studio/shared/procedural-assets/` is the shared library (58 assets, GLB export, `build-meta.json` per asset, `representation: geometry-study`). Konam-side intake still has to apply its own mobile budgets; the fields exist, the gate does not.

## 7. Disclosure checklist for any competition image

- Shader-only enrichment of the municipal Sagrada (windows, courses, tone) — geometry unmodified.
- Finishing pass applied (`finish.py`).
- Figures are procedural and illustrative.
- Trencadís fins are a stylistic choice; `VISUAL_SYSTEM.md` warns against Gaudí mimicry, so treat as an optional variant for the board.
- Sun derived from declared place/date/time (Barcelona, 2026-09-21, UTC+2).
