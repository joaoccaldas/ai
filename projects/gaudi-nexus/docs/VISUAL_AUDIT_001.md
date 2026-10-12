# Visual Audit 001 — 2026-10-04

## Purpose
This is a deliberately severe review of the **real rendered evidence we already have** from the reusable 3D stack, and of the current Gaudi-Nexus visual output.

The goal is to stop confusing "working 3D" with "competition-grade visual communication."

## A. Current Gaudi-Nexus output

### M0 site template
Current output is a chamfered Cerdà-block calibration model:
- 113 m side
- 14 m chamfer legs
- 12,377 m²
- authority: `template_only`

**Competition visual quality: 1/10.**
That is intentional. It is geometry validation, not architecture.

**Technical value: 7/10.**
It proves coordinate/tolerance/provenance discipline and gives us a deterministic starting object.

### What is missing before a first real architectural render
- authoritative competition boundary;
- municipal 3D context;
- Sagrada geometry adequate for view tests;
- true north and topography;
- trees and public-space objects;
- site access and movement evidence;
- actual architectural geometry.

No generated photorealistic image is allowed to disguise these gaps.

---

## B. Reusable rendered evidence

### Studio-Kona — verified overview
Path: `joaoccaldas/studio-kona/renders/review/30_verified_overview.png`

**What works**
- proves large geospatial scene assembly;
- real-world texture/context registration;
- route/state overlays;
- camera navigation and application shell.

**What fails**
- debug-looking geometry and route lines dominate;
- context massing is crude;
- atmospheric depth is weak;
- water and terrain shader quality is visibly game-prototype level;
- UI competes with the scene;
- insufficient material/lighting fidelity for architecture jury work.

**Competition-grade visual score: 2.5/10.**
**Reusable systems score: 7/10.**

### Studio-Kona — verified pier
Path: `joaoccaldas/studio-kona/renders/review/31_verified_pier.png`

**What works**
- first-person scale;
- deterministic placement;
- spatial interaction proof.

**What fails**
- proxy buildings;
- almost no convincing surface/material hierarchy;
- label collisions and visual clutter;
- flat lighting;
- low environmental realism;
- no architectural detail language.

**Competition-grade visual score: 1.5/10.**
**Reusable spatial-validation score: 6/10.**

### Studio-Kona — 2019 bike studio
Path: `joaoccaldas/studio-kona/renders/review/33_verified_studio_2019.png`

**Critical defect**
The screenshot does not convincingly show the bike. As visual proof this is effectively a failure even if the surrounding UI works.

**Competition-grade visual score: 0.5/10.**
This is exactly why Gaudi-Nexus requires visual evidence gates, not "page loaded" gates.

### Studio-Kona — 2027 bike studio
Path: `joaoccaldas/studio-kona/renders/review/35_verified_studio_2027_cfr.png`

**What works**
- good UI hierarchy;
- object/material controls are legible;
- scene is interactive and composited cleanly.

**What fails**
- object geometry is visibly simplified;
- silhouette/proportions and component details are not presentation-grade;
- lighting is generic;
- contact shadows/material response are weak;
- scene reads as product prototype, not premium visualization.

**3D visual score: 3/10.**
**UI score: 7/10.**

### Kona.m procedural bike renders
Representative paths:
- `renders/atlas/lotus-108-1992.png`
- `renders/atlas/type-disc-superbike.png`
- `renders/atlas/zipp-2001.png`

**What works**
- deterministic procedural geometry;
- recognizable design families;
- clean controlled studio framing;
- usable material/lighting baseline.

**What fails**
- geometry is too approximate for a design jury;
- some components float or simplify real mechanical junctions;
- no micro-detail;
- materials remain synthetic;
- shadows and highlights expose low geometric fidelity;
- reference accuracy is not demonstrated in the image itself.

**Competition-grade visual score: 4/10.**
**Procedural pipeline value: 8/10.**

---

## C. Non-negotiable Gaudi-Nexus visual threshold

Before any image is called "final":

1. **Geometry**
   - silhouette survives black-only render;
   - no proxy massing inside hero camera;
   - no floating/interpenetrating junctions;
   - structural connections read plausibly at board scale.

2. **Lighting**
   - daylight direction derives from real site/date;
   - contact shadows anchor every major object;
   - exposure protects highlight and shadow detail;
   - atmosphere supports depth without hiding geometry.

3. **Materials**
   - scale-correct texture;
   - plausible roughness hierarchy;
   - edge/joint behavior visible;
   - no generic "AI gold / glossy biomorph" aesthetic.

4. **Camera**
   - lens and eye height recorded;
   - human scale understandable;
   - Sagrada relationship intentional;
   - no wide-angle distortion used to fake spatial generosity.

5. **Entourage**
   - people indicate actual use patterns;
   - density is analytically plausible;
   - no cloned AI crowds;
   - residents and visitors are spatially legible without caricature.

6. **Consistency**
   - render, plan, section and axon all derive from the same model;
   - zero geometry invented only for the hero image.

## Target
For the final A1 hero, anything below **9/10** on geometry, light, material, composition and spatial truth is rejected.
