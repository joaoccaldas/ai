# A+ — Living Threshold V0.4

## Status
PRIMARY SCHEME — still killable.

## Architectural contract
Two low, Cerdà-aligned inhabited bars remain the core architecture.

- hard market / service bar: 45 × 10 m ground footprint;
- civic / interpretation bar: 45 × 10 m ground footprint;
- two occupied levels;
- no occupied bridge across the civic middle;
- maximum enclosed height target: ~9.0 m.

## Area control
Ground:
- 900 m² total.

Upper:
- ~836 m² after modest set-back.

Total GFA:
- ~1,736 m².

Current plaza occupation:
- ~7.7%.

This sits inside the competition's 1,500–2,000 m² target.

## Program control
Approximate control split:
- market + neighborhood: ~781 m²;
- interpretation + viewpoint: ~434 m²;
- shared / cooking: ~260 m²;
- admin / logistics: ~261 m².

These are control totals, not final room schedules.

## Operational asymmetry
### Hard market / service bar
- delivery;
- cold/dry storage;
- waste;
- food prep;
- trader support;
- wet cores;
- market stalls;
- concentrated exhaust/services.

### Civic / interpretation bar
- community;
- cooking/workshops;
- interpretation;
- viewpoint;
- neighborhood room;
- public WC/access core;
- independent evening access.

## Civic middle
Remains unprogrammed public ground.

It is not:
- leftover circulation;
- service route;
- event-only space;
- an occupied bridge.

## Environmental logic
Representative bar depth is ~10 m.

A bilateral daylight-depth heuristic using a 3.0 m window head and a 2.5× reach gives ~7.5 m from each façade. The two daylight zones overlap across the entire bar depth.

This is a geometry screen only, not a lux/daylight-factor claim.

## Operation
The market/service bar can close while the civic/interpretation bar remains open.

This is one of A+'s strongest advantages over stacked C+.

## Render truth
A deterministic OpenSCAD model exists in `models/a_plus_v0_4.scad`.

The model:
- uses the current optimized bar positions;
- includes people, trees, stalls, columns, upper volumes and roof strips;
- has fixed iteration ranges so columns/shading actually instantiate;
- hides non-authoritative Sagrada context by default.

OpenSCAD remains a geometry-check stage, not the final renderer.

## Current kill conditions
A+ dies or radically changes if:
1. detailed support rooms consume the market flexibility;
2. acoustic separation fails;
3. two bars feel like detached pavilions;
4. real municipal heights/topography reverse current shadow/view conclusions;
5. the first authoritative material/light scene feels generic.

## Next proof
- dimensioned support rooms;
- stairs/lifts/accessible WCs;
- trader/customer/delivery/waste route separation;
- structural 5 m bay + one buildable joint;
- acoustic zoning;
- municipal-height daylight/shadow rerun;
- Blender/Cycles human-scale camera.
