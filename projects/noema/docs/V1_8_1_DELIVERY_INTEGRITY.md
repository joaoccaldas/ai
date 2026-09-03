# NOEMA v1.8.1 — Delivery Integrity

## Purpose

NOEMA's scientific corpus is intentionally large, but discovery and reference-entity pages must not require the browser to download full source projections before showing useful content. v1.8.1 separates **navigation/search metadata**, **reference identity**, **optional media**, and **research evidence payloads**.

## Problem corrected

The legacy shared runtime loaded `religion-decomposition.json` and `drh-decomposition.json` as part of a common boot path. Those projections are tens of megabytes in raw JSON. That architecture made simple Explore and Entity routes pay the parsing, memory and transfer cost of full source workbenches.

This release now has two lightweight delivery paths.

### Explore

`source corpora -> build_search_index_v18.py -> site/search-index-v18.json -> explore-v18.js`

The source corpora remain authoritative. The compact index contains only navigation metadata: identity, type, aliases, regions, source family, canonical dimensions/components and search text. It deliberately excludes claim evidence, quotations, model results and source documents.

### Entity Workspace

`reference catalog + ontology -> entity-v18.js -> immediate reference entity render`

`source-verified media -> idle/deferred request -> optional visual context`

Reference entity pages no longer load the global application runtime, DRH decomposition, Pulotu decomposition, or the older multi-layer Entity scripts. DRH and Pulotu records remain routed to their dedicated source workbenches, where their large source-scoped payloads are relevant.

## Epistemic contract

Search metadata, reference identity and visual context are **not historical or causal evidence**.

- a match does not establish historical influence
- co-occurrence does not establish causation
- semantic proximity does not establish descent or common origin
- a reference graph edge means catalogued association, not ancestry or diffusion
- source-family labels remain visible
- museum / Commons imagery remains reference context unless separately linked to a reviewed claim
- missing search or media data must degrade safely rather than fabricate content

## Runtime contract

### `explore.html`

1. use `shell-v18.js`
2. use `explore-v18.js`
3. not load `app-v1.js`
4. not directly request `drh-decomposition.json`
5. not directly request `religion-decomposition.json`
6. retain a reference-catalog fallback if the generated compact index is temporarily unavailable

### `entity.html`

1. use `shell-v18.js`
2. use `entity-v18.js`
3. use the v1.8 accessibility foundation
4. not load `app-v1.js`
5. not load `entity-v2.js`, `entity-depth-v14.js`, or `synoptic-v15.js`
6. not request DRH or Pulotu full projections
7. render reference identity before optional media work
8. isolate media failures from identity, decomposition, source trail and epistemic warnings

## Build contract

`projects/noema/scripts/build_search_index_v18.py`:

- reads versioned source projections
- extracts only compact search/navigation metadata
- records source SHA-256 digests
- deduplicates per source family and source identity
- emits deterministic record ordering
- writes `site/search-index-v18.json`

The generated index is checked into the repository so GitHub Pages can serve it without a runtime server.

## Size budget

The generated search index must remain below **2.5 MB raw JSON** for the current v1.8 source set. This is a guardrail, not a permanent target. If the corpus grows beyond the budget, the next architecture step is prefix/source/time sharding rather than increasing the global payload indefinitely.

The Entity Workspace does not use the compact search index for evidence. Reference entities load from the much smaller reference catalog and ontology. Larger source-family records continue to live in source workbenches until entity-specific source projections are introduced.

## Accessibility contract

Explore and Entity must keep:

- skip-to-content support through the shared shell
- semantic navigation labels
- `aria-live` state where dynamic content changes
- visible `:focus-visible` focus states
- `prefers-reduced-motion` behavior
- semantic links/buttons for interactive navigation

## Media contract

Entity imagery is optional context.

- only source-verified / provider-allowed reference records may render
- media must retain rights/source attribution
- imagery is labelled as reference depiction, not evidence
- media is requested after the identity page is usable
- an image/network failure must not block or erase the entity record

## Tests

`tests/test_delivery_integrity_v18.py` verifies:

- evidence payloads cannot leak into the compact search projection
- Explore does not regress to the heavyweight runtime
- compact-index fallback remains present
- Entity does not regress to the heavyweight runtime or old multi-script stack
- Entity never requests DRH/Pulotu full projections
- optional media remains reference-only and failure-isolated
- accessibility foundation remains wired on both routes

The GitHub Actions delivery workflow additionally:

- builds the real index from current source corpora
- runs the v1.8.1 regression module
- runs JavaScript syntax checks for Explore, Entity and the shared shell
- validates projection schema and record count
- enforces the 2.5 MiB payload budget
- commits the generated projection only when it changes
- polls the public GitHub Pages endpoint until both Explore and Entity lightweight contracts are visible

## Expected outcome

### Explore

Browser work changes from "load and parse the research corpus" to "load a compact search projection and fetch deeper evidence only when requested."

### Entity

Browser work changes from "boot the shared corpus runtime plus multiple historical Entity enhancement layers" to "load reference identity + ontology, render immediately, then request optional media separately."

This lowers network transfer, parsing cost, memory pressure and failure coupling while preserving NOEMA's provenance and uncertainty rules.

## Remaining delivery-integrity slices

Apply the same route-specific loading policy to:

1. Compare
2. Concept Hubs
3. Lineages
4. source-specific workbenches

The next target is Compare because it should load only the two selected profiles and comparison metadata, rather than inheriting any global-corpus assumptions.
