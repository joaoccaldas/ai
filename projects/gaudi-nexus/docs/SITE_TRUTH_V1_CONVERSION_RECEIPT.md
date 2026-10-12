# SITE_TRUTH_V1 Conversion Receipt

## Source
- Barcelona municipal Barri 06 / la Sagrada Família 3D building model
- DWG R2018
- EPSG:25831 / ETRS89 UTM 31N
- units: metres
- source date: 2026-05-20
- source ZIP SHA-256: `186ed46321b9ec3baf7f6dc14235a32a8dd7a3fa54d32e815cddc4d0a91d9ef9`

## Trusted conversion
- converter: ODA File Converter
- release: 27.9 AppImage
- converter SHA-256: `f2a8e125e84eee32d88c6d06d957c05b71c3b53b44304b1c479e466b2b0929ff`
- output: DXF R2018
- DXF bytes: 177,781,497
- DXF SHA-256: `d7653777a0a66023dacae6c44484a39b5423dd9463f44cbd5ddc1aca54330ec7`

The DXF parses as 11,749 true 3D MESH entities.

## Competition-context crop
Official brief coordinate transformed to EPSG:25831:
- local XY: 430901.597832363, 4583892.983829999
- local Z datum used for working crop: 33.0 m
- crop radius: 300 m

Result:
- municipal mesh entities: 2,900
- vertices: 62,188
- triangles: 113,640
- local bbox: [-274.529, -307.590, -10.000] → [306.451, 315.100, 120.805]
- GLB bytes: 2,110,684
- GLB SHA-256: `f5c324141f1328666c528810b8212c3152f2b6970bd780c6bb4516ee8c3e3f1c`
- durable Higgsfield file media id: `eaef5ac9-3706-45dc-809e-73c0b8b4c864`
- receipt media id: `c31262b3-2364-469f-b4d3-85a6215a4dd2`

## Gate status
Conversion and crop are complete.

SITE_TRUTH_V1 is **not yet promoted**, because the cropped municipal GLB has not yet been imported into Rev 15 and compared against proxy geometry. Current 3D Jutsu import tooling accepts curated catalog GLBs, not arbitrary custom GLBs. We therefore fail closed rather than bypassing the import boundary.

Next:
1. supported custom-file import;
2. side-by-side proxy/municipal reconciliation;
3. sightline + shadow proof;
4. proxy retirement;
5. SITE_TRUTH_V1 promotion.
