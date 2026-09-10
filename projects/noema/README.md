# NOEMA

**Network Observatory of Experience, Myth & Ancestry**

NOEMA is a provenance-first research system for mapping beliefs, rituals, myths, symbols, sacred practices, archaeological observations and competing explanations across geography and deep time.

> Similarity generates a question, never a conclusion.

## Scientific contract

1. Observations, claims, interpretations and hypotheses are separate record types.
2. Every empirical claim requires source provenance.
3. `RESEMBLES` never implies `DESCENDS_FROM`, diffusion or causation.
4. Embeddings nominate candidate relationships only.
5. Directional historical relationships must pass temporal plausibility checks.
6. Source dependence, shared ancestry, contact, environment and coding bias are explicit confounders.
7. Unknown is a valid result. Unknown does not mean supernatural.
8. Model outputs are audit events, not evidence.
9. Sacred or community-restricted knowledge is excluded from public projections.
10. Hypotheses require alternatives and falsification criteria.

## Architecture

```text
Public scholarly discovery ─┐
Consensus / research review ├─> Source envelopes ─> typed assertions ─> claim review ─> evidence graph
D-PLACE / DRH / Seshat ─────┤                              │
Pulotu / ARIADNE ───────────┘                              ├─> entity resolution queue
                                                           ├─> candidate relationships
                                                           └─> hypothesis revisions
                                                                       │
                                             publication safety gate ──┘
                                                                       │
                                                          read-only API / Site
```

### Durable data layer

`db/001_initial.sql` targets PostgreSQL with PostGIS and pgvector. The dedicated Neon project is named `noema-research`. **Never commit its connection string.**

### Research engine

- `src/noema/models.py` — typed epistemic primitives
- `src/noema/scoring.py` — conservative relationship scoring
- `src/noema/ingest.py` — source envelopes + stable deduplication
- `src/noema/evidence_ingestion_v2.py` — typed assertion decomposition, nonbinary absence semantics, Crossref integrity envelopes, field-level confidence, multi-extractor disagreement handling
- `src/noema/resolution.py` — conservative entity resolution
- `src/noema/patterns.py` — pairwise complete-case enrichment, effect size and BH-corrected pattern nomination
- `src/noema/analysis_v2.py` — staged robustness diagnostics including stratification, leave-one-source-family-out sensitivity and descriptive temporal ordering
- `src/noema/scientific_reasoning.py` — chronology, detectability, competing mechanisms and Evidence Court primitives
- `src/noema/hypothesis_engine.py` — dependence-aware probability revision
- `src/noema/publish.py` — public projection safety gate
- `src/noema/api.py` — read-only observatory API

See `docs/INGESTION_ANALYSIS_V2.md` for the active ingestion and analysis contract.

### Evidence sources and discovery

- `data/seeds/initial_sources.json` — initial adversarial source fabric
- `scripts/discover_crossref.py` — credential-free recent literature discovery
- `scripts/discover_openalex.py` — work-identity and citation-neighborhood discovery; bibliometric links are not evidence
- `scripts/build_benchmark.py` — deterministic D-PLACE 100-society benchmark generator
- `scripts/seed_db.py` — idempotent source seed loader using `DATABASE_URL`

### Observatory

`site/observatory.html` is the flagship immersive research surface. Evidence-bearing geographic marks must come from source-bounded coordinates; atmosphere and reference imagery are visually distinct from evidence. Production data must pass publication and rights gates.

## Automation

- `NOEMA CI` — tests changes under `projects/noema/**`
- `NOEMA Discovery` — daily Crossref candidate artifact, no direct evidence writes
- `NOEMA Benchmark` — weekly deterministic 100-society D-PLACE artifact
- `NOEMA Ingestion and Analysis V2 Contract` — tests richer ingestion semantics and staged analytical guardrails
- `NOEMA Civilization Observatory Contract` — tests data-to-visual semantics and epistemic UI boundaries
- ChatGPT scheduled research cycles — daily discovery, weekly re-analysis, monthly cross-domain discovery, with quarterly paradigm challenge folded into Jan/Apr/Jul/Oct

No automated discovery or analysis channel has authority to promote candidates directly into approved evidence.

## Local setup

```bash
cd projects/noema
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev,api]'
pytest
```

Run the read-only API:

```bash
export DATABASE_URL='postgresql://...'
uvicorn noema.api:app --reload
```

Seed the source catalogue after the schema exists:

```bash
python scripts/seed_db.py
```

## Current infrastructure limitation

The Neon ChatGPT connector currently exposes a casing mismatch between its declared tool schema and backend migration endpoint. The initial schema was successfully verified on the connector-created temporary branch, but promotion through that broken endpoint cannot be truthfully marked complete until the connector accepts a valid completion call or the schema is applied by another authorized database path.

## Next milestones

1. Wire `StructuredAssertion` records into the durable database and human review flow.
2. Add an operational Crossref integrity/update job that revisits corrections, retractions and related versions without promoting claims.
3. Add Europe PMC structured full-text ingestion where licensing permits.
4. Expand from the D-PLACE benchmark to a version-pinned full federation and add Seshat / ARIADNE crosswalks.
5. Add probabilistic chronology distributions and dating-method metadata to historical observations.
6. Add spatial autocorrelation and phylogenetic comparative model adapters, preserving the current nomination layer as Stage 0 only.
7. Add missingness/detectability sensitivity and contact-network models.
8. Build a manually adjudicated NOEMA-EVAL benchmark before exposing calibrated causal probabilities.
9. Add hypothesis revision ledger UI and "what would falsify this?" view.
10. Add expert/community review queues for sensitive cultural interpretations.
