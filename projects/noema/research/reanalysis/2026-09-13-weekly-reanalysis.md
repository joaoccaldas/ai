# NOEMA weekly local re-analysis — 2026-09-13

## Executive result

This cycle inspected the latest successful NOEMA Discovery artifact (`github-discovery-34737945040`, Action run `34737945040`) and the latest successful deterministic D-PLACE benchmark (`dplace-benchmark-34088171878`, Action run `34088171878`), then screened material scholarly findings published or newly surfaced during the prior week.

**Outcome:** five material revision candidates, three chronology/date-scope revision candidates, zero new historical relationships, zero hypothesis promotions, and zero approved-claim edits. The strongest movements are: (1) Les Rois 2 taxonomic attribution now strongly favors *Homo sapiens*; (2) Granada Neolithic cannibalism must be decomposed into distinct dated episodes rather than one uniform practice; (3) Bianfu Cave becomes a source-bounded Denisovan locality in Southwest China while artifact authorship remains constrained; (4) direct habitual neuroactive-plant use now extends into the Late Pleistocene in Sulawesi without establishing ritual meaning; and (5) direct millet chronology improves crop-dispersal timing while making crop -> people -> language shortcuts less defensible.

No model output, Crossref candidate, PubMed relevance hit, D-PLACE focal year, ML classifier, imputed genotype, or source co-occurrence was treated as evidence by itself.

## Native artifact verification

### NOEMA Discovery

- Run: `github-discovery-34737945040`
- Action run: `34737945040`
- Completed: 2026-09-13
- Candidate count: **108**
- Priority queue: **30**
- Priority composition: **5 recent publications / 2 ahead-of-print / 23 newly indexed legacy**
- Raw candidate JSON SHA-256: `1a7143b61554268e93dcff9a0ee953910be65a8e7ffd1046390c2d96e6ec5315`
- GitHub artifact ZIP SHA-256: `32f51f926715566757d1779edb1536d7a2a9e726fa6ae7f2ceae28f6e216663f`
- Policy: `CANDIDATE_UNREVIEWED`. Discovery/index recency is not evidentiary recency.

The current priority queue does not itself justify a new relationship. Its strongest already-known scholarly item, the 2026 moralistic-supernatural-explanations paper, was materially handled in the previous weekly cycle. The remaining recent/high-ranked items are mostly conceptual or peripheral to the affected graph neighborhoods.

### NOEMA Benchmark

- Run: `dplace-benchmark-34088171878`
- Action run: `34088171878`
- Output: deterministic 100-society D-PLACE benchmark
- Raw benchmark JSON SHA-256: `83ff1ed66402b284d0cf2cd3ff4433ea0e632be0cfb64819143345f803ffeeb2`
- GitHub artifact ZIP SHA-256: `c3cacb0278258b0f792b420cab1e6c0f18d16b94a76f37deb82f5dea60beb2cb`
- **No benchmark content change:** the raw benchmark digest is identical to the prior benchmark used by NOEMA.

`focal_year` remains observation/coding metadata only. It is not a date of culture origin, belief origin, language origin, or ritual origin.

## Scoring convention

Positive dimensions use **0–4, higher = stronger**: temporal plausibility, geographic/contact plausibility, ancestry explanatory fit, source independence.

Risk dimensions use **0–4, higher = more risk/unresolved**: coding bias, ecological confounding, translation/category risk, alternative explanations.

A score movement is an analytical revision candidate, not evidence.

## Affected neighborhood 1 — AURIGNACIAN_HOMININ_ATTRIBUTION / LES_ROIS_ENTITY

**Before:** Les Rois 2 retained meaningful taxonomic ambiguity in NOEMA-adjacent reasoning, with some Neanderthal-leaning interpretations historically possible.

**New evidence:** a 2026 multi-method dental reassessment using micro-CT, dental tissue proportions, EDJ traits, metrics, and 3D geometric morphometrics places Les Rois 2 within Late Pleistocene *H. sapiens* variation and outside the derived Neanderthal dental pattern. The authors conclude that all known human remains from Les Rois are now attributable to *H. sapiens*.

Source: https://doi.org/10.1002/ajpa.70354

