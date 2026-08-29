# NOEMA implementation status

Updated: 2026-08-29

## Implemented

- Scientific/epistemic contract and controlled ontology.
- PostgreSQL/PostGIS/pgvector initial schema.
- Source envelopes with stable DOI/external-ID/URL deduplication.
- Conservative entity resolution: names nominate review; authoritative IDs permit auto-merge only within matching entity type.
- Candidate relationship scoring with temporal and confounder gates.
- Dependence-aware hypothesis probability revision.
- Publication safety gate for review status, restricted knowledge and model-generated material.
- Read-only FastAPI observatory API.
- Interactive Site prototype consuming a publishable JSON projection.
- Adversarial seed source catalog spanning D-PLACE, Seshat, DRH, Pulotu, ARIADNE and peer-reviewed methodological debate.
- Credential-free Crossref discovery job producing unreviewed artifacts.
- Deterministic D-PLACE 100-society benchmark builder and weekly artifact job.
- Path-scoped unit-test CI.
- ChatGPT daily/weekly/monthly research schedules, with quarterly paradigm challenge folded into the monthly task.

## Verified

- Initial Neon schema succeeded on a temporary migration branch with PostGIS and pgvector present.
- Independent local checks pass for provenance, deduplication, publication policy, temporal rejection, entity resolution and dependence-aware hypothesis updates.
- GitHub reports PR #45 mergeable.

## Activation gate

PR #45 is the v0 activation change set. After merge, the default branch owns NOEMA CI, daily Crossref discovery and weekly D-PLACE benchmark workflows. Post-merge workflow results are the authoritative integration check.

## Blocked by connector/runtime, not represented as complete

- Neon main-branch promotion: the current ChatGPT Neon connector exposes incompatible camelCase vs snake_case argument contracts for migration completion and subsequent DB calls.
- ChatGPT Sites publication: this chat runtime does not expose a Sites create/publish action. The site bundle is ready to import/use from a Work/Sites-capable surface, while GitHub Pages can serve the same static observatory after merge if the repository's existing Pages deployment includes the path.

## Safety truth

No database credential is committed. No automated discovery process can turn a candidate into evidence without review. No restricted/sacred material is intentionally included in the public seed corpus.
