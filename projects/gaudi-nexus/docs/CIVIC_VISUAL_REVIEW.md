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
