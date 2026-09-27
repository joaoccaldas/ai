# SŌKAI · Infinite Edition

An interactive katana modeled in Blender, lit in Cycles and rendered live in the browser with Three.js.

- **Experience:** https://joaoccaldas.github.io/ai/studio/sokai/
- **Making-of (animated, step by step):** https://joaoccaldas.github.io/ai/studio/sokai/making/

## What a visitor can do

| Area | Details |
| --- | --- |
| Look | Drag to orbit, scroll or pinch to zoom toward the cursor, right-drag to pan. Hover names a part; double-click or tap flies to it. |
| Draw | Pull the handle (or use Reveal): the blade slides along its sori and floats above the saya. **Exploded** separates all 18 parts. **Iai** (`I`) draws, cuts with a light trail, flicks and re-sheathes. |
| Forge | Hamon style, polish, engraving, 7 lacquers, maki-e pattern, luminosity, raden flecks, silk and cord colours, samegawa, fitting metals, and three tsuba designs (∞, sakura, moon & waves). Six presets, random, share link. |
| World | Atelier (night or dawn), the Infinite Vault through the ring portal, and an Obsidian study. Four seasons, five weathers (clear, mist, rain, storm with lightning, snow), light sliders, film look, quality. |
| Memory | World settings, the last view and a named collection of up to 24 forgings are saved in the visitor's browser. |

Keyboard: `1` `2` `3` modes · `I` iai · `C` cinematic · `S` orbit · `P` portal · `N` night/dawn · `E` forge · `W` world · `R` reset · `F` fullscreen.

## How it was made

1. **Blender 5.2 (procedural Python).** The blade is lofted from a shinogi-zukuri cross-section along a 3.5 m arc (710 mm nagasa, 18 mm sori, kissaki with fukura). The ito is four helical ribbons crossing over and under, leaving real diamond openings; tsuba openings are cut with exact Booleans. The atelier (≈600 objects), garden and vault are built the same way.
2. **Cycles bakes.** Static geometry is merged into one UV atlas and path-traced on the GPU (4096², 768 samples; night and dawn states). HDR panoramas are rendered from the sword's position for reflections.
3. **Browser.** One meshopt-compressed GLB, generated materials (hamon, lacquer, silk, samegawa, hammered iron), wet-floor reflections, bloom, depth of field, shader weather and particles, generated ambient sound. Everything is packed into `index.html` (≈13 MB, works offline).

The theme is an original homage inspired by the film *Infinite* (2021); no footage, logos, characters or designs from the film are used. An artistic reconstruction, not a scan, certification or fabrication guide.

## Files

| Path | Contents |
| --- | --- |
| `index.html` | The self-contained experience (app bundle + GLB, lightmaps and HDRs inlined as base64). |
| `making/index.html` | The animated making-of page. |
| `source/blender/` | `katana.py`, `env.py`, `common.py` (modeling), `build.py` (lights, bakes, panoramas, GLB export), `hdr_small.py`. |
| `source/web/` | `src/` (main, textures, atmosphere, sound, data), `index.template.html`, `build.mjs`. |
| `../gallery/sokai.jpg` | Portfolio artwork (900 × 1200). |

## Rebuilding

```bash
# 1) Blender: build, bake (night + dawn + vault) and export into ./out_hq
cd source/blender
STAGE=bake RES_A=4096 RES_V=2048 SPP=768 OUT=../../out_hq blender -b --factory-startup -P build.py
blender -b --factory-startup -P hdr_small.py        # optional: smaller HDRs for the web build

# 2) Web: bundle and inline assets into a single HTML file
cd ../web
npm install three@0.186.1 esbuild@0.28.2
ASSET_DIR=../../out_hq OUT_HTML=../../index.html node build.mjs
```

The build expects `sokai.glb`, `lightmap_atelier.jpg`, `lightmap_atelier_dawn.jpg`, `lightmap_vault.jpg`, `env_atelier.hdr`, `env_atelier_dawn.hdr` and `env_vault.hdr` in `ASSET_DIR`. The Blender master file and baked assets are not committed; the build regenerates them.
