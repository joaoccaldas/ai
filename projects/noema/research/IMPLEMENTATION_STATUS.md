# NOEMA implementation status

Updated: 2026-08-29

## Operational now

- Scientific/epistemic contract and controlled ontology.
- PostgreSQL/PostGIS/pgvector migration set for canonical storage, ingestion provenance, source staging and claim staging.
- Stable DOI/external-ID/URL source deduplication.
- Conservative entity resolution: name matches require human review; authoritative external IDs permit auto-merge only within matching entity type.
- Temporal/confounder-aware candidate relationship scoring.
- Dependence-aware hypothesis probability revision.
- Source discovery firewall: discovery artifact -> `source_candidates` -> review queue -> explicit reviewer promotion -> approved `sources`.
- Claim extraction firewall: extraction artifact -> `claim_candidates` -> review queue -> explicit reviewer promotion -> reviewed `claims`.
- Claim candidates require source locators and stable fingerprints; extractor confidence cannot become human evidence confidence implicitly.
- Publication gate excludes unreviewed, restricted/sacred and model-generated evidence.
- Read-only FastAPI observatory API.
- Atomic reviewed database-to-Site projection exporter.
- Public GitHub Pages observatory with independent availability verification.
- D-PLACE importer preserving focal dates as observation metadata, not culture origin dates.
- Daily Crossref scholarly discovery, weekly deterministic D-PLACE 100-society benchmark and recurring ChatGPT research cycles.
- CI compiles package, scripts and tests before pytest.

## Verified runtime results

- NOEMA CI is green on main after the source-review layer.
- Public observatory verified by GitHub-hosted runner at `https://joaoccaldas.github.io/ai/projects/noema/site/`.
- D-PLACE benchmark verified: 100 unique societies, 50 regions, zero missing coordinates, zero missing Glottocodes.
- Crossref discovery verified after live fixes: unique candidates, bounded 30-item priority queue, explicit recent/upcoming/legacy classification and sanitized display titles.
- Initial Neon schema was successfully exercised on a temporary Neon branch with PostGIS and pgvector present.

## Blocked by external connector/runtime

- **Neon main promotion:** the current ChatGPT Neon connector exposes incompatible camelCase vs snake_case request contracts between its surfaced schema and backend. The verified migration cannot truthfully be marked promoted through that connector.
- **Live database-backed Site data:** depends on Neon main migration plus reviewed records. Until then the public observatory intentionally serves the labeled seed projection.
- **Native ChatGPT Sites publication:** this chat runtime does not expose a Sites create/publish action. The verified GitHub Pages observatory remains the active visual surface and the same bundle is ready for a Sites-capable Work surface.

## Safety truth

No database credential is committed. Discovery never writes directly into evidence. Extracted claims never become evidence without explicit reviewed promotion. Restricted/sacred material is excluded from public projection policy. Model outputs remain audit events, not empirical evidence.
