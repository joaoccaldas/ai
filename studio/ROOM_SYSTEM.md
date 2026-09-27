# Caldas Studio — The Exposition hall

`/studio/` is a gallery hall modeled in Blender and lit in Cycles. Visitors walk it by scrolling: the camera glides down the nave and stops at each work. Work 01 stands on a dais at the entrance; the others hang in lit niches that alternate left and right; the apse at the far end holds the commission frame.

> Supersedes the earlier set-extension room system (2026-08). `gallery-engine.js`, `gallery-rooms.js` and `gallery-shell.css` are no longer loaded by any page and are kept only for reference.

## Files

| File | Responsibility |
| --- | --- |
| `index.html` | Page shell: intro, caption, dots, preview modal, menu, tour, sound, process and commission sections. |
| `rooms.js` | The works, in hall order (`window.STUDIO_ROOMS`). |
| `hall/hall.js` | Built bundle (Three.js r186 + app). Do not edit; rebuild from `hall/src`. |
| `hall/src/main.js` | Scene loading, baked-light materials, artworks, floor reflection, camera path, interaction. |
| `hall/src/tex.js` | Procedural katana finishes shared with SŌKAI. |
| `hall/assets/` | `hall.glb` (geometry, meshopt), `hall_lightmap.jpg` (4096² Cycles bake), `hall_env.hdr` (reflection panorama from the dais). |
| `hall/blender/hall.py` | Builds, lights, bakes and exports the hall. Uses `common.py`, `katana.py`, `env.py`, `build_helpers.py`. |
| `sokai/` | SŌKAI, the Infinite edition katana (self-contained page). |
| `sokai/making/` | How SŌKAI was made, step by step. |
| `gallery/<slug>.jpg` | Portfolio artwork, 900 × 1200 (3:4), shown in the niche frames and as previews. |

## Add a work

1. Build the concept under `studio/<slug>/` (or elsewhere in the repo) so it works on its own.
2. Export a 900 × 1200 JPEG (3:4, under ~300 KB) to `studio/gallery/<slug>.jpg`.
3. Add one line to `rooms.js`:

```js
{slug:'new-concept', n:'New Concept', room:'Short category', tag:'One memorable line.', url:'new-concept/', img:'gallery/new-concept.jpg', accent:'#c9a86a', note:'One sentence for the guided tour.'},
```

Order in `rooms.js` is the walking order. An optional `extra:{label, url}` adds a secondary link under the caption (SŌKAI uses it for the making-of).

The hall has **18 places**: the dais plus 17 niches. Unused niches show a "Reserved" card. To hang more than 18 works, raise `NICHES` in `hall/blender/hall.py` and re-bake (see below).

## Rebuild

```bash
# 1) geometry + light (Blender 5.2, Apple GPU ~2.5 min)
cd studio/hall/blender && STAGE=bake OUT=../assets blender -b --factory-startup -P hall.py
# 2) the web bundle
cd studio/hall && npm install && npm run build
```

`STAGE=preview` renders three quick Cycles previews instead of baking.

## Rendering model

- **Baked light.** All static architecture is merged, unwrapped into one atlas and path-traced in Cycles (640 samples). The browser shows that light directly, adding fine wood and stone detail only at close range.
- **Live layers.** Artworks, brass, the katana, the ring and the lamps stay out of the bake so they can change: artworks load from `gallery/`, brass and steel reflect the HDR panorama, emissives pulse and bloom.
- **Atmosphere.** Floor reflection, accent-coloured light spill under the active work, light cones, dust, bloom, lens edge softening and fog.
