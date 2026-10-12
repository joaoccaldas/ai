# Decision log

Use one entry per consequential decision.

## Template
### D-000 — Title
- Date:
- Status: proposed | accepted | rejected | superseded
- Question:
- Options considered:
- Evidence:
- Decision:
- Why:
- What would falsify this decision:
- Downstream dependencies:

### D-OVERRIDE-MAIN — Merge gaudi-nexus to main and publish a public gallery
- Date: 2026-10-12
- Status: accepted (explicit owner instruction)
- Question: the rule "Do not merge Gaudi competition work to main" (current_world.json, README) conflicts with the owner's request to deploy to main with a public URL.
- Options considered: shared assets only; everything; gallery page only.
- Evidence: owner chose "Everything, override the rule" and Vercel hosting when asked.
- Decision: merge gaudi-nexus into main; publish a static public gallery on Vercel.
- Why: owner decision.
- What would falsify this decision: a competition rule against pre-submission publication, or a licence breach in the public page (municipal data is CC BY 4.0 / ODbL and needs attribution).
- Downstream dependencies: the older no-merge rule text in current_world.json and README is superseded for this merge only; the page must carry the attributions.
