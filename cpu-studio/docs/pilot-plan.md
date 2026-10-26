# CPU Studio: 30-player validation pilot

**Status:** protocol only; no children or parents have yet been enrolled. All numeric thresholds are prospective decision gates, not observed performance.

## Four hypotheses

1. **Usability:** at least 80% of naive learners successfully boot the 1975 kit within 2 minutes without instruction.
2. **Mastery:** at least 65% of learners identify an unexpected incorrect / missing component and correct it in 4 minutes. Measure question correctness before and after play rather than self-reported learning alone.
3. **Engagement:** 50% of consenting test users voluntarily start a second mission, with no reward reminder. Target D1 25% and D7 10% for first exploratory cohort, to be recalibrated against relevant comparables (these are hypotheses, not industry benchmarks).
4. **Distribution:** at least 5 of 10 interviewed caregivers/teachers can describe a concrete context for using the app again; separately verify budget, procurement and willingness to pay.

## Research procedure

- Recruit 20–30 participants of varied prior PC experience across ages 9–14, using informed guardian consent and child assent; collect no names directly in the game.
- Randomize presentation order for comparison with a static computer-components explainer, if feasible and ethical.
- Observe first session on the participant's own phone or a neutral device. Screen/audio recording is opt-in and not necessary for the basic tests.
- Before and after, ask 4 novel, age-appropriate factual questions covering CPU instructions, RAM volatility, storage and compatibility; avoid teaching the exact test prompts beforehand.
- Record observer-noted time-to-boot, errors, requested help, completed missions and next-day voluntary use only with explicit permission.
- Debrief child and caregiver separately about enjoyment, frustration, perceived learning and unprompted desire to share.

## Instrumentation needed before a funded rollout

An event schema, anonymous session identity with clearly documented retention and deletion, a consent/assent flow where required, a privacy notice, minimal purpose-bound analytics and safeguards. Offline build currently logs only a local currency history; **there is no instrumented production funnel or public telemetry**.

## Stop/go criteria

- Safety and technical correctness are non-negotiable: no misleading history, no accidental data collection, no harmful trading functionality, no security failures.
- Continue to product beta if participants can play uncoached, can demonstrate real knowledge gains, and caregivers/teachers report a clear repeat-use case.
- If users enjoy the aesthetic but don't learn, rework the lesson design before adding more collectible systems.
- If learning works but retention is weak, test creative build challenges and multiplayer co-op only under adequate child-safety protections.

## Funding conversation

Funding readiness requires: working game vertical slice, observed user tests, historical-content advisor sign-off, clear buyer hypothesis, distribution channel evidence, team/roadmap, costed budget and privacy/security plan. This source package currently provides the vertical slice, source-level engine tests and the validation protocol; it is **not** proof of traction, market size, legal compliance, scalability under load, or investability.
