# Decoration candidates and a lighter vessel

Two new supporting-prop designs extend `props.py` and the existing registry: a hollow ribbed terracotta planter and an oak-louvred lantern with brass handle/rings and opaque porcelain diffuser. A third recipe is a deliberate display variant of the existing vessel. No new registry, renderer, scheduler or cloud service.

| Candidate | Triangles | GLB bytes |
|---|---:|---:|
| `planter_ribbed` | 16,896 | 305,500 |
| `lantern_louvred` | 4,544 | 1,555,324 |
| `vase_fluted_display` | 16,128 | 297,120 |

The detailed vessel remains unchanged: 46,080 triangles / 838,540 bytes. The display variant has 65% fewer triangles and 64.6% fewer bytes, but 32 broader flutes instead of 48 and fewer profile samples. Matched 980 × 450 shared-inspector captures show a similar outline and visibly different flute spacing. Neither equal appearance nor faster frame rate has been established.

The planter's rim, hollow interior, ribbing and floor contact are visible. It contains no plant; drainage, physical material accuracy and manufacturing suitability are untested. The lantern's slats, handle and separate material slots are visible; it is an opaque decorative form, not a live light. Its generated wood grain remains too repetitive for a foreground hero brief. All are candidates; no independent or consuming-room acceptance.

## Failures preserved

1. First lantern source check failed: ten zero-area bevel faces. Inspection located them on wood slats. Beveling each slat at the local origin before rotation/placement repaired the source construction; the positive-area check now passes. No broad deletion/repair heuristic was applied to older assets.
2. A 192-segment, 48-flute vessel violated the existing minimum density rule. The generator rejected it. The explicit 32-flute variant respects the rule; the guard was not weakened.
3. A markup replacement initially misplaced two closing tags in the Playbook draft. Source review corrected them before the post-edit browser captures; expandable steps, failure table and chapter selection were exercised. JS syntax alone was insufficient to check HTML structure.

## Exact evidence and gates

Ignored source output: `projects/gaudi-nexus/output/decoration-study-2026-10-18/`. It retains both failed source logs, the final eight-check pass, input plan, batch receipt, build sidecars, manifests, three GLBs and Khronos reports (zero errors/warnings each). Blender 5.2.2 LTS; geometry-only factory startup and disabled auto-execution. No Blender image render. The batch receipt pins source bytes, tool version and actual elapsed export time; one run is not a throughput benchmark.

Private runtime captures and page audit are in the Atlas's `output/page-review/content-and-props-20261018/`. Current recipes are matched against exact source outputs and full receipts; earlier outputs are preserved. Next gates: room placement, directional wood UVs, material/lighting review at intended distances, actual device loading/GPU evidence, intended-use rights and independent visual acceptance. Do not push this source checkout or call the candidates production-ready.
