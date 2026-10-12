# Canonical Scene Contract

## Authority
The competition must resolve to one canonical Blender scene before final representation.

## Required collections
- `00_SITE_MUNICIPAL` — authoritative municipal context, immutable after SITE_TRUTH_V1 promotion except by a new site-truth revision.
- `01_SITE_LANDSCAPE` — plaza ground, trees, furniture, accessibility routes.
- `10_ARCH_PRIMARY` — permanent structure and civic ground.
- `11_ARCH_SECONDARY` — roof, shading, glazing, replaceable architectural systems.
- `20_MARKET_KIT` — stalls, service chassis, counters, cold/dry storage.
- `30_ENTOURAGE_PEOPLE`
- `31_ENTOURAGE_BIKES`
- `32_ENTOURAGE_PROPS`
- `40_LIGHTING`
- `50_CAMERAS_EVIDENCE`
- `90_PROXY_CONTEXT_RETIRED` — old context retained for comparison until signed off, then hidden by default.

## Non-negotiables
1. Plan, section, axon and hero derive from the same scene.
2. Municipal context and design geometry never share an untracked transform.
3. Every imported context collection stores CRS, source hash and conversion-tool version in custom properties or manifest.
4. Rev 14 is not overwritten. A later revision is promoted explicitly.
5. Proxy context is hidden, not deleted, until comparison evidence is archived.
6. Competition cameras are named and immutable after final render approval.
7. No generative image process may invent or alter spatial geometry in competition-facing views.

## Rev 14 promotion blockers
- exact .blend binary not yet archived in repository lineage;
- municipal context not reconciled;
- hero not >=9/10;
- A1 not final.
