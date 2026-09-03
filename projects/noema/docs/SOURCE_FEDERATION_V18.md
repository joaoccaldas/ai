# NOEMA Source Federation v1.8

## Goal

NOEMA should become a one-stop research observatory for religion, human belief, ritual, mythology, supernatural claims, spiritual experience, institutions, historical change and competing explanations without pretending that all evidence types are interchangeable.

The moat is not a giant undifferentiated database. It is a provenance-first federation that preserves the epistemic type, historical scope, community context, source dependence, licensing and uncertainty of every record.

## Source families

### 1. Historical and comparative religion

- Database of Religious History (DRH/SCCSR): expert-coded historically scoped entries.
- Pulotu: comparative Austronesian religion and culture.
- D-PLACE: cross-cultural variables and society metadata.
- Seshat Global History Databank: polity, social-complexity, ritual/religion and historical context variables where licensing permits.
- eHRAF / HRAF: high-value ethnographic context where licensed access permits; never assume public redistribution rights.

### 2. Archaeology, material religion and sacred geography

- ARIADNE: archaeological datasets and object/site metadata.
- Pleiades: ancient-place reconciliation, names and coordinates.
- World Historical Gazetteer: temporally scoped historical place reconciliation.
- Museum open-access APIs and reviewed Wikimedia Commons records for reference imagery only.
- Primary archaeological publications and project repositories linked through DOI/data identifiers.

### 3. Texts, scriptures and historical documents

NOEMA must distinguish a primary text from claims about that text.

- public-domain or licensed canonical/scriptural corpora
- inscriptions and documentary papyri where authoritative repositories expose them
- critical editions and translations as separate source/version records
- councils, legal codes, decrees, missionary records and institutional archives

Every text record must preserve language, edition/translation, date uncertainty, manuscript/witness context where applicable and passage locator.

### 4. Scholarship and citation graph

- Crossref for DOI metadata and update/retraction metadata.
- OpenAlex for works/authors/institutions/topics/citation neighborhoods.
- PubMed/MEDLINE for biomedical/cognition discovery.
- Europe PMC / PMC for licensed structured full text where available.
- discipline-specific bibliographies and repositories where licensing permits.

Literature discovery is not evidence promotion. Citation counts are not truth scores.

### 5. Contemporary belief, affiliation and practice

- World Values Survey for longitudinal cross-national beliefs and values.
- European Values Study for European longitudinal values/religion data.
- Pew Research Center public religion datasets, global religious composition estimates and restrictions datasets.
- national censuses and official statistical agencies where religion variables are collected.

Survey responses represent sampled populations under a particular instrument and time window. They are not timeless properties of a religion or culture.

### 6. Folklore, myth, supernatural and anomalous-experience records

NOEMA should include supernatural claims without pre-judging them as either established metaphysical facts or pathology.

Required classes:

- TRADITION_RECORDED_CLAIM
- FIRST_PERSON_EXPERIENCE_REPORT
- COMMUNITY_INTERPRETATION
- HISTORICAL_CHRONICLE_REPORT
- FOLKLORE_MOTIF
- THEOLOGICAL_CLAIM
- PARAPSYCHOLOGY_EXPERIMENT
- SKEPTICAL_OR_NATURALISTIC_EXPLANATION
- FRAUD_OR_HOAX_FINDING
- UNRESOLVED

Each record keeps observer/source distance, contemporaneity, transmission chain, corroboration status, alternative explanations and evidentiary limitations.

### 7. Cognition, psychology and phenomenology

Mechanism and meaning remain separate.

- phenomenology of prayer, trance, meditation, possession, visions, dreams, near-death reports and psychedelic experience
- cognitive science of religion
- neuroscience and psychiatry only where the population and construct are valid
- cultural psychiatry and anthropology as safeguards against retrospective diagnosis

## Historical-force layer

Belief systems change because populations and institutions change. NOEMA therefore needs events and processes as first-class entities rather than decorative timeline labels.

Typed historical forces:

- CONQUEST
- STATE_FORMATION
- STATE_PATRONAGE
- LEGAL_REFORM
- PERSECUTION
- SCHISM
- REFORMATION
- REVIVAL
- MISSIONIZATION
- COLONIZATION
- ENSLAVEMENT_AND_DIASPORA
- MIGRATION
- TRADE_AND_CONTACT
- TRANSLATION
- PRINT_AND_MEDIA_CHANGE
- SCIENTIFIC_OR_INTELLECTUAL_CHANGE
- SECULARIZATION
- NATIONALISM
- REVOLUTION
- WAR
- GENOCIDE
- DECOLONIZATION
- GLOBALIZATION
- DIGITAL_MEDIA

A historical-force edge must never say merely `EVENT -> RELIGION`. It must state the proposed mechanism, evidence, affected population, time window, direction and alternatives.

Examples of mechanisms:

- institutional patronage
- legal coercion
- elite conversion
- demographic replacement or migration
- vernacularization and cheaper textual reproduction
- destruction or displacement of institutions
- syncretic contact
- boundary hardening under conflict
- identity revival
- educational and scientific change
- urbanization and social-network change

## Relationship ontology

NOEMA should distinguish at least:

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

No generic `CONNECTED_TO` edge should appear in analytical views without a typed explanation.

## Source reliability model

Reliability is use-specific, not a scalar prestige score.

Every source envelope should track:

- source family and primary/secondary/tertiary status
- author/institution
- publication date and historical distance from event
- peer-review/editorial status where applicable
- dataset snapshot/version
- language and translation
- population/sample and instrument for surveys/experiments
- source dependence and citation lineage
- conflicts of interest/funding where known
- licensing and redistribution status
- known criticism/corrections/retractions
- appropriate uses
- prohibited inferences

## Publication rule

A user should always be able to answer:

1. What is being claimed?
2. Who or what recorded it?
3. When and where does the evidence apply?
4. Is this observation, interpretation, theology, experience report or analytical hypothesis?
5. What disagrees with it?
6. What historical process could have shaped it?
7. What remains unknown?
8. What evidence would discriminate the competing explanations?
