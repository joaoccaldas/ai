# NOEMA Roadmap

Last updated: 2026-09-03

NOEMA is a provenance-first Human Belief Observatory: an evidence-backed atlas, historical-change graph, decomposition engine and hypothesis laboratory for religion, ritual, mythology, supernatural claims, spiritual practice, texts, institutions, material culture, altered states, cognition and human meaning across geography and deep time.

## North star

A user should be able to begin with almost any serious question about human belief and move from orientation to evidence without leaving NOEMA:

- What does a tradition teach, and how internally diverse is it?
- Which rituals, agents, texts, institutions and experiences belong to a given historical context?
- What do two traditions genuinely share, and where do similar words hide different meanings?
- What historical events changed a tradition, through what mechanism, and for which populations?
- Which ideas plausibly descend from earlier forms, which may reflect contact or borrowing, and which could be convergence?
- What supernatural or anomalous claims are recorded, by whom, how close to the alleged event, with what corroboration and alternatives?
- What does archaeology observe before interpretation is added?
- What do contemporary surveys show about affiliation, practice and belief, and how have they changed?
- What cognitive or biomedical mechanisms have been proposed without replacing cultural meaning or diagnosing historical people?
- What evidence contradicts the favored explanation, and what observation would discriminate the alternatives?

The moat is not an enormous undifferentiated knowledge graph. It is the ability to federate incompatible evidence types while preserving their provenance, scope, uncertainty and epistemic role.

## Non-negotiable release principles

1. Observation, report, interpretation, theology, mechanism, historical relationship, diagnosis and hypothesis are separate layers.
2. Unknown is not absence.
3. Similarity is not descent, diffusion or common origin.
4. Discovery metadata and model output are not evidence.
5. Current first appearance in the dataset is not origin.
6. Every generated analysis identifies its dataset snapshot, unresolved confounders, source dependence and null/alternative explanations where applicable.
7. Historical people and cultural roles are not retrospectively diagnosed from narrative resemblance.
8. Biomedical mechanism does not replace cultural meaning.
9. A supernatural report is neither metaphysical proof nor a diagnosis by default.
10. Primary texts establish what a text says, not what every adherent believed or practiced.
11. Survey answers describe sampled populations under specific instruments and dates, not timeless properties of a religion.
12. Historical events require mechanisms; temporal proximity alone is not causation.
13. No generic relationship edge should hide whether a link means identity, descent, contact, analogy, contradiction, reform, schism, influence or an unresolved hypothesis.

## Current system: v1.7 public release + v1.8 foundation

### Product and visual layer

Operational:

- search-first home
- five-area navigation
- progressive disclosure
- Concept Hubs
- Entity Workspace v2
- synchronized Map–Time–Graph–Evidence lens
- Human Meaning Atlas
- Deep Time evidence surface
- Connections / Pattern Lab / Compare / Simulation surfaces
- Research Health and Automation Pulse
- reference-media provenance and rights gates

v1.8 foundation now added:

- expanded Human Belief Library taxonomy
- History & Change observatory
- typed historical-force starter projection
- source-federation specification
- expanded source registry
- lightweight shared shell for static research/library/history routes
- focus-visible, skip-link and reduced-motion accessibility foundation
- dedicated v1.8 foundation CI contract

### Comparative religion federation

Operational, incomplete coverage:

- DRH historical entries
- Pulotu comparative religion data
- D-PLACE society benchmark and religion-variable audit
- source-bounded deterministic projections
- descriptive candidate-pattern engine with explicit missingness rules

Known limitations:

- DRH semantic crosswalk coverage remains sparse relative to the full standardized question set.
- Pulotu currently lacks sufficient explicit ABSENT coding for NOEMA's binary enrichment model.
- pattern candidates do not yet fully control for phylogeny, spatial autocorrelation, known contact, source dependence, research intensity or missing-data mechanisms.

### Cognition / neurophenomenology

Operational discovery, research preview:

- cognition-mechanism ontology
- PubMed/MEDLINE discovery adapter
- twice-weekly candidate workflow
- PubMed run manifests integrated into Automation Pulse
- cross-domain cognition hypothesis queue
- historical inference / anti-retrodiagnosis protocol

### Historical change

Research-preview foundation:

- typed historical forces
- explicit mechanisms-to-test
- event/tradition scope
- source links
- anti-monocausal publication rule

