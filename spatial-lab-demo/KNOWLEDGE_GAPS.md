# Top 10 3D Competency Gaps

These are the ten knowledge bases we should deliberately build next. A topic is not considered learned until it transfers to a measured artifact.

| # | Knowledge base | Why it matters | Evidence we need |
|---|---|---|---|
| 1 | Perceptual error / screen-space LOD | We still choose much detail by intuition. Pixel contribution and perceptual error should drive geometry/texture effort. | cross-device reference scene, projected-error thresholds, user-visible quality deltas |
| 2 | Physically calibrated materials | Hyperrealism in bikes, shoes, watches and architecture is often material/lighting limited rather than polygon limited. | measured carbon/metal/rubber/glass/fabric reference library and render comparisons |
| 3 | XR GPU/CPU frame-budget engineering | Stereo rendering, thermal throttling and reprojection change the bottleneck model. | Quest frame timing, GPU/CPU bound classification, thermal runs |
| 4 | Lighting transport across device tiers | We need a repeatable rule for baked GI, probes, realtime lights, HDR environments and shadows. | one scene rendered through lighting tiers with quality/cost comparison |
| 5 | Semantic asset decomposition | AI-created assets become much more useful when parts/material slots/scale/anchors are machine-readable. | sports-equipment part ontology + validators + exploded-view tests |
| 6 | Hybrid capture representations | Mesh, photogrammetry and Gaussian splats have different strengths. We need evidence for when each wins. | EXP-SPLAT-INTEROP-001 and hybrid room benchmark |
| 7 | Deterministic procedural source authority | Scaling AI asset creation requires diffable, reproducible construction logic rather than opaque binary-only edits. | EXP-BLENDER-ASSET-AS-CODE-001 with byte/geometry determinism |
| 8 | Scientific sports geometry / aero simulation | Visually plausible bikes are not necessarily geometrically or aerodynamically meaningful. | Generic Cyclist Model + CFD/wind-tunnel validation with uncertainty |
| 9 | World streaming / memory residency | Large worlds fail on mobile/Quest through memory and lifecycle before raw polygons alone. | room residency traces, texture/GPU memory, eviction and reload benchmarks |
| 10 | Visual validation science | “Looks amazing” is not a metric. We need calibrated cameras, silhouette, pixel/perceptual and material error. | golden cameras, IoU/edge/SSIM/perceptual comparisons plus human review rubric |

## Competency rule

Every reusable lesson stores: source revision, device, scene, intervention, baseline, candidate, visual delta, performance delta, confidence and failure conditions.
