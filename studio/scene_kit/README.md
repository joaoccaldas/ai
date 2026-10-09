# Scene Kit

Reusable Blender components extracted during Living Threshold visual development.
Imports have no scene side effects. Components do not know about Gaudí cameras,
municipal coordinates, program requirements or canonical promotion.

## Existing standards extended

This kit extends `studio2/docs/ARCHITECTURE.md` (streaming, adaptive DPR and
performance targets), the Gaudí render pipeline (Cycles authority, detail where
it matters), and the canonical scene contract (immutable context, retained
proxies and named cameras). It does not replace those contracts.

`contract.json` records units, axes, provenance, material/export rules and runtime
targets. Runtime targets must be measured on each delivered experience; a successful
offline render is not a mobile performance pass.

## Components

| Module | Purpose | Reuse boundary |
| --- | --- | --- |
| materials | limestone, paving, mineral, glaze, timber, fabric, foliage | caller supplies an unscaled world-coordinate Empty |
| geometry | tubes, ellipsoids, batched mesh creation | real dimensions; no per-leaf Blender objects |
| architecture | floor plates with explicit voids, measured mesh areas, switchback stair geometry | dimensioned coordination geometry; no GFA/code/structural certification |
| vegetation | seeded holm oak, branch hierarchy, leaf variation, shared instances | visual botanical approximation, hero/low detail choices |
| entourage | civic figures with tapered limbs, shoes, hair, bags | architectural entourage, not scanned people |
| lighting | solar direction, daylight, Metal/CPU Cycles presets | location/date/time/UTC offset explicit |
| market | open serving frames, cabinets, shelves, fittings | dimensions and front orientation explicit |
| landscape | seeded herbs, lavender, stone curbs, timber seating | proposed planting; caller checks placement and circulation |
| collision | separate low-poly static trunk, seat and stall profiles | suggested friction/restitution; engine integration remains caller responsibility |
| export / build_assets | evaluated mesh GLBs and standalone asset registry | portable PBR approximation, source objects retained |

```python
from studio.scene_kit.vegetation import holm_oak, instance_tree
asset = holm_oak('Oak', prototype_collection, bark, leaf_materials, seed=810)
instance_tree(asset, 'PlantedOak', (12, 8, 0), landscape_collection)
```

Keep prototypes in a hidden collection. Instances share mesh data. Pass local
seeds instead of mutating the process-global RNG. Add project adapters under that
project's `scripts/`, with camera registries and acceptance checks there.

## Physics and representation

Solar direction, leaf backlighting, microbump, roughness, clearcoat and contact
shadows are rendering behavior. They do not validate structure, wind, drainage,
annual energy or crowd circulation. Keep those claims in separate engineering
evidence. Do not introduce fake wind/fluid simulations as performance evidence.

Procedural shaders do not travel intact in glTF. Bake them before claiming web
material equivalence, or label exports as PBR approximations. Use the
[Khronos glTF validator](https://github.com/KhronosGroup/glTF-Validator) on exports.
The [glTF standard](https://www.khronos.org/gltf/) is the interoperability boundary.

Compile with `Blender -b --python-exit-code 1 --python studio/scene_kit/build_assets.py -- --output /new/assets`.
The current library emits 12 standalone assets plus a material library and registry.
For export validation, install Khronos `gltf-validator` in a separate tooling folder,
then run `NODE_PATH=/tooling/node_modules node studio/scene_kit/validate_glb.cjs /new/assets`.
The Gaudí adapter exports 39 static collision profiles through
`projects/gaudi-nexus/scripts/build_collision_world.py`; they remain separate from
the visual scene and are not a complete collision model of the buildings/site.

## Learning loop

Each adapter emits source hashes, preserved-object checks, component IDs,
render settings, measured durations, counts and limitations. Record failed API
assumptions as well as passing checks. Recipes are agent-authored until another
run/person independently verifies them. Never mark a visual gate approved from
the generator's self-report.

Blender 5.2.2 uses Principled `Anisotropic`, sky `MULTIPLE_SCATTERING`, and
`aerosol_density` names; probe the installed node API before porting an older script.