The layer must grow from a starter timeline into a causal research graph linking events to institutions, texts, places, demographic change, practice, doctrine and competing mechanisms.

## v1.8 — Source breadth, historical force and source-dependence graph

**Goal:** make NOEMA materially broader before making it look more certain.

### Source adapters / linkers

1. Seshat Global History Databank
   - polity/time variables
   - ritual/religion variables
   - social complexity and institutional context
2. ARIADNE
   - archaeological datasets, sites and object metadata
   - provider and rights provenance
3. OpenAlex
   - literature and citation discovery
   - work identity, citations and source-dependence hints
4. Pleiades + World Historical Gazetteer
   - ancient and historical place reconciliation
   - temporalized geography
5. PMC / Europe PMC
   - rights-compatible structured full text for already discovered biomedical works
6. World Values Survey
   - longitudinal cross-national belief, religiosity and value variables
7. European Values Study
   - European longitudinal religion and values
8. Pew Research Center religion datasets
   - affiliation, practice, religious change, restrictions and demographic composition
9. Primary-text federation
   - licensed/public-domain scriptures, inscriptions, councils, legal texts and institutional archives with edition/translation metadata
10. Licensed ethnographic layers where access permits
   - HRAF/eHRAF locators and derived reviewed mappings without violating redistribution rights

### Historical-force graph

Add first-class event/process entities for:

- conquest and state formation
- patronage and legal reform
- persecution and genocide
- schism, reformation and revival
- missionization and colonization
- enslavement and diaspora
- migration and trade/contact
- translation and media change
- scientific/intellectual change
- secularization and nationalism
- revolution and war
- decolonization, globalization and digital media

Each event-to-belief edge must preserve:

- affected population
- time window
- geography
- proposed mechanism
- source IDs and independence
- before/after state when observable
- competing explanations
- confidence class derived from evidence type, never from model rhetoric

### Required outputs

- versioned source snapshot table
- source-dependence graph
- historical-force ontology and graph projection
- adapter-specific validation tests
- freshness/failure state in Research Health
- no adapter may automatically promote claims

## v1.8.1 — Frontend delivery integrity

**Goal:** stop shipping research corpora as page payloads.

- replace global loading of large DRH/Pulotu projections with route-scoped data
- produce compact search/entity indexes
- shard source projections by entity/source/time where appropriate
- use immutable versioned artifacts and browser caching
- define compressed first-load budgets
- add browser-level performance tests
- remove legacy UI generations as behavior moves into canonical modules

Target: discovery routes should not download tens of megabytes before showing one result.

## v1.9 — Hybrid semantic retrieval

**Goal:** search meaning, not only strings.

Implement:

- lexical + ontology + embedding retrieval
- metadata filters for time, place, entity, tradition, source and evidence status
- separate semantic spaces/labels for identity, concept, phenomenology, mechanism, theology and evidence text
- calibrated relevance explanations
- query-to-Concept-Hub routing
- multilingual entity aliases and historical forms
- temporal query interpretation, e.g. `ancestor cult Roman Britain 2nd century`

Guardrails:

- embedding similarity remains candidate generation only
- semantic proximity cannot create a descent/diffusion relationship
- source quality and evidence status rank independently from relevance

## v1.10 — Typed relationship and disagreement engine

**Goal:** make connections explicit enough to attack.

Required edge families include:

- IDENTITY_EQUIVALENT
- HISTORICAL_DESCENT
- SCHISM_FROM
- REFORM_OF
- INFLUENCED_BY
- CONTACT_PLAUSIBLE
- BORROWING_PROPOSED
- SHARED_ANCESTRY_PROPOSED
- CONVERGENT_PATTERN
- FUNCTIONAL_ANALOGY
- PHENOMENOLOGICAL_RESEMBLANCE
- THEOLOGICAL_CONTRAST
- RITUAL_ANALOGY
- ICONOGRAPHIC_RESEMBLANCE
- TEXTUAL_DEPENDENCE
- POLEMICAL_RESPONSE
- SYNCRETIC_FORMATION
- INSTITUTIONAL_SUCCESSOR
- DEMOGRAPHIC_SHIFT
- HISTORICAL_FORCE_ASSOCIATION
- CLAIM_SUPPORTS
- CLAIM_CONTRADICTS
- UNKNOWN_RELATIONSHIP

