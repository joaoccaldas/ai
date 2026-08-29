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

## v0 architecture

```text
Public scholarly discovery ─┐
Consensus / research review ├─> Source envelopes ─> claim review ─> evidence graph
D-PLACE / DRH / Seshat ─────┤                         │
Pulotu / ARIADNE ───────────┘                         ├─> entity resolution queue
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
- `src/noema/resolution.py` — conservative entity resolution
- `src/noema/hypothesis_engine.py` — dependence-aware probability revision
- `src/noema/publish.py` — public projection safety gate
- `src/noema/api.py` — read-only observatory API

### Evidence sources and discovery

- `data/seeds/initial_sources.json` — initial adversarial source fabric
- `scripts/discover_crossref.py` — credential-free recent literature discovery
- `scripts/build_benchmark.py` — deterministic D-PLACE 100-society benchmark generator
- `scripts/seed_db.py` — idempotent source seed loader using `DATABASE_URL`

### Observatory

`site/index.html` consumes `site/data.json`. Production data must be exported only after the publication gate. The current map nodes are explicitly schematic and make no geographic claim.

## Automation

- `NOEMA CI` — tests changes under `projects/noema/**`
- `NOEMA Discovery` — daily Crossref candidate artifact, no direct evidence writes
- `NOEMA Benchmark` — weekly deterministic 100-society D-PLACE artifact
- ChatGPT scheduled research cycles — daily discovery, weekly re-analysis, monthly cross-domain discovery, with quarterly paradigm challenge folded into Jan/Apr/Jul/Oct

No automated discovery channel has authority to promote candidates directly into evidence.

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

1. Wire reviewed claim extraction into the database.
2. Export approved PostGIS geometry to the Site.
3. Add D-PLACE / DRH / Seshat / Pulotu adapters with source-specific licenses and caveats.
4. Add chronological uncertainty distributions and dating-method metadata.
5. Add phylogenetic and spatial model adapters rather than relying on generic similarity scores.
6. Add hypothesis revision ledger UI and "what would falsify this?" view.
7. Add expert/community review queues for sensitive cultural interpretations.
