# NOEMA

**Network Observatory of Experience, Myth & Ancestry**

NOEMA is a living, provenance-first research system for mapping beliefs, rituals, symbols, narratives, altered-state practices, sacred material culture, and theories about the unknown across deep time and geography.

## Research contract

NOEMA does **not** attempt to prove or disprove religion, spirituality, or supernatural claims. It separates:

1. **Observations** — what a source reports or what material evidence shows.
2. **Claims** — atomic, attributable propositions extracted from observations.
3. **Relationships** — candidate links between entities or claims.
4. **Hypotheses** — explanations that can be tested against alternatives.
5. **Unknowns** — observations for which available evidence cannot discriminate among explanations.

A similarity is a question, never a conclusion.

## Epistemic statuses

- `KNOWN`: direct, high-confidence observation within the source's scope.
- `SUPPORTED`: evidence favors the claim.
- `PLAUSIBLE`: consistent with evidence but underdetermined.
- `DISPUTED`: credible competing interpretations exist.
- `SPECULATIVE`: hypothesis-generation only.
- `UNKNOWN`: evidence does not currently discriminate explanations.
- `UNTESTABLE`: no present empirical test is available.

## Evidence levels

- `E0` speculative
- `E1` anecdotal / single-source
- `E2` repeated correlational evidence
- `E3` strong, independent multi-source/multi-method evidence
- `E4` very strong, replicated and robust across methods

## Core architecture

```text
Sources -> ingestion -> atomic claims -> entity resolution
                               |
                               v
                        evidence graph
                         /    |     \
                 temporal  spatial  semantic
                         \    |     /
                         candidate links
                               |
                         confounder tests
                               |
                         hypothesis engine
                         /             \
                  supporting       adversarial
                    evidence         alternatives
                         \             /
                         posterior update
                               |
                        human review gate
                               |
                         observatory API/site
```

## v0 scope

The first release is intentionally bounded:

- 100 cultures/populations
- 50 cross-cultural motifs
- 25 ritual classes
- 20 archaeological/historical periods
- 10 explicit hypotheses
- peer-reviewed and primary-source provenance
- temporal ranges, geographic geometry, source independence
- adversarial alternative-hypothesis generation
- reproducible scoring and revision history

The objective is to validate the methodology before scaling the corpus.

## Repository layout

```text
projects/noema/
  db/                 schema and migrations
  ontology/           controlled vocabulary and relation semantics
  src/noema/          research engine
  tests/              scientific and software invariants
  site/               observatory prototype
  research/           protocols, evaluation sets, source registry
```

## Canonical store

A dedicated Neon PostgreSQL project (`noema-research`) is used as the canonical store with PostGIS and pgvector. No database credentials are committed to GitHub. Runtime configuration is loaded from environment variables.

## Non-negotiable invariants

1. Every factual claim must retain source provenance.
2. `RESEMBLES` must never imply `DESCENDS_FROM`.
3. Temporal impossibilities automatically invalidate directional influence claims.
4. Cultural non-independence must be modeled before treating cross-cultural recurrence as independent convergence.
5. Embedding similarity may nominate relationships but may not validate them.
6. Restricted or sacred community knowledge must not be published merely because it is technically accessible.
7. Every hypothesis must record at least one alternative and a falsification criterion before promotion beyond `SPECULATIVE`.
8. Model outputs are audit events, not evidence.

## Development

Python 3.12+ is the reference runtime.

```bash
cd projects/noema
python -m pytest
```

The codebase is deliberately provider-neutral. LLMs are used behind typed interfaces so local/cloud models can be substituted without changing the evidence model.
