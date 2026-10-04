# Technical stack

## Authoritative geometry
- Blender + Python for deterministic procedural geometry.
- Geometry Nodes where interactive design-space exploration is superior to Python-only generation.
- Rhino/Grasshopper is optional and only enters if it produces materially better structural/form-finding or interoperability than Blender-native tools.

## Existing runtime versions to preserve initially
- Three.js: 0.186.x family, matching current Kona.m / Bellagio work.
- esbuild: start with Kona.m 0.28.x family.
- meshoptimizer: Kona.m pattern.
- three-mesh-bvh: Bellagio pattern where interactive spatial queries matter.
- glTF Transform / gltfpack: measured per asset, not blindly applied.

## Rendering authority
1. **Cycles**: hero images, material truth, final-light authority.
2. **Blender viewport / Eevee**: fast iteration and camera blocking.
3. **Three.js**: interaction/performance validation, not final photoreal authority.

## Analysis
- Solar/daylight: start with deterministic solar geometry; escalate to Radiance/Ladybug/Honeybee if needed.
- Wind: use validated external CFD or reduced-order proxies; do not treat Blender smoke/fluid visuals as engineering evidence.
- Crowd flow: explicit agent/network model with documented assumptions.
- Acoustics: simplified propagation / shielding model unless a validated package is used.

## AI
- ComfyUI for reproducible image-generation workflows and process evidence.
- AI may propose, cluster, critique and visualize variants.
- AI may not be the source of final plan/section geometry.
- Every generated asset used in the final board must have provenance.
