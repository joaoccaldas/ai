# NOEMA: question-first product and LLM research contract
Status: proposed contract, 2026-10-18. This document extends, **does not supersede**, `docs/ROADMAP.md`, `research/UI_RELEASE_STANDARD.md`, and the README scientific contract. No implementation status is implied by this document.

## The problem NOEMA solves
People exploring the history of belief currently need to reconcile scattered primary records, archaeological observations, historical commentary, religious self-descriptions, conflicting scholarly interpretations, and culturally sensitive knowledge. Search engines and LLMs collapse these into fluent prose too easily. NOEMA's job is to allow a reader or machine to distinguish **what was observed, what was reported, what was believed, what scholars infer, and what remains unknown**.

## Primary user questions and measurable outcomes
| Persona | Question | Expected output | Failure to prevent |
|---|---|---|---|
| Curious learner | What did people in this region believe at a particular time? | Bounded overview with representative evidence, uncertainty and dated region | Modern beliefs projected into the past |
| Student/teacher | How did this tradition change and why? | Timeline with event mechanisms, alternatives and sources | Dates treated as causal proof |
| Researcher | What sources support or contradict this historical link? | Claim-level evidence table, independent source families, dating and counterevidence | Similarity represented as descent |
| Member of living tradition | How is this practice understood by its communities? | Respectful attribution, plurality of views, access restrictions | Treating outsiders' interpretations as authoritative |
| Comparative historian | Which motifs recur, and could contact, shared inheritance or convergence explain them? | Typed comparison, controls, missingness and falsification conditions | Naive cross-cultural pattern mining |
| LLM/agent | What can I safely state with a citation? | Stable, versioned, policy-filtered claim bundles with source locators | Hallucinated claims or leaked restricted material |

## Product navigation and use cases
Use the already established five-area navigation and synchronized Map–Time–Graph–Evidence lens, rather than replacing functioning surfaces. Evaluate task success for:
1. Question → answer overview → claim → source locator → alternative interpretation.
2. Tradition → time period → geographic scope → evidence-bounded evolution.
3. Compare two concepts → distinguish identity, analogy, transmission and disagreement.
4. Start with an ancient artifact → report what is materially observed separately from religious interpretations.
5. Start with an extraordinary report → inspect reporting chain, interpretations and unresolved alternatives.
6. Save a reproducible research trail containing query, filters, snapshot and source identifiers.

## LLM-facing evidence contract
A retrieval response MUST carry:
- `snapshot_id` and schema version, retrieval timestamp, content visibility and license constraints.
- Stable IDs and multilingual aliases for entity records, with temporal and geographic scope.
- Separately typed observation, report, interpretation, hypothesis and scholarly synthesis.
- Claim-local source locators (edition, page/section, DOI or stable URL where legitimate), evidence status, and provenance chain.
- Relationship semantics; **RESEMBLES != DESCENDS_FROM** and temporal ordering is not causation.
- Explicit unknown/contested/absent/not-coded states, source dependencies and relevant counterevidence.
- An `answerability` state: supported, mixed, insufficient, restricted, or out-of-scope.
- No automatic publication of extraction output, inferred relationships, or sensitive material.

The assistant must cite claim IDs AND retrievable source locators, describe limitations and refuse to fill an evidence gap by inventing a narrative. Bibliometric citations and embeddings may rank discovery candidates but never count as historical support.

## Evaluation protocol
Create version-pinned, independent expert-adjudicated cases with expected claim sets, mandatory caveats, disallowed inferences, scope and sensitivity flags. Do not use one LLM's self-rating as ground truth. Split evaluation into:
- Evidence support and citation entailment.
- Historical/time/geographic correctness.
- Epistemic calibration and contradiction handling.
- Retrieval relevance and abstention on insufficient evidence.
- Cross-language name resolution and translation fidelity.
- Sensitive/restricted data non-disclosure.
- Latency, accessibility, navigation task completion and graph comprehensibility.

Record precision/recall against approved reference claims; track unsupported assertion rate, citation locator validity and inappropriate disclosure count. Baseline before setting numerical pass targets. Historical correctness requires expert checks, not deterministic unit tests alone.

## Evidence-derived design constraints
- DRH's expert-contributed comparative history demonstrates structured entries can coexist with textual interpretation, references and space/time exploration: https://religiondatabase.org/landing/about
- DRH ontology/coding work identifies the unit of analysis and coding as fundamental cross-cultural data-design decisions: https://doi.org/10.1080/2153599X.2023.2200825
- W3C PROV-O provides reusable provenance entities/activities/agents for data lineage: https://www.w3.org/TR/prov-o/
- CIDOC CRM provides a cultural-heritage ontology for interoperability: https://cidoc-crm.org/
- W3C WCAG 2.2 gives testable accessibility success criteria: https://www.w3.org/TR/WCAG22/

These sources support methodology, not claims that NOEMA already meets a benchmark.

## Implementation order: incremental gates
**Gate 0: verify rather than rebuild.** Inventory existing surfaces, projection formats, CI, data and permissions. Record measured baseline and component reuse. Compare against `docs/ROADMAP.md` and refuse duplicate scaffolds.

**Gate 1: contract tests.** Add versioned LLM-retrieval fixtures, forbidden inference cases, source locator verification and restricted-data denial checks. Ensure existing publication firewall remains intact.

**Gate 2: query-to-evidence path.** Expose filtered read-only retrieval through existing API; never allow direct candidate promotion. Add response schemas, lineage and reproducible query metadata.

**Gate 3: research UX.** Improve existing search and synchronized lenses with question-first examples, immediately visible provenance/uncertainty, explicit relationship legend and keyboard/mobile task flows. Measure against baseline.

**Gate 4: source depth.** Add licensed source federation and reviewed crosswalks, prioritizing independent evidence families and geographic/language coverage rather than raw node counts.

**Gate 5: governance.** Expert/community review, artifact versioning, correction and retraction propagation, privacy/rights checks, drift and contradiction monitoring.

## Change control
For each PR: inventory overlapping functionality; state research hypothesis and affected user question; attach before/after tests; preserve existing source lineage; run unit/integration/browser checks where applicable; attach accessible screenshots for UI work; prove no candidate or restricted content bypasses publication gate; add rollback; distinguish tested code from historically validated content. Never claim deployed functionality or full completeness from a documentation-only PR.

## Definition of success
NOEMA becomes valuable when a learner can follow an idea across time and culture without being misled, a researcher can reproduce the path from claim to source, and an LLM can answer with bounded, reviewable evidence or abstain. Measure coverage by source quality, independent evidence families, geographic/temporal diversity, reviewed entities and unanswered question classes, not by total graph edges.
