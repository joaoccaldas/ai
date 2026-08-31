# NOEMA Automation Integration Contract

Every scheduled research cycle must leave two outputs when it materially executes:

1. a human-readable research note when narrative reasoning is needed; and
2. a machine-readable JSON run manifest under `projects/noema/data/runs/`.

The manifest is workflow state, never evidence. It must preserve input references, artifact digests when available, candidate/revision counts, errors, affected hypotheses, and the epistemic guards that prohibit automatic promotion.

## Required lifecycle

`DISCOVER -> TRIAGE -> REVIEW QUEUE -> CLAIM/FEATURE ASSERTIONS -> ANALYZE -> RELATIONSHIP CANDIDATES -> TEST -> HYPOTHESIS REVISION -> PUBLISH`

A run may stop at any gate. Stopping is valid. It must not skip gates silently.

## UI integration

`projects/noema/scripts/build_automation_pulse.py` aggregates manifests into `projects/noema/site/automation-pulse.json`. The public UI may display run state, freshness, counts and failures from this projection, but must not present automation output as scientific evidence.

## Writeback rules

- Daily discovery/triage writes candidates and a run manifest. It never promotes evidence.
- Weekly reanalysis writes a revision note plus run manifest. If no hypothesis changes, it records a no-change result rather than manufacturing movement.
- Monthly discovery writes candidate relationships, rivals/nulls and a run manifest. It never promotes relationships beyond candidate state without explicit stronger-model and human-review gates.
- GitHub data workflows should emit their own manifests when feasible, including artifact digests and source snapshot identifiers.
- Errors and missing connectors are recorded explicitly.
