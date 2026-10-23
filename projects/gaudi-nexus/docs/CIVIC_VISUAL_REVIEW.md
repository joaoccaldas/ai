# Civic visual review

21 October 2026. Agent-authored design-development review; no independent jury,
owner, physical-device or construction acceptance.

## Reuse decision and requirements

Extend `studio/scene_kit/market.py`, `materials.py` and the existing Gaudí
`coordinate_visual_candidate.py` / remote-render workflow. Keep the municipal
source `2cef25d126a17cd653422d778367c73561093972fc8eace190114b80a7584875`,
the 2,090 prepared non-camera object signatures and the three baseline cameras.
No parallel renderer, prop library or public website was created.

Hub discovery/preflight was consulted; selected evidence was fetched before use:
`628d206caf7f9642e7f46575fbaefb07f39c4cafb7704bc1ce2e28f6790a30cb`
(remote pipeline lead),
`78e022c9418ab81fa490994b7a67673c68d401261fdc0d55a61a0224fee2e301`
(historical V3 pixel failure), and
`f975cd56a48c1e965532d47b9d25724342492b7d616b4f6c9cee72e6547c2b7b`
(existing stalls/crates). Historical reports were checked against current code,
V6 artifacts and newly generated geometry rather than treated as instructions.
The selected shared components are already implemented; no new package or paid
service is needed. The company 3D lookup failed validation on unrelated records;
this coverage gap was preserved, with no silent fallback. The selected research
intake distinguishes parabolic equal-horizontal-load models from catenaries,
portable PBR approximations from procedural Cycles materials, and measurements
from quality acceptance.

