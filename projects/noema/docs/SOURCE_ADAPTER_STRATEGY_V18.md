# NOEMA v1.8 Source Adapter Strategy

Last updated: 2026-09-02

## Purpose

v1.8 expands source breadth only where provenance, versioning, rights, missingness and source dependence can remain visible. Different infrastructures require different ingestion strategies. NOEMA must not force every source through one API-shaped abstraction.

## Pleiades — open place linker

Strategy: **versioned JSON/bulk-linker**.

Why:
- canonical place resources expose stable URIs;
- the preferred comprehensive export is JSON;
- regularly updated exports are available;
- place records distinguish conceptual places, names, locations and connections;
- representative coordinates, bounds, names and temporal attestations can be preserved without inventing religious meaning.

NOEMA use:
- ancient place identity;
- multilingual/historical name reconciliation;
- source-bounded coordinates;
- place-to-place connection metadata;
- temporal name/location context.

Guardrail: a Pleiades place or connection is geographic/reference context, not evidence that a place was sacred or that a religious practice occurred there.

## OpenAlex — literature identity and citation discovery

Strategy: **candidate metadata adapter**.

NOEMA use:
- work identity and DOI normalization;
- authorship/source metadata;
- topics for discovery;
- referenced/related work links for provenance follow-up;
- citation graph hints for possible source-family tracing.

Guardrail: a citation or related-work link does not establish shared data, shared sample, agreement, or evidentiary independence. It is never independence-blocking by itself.

## Seshat — versioned research snapshots first

Strategy: **snapshot/release ingestion before live API dependence**.

Why:
- Seshat exposes structured historical data and has an official Python API client;
- the API client requires authentication and current public-client issues document remote-base/API usability limitations;
- reproducible comparative analysis needs a named/versioned snapshot rather than a mutable remote state.

Preferred NOEMA path:
1. identify an authoritative Seshat release/snapshot with explicit license and citation;
2. store snapshot ID/hash/date and variable definitions;
3. ingest variable-level values with polity/time scope and citations;
4. preserve UNKNOWN, disputed coding and source notes;
5. model papers using the same Seshat snapshot as a dependent evidence family unless their relevant data are demonstrably independent.

Guardrail: shared Seshat data does not mean two analyses reach the same conclusion. It means they cannot be counted as fully independent data replications.

## ARIADNE — federated archaeological discovery/context

Strategy: **discovery/context adapter until a stable machine contract is pinned and fixture-tested**.

Current public documentation describes the ARIADNE Portal as a federated access point to distributed archaeological datasets and services. NOEMA should therefore first preserve provider identity and landing-page provenance rather than scrape interpretations out of portal search results.

NOEMA use:
- archaeological dataset discovery;
- site/object/resource identity;
- provider and rights metadata;
- chronological/geographic context when supplied;
- link to underlying provider record.

Guardrail: ARIADNE metadata identifies resources. Religious, ritual or symbolic interpretations require the underlying archaeological source and source-bounded claims.

## PubMed / MEDLINE — biomedical discovery

Status: already operational in v1.7.

Strategy: **candidate discovery with paper-level review**.

NOEMA use:
- neuroscience, neurodevelopment, sensory processing, sleep, dissociation, psychiatry, pharmacology and altered-state literature;
- PMID/DOI/PMC identity;
- systematic review discovery;
- modern mechanism hypotheses.

Guardrails:
- PubMed metadata is not evidence;
- modern mechanism does not equal cultural meaning;
- modern prevalence does not project backwards;
- historical roles/accusations are not diagnoses.

## Source-dependence standard

Every adapter should eventually produce or enrich a source fingerprint with:
- canonical work IDs (DOI/PMID/OpenAlex/etc.);
- dataset snapshot IDs;
- sample/cohort IDs where known;
- explicit parent/derived-from links;
- version/date;
- source family;
- licensing/rights where relevant.

Current independence-blocking relationships:
- SAME_WORK
- DERIVED_FROM
- SHARED_DATASET
- SHARED_SAMPLE

Not sufficient by themselves:
- shared authors;
- citation;
- related-work recommendation;
- semantic similarity;
- same conclusion;
- same institution.

Absence of a recorded dependence edge means **not yet encoded**, not proof that sources are independent.
