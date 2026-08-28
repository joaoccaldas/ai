# NOEMA Operating Protocol v0

## Principle

The system continuously discovers and re-evaluates evidence, but never silently promotes machine-generated relationships into historical facts.

## Research cycle

### Daily: discovery and ingestion

1. Discover newly published or newly indexed material.
2. Deduplicate by DOI, canonical URL, title fingerprint, and source identity.
3. Store source metadata before extraction.
4. Extract atomic candidate claims with exact provenance spans where licensing permits.
5. Resolve entities conservatively; unresolved aliases remain unresolved.
6. Record ingestion and model actions in the audit log.
7. Do not publish unreviewed claims.

### Weekly: local re-analysis

Recompute only graph neighborhoods affected by new or revised claims:

- semantic candidates
- temporal compatibility
- geographic compatibility
- known contact routes
- linguistic/population ancestry
- source independence
- coding/category bias
- alternative explanations

Any score change creates a hypothesis revision, never an overwrite.

### Monthly: discovery run

Run broader analyses:

- motif clustering
- temporal sequence mining
- spatial autocorrelation
- phylogenetically-aware recurrence analysis
- contradiction discovery
- under-studied regions and traditions
- unexplained high-independence recurrences

Outputs are candidate hypotheses awaiting adversarial review.

### Quarterly: paradigm challenge

Rank accepted/open hypotheses by fragility and deliberately attempt to reduce confidence:

- search for negative evidence
- search for later dating revisions
- test alternative category definitions
- test diffusion/contact explanations
- test shared ancestry
- test ecological convergence
- inspect source dependence and colonial/translation bias

The objective is not to protect the current graph; it is to improve calibration.

## Agent lenses

Each hypothesis review should include independent passes using these methodological lenses:

1. archaeology
2. history
3. anthropology
4. comparative religion
5. historical linguistics
6. cognitive science
7. statistics / causal inference
8. skeptical source audit
9. community / indigenous-perspective review where applicable

These are methodological prompts, not claims that an LLM is a credentialed expert.

## Hypothesis promotion gate

A hypothesis cannot move beyond `SPECULATIVE` unless it has:

- >= 2 independent supporting claims
- >= 1 explicit alternative hypothesis
- >= 1 falsification criterion
- temporal plausibility checked
- source independence estimated
- coding-bias risk considered
- contact/ancestry alternative considered when relevant
- machine-generated evidence excluded from evidence count

`SUPPORTED` additionally requires human review.

## Publication gate

Never publish:

- `DO_NOT_PUBLISH` material
- `COMMUNITY_RESTRICTED` material without explicit authorization
- private notes or credentials
- unpublished personal data
- generated claims that have not passed review

Public site views should be built from an explicit publishable projection, not direct unrestricted database access.

## Unknown protocol

Use `UNKNOWN` when observations are credible but available evidence cannot discriminate among live explanations. Unknown is not a placeholder for supernatural causation, nor a synonym for error.

## Source strategy

Seed categories:

- peer-reviewed literature
- archaeological databases
- historical primary sources
- ethnographic corpora
- linguistic phylogenies
- ancient DNA literature
- environmental and paleoclimate data
- astronomy datasets where historically relevant
- museum/catalogue records
- structured comparative-religion datasets

Every connector/source adapter must declare licensing, access, update cadence, and extraction limits.
