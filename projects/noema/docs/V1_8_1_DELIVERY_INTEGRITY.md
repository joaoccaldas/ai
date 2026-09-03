# NOEMA v1.8.1 — Delivery Integrity

## Purpose

NOEMA's scientific corpus is intentionally large, but discovery pages must not require the browser to download full source projections before showing a search result. v1.8.1 separates **navigation/search metadata** from **research evidence payloads**.

## Problem corrected

The legacy shared runtime loaded `religion-decomposition.json` and `drh-decomposition.json` as part of a common boot path. Those projections are tens of megabytes in raw JSON. That architecture made a simple Explore search pay the parsing, memory and transfer cost of full source workbenches.

This release introduces a compact build-time projection:

`source corpora -> build_search_index_v18.py -> site/search-index-v18.json -> explore-v18.js`

The source corpora remain authoritative. The compact index contains only navigation metadata: identity, type, aliases, regions, source family, canonical dimensions/components and search text. It deliberately excludes claim evidence, quotations, model results and source documents.

## Epistemic contract

The search index is **not evidence**.

- a match does not establish historical influence
- co-occurrence does not establish causation
- semantic proximity does not establish descent or common origin
- source-family labels remain visible
- missing search data must degrade to a smaller reference catalog rather than fabricate results

## Runtime contract

`explore.html` must:

1. use `shell-v18.js`
2. use `explore-v18.js`
3. not load `app-v1.js`
4. not directly request `drh-decomposition.json`
5. not directly request `religion-decomposition.json`
6. retain a reference-catalog fallback if the generated compact index is temporarily unavailable

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

The generated search index should remain below **2.5 MB raw JSON** for the current v1.8 source set. This is a guardrail, not a permanent target. If the corpus grows beyond the budget, the next architecture step is prefix/source/time sharding rather than increasing the global payload indefinitely.

## Accessibility contract

Explore must keep:

- skip-to-content support through the shared shell
- semantic labels for search/filter controls
- `aria-live` result counts
- visible `:focus-visible` focus states
- `prefers-reduced-motion` behavior

## Tests

`tests/test_delivery_integrity_v18.py` verifies:

- evidence payloads cannot leak into the compact projection
- Explore does not regress to the heavyweight runtime
- compact-index fallback remains present
- accessibility foundation remains wired

The GitHub Actions delivery workflow additionally:

- builds the real index from current source corpora
- runs the v1.8.1 test module
- validates JSON syntax and record count
- enforces the payload budget
- commits the generated projection only when it changes
- polls the public GitHub Pages endpoint until the new Explore client and compact index are visible

## Expected outcome

For the Explore route, browser work changes from "load and parse the research corpus" to "load a compact search projection and fetch deeper evidence only when requested." The expected result is substantially lower network transfer, lower parse/memory cost, faster first interaction and an architecture that can scale to much larger source federations.

## Next delivery-integrity slice

Apply the same route-specific loading policy to:

1. Entity Workspace
2. Compare
3. Concept Hubs
4. Lineages
5. source-specific workbenches

Entity pages should ultimately load an entity header projection first, then relationships/evidence/media/history on demand.