Every relationship candidate retains source independence, population applicability, chronology, geography/contact, ancestry/phylogeny, translation/coding risk, missingness, rivals and falsification criteria.

## v1.11 — Strong comparative models

**Goal:** move selected candidates beyond descriptive co-occurrence.

Evaluate:

- phylogenetic comparative models
- spatial/autocorrelation models
- event-history and temporal-order models
- diffusion/contact-network models
- hierarchical source/research-intensity effects
- missing-data sensitivity
- negative controls and synthetic-null calibration

No posterior/confidence number may be shown without a documented model, assumptions and sensitivity analysis.

## v1.12 — Global knowledge depth

**Goal:** become a genuinely broad reference layer, not merely a comparison database.

Authority-resolved entities:

- religions, denominations, schools and movements
- gods, deities, spirits, ancestors, saints, kami, devas, bodhisattvas and culture heroes
- founders, theologians, reformers, mystics and ritual specialists
- rituals and disciplines
- doctrines and theological propositions
- supernatural and anomalous claims
- scriptures, commentaries, inscriptions and oral-text traditions
- institutions, councils and orders
- sacred substances
- motifs and symbols
- archaeological objects and sites
- sacred places and pilgrimage routes
- historical events and processes
- contemporary survey constructs

Each entity supports multilingual names, historical forms, authority identifiers, period/geography, reference media, decomposition, typed relationships, claims/evidence, disagreement and uncertainty.

## v1.13 — Human review and community-sensitive governance

Queues:

- source candidates
- literature candidates
- claims
- ontology/crosswalk mappings
- relationships
- historical-force mechanisms
- supernatural reports and interpretations
- hypothesis revisions
- entity merges/splits
- media identity and rights
- translation/version conflicts

Every review action is auditable and reversible where scientifically appropriate.

Sensitive or community-restricted knowledge stays excluded from public projection unless legitimate publication and community-use conditions are satisfied.

## v1.14 — Supernatural claims observatory

**Goal:** make difficult claims inspectable without sensationalism or premature dismissal.

Record classes:

- tradition-recorded claim
- first-person experience report
- historical chronicle report
- community interpretation
- miracle/apparition/prophecy claim
- folklore motif
- parapsychology experiment
- skeptical/naturalistic explanation
- fraud/hoax finding
- unresolved

Required fields include source distance, contemporaneity, transmission chain, corroboration, alternatives, community interpretation and evidentiary status.

The UI should allow users to switch lenses between `what was reported`, `how the tradition interprets it`, `historical-critical analysis`, `naturalistic proposals`, `experimental evidence`, and `what remains unresolved`.

## v1.15 — Contemporary religion and change

**Goal:** connect historical religion to living populations without confusing the two.

- affiliation and switching
- practice and attendance
- prayer, spirituality and belief variables
- demographic composition
- restrictions and social hostilities
- migration and diaspora
- secularization and revival
- generational change

Every chart must expose survey/census year, population, instrument and uncertainty.

## v2.0 — Integrated Human Belief Observatory

A selected entity, concept, claim, event or hypothesis drives one synchronized workspace:

- identity and definitions
- world map
- historical/deep-time timeline
- knowledge graph
- historical-force layer
- phylogeny/contact overlay
- texts and primary-source passages
- doctrine/practice decomposition
- supernatural-report lens
- cognition/mechanism layer
- contemporary survey layer
- evidence/counterevidence
- missingness/source-dependence diagnostics
- hypothesis history

Example query:

`ancestor spirits + dreams + mountains`

NOEMA should show where each component is encoded, in what periods and sources, which traditions are independent or historically connected, which events altered their distribution, which interpretations traditions give themselves, which cognitive mechanisms have been proposed, what evidence disagrees, what is missing, and which observation would best discriminate ancestry, diffusion, convergence, cognitive universals, social function and null explanations.

## Priority order

1. delivery integrity and accessibility
2. source breadth and source-dependence
3. historical-force graph
4. semantic retrieval
5. typed relationships and disagreement
6. strong comparative models
7. global knowledge depth
8. supernatural-claim observatory
9. contemporary belief-change layer
10. integrated v2 workspace

The governing principle is simple: **increase actual knowledge faster than apparent certainty.**
