# Gaudí automated review: measurable, fail-closed delivery

Status: review-gate implementation candidate. It does not run Blender, assert architectural correctness, or publish competition media.

## Canonical boundaries
- The current-world authority is `config/current_world.json`. Historical Rev16 is not automatically site truth.
- `docs/DECISIONS.md` records a narrowly scoped owner-approved public-gallery exception; README's blanket no-main statement requires reconciliation, not an automatic new merge.
- Never alter municipal source geometry, original receipts, verified camera data, or signed hashes through visual optimization.
- Follow `render/README.md` and `docs/REALISM_PLAYBOOK.md`: lightweight Eevee review before costly Cycles finals; expensive rendering on authorized GPU workers, not on the Mac.
- Never fabricate missing visuals, site data, rights, environmental physics or jury scores.

## Dependency-driven production queue
1. **Site truth**: reconcile Rev16/Rev17; validate municipal geometry lineage, CRS, elevations, visible context, and signed source SHA; fail until explicit promotion.
2. **Render-review harness**: benchmark existing F3 640–960 px path and prior timeout; deterministic camera/light/material settings; record measured per-render seconds, peak memory and output SHA; do not change look accidentally.
3. **Hero visual QA**: capture authentic pixels; compare composition, site visibility, PBR reflectance, edge artifacts, figures, vault and foreground; require reviewed visual evidence, not just source-string tests.
4. **A1 board**: compare every cell against `visuals/A1_STORYBOARD.md`; label missing plan/section/evidence; enforce anonymity, provenance and competition rules.
5. **Scientific checks**: validate structural, solar/daylight, ventilation, rainwater and acoustics using appropriate independent models; never upgrade proxies into engineering proof.
6. **Cross-project learning**: extract repeatable lighting, material, camera, terrain, QA and room-composition skills into canonical CaldasAtlas registry after independent reproduction.

## Proposed measured gates (targets, not observed outcomes)
- Render runtime p50/p95 and memory ≤ baseline under matching machine/settings, or approved documented tradeoff.
- Structural/geometry/source invariants unchanged across derived render candidates.
- No critical flicker, clipping, unlicensed material or hidden context discrepancy in moving-view captures.
- CIEDE2000/FLIP comparisons only for matched references with recorded settings; blinded human visual score used separately.
- UI review: same viewport and task before/after; record readability, navigation, overflow, keyboard access, responsiveness and task time.
- Every improvement has experiment ID, source revision, test device, baseline, candidate, uncertainty, independent evidence, and rollback route.

## Executable evidence gate
Run `python3 projects/gaudi-nexus/gaudi_release_gate.py --output /tmp/gaudi-release-audit.json` from repository root. Exit 2 means release BLOCKED (correct for the historical Rev16 state). Exit 0 requires explicitly recorded site truth, binary identity, hero visual approval, all source blockers cleared, and signed review records.

A structured approval under `release_approvals` contains `approved:true`, `reviewer`, `evidence_sha256`, and should be supplied only after the evidence is independently verified; this lightweight initial gate verifies field presence, **not** cryptographic linkage of approval to an external artifact. Add that verification before any real external release. It is not a replacement for existing submission auditors.

## Automated progression
Use existing scheduler/pipeline if possible. For each queued task: deduplicate → confirm dependencies → prepare isolated branch → measure baseline → apply bounded change → run deterministic tests → collect physical/browser visual evidence → score confidence → human review for promotion → save receipt and lesson → propose next task. Failed gates must leave production untouched. No automatic public publish or competition submission.
