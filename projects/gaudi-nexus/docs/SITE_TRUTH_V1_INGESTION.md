# SITE_TRUTH_V1.0 — Authoritative Ingestion Plan

## Goal
Replace the current secondary OSM/CARTO context with authoritative Barcelona municipal data without breaking the project's existing local-coordinate contracts.

## Authority
1. Competition-issued drawings/assets.
2. Barcelona municipal topographic GPKG.
3. Barcelona municipal Sagrada Família neighborhood 3D DWG.
4. ICGC cross-checks.
5. OSM/CARTO only as secondary validation.

## Locked working CRS
Target working CRS remains **EPSG:25831 / ETRS89 UTM zone 31N**, pending confirmation against source metadata.

## Ingestion stages

### A. Archive raw sources
Store outside Git where file size/licensing makes raw binaries inappropriate.

Record:
- source URL;
- retrieval UTC;
- original filename;
- byte size;
- SHA-256;
- source license;
- CRS / vertical datum;
- source version/update date.

### B. Inspect municipal GPKG
Inventory all layers and identify:
- curbs / road edges;
- spot levels / contours;
- trees / urban furniture;
- building footprints;
- transit/access objects;
- plaza features.

### C. Crop
Use a reproducible competition context extent:
- minimum: full intervention block;
- working urban context: enough surrounding Eixample to make views, shadow and approach sequences credible.

Never edit source geometry manually before archiving the raw/cropped lineage.

### D. Convert municipal 3D DWG
DWG is an ingestion boundary, not an authoring dependency.

Preferred intermediate:
1. DXF or IFC if semantic layers survive;
2. otherwise GLB/OBJ + separate metadata;
3. normalize units and transforms before Blender import.

### E. Reconcile
Generate a discrepancy report against current OSM/CARTO model:
- boundary displacement;
- building footprint differences;
- context heights;
- plaza area;
- basilica outline/reference;
- tree/location differences.

### F. Promote authority
Only after reconciliation:
- generate `SITE_TRUTH_V1_0.geojson`;
- generate Blender context;
- regenerate sightlines/shadows;
- update evidence registry;
- mark secondary context as superseded.

## Gate
No final environmental claim or hero render may be signed off before SITE_TRUTH_V1.0 closes.
