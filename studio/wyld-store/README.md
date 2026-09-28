# WYLD Store 3D

Immersive, mobile-first Three.js commerce studio for WYLD.

## Product idea

This translates the strongest interaction language from Canyon Museum into a store rather than a museum: a real-time 3D product stage, cinematic camera rail, material/color controls, motion states, product switching, sizing, bag state and a privacy-safe try-on boundary.

## Current functionality

- interactive Three.js product viewer
- orbit / zoom controls
- Hero / Fabric / Side / Silhouette camera presets
- 12-second cinematic camera orbit
- Berry, Blueberry, Grape, Olive, Tiffany, Black/White color systems
- Stand / Aero / Run mannequin states
- women’s and men’s trisuit concepts
- women’s and men’s recovery hoodies
- studio tee and race-week cap
- size selection and local bag state
- local-only photo staging for the future try-on adapter
- mobile-specific 3D-first layout
- public RideWYLD collection reference rail

## Run

Serve this folder over HTTP. The direct prototype uses an import map for Three.js, so a build is not required.

```bash
python3 -m http.server 8788
# open /studio/wyld-store/
```

Optional Vite workflow:

```bash
npm install
npm run dev
```

## Asset truth

The current product meshes are semantic Three.js V1 geometry, not finished manufacturing-grade garments. Their node/material roles are deliberately stable so Blender-authored GLBs can replace them without rewriting the commerce UI.

Public WYLD collection names and color families ground the visual catalog. Private Michelle reference photos are not committed. They inform only derived palette, motion and silhouette decisions.

## Mobile

The mobile experience is authored separately rather than simply shrinking desktop:

- 58svh touch-first 3D stage
- horizontal shop carousel
- collapsible configuration panel
- sticky purchase actions
- swipeable visual-world section
- local-photo fit sheet
