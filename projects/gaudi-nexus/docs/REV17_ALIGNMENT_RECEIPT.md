# Rev 17 — Municipal Context Reconciliation Receipt

## Status

**CORRECTLY ALIGNED COMPARISON — NOT YET CANONICAL**

Rev 17 combines the exact Rev 15 architecture/world with the checksum-pinned Barcelona municipal 3D crop in Blender 5.2. It preserves the old proxy for controlled comparison.

## Immutable inputs

- Rev 15 Blender SHA-256: `cc1179cd2c2b379f954cbc55eb995f88d0786e08b37abfaca7e71417c4b1d494`
- municipal crop GLB SHA-256: `f5c324141f1328666c528810b8212c3152f2b6970bd780c6bb4516ee8c3e3f1c`
- corrected Rev 17 Blender SHA-256: `78cd3253881f07178e7878711a6dc11efced02d7e45e0e5ee5f7ae655ac10fd5`
- report SHA-256: `bc775361219119be548a2cf270467974086856102c11b24fe4afe6a69f8faa37`
- build run: `37259743278`
- artifact ID: `11323444092`
- artifact digest: `sha256:2da26bd464f7dfa12b3f6acba38027da195d0b177684220154e82d9d7736307a`

## Axis restoration

The source municipal mesh is EPSG:25831:
- +X east
- +Y north
- +Z up

After glTF import, Blender mesh coordinates were observed directly as:
- X = source X
- Y = -source Z
- Z = source Y

Observed imported local bbox:
- min: [-274.528839, -120.805, -307.590118]
- max: [306.451172, 10.0, 315.100159]

To remove ambiguity from Euler/import metadata, Rev 17 restores source coordinates directly in mesh space:

`(x, y, z) imported -> (x, z, -y) source axes`

Object rotation is then reset to zero.

## Geographic alignment

Municipal crop origin -> earlier OSM plaza centroid:
- X: -14.958828 m
- Y: -105.191557 m

Measured Rev 15 `Plaza` polygon area centroid:
- X: -1.599535 m
- Y: 3.442506 m

Applied municipal translation:
- X: **+13.359293 m**
- Y: **+108.634063 m**
- Z: **0 m**

No plan rotation is applied. Both geographic systems already carry east/north axes and the Eixample orientation is embedded in geometry.

## Verified transformed context

Municipal world bbox after correction:
- min: [-261.170, -198.956, -10.000]
- max: [319.810, 423.734, 120.805]
- size: 580.980 × 622.690 × 130.805 m

This matches the expected 300 m competition-context crop orientation and elevation range.

## Visual reconciliation

### Top-down
**PASS.**

The municipal data now reads as coherent Eixample urban blocks around the plaza and exposes how crude the proxy context was. The proxy must not appear in competition-facing output.

### Existing HeroCam
The camera itself survives the context correction better than expected.

Screen-space projections from the unchanged 32 mm / 1.56 m HeroCam:

| reference | X | Y | depth |
|---|---:|---:|---:|
| proxy Sagrada bbox center | 0.518 | 1.006 | 186.7 m |
| municipal cluster bbox center | 0.559 | 0.776 | 184.5 m |
| municipal cluster weighted center | 0.542 | 0.525 | 181.4 m |

The old proxy's exaggerated vertical mass put its center effectively above frame. The municipal mass sits naturally inside the intended view sector.

**Conclusion:** preserve HeroCam as the baseline and refine it after proxy retirement rather than redesigning the camera from scratch.

## Important limitation

The municipal DWG is authoritative building/context geometry, but it does not by itself close all SITE_TRUTH requirements. We still need the municipal 1:1000 topographic data / level cross-check and final tree/furniture catalog before calling G1 completely green.

## Next gate

1. ingest/crop municipal 1:1000 topography;
2. recompute Passion-façade sightline with municipal heights;
3. recompute shadow baseline;
4. retire proxy Sagrada/context from competition outputs;
5. promote SITE_TRUTH_V1;
6. build the next canonical rendering revision from municipal context.