| Dimension | Before | After | Reason |
|---|---:|---:|---|
| Temporal plausibility | 3 | 3 | The study revises taxonomy, not the archaeological chronology. |
| Geographic/contact plausibility | 2 | 2 | No new contact or dispersal pathway is demonstrated. |
| Ancestry explanatory fit | 0 | 0 | Morphological taxonomic attribution is not a test of recent Neanderthal ancestry. |
| Source independence | 1 | 2 | One new peer-reviewed study triangulates several dental methods, but it remains one evidence family. |
| Coding bias risk | 3 | 2 | Internal dental traits reduce reliance on superficial morphology. |
| Ecological confound risk | 0 | 0 | Not materially relevant to specimen taxonomy. |
| Translation/category risk | 3 | 2 | Species attribution is more direct, but plesiomorphic traits must not be translated into hybrid ancestry. |
| Alternatives unresolved | 3 | 2 | Neanderthal attribution is substantially weakened; population dynamics remain unresolved. |

**Revision candidate:** after human review, revise the Les Rois 2 specimen-level taxonomic node to `HOMO_SAPIENS_STRONGLY_SUPPORTED`. Recheck any downstream statement whose logic requires Les Rois 2 to be Neanderthal. Do **not** generalize one specimen into proof that every Aurignacian assemblage was made by the same population.

## Affected neighborhood 2 — GRANADA_NEOLITHIC_CANNIBALISM / MORTUARY_PRACTICE_ONTOLOGY

**Before:** legacy cave collections could be flattened into a broad “Neolithic cannibalism” behavior, obscuring chronology and motive.

**New evidence:** direct radiocarbon dating plus standardized taphonomic re-analysis of nearly 1,000 remains from Malalmuerzo, Carigüela, and Majolicas resolves different episodes and contexts. Malalmuerzo is Early Neolithic and compatible with a concentrated violent episode; Carigüela contains recurrent episodes and modified crania; Majolicas is later and includes red/cinnabar-associated remains. Similar processing marks do not imply one social cause.

Sources:
- https://doi.org/10.1016/j.jas.2026.106666
- https://canal.ugr.es/noticia/tres-cuevas-de-granada-revelan-que-el-canibalismo-en-el-sur-de-iberia-fue-una-practica-recurrente-durante-el-neolitico/

| Dimension | Before | After | Reason |
|---|---:|---:|---|
| Temporal plausibility | 2 | 4 | Direct dates separate previously aggregated episodes. |
| Geographic/contact plausibility | 2 | 2 | Shared region does not establish inter-site transmission. |
| Ancestry explanatory fit | 0 | 0 | No population-genetic evidence establishes a cause. |
| Source independence | 1 | 2 | New primary taphonomic and direct-dating program revisits legacy collections. |
| Coding bias risk | 3 | 2 | Standardized taphonomy improves observation coding. |
| Ecological confound risk | 2 | 2 | Subsistence/ecological alternatives remain open. |
| Translation/category risk | 4 | 4 | “Cannibalism” cannot be translated into “ritual,” “warfare,” or “funerary rite” without context. |
| Alternatives unresolved | 4 | 3 | Chronology separates scenarios, but motive remains underdetermined. |

**Revision candidate:** split any monolithic Granada/Neolithic cannibalism node into site- and episode-specific observations. Preserve `anthropogenic processing`, `consumption evidence`, `violence evidence`, `pigment association`, and `ritual interpretation` as distinct layers.

**Dating revision candidate:** `DATING-GRANADA-NEOLITHIC-CAVES-2026`. No approved date is changed automatically.

## Affected neighborhood 3 — DENISOVAN_DISTRIBUTION / BIANFU_CAVE_ENTITY / HOMININ_ARTIFACT_AUTHORSHIP_INFERENCE

**Before:** Denisovan presence in Southwest China was a major geographic gap; associated Middle Pleistocene archaeology could not be confidently attached to a molecularly identified population.

**New evidence:** proteomics identifies five Bianfu Cave specimens as Denisovan, from layers approximately 167–134 ka. A companion study places the wider cultural sequence at approximately 190–70 ka. This strongly changes the geographic occupancy model, but the two papers share the same site/program and are not counted as two independent evidence families. The authors also state that available genomic/proteomic data remain too sparse to characterize the Bianfu population's lineages or contribution to later modern humans.

