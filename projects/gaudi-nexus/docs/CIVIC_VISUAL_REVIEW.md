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
