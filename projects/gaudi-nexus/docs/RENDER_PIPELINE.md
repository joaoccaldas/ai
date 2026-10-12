# Render / representation pipeline

## Authoritative hierarchy
- Geometry: Blender/Python/Geometry Nodes.
- Final light/material: Cycles.
- Iteration: Blender viewport / Eevee.
- Experience and scale: Three.js.

## Camera registry
Every final camera records: id, purpose, position, target, focal length, sensor, crop, eye height, time/date, weather assumption, render engine, samples, denoiser, color transform.

## Pixel-quality priorities
1. silhouette and spatial depth;
2. physically coherent lighting;
3. material scale and roughness;
4. edge quality and contacts;
5. human scale and believable occupancy;
6. atmosphere only after structure reads clearly.

## Performance
High geometry/detail only where it changes silhouette, specular response, shadow, contact, or close-view meaning. Everything else uses instancing, texture detail, LOD or omission.
