# Frontier research intake — 9 October 2026

The user-supplied research note informs existing work. No meshoptimizer upgrade,
ClusterLOD benchmark, or local render was executed for this intake.

## Applied: evidence behind Gaudí-inspired geometry

[CRM's exposition](https://www.crm.cat/les-matematiques-de-gaudi/) explicitly
distinguishes the force distribution of a polyfunicular model from final vault
geometry. It also explains catenaries and ruled surfaces. This is mathematical
and historical context, not a dimensioned architectural survey.

The existing `structural_formfinding_v2.py` is reused. Its 9 m span, 1.35 m rise,
7.5 kN/m model is a **proposed parabola under uniform vertical load per horizontal
metre**. It is not a catenary under uniform self-weight per arc length, evidence
of historical Sagrada geometry, or proof that the current source roof conforms.
Source mesh reconciliation remains pending. The previous assertion that the
existing roof curvature was selected from this load path has been corrected.

Six additional tests pass: import without file writes; section moment residuals
across three loads and three rises; endpoints/crown; reproducible receipt forces;
rejection of a catenary substituted into the parabolic load model; and invalid
parameter handling. Together with thirteen existing contract tests, nineteen
tests pass. The generator records equilibrium, documented architecture, creative
interpretation and source mesh reconciliation separately. Its historical receipt
is retained. No fabricated mesh verification is added.

Future catenary or ruled-surface assets must test the actual emitted geometry
against their declared equations and boundary conditions. Such tests are pending
until those assets exist; the six tests above do not validate them.

## Deferred: allocation caching

[Meshoptimizer PR 1107](https://github.com/zeux/meshoptimizer/pull/1107) merged
experimental opt-in allocation caching on 9 October. The author's Zorah
preprocessing measurements are approximately 247→220 s on Windows and 230→222 s
on Linux with sixteen 32 MB blocks. These are upstream reports, not our measured
speedup, and not rendering benchmarks. The configured block capacity is 512 MB;
actual memory use must be measured rather than inferred from that capacity.

Our 58 validated procedural GLBs total 2,058,604 bytes and 49,406 triangles.
These figures do not establish allocation pressure or a ClusterLOD bottleneck.
No current direct cache integration was established in this worktree. Hub
discovery returned lineage evidence `bd1337eaf7d025a640ae006b21fc78bc4e0c3fa02d16ff6c6c1261f0ce687ca9`
but no usable ClusterLOD candidate in its bounded results; this is a coverage
limit, not an exhaustive absence claim.

If the existing ClusterLOD experiment is run, compare cache on/off with pinned
input and library commits, identical settings/thread count, repeated timings,
peak RSS, page faults/allocation counts and output geometry checks. Keep production
unchanged until a useful gain is measured within the memory budget. No new
parallel pipeline is justified by this note.

## Effect on the competition

The note strengthens structural reasoning and reusable evidence standards. It
does not remedy the municipal model's missing sculptural detail, resolve the
floor/roof conflict, certify programme capacity, or establish visual quality.
Those remain independent gates. The shared scene-kit guidance now records these
claim boundaries for reuse in other projects.
