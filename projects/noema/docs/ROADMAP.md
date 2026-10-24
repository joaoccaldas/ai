# NOEMA commercial roadmap

Last updated: 2026-10-21

NOEMA is an evidence-first discovery product for human belief, spirituality, ritual, and reports of the unexplained. It is built on comparative-religion datasets, a 17-dimension ontology, source provenance, and candidate correlations. Similarity generates a question, never a conclusion.

This document is the commercial release path. The scientific program remains in [RESEARCH_ROADMAP.md](RESEARCH_ROADMAP.md). Nothing here is a measured result unless it says so. KPI targets and prices are proposals.

## Release gates

```mermaid
flowchart LR
  G0["G0 Ground truth"] --> G1["G1 Product clarity"]
  G1 --> G2["G2 Trusted discovery"]
  G2 --> G3["G3 Understandable insights"]
  G3 --> G4["G4 Release certification"]
```

### G0 — Ground truth

The public site shows only what the projections actually contain.

- Every shown claim keeps its source, scope, and epistemic status.
- Candidates stay labelled as candidates. They are not promoted to findings.
- Unknown is not redrawn as absence. Similarity is not redrawn as ancestry, diffusion, or cause.
- Reference images stay reference images.
- A visual audit exists for every HTML page, with screenshots and a machine-readable report.

### G1 — Product clarity

A new visitor can tell what NOEMA is and where to go, on a phone, without WebGL.

- Home is a page, not a redirect into the observatory.
- One primary navigation: Home, Explore, Atlas, Connections, Research.
- The 3D observatory is an optional depth layer.
- P0 reading paths work when WebGL or remote media fail.
- Touch targets on primary controls are at least 44px. `prefers-reduced-motion` is respected.

### G2 — Trusted discovery

Five flagship journeys are completable from the home page into evidence, each still carrying provenance and the candidate label where a pattern is only a candidate.

1. Odin and Norse magic
2. Wicca and witchcraft
3. Ancestors and spirits
4. Shamanism, nature, and altered states
5. Unexplained experiences

A journey is trusted when the visitor can see what is coded, what is missing, which source family it came from, and which rival explanations remain open. Empty or thin coverage is an acceptable result.

### G3 — Understandable insights

Pattern and comparison views lead with a denominator and a caveat.

- Show the cohort size and the number of comparable profiles (`n`), not a bare percentage.
- State the missingness rule in the same view as the candidate.
- Name at least one unresolved confounder (phylogeny, geography, contact, source dependence, or chronology).
- Do not display a probability, origin date, or causal arrow the model has not earned.

### G4 — Release certification

Ship only after the product is usable and honest under the same checks a buyer would notice.

- Accessibility: keyboard reach, visible focus, skip link, labelled navigation, and no information that exists only in color or motion.
- Core Web Vitals on the P0 templates, field or lab: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- The MVP browser checks stay green: no home redirect, primary targets resolve, no horizontal overflow on P0 at 390px, no console errors on P0.
- Publication gate still refuses automatic claim promotion.

## Where this tree sits

G0 and the front door of G1 are in progress in the MVP branch: the redirect loop is gone, primary navigation is shared, and the observatory no longer throws when WebGL is unavailable. G2 journeys are linked as starting points, not certified paths. G3 denominators already exist inside Connections and Compare and are not yet the first thing a new visitor reads. G4 performance and a full accessibility audit are not yet measured.

## KPI scorecard

These are proposals for what to instrument. No baseline has been measured in production.

| Signal | Proposal | Gate | Status |
| --- | --- | --- | --- |
| Home stays on Home | 0 meta refreshes | G1 | Addressed in this MVP; re-check in CI |
| P0 overflow at 390px | 0 pages | G1 | Covered by Playwright |
| P0 console errors | 0 | G1 | Covered by Playwright |
| Flagship journey completion | Visitor reaches a sourced record or an explicit empty state | G2 | Not measured |
| Candidate misread rate | Share of sessions that treat a candidate as a conclusion, from moderated review | G2–G3 | Not measured |
| Provenance visible | 100% of claim-like statements in the journey show a source or an explicit gap | G2 | Not measured |
| Insight with denominator | 100% of public pattern rows show `n` and a caveat | G3 | Present in current pattern JSON; not certified in the UI |
| LCP / INP / CLS | ≤ 2.5s / ≤ 200ms / ≤ 0.1 | G4 | Not measured |
| Accessibility blockers | 0 critical issues on P0 | G4 | Not audited beyond skip link, focus, and labels |

## Deliberately deferred

- Accounts, billing, teams, and saved workspaces.
- Any price, seat, or API quota. See the proposal below; it is not a launched offer.
- Promoting candidates into approved claims, probabilities, or origin stories.
- Phylogenetic comparative models, covariance-aware spatial models, and a contact network. Those stay on the research roadmap until they exist as models.
- Rewriting every legacy research page into the new visual system. P0 is first.
- Deleting superseded HTML. See [audit/PAGE_DISPOSITION.md](audit/PAGE_DISPOSITION.md).
- Replacing the observatory’s remote Three.js build with a vendored runtime. The page already remains usable when that script fails.

## Monetization and positioning

Proposal only. Not a price list and not evidence of demand.

**Who it is for.** Researchers, documentary and education editors, and cultural institutions who need to compare beliefs and rituals without collapsing resemblance into a single origin story.

**Who pays, and why.**

- A research seat pays for trusted traversal: provenance, denominators, and explicit unknowns, instead of an unsourced summary.
- A library or department pays for shared reading access to the same gated projections, with export of citations rather than of private corpora.
- A methods or data partnership pays to keep a source family inside the publication gate. That fee does not buy a claim.

**What stays free.** The public reading surface, including the five journeys, with candidates labelled and sources attached. The free tier is the evidence of the product, not a stripped demo that hides uncertainty.

**What we will not sell.** Certainty, spiritual advice, diagnosis, or a ranked “most ancient” tradition.
