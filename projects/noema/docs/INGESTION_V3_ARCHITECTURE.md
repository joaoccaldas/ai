# NOEMA Ingestion V3

## Audit result

The current ingestion system is scientifically conservative but operationally fragmented. Crossref is scheduled daily; PubMed is scheduled twice weekly and persists a latest candidate file; OpenAlex has an adapter but no scheduled durable output; DRH and D-PLACE refresh paths are primarily audit/projection jobs rather than unified source-refresh jobs. Candidate persistence is inconsistent by source.

## New objective

Optimize ingestion for **coverage gap × source independence × hypothesis information gain × freshness × data richness ÷ review cost**, never for raw document count.

Operational priority is not evidential confidence.

## Canonical pipeline

```text
SOURCE REGISTRY
  ↓
FRESHNESS / VERSION CURSOR
  ↓
DISCOVER
  ↓
NORMALIZE TO SOURCE ENVELOPE
  ↓
IDENTITY DEDUP (DOI / authoritative ID / canonical URL)
  ↓
RIGHTS + SENSITIVITY GATE
  ↓
DEPENDENCE ENRICHMENT
  ↓
DURABLE CANDIDATE LEDGER
  ↓
CLAIM / MEASUREMENT / CHRONOLOGY DECOMPOSITION
  ↓
ENTITY RESOLUTION
  ↓
HUMAN REVIEW
  ↓
APPROVED EVIDENCE
  ↓
REANALYSIS + HYPOTHESIS REVISION
```

## Durable candidate ledger

Every discovery job should persist normalized candidate identity, source snapshot/version, payload digest, discovery reason, source family, rights state, sensitivity state and review state. GitHub Actions artifacts may remain a debugging/export mechanism but must not be the only durable copy of material candidates.

Candidate IDs must use DOI, provider IDs or canonical URLs. Title-only deduplication is forbidden.

## Source strategy

### Tier 1: activate now

- Crossref: discovery + correction/retraction/version watch.
- OpenAlex: daily identity/citation/dependence enrichment, joined primarily by DOI/OpenAlex ID.
- PubMed: retain twice-weekly biomedical discovery; add PMID↔DOI↔OpenAlex identity reconciliation.
- D-PLACE: move from 100-society benchmark toward version-pinned full federation while preserving raw/canonical/crosswalk/analysis layers.
- DRH/Pulotu: source-version freshness checks and semantic-crosswalk review queues.

### Tier 2: highest-value new structured sources

- Seshat: polity-time, institutions, warfare, social complexity and religion variables.
- ARIADNE: sites, contexts, objects, datasets and dating observations.
- Europe PMC: rights-aware full text, methods, tables, supplements and citation context.
- Pleiades + World Historical Gazetteer: time-aware place reconciliation.

### Tier 3

Paleoclimate, aDNA, linguistic phylogenies, WVS/EVS/Pew, primary texts and licensed ethnography.

## Pull vs push cadence

Do not run every source daily. Literature indexes and integrity feeds can run daily. Slowly changing curated datasets should use version/digest checks weekly and skip full rebuilds when unchanged. Expensive full-text enrichment should run only for high-information-gain candidates after identity and rights gates.

## Active-learning loop

Ingestion should eventually be hypothesis-driven. For each important unresolved hypothesis, generate a gap profile: missing regions, periods, negative cases, source families, language families and discriminating observations. Candidate priority should then favor records capable of reducing those uncertainties.

## Required telemetry

For every source and run record: last successful cursor/version, records examined, unique candidates, duplicate rate, update rate, extraction yield, review acceptance rate, contradiction yield, source-dependence clusters, rights failures, sensitivity exclusions, cost/runtime, and stale-source age.

## Epistemic invariants

- metadata != evidence
- citation count != truth
- source count != independent evidence count
- extractor agreement != truth
- absence != non-recovery
- similarity != descent/diffusion
- operational priority != evidence strength
- no automated discovery, enrichment or analysis may promote an approved claim

## Migration sequence

1. Introduce the source registry and planner.
2. Make Crossref persist its candidate ledger, matching PubMed durability.
3. Schedule OpenAlex as an enrichment job and persist normalized records.
4. Add shared identity reconciliation across DOI/PMID/OpenAlex IDs.
5. Add Crossref integrity watch for corrections/retractions/version changes.
6. Add source freshness telemetry to Research Health.
7. Add Seshat and full D-PLACE version-pinned federation.
8. Add ARIADNE + historical place reconciliation.
9. Add Europe PMC selective full-text enrichment.
10. Close the loop with hypothesis-driven information-gain planning.