Sources:
- https://doi.org/10.1038/s41586-026-10976-9
- https://doi.org/10.1038/s41586-026-10997-4

| Dimension | Before | After | Reason |
|---|---:|---:|---|
| Temporal plausibility | 2 | 4 | Molecularly identified fossils occur in dated layers. |
| Geographic/contact plausibility | 1 | 4 | Southwest-China presence is now directly source-bounded. |
| Ancestry explanatory fit | 1 | 1 | Taxonomic presence does not establish lineage contributions to later populations. |
| Source independence | 1 | 2 | Two companion papers triangulate context, but are dependent and count as one site-level evidence family. |
| Coding bias risk | 3 | 2 | Proteomic assignment sharply improves taxonomic coding. |
| Ecological confound risk | 2 | 2 | Habitat suitability does not establish migration route or behavior. |
| Translation/category risk | 4 | 3 | “Denisovan at site” is defensible; “Denisovan authored every associated artifact” remains high-risk. |
| Alternatives unresolved | 3 | 2 | Presence is far less ambiguous; population structure and artifact authorship remain unresolved. |

**Revision candidate:** move `DENISOVAN_PRESENCE_SOUTHWEST_CHINA` from indirect/hypothetical to source-supported locality after human review. Keep `HOMININ_ARTIFACT_AUTHORSHIP_INFERENCE` constrained: archaeological layer association is not individual authorship proof.

## Affected neighborhood 4 — PSYCHOACTIVE_PLANT_CHRONOLOGY / ALTERED_STATE_BEHAVIOR_ONTOLOGY

**Before:** NOEMA’s strongest direct evidence for habitual psychoactive/neuroactive plant use was much later and could tempt a Holocene/agricultural framing.

**New evidence:** two pre-agricultural Sulawesi foragers show a distinctive dental-wear pattern experimentally linked to habitual whole-betel-nut sucking, with biomolecular evidence consistent with areca exposure. The older individual dates to approximately 25–16 ka.

Sources:
- https://doi.org/10.1126/sciadv.aei1901
- https://news.griffith.edu.au/2026/09/10/ice-age-origins-of-one-of-humanitys-oldest-drug-habits/

| Dimension | Before | After | Reason |
|---|---:|---:|---|
| Temporal plausibility | 1 | 4 | Directly dated human remains extend the behavior into the Late Pleistocene. |
| Geographic/contact plausibility | 1 | 2 | Strong local occurrence; no long-distance continuity or diffusion is established. |
| Ancestry explanatory fit | 0 | 0 | No ancestry mechanism is tested. |
| Source independence | 1 | 2 | Dental wear, experiment, and biomolecular analysis triangulate one primary study. |
| Coding bias risk | 3 | 2 | Convergent methods improve behavioral identification. |
| Ecological confound risk | 2 | 2 | Availability and medicinal use remain plausible context variables. |
| Translation/category risk | 4 | 4 | Neuroactive use is not evidence of ritual, shamanism, religion, visions, or spiritual purpose. |
| Alternatives unresolved | 4 | 3 | Habitual use is stronger; motive and cultural meaning remain unresolved. |

**Revision candidate:** extend the source-bounded chronology of habitual neuroactive plant use to the Late Pleistocene. Do not create a ritual, shamanism, or religion edge from this evidence.

**Dating/scope revision candidate:** `PSYCHOACTIVE_PLANT_CHRONOLOGY` now has a materially older directly evidenced instance.

## Affected neighborhood 5 — MILLET_DISPERSAL_CHRONOLOGY / CROP_LANGUAGE_DEMOGRAPHY_PROXY

**Before:** some broad migration/diffusion narratives can overread crop appearance as a proxy for people, language, or cultural descent.

**New evidence:** 70 directly dated millet grains, including 16 new AMS dates, plus Bayesian modeling and stable-carbon-isotope synthesis support the western Pontic Steppe as the earliest secure European millet evidence and synchronous subsequent appearances in the Carpathian Basin, Southeastern Europe, and the Caucasus.

