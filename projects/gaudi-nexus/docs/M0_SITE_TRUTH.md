# M0 — Site Truth

## Objective
Create a reproducible, source-traceable digital twin of the competition site before architectural form-finding begins.

## Authority ladder
1. Competition-issued CAD/site drawings, if supplied.
2. Barcelona municipal/open GIS and cadastral geometry.
3. Official Sagrada Família data for basilica access/orientation references.
4. OpenStreetMap and other open geodata for context only, with attribution and cross-checking.
5. Generic Cerdà geometry only as a temporary sanity-check template.

## Coordinate policy
- Geographic: WGS84 / EPSG:4326.
- Working projected CRS: ETRS89 / UTM zone 31N / EPSG:25831.
- Blender/world axes: X east, Y north, Z up.
- Model units: metres.
- Never bake an arbitrary rotation into meshes. Store transforms explicitly.

## Required site layers
- competition boundary / plaza polygon;
- street and curb edges;
- Sagrada massing sufficient for silhouettes and sightline tests;
- surrounding block massing;
- tree trunks/canopies by source/confidence;
- metro/bus/access points;
- current paths, benches, kiosks and major public-space objects;
- solar vectors;
- protected view volumes;
- noise-source hypotheses;
- resident/tourist flow hypotheses.

## M0 outputs
- `site_truth.blend` generated from versioned data (once Blender is available);
- `site_truth.geojson` / layer files;
- an orthographic aerial proof image;
- an evidence/confidence legend;
- baseline sun/view studies;
- checksum manifest.

## Hard rule
No concept geometry is allowed to become authoritative while the site boundary or view relationship remains uncertain.
