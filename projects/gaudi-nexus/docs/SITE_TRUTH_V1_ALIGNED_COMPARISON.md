# SITE_TRUTH V1 — Aligned Comparison Receipt

## State

The authoritative Barcelona municipal context has now been converted, cropped, imported into the exact Rev 15 Blender scene, axis-restored, aligned by plaza centroid, and rendered side-by-side with the legacy proxy context.

This is **not yet proxy retirement**. It is the comparison gate immediately before promotion.

## Exact inputs

- Rev 15 Blender SHA-256: `cc1179cd2c2b379f954cbc55eb995f88d0786e08b37abfaca7e71417c4b1d494`
- municipal crop GLB SHA-256: `f5c324141f1328666c528810b8212c3152f2b6970bd780c6bb4516ee8c3e3f1c`

## Alignment

Both source and scene use east / north / up.

glTF import axis restoration:
- imported coordinates -> source axes: `(x, y, z) -> (x, z, -y)`

Plaza-centroid translation:
- X: **+13.359293 m**
- Y: **+108.634063 m**
- plan rotation: **0°**

Anchor:
municipal OSM plaza centroid -> Rev 15 `Plaza` polygon area centroid.

## Rev 17 candidate

- Blender SHA-256: `3de0f2062cd2a465a0322cfa1828d3b16b2267c6ffc31dfee22fcc51b5c47bcf`
- report SHA-256: `0d43c9a84b1993ef40bf4103f26d25b44b30148dcfcbddabe5277da16ff663e8`
- total objects: 1,602
- municipal context remains isolated in `00_SITE_MUNICIPAL_IMPORTED`
- legacy proxy remains intact for comparison.

## Findings

1. The previous proxy placed the cathedral in approximately the correct broad location.
2. Its plan extent and vertical representation are materially different from the municipal 2026 model.
3. The existing HeroCam does not make the cathedral relationship sufficiently legible in either comparison.
4. The final hero camera is therefore rejected, while the scene itself remains valid for continued development.

## Next gate

- finish human-height unobstructed camera search;
- quantify municipal vs proxy sightline/shadow differences;
- hide/retire the proxy context;
- promote municipal context to `SITE_TRUTH_V1.0`;
- derive final hero, plan, section and A1 from that promoted scene.
