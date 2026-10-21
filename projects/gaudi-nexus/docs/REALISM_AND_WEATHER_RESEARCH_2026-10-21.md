# Gaudí: realism, motion and useful rendering

21 October 2026. Design research and implementation record; no jury outcome,
construction certification or final visual acceptance is implied.

## Actual status

The proposal is not finished. The [completion audit](COMPETITION_COMPLETION_AUDIT.md)
tracks 111 families across landscape, exterior, interior, materials, physics,
motion, interaction and delivery. The coordinated scene has twenty fitted stalls,
two kitchen reservations, eight desks and a more legible four-garden plaza.
Those quantities do not establish a convincing complete cultural programme,
accessible circulation, construction detail or a final urban image.

The V4 plaza render improves circulation and furniture but still reads as
isolated garden ovals on a flat field. Context is coarse. The market has a useful
warm interior, but repetitive stalls and insufficiently resolved daily life.
The new weather derivative deliberately omits municipal context; it is not the
competition hero and cannot demonstrate the relationship to the Sagrada Família.
Motion helps explain environmental intent; it cannot repair these design gaps.

## Competition and architectural direction

The [organizer](https://archademy.ai/), [FAQ](https://archademy.ai/faq/) and
[official Spanish brief](https://fundacionantoniogaudi.org/concurso_arq_2026/GxAI_BRIEFING_ES.pdf)
support a proximity market, digital culture centre and complete Passion-side
plaza. Architecture, context, Gaudí logic and coherent AI process each carry
20 jury points; passive design and communication each carry 10. A flat-site
conceptual assumption is allowed. Preserve the documented submission-format
conflicts and stricter 10 MB working cap in the completion audit.

The [Sagrada Família booklets](https://sagradafamilia.org/en/the-booklets)
explain construction, geometry and light as connected decisions. Our application
is a readable support/roof hierarchy, filtered daylight and repairable components,
with a small load/inversion interpretation display. Copying cathedral ornament
onto unresolved bars would not demonstrate that constructive logic. This is our
design interpretation, not an endorsement from the basilica or competition.

## Reuse and local evidence

Extend the existing Scene Kit, coordination script, reviewed texture intake,
Atlas inspector and maintained full-world exporter. No second renderer, physics
engine, asset registry or weather service was needed. Knowledge Hub discovery
and preflight found relevant prior work; current source and tests were inspected.
The 3D-map lookup itself remains blocked by invalid map metadata, so direct file
inspection supplements it. This is bounded coverage, not an exhaustive Mac scan.

The private 21 October catalog had 7,475 file records across 37 projects, with
469 distinct nonempty model hashes among available occurrences. Twenty-four
relevant asset families were rehashed (47 occurrences, no stale hash in that
subset). Trees, benches, chairs, tables, counters, produce, display components
and existing viewer/collision tools are reusable candidates. Rights and artistic
acceptance remain separate. No detailed cathedral asset was approved from this
bounded search; do not replace municipal geometry with an unreviewed download.

Local vegetation research retained 36 of 145 leaves per cluster in a stable
seeded subset, scaling leaf area for coverage. Leaf triangles fell 75.17%; the
worst sky-share change was 0.52 percentage points across three seeds and three
geometry-ray views. This establishes static binary coverage only. It does not
establish equal shading, botanical fidelity, moving LOD quality or an FPS gain.
The weather derivative is the first destination review of that reduced foliage.

## Material experiment: useful mechanics, rejected finish

Six 2K diffuse/roughness/OpenGL-normal maps from two Poly Haven materials were
downloaded through the existing bounded intake, hash-locked and packed. Their
[asset licence](https://polyhaven.com/license) is CC0; the API's
[terms](https://github.com/Poly-Haven/Public-API/blob/master/ToS.md) require a
recognizable User-Agent. No broad library scrape was performed.

V5 adds metre UVs, roof arc UVs, member grain and small edge bevels. Actual Linux
run **39550349585**, source **35cfb54**, produced MARKET_AISLE at 960×600 with a
16-sample cap in **29.91 Cycles seconds**. Whole workflow time was 105 seconds.
PNG SHA-256: `49b30bedd92d785907f0048754760fb3cf07be11988ad2270c03d51f18301e7b`.

Actual pixel review rejected the brown repetitive paving as the main direction.
Removing illustrative figures also leaves an empty aisle that fails the daily
coexistence story. Retain the UV/normal/packing improvements; use a declared
neutral mineral design variant and improve spatial hierarchy before adding props.
This result contradicted the prediction that scanned maps would automatically
make this view better. Its 16-sample/no-haze profile differs from V2's 40 samples,
so no controlled render-speed percentage or equivalent-quality claim is valid.

The [Cycles sampling manual](https://docs.blender.org/manual/en/4.2/render/cycles/render_settings/sampling.html)
supports adaptive sampling and denoising. Our recommendation is to compare the
same view/profile, inspect joints and indirect-light noise, and record total
workflow time as well as Cycles time. Source preparation is allowed on this Mac;
Blender image rendering remains on the approved Linux workflow. The 65-minute
allowance has 111 seconds left under conservative whole-workflow accounting.

## Weather model and accuracy boundaries

The existing Atlas inspector now supports an exact source-marked optional study:

| Effect | Implemented method | Accuracy and purpose |
|---|---|---|
| Changing weather | Seeded smooth minute keyframes plus bounded gusts; clear/breeze/shower presets | Synthetic, compressed design scenarios; not local climate statistics or forecasts |
| Foliage response | Damped angular oscillator, signed quadratic wind torque, fixed 1/120 s integration | Assumed inertia, drag, stiffness and damping; canopy-only illustrative movement, no tree or structural certification |
| Roof collection | Rain depth × two measured 45×9 m projected roofs, explicit loss/storage/overflow | Correct unit and mass accounting; 85% collection and 2,000 L capacity are design assumptions |
| Wet paving | Per-area water bucket, declared drainage/evaporation and bounded roughness/darkening | Exposed surfaces only; no calibrated material, puddle flow, infiltration or slip prediction |
| Rain appearance | Bounded analytical streaks, source parabolic roof-height clipping | Illustrative particles; they do not supply the independently accounted water volume or simulate wind-driven infiltration |

At 12 mm/h over 810 m² for one minute, incident roof water is 162 L and assumed
collection is 137.7 L. Tests include overflow and independent surface/roof balance
residuals, dry/reset behaviour, four-hour stability and frame-chunk-independent
replay. A mathematically consistent assumed model is not measured site accuracy.

For future engineering drainage work, reuse a maintained established solver such
as [EPA SWMM](https://www.epa.gov/water-research/storm-water-management-model-swmm)
with actual catchments, rainfall, losses and outlet data. Its
[hydrology reference](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100NYRA.TXT)
describes processes beyond this deliberately small visual bucket. Installing a
solver now would not invent the missing calibration data. Real climate, species
and material measurements must precede predictive performance claims.

## Hybrid presentation and efficiency

The review starts with an actual geometry SVG: no canvas or model request until
the visitor explicitly opens 3D. While open, Plan & water updates the schematic
and water balance without submitting 3D frames; the model remains cached until
Close releases its resources. Paused views render on demand. Hidden/offscreen
views suspend simulation without a wall-clock catch-up jump; default motion is
paused and reduced-motion preference changes stop playback.

[Three.js renderer controls](https://threejs.org/docs/pages/WebGLRenderer)
support explicit shadow refresh and frame counters. Our implementation bounds
rain to 120/280 streaks, DPR to 1/1.5 and shadow maps to 1024/2048, refreshing
moving shadows at most four times per simulated second. These budgets are design
choices, not measured universal device limits. Follow the
[visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
and [animation timestamp guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
instead of advancing physics once per display frame.

The generic lossy world preset is unsuitable for proving small clearances. An
explicit preserve-geometry path now deduplicates identical data and applies only
meshopt transport encoding. It reads the result back and compares position,
normal/UV arrays, oriented triangles, node transforms, source extras and image
bytes. The previous 3 cm-gap failure in our research is the reason to verify the
decoded model, not just its file size. Transport preservation still does not
establish appearance or target-device speed.

## Next visual priorities

1. Resolve inherited building/plaza edge fit and compose the full urban threshold
   with the documented municipal scene. Make one convincing human-eye exterior.
2. Connect gardens and mineral surfaces into a coherent landscape; detail edges,
   shaded daily use, drainage intent, species/root volume and accessible approaches.
3. Develop a decisive occupied market/kitchen/culture sequence, with clear doors,
   sanitary/support rooms, repairable joints, believable lighting and quiet signs.
4. Review restrained neutral paving, member grain, roof scale, contact shadows and
   entourage at the intended camera distances. Reject repeated noisy patterns.
5. Keep plans, sections, programme and AI-method evidence light and readable;
   reserve 3D for spatial inspection and motion. Build the anonymous final A1 from
   one accepted source with the stricter working file-size cap.

These are the remaining design and delivery tasks. Weather is a useful addition,
not proof that the complete concept is finalized or certain to win.
