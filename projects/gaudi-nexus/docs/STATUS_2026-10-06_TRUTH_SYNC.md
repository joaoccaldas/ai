# Gaudí Nexus — Truth Sync and Winning Critical Path

**Date:** 2026-10-06  
**Canonical project:** `joaoccaldas/ai` → `gaudi-nexus` → `projects/gaudi-nexus/`  
**Scheme:** Living Threshold A+  
**Purpose:** Align repository claims with the live 3D scene before further competition-facing rendering.

## Executive assessment

The architectural proposition is substantially developed. The remaining risk is not lack of content; it is a source-of-truth split between the live production scene, the validated municipal comparison scene, engineering/environmental evidence, and the final jury board.

Two readiness measures should be kept separate:

- **Brief-compliance readiness:** approximately **70–78%**.
- **Winning-readiness:** approximately **50–58%**.

These are project-management estimates, not official jury scores. The unfinished portion contains the most jury-visible and technically expensive work, so percentage complete must not be read as effort remaining.

## Confirmed live state

3D Jutsu project `6bfa2d88-eef7-4583-9d82-08218b0bf4e4` was inspected directly.

- live revision: **16**
- scene sequence: **6**
- objects: **1,601**
- meshes: **1,500**
- cameras: **2**
- active camera: **A_HERO_MUNICIPAL_F3**
- F3: **(-15, 42, 1.56), 32 mm**
- live collections: `21_PROGRAM_REQUIRED`, `ARCHITECTURE`, `CONTEXT`, `LANDSCAPE`, `LIGHTS`, `MARKET`, `SITE`
- authoritative municipal collection in live scene: **ABSENT**
- live blend etag: `6e363709b9f3d14ce29ec73571315454`
- live GLB etag: `e2a0f0b77cf42036c62ffd57e6470bc6`

### Critical finding

The F3 camera is present and active in the live scene, but the municipal context used to validate F3 exists in the separate Rev17 comparison evidence, not in the live Rev16 scene.

Therefore:

> **Do not call Rev16 SITE_TRUTH_V1 and do not use its context as final competition truth.**

The authoritative context must be integrated into the canonical scene, or the validated Rev17 lineage must be promoted after its remaining gates close.

## Rendering evidence

- Workbench F3 composition proof: **PASS as a renderable geometry check**
  - operation: `gaudi-r16-f3-workbench-20261006`
  - artifact: `fa5c862226fdc934f48eee4efe37140d`
  - 640×360
- Eevee F3 review: **TIMEOUT**
  - operation: `gaudi-r16-f3-preview-20261006`
  - 640×360
  - exceeded the 300 s worker limit

The Workbench render proves the camera can be rendered. It does **not** prove hero quality. The Eevee timeout means the iterative photoreal review path needs to be made cheaper before repeated hero tuning.

## Requirement distance

| Area | Current state | Winning gap |
| --- | --- | --- |
| Official program / architecture | Advanced; required kitchens and admin workstations scene-backed | net/gross reconciliation, BOH details, accessibility/egress closure |
| Plaza / urban context | Municipal geometry converted, aligned and compared | authoritative context absent from live scene; topography/levels/trees/furniture and final sightline/shadow closure |
| Gaudí logic | Structural logic and thrust proxies exist | engineer-grade form-finding/load path/joint proof |
| AI integration | Strong evidence-driven workflow and provenance | compress into one clear jury diagram and reproducibility story |
| Passive/environment | Baselines and proxies exist | annual solar/daylight, ventilation method, rainfall basis, acoustics |
| Material/construction reality | Rapidly advancing; PBR/provenance, trencadís, relief, fabric physics, lighting and props | verify in canonical site-truth scene and resolve visible connections/contact |
| Hero image | F3 geometry candidate selected and active | site truth first; then fast photoreal render path, pixel review and >=9/10 score |
| A1 board | Storyboard contract is good | final plan, section, axon, hero and evidence strip still missing |
| Optional A4 | Strong concept | final connection/material/accessibility proof and composition |
| Release | Auditor exists | final JPEGs, rights manifest, anonymity/metadata scrub and deadline recheck |

## Highest-value sequence

### P0 — Unify site truth
1. Bring the checksum-pinned municipal crop into the canonical production lineage, or promote the verified Rev17 lineage.
2. Preserve the known axis restoration and translation.
3. Add/cross-check municipal topography, levels, trees and street furniture.
4. Recompute Passion-façade sightline and shadow evidence.
5. Retire proxy context from competition-facing outputs only after the comparison passes.
6. Pin the resulting canonical blend/GLB hashes.

### P1 — Build the hero review loop
1. Keep F3 unless authoritative site truth invalidates it.
2. Separate render layers/collections or create a lightweight hero-review scene derived from the canonical binary without changing spatial truth.
3. Target fast 640–960 px Eevee previews first.
4. Lock exposure, Barcelona daylight, final PBR materials and foreground choreography.
5. Inspect actual pixels and score against the hero gate before expensive final rendering.

### P2 — Make the A1 now, not at the end
Build an A1 alpha as soon as authoritative plan/section exports exist. Missing cells should remain visibly marked rather than being filled with speculative graphics. Iterate the board in parallel with the model because the board will expose missing arguments faster than more asset creation.

### P3 — Close only jury-relevant engineering
Prioritize:
- structural load path/form-finding and support reactions;
- one convincing connection/joint detail;
- annual solar/daylight;
- ventilation method;
- rainwater basis;
- acoustic strategy.

Do not turn the competition into a full construction-document exercise.

## What to stop

Until P0–P2 advance, **do not prioritize additional decorative prop count**. Six more market objects can improve atmosphere, but another fifty will not compensate for a non-authoritative context, an unscored hero, or an empty A1.

## Recent visual-production progress already worth keeping

The current branch includes useful work that should feed the canonical visual pipeline rather than become a separate aesthetic branch:

- CC0 PBR base-texture provenance for Sagrada stone, plaza paving and vault tiles;
- stone relief and trencadís passes;
- catenary canopy sag and depth-of-field controls;
- warm pendant lighting and low-sun atmosphere;
- photographic finishing pass;
- procedural market props with per-asset build metadata.

## Decision rule

From this point forward, every task should answer one of two questions:

1. **Does it increase an official jury criterion using defensible evidence?**
2. **Does it remove a submission or source-of-truth risk?**

If neither is true, it is not on the winning critical path.
