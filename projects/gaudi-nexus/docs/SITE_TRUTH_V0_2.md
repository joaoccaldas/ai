# SITE_TRUTH_V0.2 — 2026-10-04

## What changed

V0.2 removes the generic Cerdà block as the main spatial model.

The current working site geometry now uses:
- the actual **Plaça de la Sagrada Família** polygon from OpenStreetMap/Nominatim;
- the actual Sagrada Família building outline from OpenStreetMap/Nominatim;
- surrounding block/parcel unions from the public `barcelona_building_footprints` CARTO dataset;
- a real OSM subway-entrance point on the plaza side;
- projection into **ETRS89 / UTM 31N (EPSG:25831)**.

## Measured / computed facts from the current model

- plaza area: **11,630.5 m²**
- plaza perimeter: **415.3 m**
- basilica outline area in the OSM geometry: **6,094.4 m²**
- plaza centroid → basilica centroid: **137.6 m**
- plaza centroid → nearest basilica boundary: **99.1 m**
- centroid bearing toward basilica: **45.35° from north**
- dominant plaza / Eixample grid axis: **44.14° from east**

These are valid for the current open-data geometry, but the municipal topographic/3D sources remain higher authority.

## Program-pressure finding

For the brief's **1,500–2,000 m² GFA**:

| arrangement | theoretical footprint | current-plaza occupation |
|---|---:|---:|
| 1 level | 1,500–2,000 m² | 12.9–17.2% |
| 2 levels | 750–1,000 m² | 6.4–8.6% |
| 3 levels | 500–667 m² | 4.3–5.7% |

This is not an argument for height by itself. It reveals the scarce resource: **public ground**.

The next concepts must therefore prove why any square metre of plaza they occupy deserves to become enclosed or structurally committed space.

## Higher-authority source path now confirmed

Barcelona Open Data CKAN confirms:
- **Topografic_1-1000.gpkg**
- resource size: **652,088,394 bytes**
- no token required
- license: **CC BY 4.0**

The Barcelona Dades 2026 3D product also explicitly lists:
- **DWG 3D (la Sagrada Família)**
- source: Ajuntament de Barcelona
- license: **CC BY 4.0**

The web download UI is currently the remaining ingestion friction, not source availability.

## Visual quality

Current V0.2:
- geometry/evidence integrity: **7/10**
- analytical clarity: **5/10**
- competition visual quality: **4/10**
- architectural content: **0/10**, intentionally

## Gate state

**G1 SITE_TRUTH is still RED.**

It becomes green only after:
1. municipal topographic geometry is ingested/cross-checked;
2. the 2026 neighbourhood DWG is ingested or explicitly reconciled;
3. real vertical levels/heights exist;
4. existing trees/site furniture are catalogued;
5. the Passion-façade sightline volume is authoritative;
6. shadow studies use real heights.