Source: https://doi.org/10.1038/s41598-026-70250-w

| Dimension | Before | After | Reason |
|---|---:|---:|---|
| Temporal plausibility | 2 | 4 | Direct grain dating materially improves chronology. |
| Geographic/contact plausibility | 2 | 3 | The crop distribution sequence is clearer, though mechanisms of transmission remain open. |
| Ancestry explanatory fit | 1 | 1 | Crop movement does not establish population ancestry. |
| Source independence | 1 | 2 | Direct dating plus isotopic synthesis strengthens the crop chronology. |
| Coding bias risk | 2 | 2 | Crop presence is comparatively direct, but sample coverage remains uneven. |
| Ecological confound risk | 3 | 3 | Environment and subsistence affect adoption and preservation. |
| Translation/category risk | 4 | 4 | Crop spread must not be translated into language spread or demic migration. |
| Alternatives unresolved | 3 | 3 | Exchange, adoption, farmer movement, and mixed mechanisms remain viable. |

A global language-spread model published in 2026 reconstructs more than 2,500 diffusion events and finds faster modeled spread among agricultural languages, but it explicitly relies on reconstructed phylogenies, dates, and homelands, and acknowledges that language diffusion need not equal movement of people.

Source: https://doi.org/10.1016/j.qeh.2026.100107

**Revision candidate:** update crop chronology, while **reducing confidence in any shortcut edge** `crop dispersal -> demic migration -> language dispersal` unless archaeological, genomic, and linguistic evidence independently converge.

**Dating revision candidate:** `DATING-MILLET-EUROPE-2026`.

## Reinforced but not materially changed — MORTUARY_KINSHIP_ONTOLOGY / VIKING_AGE_EVENT_CAUSATION

The prior weekly cycle already weakened co-burial -> close biological kinship. A rare six-person Viking-age burial in Semigallia now independently reinforces that boundary: the group includes a father-son pair, a third-degree relative, and biologically unrelated individuals. Three adult males have perimortem sharp-force trauma. Population genetics is closer to local ancient Baltic groups than predominantly Scandinavian groups. The study says a Viking-age raid is **possible**, not established.

Source: https://doi.org/10.1016/j.jasrep.2026.105790

**No status change.** The new case strengthens the ontology rule that biological kinship, social group membership, mortuary co-placement, cultural tradition, genetic affinity, and event causation are distinct variables.

## Method guards added or strengthened

### Strontium mobility classification

MobSr is trained on roughly 3,000 human enamel samples from 86 sites using published expert-derived local/non-local classifications. Its reported 87–95% performance is explicitly **agreement with the source-study labels**, not accuracy against independently known residential histories.

Source: https://doi.org/10.1007/s10816-026-09827-8

**Guard:** ML locality probability is a model-derived inference layer. It must not be stored as direct mobility observation or used as an independent source when its labels descend from the studies being evaluated.

### Human-bone radiocarbon reservoir effects

A 2026 methodological warning shows that freshwater dietary inputs can make human-bone radiocarbon ages appear hundreds of years too old, with examples including Danish monastic burials and older prehistoric contexts.

Source: https://doi.org/10.1038/s40494-026-02958-x

**Guard:** where human-bone dates coexist with elevated nitrogen isotopes or plausible freshwater diets, NOEMA should flag reservoir-risk review before using the date as a hard chronological boundary. This cycle does not automatically alter any focal site date.

### Ancient-DNA imputation

A 2026 Nature Communications benchmark shows imputation can improve archaic-ancestry recovery from low-coverage ancient genomes, but very low coverage and genotype-probability filtering can introduce specific biases.

Source: https://doi.org/10.1038/s41467-026-76204-0

**Guard:** observed genotype, imputed genotype, inferred archaic segment, population affinity, culture, language, and identity remain separate provenance layers.

### Mortuary object intentionality

A Warring States Qin intraoral stone study finds no evidence for sustained antemortem prosthetic use; postmortem placement remains plausible, but taphonomic displacement cannot be excluded because original microcontext was not documented.

Source: https://doi.org/10.1038/s40494-026-02987-6

