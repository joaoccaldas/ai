# Rev 17 — Municipal Alignment Receipt

## Status

**ALIGNED COMPARISON CANDIDATE — NOT PROMOTED**

Rev 17 exists to reconcile the current visual world against the Barcelona municipal 3D context without deleting or overwriting Rev 15.

## Immutable inputs

- Rev 15 Blender SHA-256: `cc1179cd2c2b379f954cbc55eb995f88d0786e08b37abfaca7e71417c4b1d494`
- municipal crop GLB SHA-256: `f5c324141f1328666c528810b8212c3152f2b6970bd780c6bb4516ee8c3e3f1c`
- Rev 17 aligned Blender SHA-256: `67cc3eeb60838b1ca684d127f1bde4da987db8923617c997b80414a7526eed24`

## Alignment

The municipal source uses EPSG:25831 with +X east, +Y north, +Z up.

The GLB interchange maps those axes on Blender import as:
- X -> X
- Z -> -Y
- Y -> Z

Therefore the comparison build restores source axes with:

- rotation X: **-90°**

The municipal crop was localized around the official brief coordinate. The earlier OSM site model uses the plaza centroid as its working geographic anchor.

Municipal crop origin -> earlier plaza centroid:
- X: -14.958828 m
- Y: -105.191557 m

Measured Rev 15 `Plaza` polygon area centroid:
- X: -1.599535 m
- Y: 3.442506 m

Therefore the municipal collection translation is:

- X: **+13.359293 m**
- Y: **+108.634063 m**
- Z: **0 m**

No plan rotation is applied. The ~44.14° Eixample grid rotation already exists in both the geographic data and the architectural geometry.

## Safety

- municipal geometry enters as `00_SITE_MUNICIPAL_IMPORTED`;
- proxy context is preserved;
- no architectural object is moved;
- HeroCam is unchanged;
- Rev 17 is not canonical until numeric and visual reconciliation passes.

## Early finding

The municipal cathedral/context cluster lands close to the proxy's horizontal center, suggesting the viewing direction was broadly right. The authoritative footprint/form differs materially, so the proxy cannot remain competition-facing.

## Next gate

1. transformed-bbox verification;
2. top-down municipal vs proxy evidence;
3. HeroCam municipal vs proxy evidence;
4. sightline/shadow recomputation;
5. retire proxy context;
6. promote SITE_TRUTH_V1 + next canonical world revision.
