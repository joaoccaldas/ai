# Caldas Studio portfolio and art gallery

Two views of one creative practice:

- `studio/index.html`: a readable project portfolio with the interactive Speedmax CFR hero.
- `studio/gallery.html`: the original walkable museum, with the Stained Glass bike in the central atrium and six project case studies in All Works.
- `studio/mobile/index.html`: the same generated portfolio with relative links for the mobile route.
- `studio/mobile/archive.html`: the preserved concept catalogue, with its filtering repaired.

`studio/projects.json` is the source of truth for the curated projects. The build generates the static landing pages, case studies, the gallery’s project links and `project-catalog.js`. Project content is HTML before any WebGL initialization. The original rooms and concepts remain in `rooms.js`; they are an explicit archive, rather than unverified commissioned work.

## Build and preview

Requires Node 22 or newer, npm and Python 3.

```sh
npm ci --prefix studio/portfolio --ignore-scripts
npm run build --prefix studio/portfolio
npm run validate --prefix studio/portfolio
python3 -m http.server 8815 --bind 127.0.0.1
```

Open `http://127.0.0.1:8815/studio/` or `http://127.0.0.1:8815/studio/gallery.html`.

The same build bundles the landing hero and museum with Three.js 0.186.1 and esbuild 0.28.2. Generated files are checked in for GitHub Pages. Rebuild after changing the registry or renderer sources.

## Featured artwork

The Speedmax CFR is the existing Konam model with the Sanctuary / Stained Glass finish. `assets/bike-provenance.json` pins the source repository, commit, SHA-256, palette and measured derivative costs. `src/stained-glass.js` preserves the procedural WYLD shader; `src/bike.js` applies one material and scale contract in both renderers. Konam’s identity, progression and cloud application are not dependencies.

| Model | Triangles | Bytes |
| --- | ---: | ---: |
| Original | 509,624 | 2,081,248 |
| Desktop | 131,772 | 628,612 |
| Mobile | 44,717 | 276,572 |

To regenerate derivatives, pass the original source explicitly; it is read and never overwritten:

```sh
npm run assets --prefix studio/portfolio -- /absolute/path/to/konam/assets/museum/speedmax_web.glb
```

Compatible static primitives are joined from 74 to 20 while retaining named material slots. The asset generator uses glTF Transform 4.5.0 and meshoptimizer 1.3.0. Regeneration after a source change requires updating the source commit in the provenance script. The poster is exported from the portfolio renderer’s `window.__STUDIO_HERO.capture()` at its reset camera position. The debug capture API is for validation and export, rather than a product control.

Three.js, meshoptimizer and glTF Transform license texts are in `licenses/`. The shader and bicycle are credited to the owner’s Konam repository; this work does not declare a new redistribution license for artwork.

## Interaction and recovery

The hero renders on demand, pauses when hidden, supports drag and arrow-key orbit, keyboard zoom, reset and a still-image control. Reduced-motion and Save-Data visitors start with the poster and can opt into 3D. A renderer/model failure leaves the poster and all project links usable.

The museum provides Auto, Balanced and Cinematic rendering tiers. Artwork textures are prefetched at corridor entry and retained for at most two wings on touch devices or three on desktop. Rendering stops while a project dialog is open or the document is hidden.

The museum uses obstacle-aware routes around its dais and exhibit bases. Selecting a route before entry enters the experience. Dialogs clear movement, trap focus and make background controls inert. Iframe cleanup is immediate, preventing the old delayed-close race. Missing optional HDR maps fall back to the atrium or a neutral environment. Temporary HDR textures and the PMREM generator are disposed. The bike has a simple picking proxy; raycasts exclude its detailed meshes. If the bike cannot load, the original katana remains in the atrium, and the project index is retained.

SŌKAI’s complete standalone experience and making-of are preserved. Its archive card opens that experience directly when the bike occupies the atrium.

## Verification

`validate.mjs` checks registry integrity, local references, model triangle counts/materials, and 342 continuous routes from the entrance and between exhibit stops. It samples every route segment against museum boundaries and obstacles.

`browser-check.mjs` exercises real UI flows using the existing Playwright browser setup: desktop and actual touch contexts, search/filter/reset, case study navigation, no-JavaScript navigation, reduced motion, WebGL failure, dialog focus, an entrance-to-Éclat walk without teleporting, movement pause, rapid iframe reopen, missing lighting and a missing-bike recovery. It also checks hero draw submissions, quality selection, bounded wing textures, suspended dialog rendering and opening Konam from the central bike. The existing visual CI captures every wing separately as a rendering check. Browser evidence is saved under `output/playwright/`.

## Remaining creative work

The original baked room shell, labels and object themes are preserved. This first revision makes real projects available inside the gallery, and gives Konam a physical central exhibit. A later art-direction pass can replace generic concept sculptures with dedicated NOEMA, Gaudí and other project artifacts, and re-bake the architectural lighting around the bike. NOEMA and Gaudí currently use labelled schematic illustrations in their case studies; they are not final architectural or scientific outcome renders.

Case-study copy reflects inspected code and documented status, rather than invented commercial impact. Project-specific runtime audits beyond the portfolio and museum remain separate work.
