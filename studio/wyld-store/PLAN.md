# WYLD Store implementation plan

## File map

- `index.html` — commerce shell and semantic UI
- `src/main.js` — store state, product selection, sizing, bag, motion and local-photo staging
- `src/viewer.js` — Three.js scene kernel, OrbitControls, ACES, lighting, camera rail and cinematic orbit
- `src/productFactory.js` — semantic V1 product and athlete geometry
- `src/products.js` — product definitions, colorways and public WYLD reference families
- `src/styles.css` — desktop/tablet/mobile design system
- `src/art.css` — derived WYLD campaign graphics as CSS-native artwork
- `assets/brand/palette.json` — canonical brand color manifest

## Visual direction

1. Product first, not UI first.
2. Pale studio stage for faithful color/material judgement.
3. Black WYLD-world sections for cinematic contrast.
4. Berry / Tiffany / Blueberry / Grape / Olive / Black product language.
5. Mobile treats 3D as the hero and configuration as a collapsible sheet.

## Blender production sequence

Replace V1 geometry one asset at a time:

1. women’s trisuit
2. men’s trisuit
3. hoodie
4. tee
5. cap

Production assets should add garment seams, pattern-aware topology, cloth thickness, proper UVs, roughness/normal maps, armature/skinning and validated standing/aero/run deformation.

## Try-on sequence

- V1: local image staging only
- V2: body/pose segmentation adapter
- V3: garment-transfer inference
- V4: bike + apparel composition for predefined riding poses

The store must never imply AI try-on is working before the inference path is actually connected and validated.