**Guard:** object-with-body association is not sufficient evidence for ritual, intentional placement, status, dentistry, or belief.

## Neurodiversity, religion, witchcraft, and retrospective diagnosis

The latest NOEMA PubMed discovery feed remains candidate-only. Its `neurodiversity_religion` query returned seven retrieved records but **zero title-gated relevant records** in the latest feed; `witchcraft_psychiatry_history` returned **zero**; `sleep_visions` with supernatural/witch terms returned **zero**. The two retained PubMed candidates were a systematic neurotheology review and a retrospective psychedelic/mystical-experience survey.

A separate 2026 study of 2,091 modern participants reports associations among autistic traits, positive schizotypy, religiosity/spirituality, and faith changes, but it is cross-sectional and modern.

Source: https://doi.org/10.3389/fpsyg.2026.1689818

**No historical-diagnosis revision.** There is still no defensible evidence chain from modern neurodivergent trait correlations to “witches,” shamans, mystics, or historical religious specialists as diagnostic categories. NOEMA should continue treating such ideas as explicitly testable hypotheses about mechanisms and social selection, never retrospective diagnoses.

## Explicit contradiction and redating search

The cycle explicitly searched for new dating or attribution results affecting Los Aviones, La Roche-Cotard, La Ferrassie, Shanidar, Blombos, Bizmoune, Qafzeh, and Tinshemet. **No verified publication from the review window was found that requires a new NOEMA chronology for those focal deep-time sites.**

Absence of a revision is not proof that current dates are final.

Material chronology changes elsewhere this week are kept as review candidates:
1. Granada Neolithic cave episodes: direct radiocarbon separation.
2. Sulawesi habitual betel-nut use: directly evidenced Late Pleistocene instance.
3. European millet dispersal: direct AMS/Bayesian chronology refinement.

The C-Turkey v1.0.0 release and Brattforsheden loess chronology are useful versioned chronology resources, but this cycle did not translate them into graph-level historical claims without record-by-record reconciliation.

## Revision candidates for human review

1. `REV-2026-09-13-LES-ROIS-TAXONOMY` — specimen-level Les Rois 2 attribution -> *H. sapiens* strongly supported; recheck downstream Neanderthal-dependent statements.
2. `REV-2026-09-13-GRANADA-EPISODE-SPLIT` — split monolithic Neolithic cannibalism into dated site/episode observations; motive remains separate.
3. `REV-2026-09-13-BIANFU-DENISOVAN-DISTRIBUTION` — Southwest China Denisovan locality becomes source-supported; lineage contribution and artifact authorship remain unresolved.
4. `REV-2026-09-13-PSYCHOACTIVE-PLANT-CHRONOLOGY` — extend direct habitual neuroactive-plant-use chronology to 25–16 ka; no ritual edge.
5. `REV-2026-09-13-CROP-LANGUAGE-PROXY` — refine millet chronology and downweight crop->people->language proxy edges absent independent convergence.

No revision candidate changes an approved claim automatically.

## Review queue created

- `REVIEW-LES-ROIS-TAXONOMY`
- `REVIEW-GRANADA-EPISODE-SPLIT`
- `REVIEW-BIANFU-DISTRIBUTION`
- `REVIEW-BIANFU-ARTIFACT-AUTHORSHIP`
- `REVIEW-SULAWESI-PSYCHOACTIVE-CHRONOLOGY`
- `REVIEW-MILLET-CHRONOLOGY`
- `REVIEW-CROP-LANGUAGE-DEMOGRAPHY-GUARD`
- `REVIEW-SEMIGALLIA-MIXED-KIN`
- `REVIEW-MOBSR-VALIDATION-LAYER`
- `REVIEW-HUMAN-BONE-RESERVOIR-RISK`
- `REVIEW-NEURODIVERSITY-HISTORICAL-DIAGNOSIS-GUARD`

## No-change statement

No approved claim was edited. No candidate was promoted to evidence. No speculative relationship became fact. No dependent companion paper was counted as an independent evidence family. No D-PLACE focal year was treated as an origin date. No model re-score was treated as evidence. The deterministic D-PLACE benchmark content is unchanged. The focal deep-time site chronologies listed above received no verified redating this cycle.
