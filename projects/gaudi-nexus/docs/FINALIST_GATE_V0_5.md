# Finalist Gate V0.5 — 2026-10-04

## Decision
Living Threshold A+ remains the primary scheme.

Confidence: medium-high for continuing development, low for final competition outcome.

## Dimensional contract
The primary scheme is now controlled by two low bars:
- 2 × 45 × 10 m ground bars;
- ~900 m² ground footprint;
- ~836 m² upper-floor area after modest setbacks;
- ~1,736 m² total GFA;
- ~9 m enclosed-height target;
- no occupied bridge across the civic middle.

## Hard market bar
The hard edge is no longer a generic market rectangle.

Current ground-floor concept includes:
- 20 stalls;
- stall module ~3.0 × 2.4 m;
- 3.2 m central public aisle;
- 11 × 10 m service/support head;
- cold store;
- dry store;
- waste;
- cleaning/utilities;
- staff support;
- public WC;
- accessible WC;
- lift;
- two remote stairs.

All 20 stalls are now concentrated in the hard bar so refrigeration, drainage, cleaning, exhaust, delivery and waste remain on one maintainable edge.

## Civic bar
Current ground-floor concept includes:
- neighborhood/community room ~180 m²;
- interpretation intro ~140 m²;
- foyer/coat/storage ~70 m²;
- support/WCs ~60 m²;
- lift;
- two remote stairs.

The civic bar is intended to remain independently operable after the market closes.

## Corrected CTE concept screen
The current DB-SI / DB-SUA screen is deliberately conservative and is **not final regulatory certification**.

Screened occupancies:
- Hard L0: ~160 people;
- Hard L1: ~231;
- Civic L0: ~291;
- Civic L1: ~300.

Current DB-SI dimensioning formulas used:
- doors/passes: A >= P/200, minimum 0.80 m;
- corridors/ramps: A >= P/200, minimum 1.00 m;
- non-protected descending stairs: A >= P/160.

Current design reservations:
- hard bar stairs: 1.50 m clear each;
- civic bar: 2.00 m shown, but up to 2.40 m reserved until the protected-stair strategy is resolved;
- principal accessible circulation: >=1.50 m;
- complex wheelchair maneuvers: Ø1.50 m turning zones.

Two end exits in a 45 m bar keep the longitudinal worst-case distance to the nearer end near 22.5 m before local room/cross-bar travel. Every actual origin must still be checked after partitions are frozen.

## Structural bay
The first explicit structural hypothesis is:
- 10 m transverse clear span;
- 5 m longitudinal rhythm;
- catenary-informed roof;
- ~1.4 m roof rise;
- repetitive edge supports;
- column-free market aisle/stall field.

This is a falsifiable structural concept, not engineering certification.

No curve survives merely because it looks Gaudí-like. Geometry must improve load path, span/depth, daylight, ventilation, acoustics, drainage, solar control or human experience.

## Environmental / operation
The ~10 m bar depth remains compatible with bilateral daylight and cross-ventilation logic while retaining materially more room-planning flexibility than C+'s ~5.6 m bands.

A+ can:
- open both bars during market hours;
- secure the hard bar after closing;
- keep civic/community/interpretation functions independently active;
- preserve the central public ground at all times.

## Critical visual verdict
Current deterministic / design-development quality:
- geometry evidence: 7/10;
- architecture maturity: 6/10;
- code/operations thinking: 6/10;
- structural resolution: 4/10;
- material quality: 3/10;
- lighting quality: 2/10;
- human experience: 5/10;
- competition visual quality: 3/10.

The visual gap remains large.

## Current render/tooling status
OpenSCAD remains useful as a deterministic geometry-check stage. In the current headless execution environment, PNG rendering fails because an OpenGL offscreen context is unavailable, so OpenSCAD should not become a production-render dependency.

Do not spend time polishing OpenSCAD.

## Next gate
1. choose protected vs non-protected stair strategy;
2. draw every support room to equipment-level dimensions;
3. check every origin-to-exit travel distance;
4. acoustic zoning between hard edge, civic edge and plaza;
5. structural analysis / one real joint;
6. authoritative municipal 3D/topography;
7. move the primary scheme to Blender/Cycles;
8. render one 1.55 m-eye-height material/light scene from authoritative geometry;
9. kill or radically iterate if that scene still feels generic.
