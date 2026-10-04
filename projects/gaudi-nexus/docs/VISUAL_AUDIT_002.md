# Visual Audit 002 — deterministic 3D concept render

## What was built
A real OpenSCAD A+ V0.4 concept model now exists in `models/a_plus_v0_4.scad`.

It includes:
- the two V0.3 bars at their current optimized centers;
- two occupied levels;
- explicit ground-floor columns;
- stall modules;
- a hard-service core;
- shallow roof-strip geometry;
- trees and human-scale markers;
- an explicitly non-authoritative Sagrada background mass used only as orientation context.

## Critical visual verdict
**Geometry proof: 6/10.**
The model is deterministic, dimensional and reproducible.

**Architecture maturity: 4/10.**
The bars are still schematic and the upper-floor envelope is generic.

**Material quality: 2/10.**
OpenSCAD materials are only categorical placeholders.

**Lighting quality: 2/10.**
The renderer is not authoritative for competition lighting.

**Human experience: 4/10.**
Scale is now visible, but the scene lacks the spatial richness required for the final project.

**Competition visual quality: 3/10.**
This is real 3D evidence, but nowhere near a hero image.

## What must improve before Blender/Cycles-quality final rendering
1. real municipal/Sagrada context model;
2. structural joints and bay hierarchy;
3. true arcade geometry rather than box/column shorthand;
4. roof geometry derived from daylight + structure;
5. real material assemblies and thicknesses;
6. actual planting/ground design;
7. real camera composition at ~1.55 m eye height;
8. physically based lighting.

OpenSCAD is being used as a geometry truth/checking stage, not as the final renderer.