The [current organizer FAQ](https://archademy.ai/faq/) permits a flat-site
assumption and excludes planning codes/slopes/subsurface infrastructure from the
conceptual competition. The obsolete topography prerequisite was removed from
the current source manifest and retained as a superseded historical blocker.
This does not promote the separate municipal scene or certify construction.
The FAQ states a 10 MB A1 cap while the homepage/earlier brief state 15 MB;
the submission auditor now enforces the stricter 10 MB working cap. Original
requirements remain preserved alongside the dated clarification. The homepage
still lists 16 December 2026, 23:59 GMT-7. Final participant-area checks remain.

## Design changes and purpose

| Change | Why it serves the brief | Remaining limit |
| --- | --- | --- |
| Metre-scale stone, timber and linen; lime soffit | Make durable civic materials and human scale legible | Procedural response; not a physical material sample |
| Removable stall shade/signboard and protective front ribs | Distinguish traders, tame the repeated empty frames, express replaceable equipment | Designed cosine shade; not simulated cloth; named traders are hypothetical |
| Proposed timber soffit baffles | Give the flat lower floor an inhabitable ceiling rhythm | No acoustic performance is claimed |
| Fewer close illustrative figures and less orange pendant light | Keep the market and its aisle as the subject | Entourage remains schematic |
| Equal-point-load polygon and inverted compression display | Fit out the interpretation programme with a teachable Gaudí-related rule | Not historical Sagrada geometry, a catenary, or building structural approval |

The 20 fitted stalls, 3.2 m aisle, two independent teaching layouts, eight admin
workstations, area allocation and upper-floor/stair geometry are retained.
The new accessories stay within their 2.5 × 2.4 m stall footprint. The display
is located in the upper Civic interpretation zone, with an additional detail
camera. Existing arrival/market/plaza cameras, lenses and source geometry remain.

## Baseline, candidate and validation

Baseline: actual V6 run **38057112692**, candidate blend
`418b504b328c107d707b47101918d7cb8813913123272c455dd735d76bb13f55`.
Its arrival, market and plaza PNGs and adjacent receipts were downloaded and
inspected. Current study: `output/civic-visual-20261021/RESEARCH.json` and its
remote subfolder. Candidate remote run:
[39542668513](https://github.com/joaoccaldas/ai/actions/runs/39542668513).

Before image review, the declared hypothesis is that material scale, stall
identity, ceiling rhythm and a quieter foreground improve the same market view.
The expected winner is the candidate market; `prediction.matched` remains unset
until actual pixels are assessed. No arbitrary jury score is assigned.

Executed local checks: six meaningful new mesh/behavior checks, including both
customer orientations, actual emitted-cable equal-load equilibrium, positive
polygon areas, deterministic geometry, invalid parameter rejection and local-anchor export without source movement. The two
new GLBs are 27,484 and 53,764 bytes; both have zero Khronos errors and warnings.
Those are fixture-material validation exports. The separate final authored package retains the actual palette and sign geometry (75,500-byte identity and 54,928-byte table); both authored GLBs also pass with zero errors/warnings and carry explicit inspector directions. All portable materials remain constant PBR approximations. Geometry preparation preserves all 2,090
incoming non-camera signatures and passes sampled clearances for the three old
views plus the new detail view. No Mac Blender image render was invoked.

The existing project/release tests pass (29 project tests plus four release-gate
tests after the stricter-size regression). The source contract validator passes.
The release audit still rejects unapproved site identity, hero/board/rights and
other open evidence. A missing realism-playbook path was reconciled against the
historical file in another worktree and replaced with current guidance; old
shader-enrichment suggestions are not authority to bypass current guards.

## First real pixel review and refinement

Remote run 39542668513 completed successfully. All four PNG hashes match their
receipts and the same prepared scene `d3c97de524c5510de4fbd4321759bac4c0f81a16817e032dab04b6e78629e5eb`.
All three baseline camera matrices/lenses were also compared directly between
Blender files, not inferred only from captions. The market is a clear
agent-judged improvement: coherent ceiling rhythm, identifiable traders, tactile
fronts and paving, with reduced foreground distraction. The arrival is largely
unchanged; the simplified cathedral remains the dominant realism limitation.
The new method display is physically present but too dark against its background.
It is rejected as a final exhibit image despite passing pixel range.

V1 render seconds: arrival 90.70, market 199.57, plaza 71.73, method 241.96.
These are one-run observations, not a benchmark or claimed speedup. Elapsed time was higher for the new
market in this run; runner hardware/variance were not controlled, and these
quality changes do not establish render efficiency. Raw V1 frames and the successful run remain preserved.

Pixel inspection also found hard rectangular brown floor marks. Source-native
ray probes identify `WetPatch_1` / `WetPaving`, superseded wet-scene props left
above the new dry floor. The V2 source retains these originals but hides them.
It adds actual ceiling-mounted accent lights to the method exhibit, keeping the
sun, exposure and camera fixed. V2 is a bounded market/display rerender; the V1
wide views must not be silently relabelled as V2 final-scene evidence.


## V2 decision and A1 alpha

[Run 39544165538](https://github.com/joaoccaldas/ai/actions/runs/39544165538)
succeeded with the bounded market/display pair. Both actual PNGs were inspected
and their hashes verified against the same prepared scene:
`9a4835304914fbd8a61f53df190ea2214aa8b10cd86e25e022c63674b5066c4b`.
Market render time was 200.02 s; display 241.43 s. These are individual observed
runs, not a performance benchmark.

**Retain V2 as the next visual study.** The market has continuous dry paving with
the hard rectangular marks removed. The display's timber arch, hanging weights
and caption are more legible under its actual mounted lights. The upper screen
and rail background still competes with the thin model. This is a useful
improvement, not final exhibit or competition acceptance. The complete V1 and
rejected dark display remain preserved.

Local study directory: `output/civic-visual-20261021/`. Start at
`refinement-v2/review.html`: its market comparison uses the preserved V6 source,
and its display comparison uses rejected V1, with per-view source labels and
receipts. Current images are both V2. URLs include their image hashes so a copied
historical file's older modification date cannot conceal a changed baseline in
a browser cache. Desktop and phone checks decode every image, show no horizontal
overflow and return 200 for every evidence/board link.

`refinement-v2/A1-alpha.svg` is a real A1-size working layout, using both V2
renders and a ground plan/market section derived from that exact V2 blend. The
generator rejects different-scene drawing/render receipts and changed image
hashes. The alpha was rasterized in the browser and visually inspected. It is
explicitly a **working SVG**, not a final submission JPEG: primary context hero,
plaza-edge reconciliation, final rights/independent review and participant number
remain open. No personal name or studio logo was added. The master renders
remain unretouched; browser rasterization assembles the page and does not invoke
Blender rendering on this Mac.

Both authored component GLBs from the actual V2 output pass Khronos validation
with zero errors and warnings. Floor-centred anchors and inspector directions
are present; procedural materials remain declared PBR approximations. The
source review is [draft PR #115](https://github.com/joaoccaldas/ai/pull/115),
stacked on the existing visual-development branch, with no main merge.

## CI, comparison integrity and learning

The first real contract run failed because its clean Python environment lacked
Pillow; both the existing submission audit and the new comparison tests import
it. The workflow now explicitly installs Pillow 13.0.0. The current official
[release notes](https://pillow.readthedocs.io/en/stable/releasenotes/13.0.0.html)
were checked, and all 29 tests pass in an isolated Python 3.12 environment with
that pin. The four release-gate tests pass separately. The replacement contract
CI run passed; final head checks are recorded in the delivery receipt.

The comparison builder rejects changed image hashes and mismatched camera/profile
fields. Selected-view mode avoids dead links to unrendered views. The V1 page
was checked at 1440 and 390 px: every PNG decodes, evidence links return 200 and
there is no horizontal overflow. V2 gets its own page and labels; V1 context
frames remain distinct.

The actual emitted polygon, rather than its name, is checked for the declared
load rule. Authored delivery assets are separate from fixture-material geometry
exports. Export copies receive the inverse anchor transform while the source
object remains unchanged. A local packaging attempt also exposed a repeated
whole-scene signature call inside the per-object comparison; that own process
was stopped and the snapshot was hoisted to one call before the successful
repeat. No original source or image was changed by that failed attempt.

## Drawing-led finding: plaza edge fit remains open

The new geometry-derived projections expose a useful problem that the distant
arrival render conceals. A 10 × 5 sample grid across each actual ground slab
finds one Hard point and four Civic points outside the current plaza surface.
The sampled coordinates are retained in `plaza-contact-sample.json`. This is
source-surface evidence, not a municipal legal-boundary determination. The
candidate therefore must not claim fully resolved plaza fit. Moving both bars
inward without checking the protected F3 corridor, stair cores and programme
would trade one problem for another; reconcile the exact edge/core geometry in
its owning coordination source before promotion. Original sources are retained.
The review drawings include actual kitchens/fixtures and equipment sections,
with schematic planting symbols explicitly labelled.

## Next competition work

The actual full-plaza plan, section, one dominant hero and compact AI
option/rejection/evidence diagram remain the A1 priorities. The basic municipal
massing cannot provide sculptural cathedral realism. Keep that source limit
visible, and do not fill it with invented geometry or an unrelated photograph.
The optional stall A4 still needs its proposed transformation, service interface
and accessible approach resolved; these new identities do not implement that
larger transformable stall contract. Promote only reviewed derivatives, with
rights and independent owner/visual gates explicit.

## Whole-proposal audit and civic landscape follow-up

The [completion audit](COMPETITION_COMPLETION_AUDIT.md) maps 111 families of
assets, finishes, analysis, motion, interaction and release work to the real
competition brief. The project is not finalized. The main remaining work is
programme fit-out and net area, plaza/building edge reconciliation, a resolved
architectural bay, a complete culture-room sequence and the final context hero.
The optional animations/walk-through do not replace those design tasks.

The original six small beds are retained but hidden behind a new civic study:
four larger gardens, twelve proposed mature oak instances, four community
tables from the existing builder and twenty-four cafe-chair components. Three
4.8 m approaches connect the daily-market, culture and visitor branches.
The first culture endpoint was functionally wrong beside a kitchen wall; the
final source places it at the open western civic bay, with a local-coordinate
guard. This does not certify the complete public route or upper-floor access.

[First run 39548145040](https://github.com/joaoccaldas/ai/actions/runs/39548145040)
rendered actual arrival and plaza views at source commit `5c9a168`. Both image
receipts share candidate SHA
`33bfc46f608d1bb7b9ee6457a6cda7a273c3fb043b0d070b06dbdf0e6b2306c5`.
Arrival took 88.98 s; plaza 71.17 s. The improved garden/route hierarchy is visible,
but the wrong approach and missing chairs were retained as a rejected intermediate.
The arrival still cannot carry a final hero because the simplified municipal
context dominates. No missing cathedral sculpture is invented.

[Final plaza run 39548829623](https://github.com/joaoccaldas/ai/actions/runs/39548829623)
uses commit `757e93a`, candidate SHA
`9f39bb47adf584168ee72908b862b057e6c4f118ac7565c5bb8f0302f93f0ce1`.
The actual 960 × 600 PNG took 72.33 s and has SHA
`1a3aff3f5de022c09e8823d8ebb4a6f07786b84bced9150c703f055779b568ee`.
This final run renders only the plaza; the prior arrival is not relabelled as
a V4 image. All 2,090 incoming source signatures remain preserved.

New fixture support checks cover 81,552 actual mesh vertices and 372 route
samples. Minimum fixture-to-route-edge clearance is 4.636 m. The new canopy
envelopes retain at least 14.359 m to the F3 axis, compared with the existing
7 m corridor threshold. The planting ellipse proxy is 422.54 m², not a shade
or permeability metric. Original geometry and source files are retained.

**Pixel decision:** the corrected approach and furnished tables are retained as
measured progress. The scene remains schematic: four isolated oval gardens,
broad route ribbons, generic context and unresolved edges are not a finished
landscape or winning-quality hero. More decorative objects would not resolve
those issues. No independent visual/device acceptance or canonical promotion.

Review artifacts beneath `output/civic-visual-20261021/`:

- `plaza-v4/remote/review.html`: actual V1 versus V4 plaza, matching camera,
  source/profile and verified PNG hashes; source-bound civic plan linked.
- `plaza-v4/remote/landscape/civic-plan.svg`: geometry plan with explicitly
  schematic canopy circles; not a Blender render.
- `plaza-v4/RESEARCH.json`: exact scene/image/landscape checks and limits.
- `plaza-v3/inventory-reuse.json`: private scoped catalog denominator and
  forty-seven rehashed occurrences across twenty-four relevant families;
  no current-tree/global rights or quality acceptance implied.

The two new remote jobs consume 3m48s and 2m21s of conservative full-run wall
time. Earlier eight pilot runs total 55m15s, so combined use is 61m24s within
the recorded 65-minute allowance. No Mac image render or new paid host.

## Foliage research reproduced on Gaudí source trees

The existing vegetation builder now offers an opt-in stable leaf budget and
coverage compensation. Its default hero geometry remains unchanged. Consuming
the original random sequence is essential: shortening the loop alone changes
later leaf clusters, making a matched LOD comparison unreliable.

`check_vegetation.py` measures three seeds and top/front/diagonal views with
160 × 160 geometry rays each. The predeclared maximum absolute sky-share
change is 0.05 and minimum leaf-triangle reduction is 70%. All three seeds
pass: 60,900 → 15,120 leaf triangles, a 75.17% reduction. Maximum coverage
change is 0.005195 (0.52 percentage points); plain thinning reaches 0.181094
(18.11 points). Branch meshes remain identical.

The representative full/compensated GLBs are 4,972,644 / 1,250,364 bytes and
both have zero Khronos errors/warnings. Raw results, source hashes, derivative
hashes and rejected plain-thinning control are preserved under
`canopy-lod-research/`. Binary ray coverage is not transparent leaf response,
appearance equivalence, moving-LOD quality or measured FPS. The rendered
landscape keeps the original full-detail meshes. Runtime distance bands,
material parity and target-device checks remain separate.

The programme inventory now reports effective collection/view-layer visibility.
A child object's `hide_render=False` did not mean the older teaching kitchen
was visible beneath its hidden programme collection. A Blender fixture verifies
hidden ancestors, a second visible collection link and the object's own render
flag. This naming inventory still cannot prove full room-fit-out completeness.


## 23 October closeout: garden detail and real portfolio evidence

This extends the existing garden/weather study. It is a private design candidate,
not a final scene, public portfolio release or completed asset-to-film run.
Source-native identities and the existing Atlas `RESEARCH.json` remain authoritative;
this iteration is `e31-gaudi-garden-construction-detail` there.

**Reuse/extend:** current `landscape.py`, `coordinate_civic_landscape.py`,
`prepare_weather_study.py`, the existing procedural registry/batch exporter,
Atlas inspector and native index. Hub lead
`66580c808310a645f77eeb18d292f867428323b5542e5f556fa9a40b252c3992`
was fetched and checked against current files. Its historical PASS report did not
prove visual or physical acceptance. The newer paving module was inspected but
not used as a drainage assembly: its decorative strip overlays uncut tiles.
No parallel renderer, asset catalog or approval system was added.

[Measured, 2026-10-23] The optional `backed=True` island preserves default geometry
exactly against committed source `074d33d`. New slats follow equal ellipse arc
spacing and the true ellipse normal. Slat and back-rail face orientation was
corrected before acceptance. `check_landscape.py` checks 437 timber solids,
positive face areas, ground/top bounds, invalid dimensions and exact deterministic
repetition. Seat-centre spacing max/min is 1.000145; post tops are 0.92 m.
This is geometry evidence, not ergonomic or accessibility certification.

The four source-positioned gardens now have 420 stone cells with 4 mm joints,
2 mm chamfers and a declared 4 mm presentation top offset. Furniture follows that
finished level. Added evaluated paving is 18,480 triangles; 89,312 garden vertices
are inside the authored plaza; minimum seating clearance to the declared route
edge is 4.642 m. Earlier beds remain hidden outside the export root. Source file
SHA-256 `404704ae392ddd5ae01646b6eaf715e91c5b0eb7013a14e7aae8be627c4b7d79`
was rechecked unchanged. Across V6/V7, 179 unchanged non-garden nodes retain exact
local transforms and mesh attributes/indices; the replaced beds and explicitly
raised furniture are excluded from that comparison.

The first V7 attempt failed on a sibling import. Its log is retained; explicit
script-directory resolution fixed the next build. All artifacts are private under
`output/civic-visual-20261021/landscape-v7-fixed/`. Original GLB: 50,893,788 bytes,
zero Khronos errors/warnings. Preserved transport: 27,092,544 bytes with exact
decoded geometry/images, SHA-256
`84214f6ff888ab6cb5167dcdda4b32c180c23a78c5ff743ca4b7a13aa2b7eba8`.
It costs 623,664 bytes more than V6. The overview complete-frame observation was
517 calls / 833,736 triangles versus 501 / 798,040. One local 30-frame CPU-submit
sample is not a GPU, FPS, speedup or physical-phone benchmark.

**Actual visual decision [Opinion]:** identical Garden/Overview cameras, seed 42,
paused clear weather, Three r186, 1440×1000 DOM viewport, 1100×560 canvas, DPR 1.
Backrests make seating more legible; stone joints contribute little at that wide
view. Retain a modest supporting detail improvement. Reject the wide plaza as a
final hero: it remains sparse, flat and disconnected from complete context.
Preserve V6 and both captures; no claim of a universally superior final scene.

### Three existing recipes rebuilt and inspected

| Existing ID | Triangles | Corrected GLB bytes | Intended role / review limit |
| --- | ---: | ---: | --- |
| `shade_pergola_biophilic` | 916 | 57,928 | Supporting shade structure; planar foliage and joinery still crude |
| `water_scupper_kusaritoi` | 572 | 25,304 | Rain-chain study; connections, cup continuity and capacity unvalidated |
| `market_goods_bread_crate` | 456 | 24,160 | Market supporting prop; coarse loaves and absent crust detail |

All three original and corrected GLBs validate with zero errors/warnings.
The source recipes mistakenly used Blender-axis inspection directions; the viewer
expects glTF Y-up. Only the three directions were converted `(x,y,z) → (x,z,-y)`.
Binary geometry/material chunks and all other JSON fields compare unchanged.
Original underside captures and exports are retained. The corrected views expose
the actual useful face but do not make these hero-quality assets. A controlled
bread default, quarter-turn and detail series records exact keyboard steps.

Current definitions are preexisting uncommitted work alongside other asset work.
The three-direction patch and exact source hashes are retained privately; do not
claim surrounding recipes were committed or accepted by this iteration. Native
Atlas index readback resolves all three current hashes and procedural IDs. Its
additional historical pointers/unavailable roots remain explicit coverage gaps.
The missing previous Atlas worktree was not reconstructed over originals: an
isolated occurrence of existing commit `df98846` hosts this review.

### Existing guardrails applied to actual outputs

Pinned Kona PR #148 `a880318e` and #149 `b4669a59` passed nine synthetic Node tests
locally. Video Studio PR #3 `45375b52` passed six synthetic Python tests. Source
was inspected before execution. The receipt tool hashed 15 explicitly selected
real bread source/output/evidence files, retaining `approval=false` and rights
not performed. A labelled Gaudí-to-Kona policy compatibility probe remains blocked;
it is not canonical Kona-manifest validation, reviewer authorization or a new
asset schema. The tool does not establish reference integrity or licence clearance
by itself.

The real staged handoff contains the bread GLB, three actual screenshots and a
private manifest. Video Studio's audit returns `blocked/private-manifest`, exit 1,
as expected. This tests the boundary on real staged artifacts, not an actual
Video Studio public build or render job. Film rendering, cancel/retry, playback
and independent acceptance remain untested. Human/Quest sessions remain paused.

[Measured] Local regressions: 39 Gaudí Python checks; 204 Atlas Node checks;
338 Atlas Python passes with three skips; both new-asset Blender suites; focused
garden checks; inspector build; original/transport geometry readback. Desktop and
390×844 layouts show no horizontal overflow; the phone starts without a canvas or
model request. Shower replay yields 162 L incident / 137.7 L collected at 60 s under
the same explicit assumptions; 12 canopies move, six exterior materials respond,
and plan advancement submits zero additional 3D frames. Close removes all canvases
and panels. Browser console observation: zero errors/warnings. Previous limits on
real background-tab signalling remain; this run does not close that gate.

**Confidence:** existing seven-dimension 0–4 minimum rubric, rehashed exact bytes:
technical confidence 2/4 (indicative); full acceptance confidence 0/4 because
independent human/device evidence is missing. This is evidence maturity, not
object quality or a winning probability. The untracked `data/WIN_SCORECARD.json`
was found claiming 96.8% win probability and unmeasured shading/flow performance.
Its original is preserved privately and those estimates were withdrawn/marked
unverified locally. `config/WIN_SCORECARD.json` remains the canonical authority.
Its older estimates remain historical and were not recomputed.

Private review entry: `output/portfolio-evidence-20261023/review.html`.
Receipts include `SOURCE_STATE.json`, `scene-readback.json`, `index-readback.json`,
`bread-evidence-receipt.json`, `bread-evidence-gate.json`, `handoff-boundary.json`
and `confidence.json`. No raw assets or private receipts belong in a Git push.

Next useful production: resolve a connected plaza/market composition, refine one
supporting asset at its intended distance, and use the existing source-bound
remote Cycles pipeline for its final comparison. No new Mac Blender image render
or remote-budget extension occurred. Source, technical validation, independent
review, physical performance, public release and competition success stay separate.
