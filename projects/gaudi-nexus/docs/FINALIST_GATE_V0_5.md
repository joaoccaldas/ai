# Finalist Gate V0.5 — 2026-10-04

## Decision
Living Threshold A+ remains the primary scheme.

Confidence: medium-high for continuing development, low for final competition outcome.

## What changed
The primary scheme now has a fixed dimensional contract:
- 2 × 45 × 10 m ground bars;
- ~900 m² ground footprint;
- ~836 m² upper-floor area;
- ~1,736 m² total GFA;
- ~9 m enclosed-height target.

## Why this matters
Earlier iterations were concept geometry.

V0.4 is the first scheme that can be checked simultaneously against:
- competition area;
- real plaza occupation;
- market logistics;
- evening operation;
- daylight depth;
- egress/core placement;
- structural bay planning;
- rendering consistency.

## Daylight / ventilation
No illuminance claim is made.

The ~10 m bar depth remains compatible with two-sided daylight and cross-ventilation logic while retaining materially more room-planning flexibility than C+'s ~5.6 m bands.

## Day/night operation
A+ can:
- open both bars during market hours;
- secure the hard bar after closing;
- keep civic/community/interpretation functions independently active;
- preserve the central public ground at all times.

This is now a core architectural advantage, not a diagram annotation.

## Geometry renderer audit
The OpenSCAD model exposed a real implementation defect:
- iteration ranges used negative steps with increasing endpoints;
- columns and façade/shading modules could silently fail to instantiate.

That defect has been fixed.

A second visual defect was also identified:
- the non-authoritative Sagrada reference mass overwhelmed camera compositions.

The reference mass is now hidden by default and must only be enabled for orientation studies.

## Critical visual verdict
Current deterministic 3D quality:
- geometry evidence: 6/10;
- architecture maturity: 5/10;
- material quality: 2/10;
- lighting quality: 2/10;
- human experience: 4/10;
- competition visual quality: 3/10.

The visual gap remains enormous.

## Do not do next
Do not spend time polishing OpenSCAD.

## Do next
1. resolve detailed support rooms and cores;
2. define acoustic/noise zoning;
3. define structural bay/joint;
4. import authoritative municipal 3D/topography;
5. move the primary scheme into Blender;
6. render one 1.55 m-eye-height material/light scene from authoritative geometry;
7. reject or iterate if that scene feels generic.
