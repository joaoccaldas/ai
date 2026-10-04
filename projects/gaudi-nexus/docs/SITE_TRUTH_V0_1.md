# SITE_TRUTH_V0.1 — real public geometry

## Status
**Secondary/open-data cross-check.** This is the first Gaudí-Nexus site model using real Barcelona geometry instead of the generic Cerdà placeholder.

It is **not yet G1 authoritative site truth** because the competition-issued drawings and Barcelona 2026 municipal DWG/topographic files remain the higher-priority sources.

## Sources
- OpenStreetMap / Nominatim, ODbL 1.0:
  - Plaça de la Sagrada Família, OSM way 23431084
  - Basilica of the Holy Family, OSM relation 9194723
- CARTO public dataset `barcelona_building_footprints`:
  - block unions grouped by `c_illa` within 260 m of the plaza centroid.
- Barcelona City Council 2026 3D buildings page confirms a dedicated `DWG 3D (la Sagrada Família)` download under CC BY 4.0; that remains the target authority for the next replacement pass.

## Measured from current geometry
- Plaza centroid ↔ basilica centroid: **~138 m**
- Local model origin: plaza centroid 41.4026624, 2.1731664
- Current local axes: east / north / up.

## Visuals
- `output/site_v0_1/site_ortho.svg`: real horizontal geometry, no heights.
- `output/site_v0_1/site_axon.svg`: real horizontal geometry with deliberately normalized heights.
- The axon must never be presented as measured building height evidence.

## Gate assessment
- Real plaza geometry: **PASS secondary**
- Real basilica footprint: **PASS secondary**
- Real surrounding urban blocks: **PASS secondary**
- Municipal DWG/topographic ingestion: **OPEN**
- True building heights: **OPEN**
- Survey/topographic levels: **OPEN**
- Final Passion-façade sightline volume: **OPEN**
- Solar baseline on authoritative geometry: **OPEN**

## Critical visual score
- Spatial truth: **5/10**
- Presentation quality: **3/10**
- Competition readiness: **2/10**
- Improvement vs M0 generic block: material and necessary, but still far below final standard.
