# CPU Studio / v0.2.1 release gate / 23 October 2026

## Release classification

**GO for a public *educational beta* at `https://joaoccaldas.github.io/ai/cpu-studio/`, verified after GitHub Pages publication on 23 October 2026. NO-GO for a production multiplayer game, child-directed monetization, unrestricted trading, or claims of validated learning/retention.**

This is a small static site with no registration, public chat, cross-device inventory, remote telemetry, or payments. This sharply limits its online privacy and fraud exposure. It is **not** an independent security, accessibility or child-safeguarding certification.

## What was independently examined

- Original source: `src/catalog.mjs`, `src/engine.mjs`, `src/main.mjs`, `index.html`, `styles.css`, `sw.js`, manifest, tests, product and funding docs.
- Existing public Vercel v0.2 preview: a remote browser agent successfully opened without login, installed 8080 CPU/256-byte RAM/front-panel, booted first level, earned 65 credits/45 XP and navigated Shop/Museum; observed minor layout copy/ownership issues. **This browser result applies to v0.2, not automatically to v0.2.1.**
- Automated local tests after v0.2.1 fixes: `npm run check` includes **38 passing tests**, module syntax checks and a deterministic single-file build.
- Scripted Chromium viewport verification in managed container: **blocked by `net::ERR_BLOCKED_BY_ADMINISTRATOR`**. Browser layout checks at 320, 375, 390, 428, and 768px as well as native iOS/Android tests remain **not verified**.

## Changes shipped since v0.2

1. **Historical/functional correctness:** memory upgrades of the same interface can satisfy lower minimum capacity requirements (S-100 1 KB vs 256 B, EDO 16 MB vs 8 MB, DDR5 32 GB vs 16 GB). Lower-capacity modules cannot fulfill upgrade goals. These alternatives are **curated**; not a general hardware compatibility database.
2. **Real troubleshooting:** Level 8 now starts with an installed incompatible DDR2 module. The player must diagnose and replace it with DDR. Missing CPUs do not mask the visible wrong-memory problem.
3. **Economy integrity:** protect the only required replacement even when the current slot contains a wrong component; one-time rewards persist. Display installed and spare inventory separately in the Shop.
4. **Clearer onboarding and feedback:** first-stage 'tap a part' prompt, honest repeat-boot reward copy, larger minor labels, larger mobile controls.
5. **PWA fail-safe:** versioned shell cache; never serve the HTML app as a fallback for missing JavaScript/CSS assets.
6. **Public beta hardening:** same-origin CSP on the modular GitHub Pages version; relative paths work under `/ai/cpu-studio/`; local-only game state and read-only validated blueprint links.
7. **Release verification:** static asset/PWA checks added to automated tests and path-scoped CI intended for the `ai` repository.

## Product audit, 0–5 scale (expert judgment, not measured user ratings)

| Dimension | Score | Why | What blocks the next gate |
|---|---:|---|---|
| Concept differentiation | 3 | Distinct historical storytelling in a crowded PC-build education niche | Demonstrate learning and repeat motivation |
| FTUE | 4 | Three parts, one power button, no account; remote beta flow passed | Timed, uncoached first-user tests |
| Visual craft | 3 | Five period-based scene themes, but stylized CSS rather than true 3D/hardware interactions | Pixel/device QA and modern typography/accessibility pass |
| Hardware accuracy | 3 | Real components and upgrade constraints; now accepts key valid alternatives | Review by historian and technician; cables/PSU/motherboard interactive fidelity |
| Progression/economy | 3 | 10 levels, credits, museum, shop and NPC barter | Replayable engineering jobs and tested currency sinks |
| Social | 1 | Private blueprint link only, offline fictional swaps | Identity, moderation, age-safety/guardian controls, transactional ledger |
| Security/privacy | 4 for current static scope | No login, analytics, PII collection, payment or player marketplace | Vulnerability scans, child-safety review before wider functionality |
| Funding evidence | 2 | Playable example, disciplined pilots and clear boundary | Observed learning, D1/D7 behavior, cohort size, GTM/cost and expert validation |

## Publication evidence (independently checked)

- Source: [`joaoccaldas/ai/cpu-studio`](https://github.com/joaoccaldas/ai/tree/main/cpu-studio), merged via [PR #119](https://github.com/joaoccaldas/ai/pull/119), first release SHA `9bd9e1419774977ea31c0e81108a516f1af7233a`.
- Main-branch [CI tests passed](https://github.com/joaoccaldas/ai/actions/runs/39991792130); [GitHub Pages deployment passed](https://github.com/joaoccaldas/ai/actions/runs/39991788189); [legacy Pages verification passed](https://github.com/joaoccaldas/ai/actions/runs/39991792529).
- Live-browser [verification session](https://agent.tinyfish.ai/runs/d7406680-7731-4af1-8a90-99ec6c6e20ae): public URL returned HTTP 200 without login; styles and modules rendered; first 1975 CPU/RAM/front-panel install successfully booted; first completion paid 65 CR +45 XP; Shop, Museum, Club and return navigation preserved state. No critical overlap was observed on the browser's **desktop viewport**.
- **Not verified:** 320/375/390/428px layout, Safari, real Android touch, all levels end-to-end through the public host. CI verifies 38 test cases, including the deterministic ten-level run, but this is not equivalent to real mobile user testing.

## Production rollout gate

- [x] Isolated app path, no root app overwrite
- [x] Deterministic full-progression tests
- [x] Correct incompatibility tests and replay reward integrity
- [x] Local economy no mandatory grind / purchase softlock test
- [x] Self-hosted runtime, no external assets
- [x] Existing public preview first-time flow independently verified (v0.2)
- [x] Data/safety feature boundary stated in product
- [x] GitHub Pages published and public HTTP/assets independently verified on **v0.2.1**
- [ ] iOS Safari + Android Chrome physical touch tests
- [ ] 320/375/390/428 responsive screenshots and keyboard/reader review
- [ ] Guardian-consented 20–30 learner usability/knowledge pilot
- [ ] Independent historical hardware review
- [ ] Quantitative day-1/day-7 engagement and learning efficacy results

## Pilot KPIs, proposed not achieved

First successful boot <=120 seconds for >=80% of first-time players; >=65% solve unseen RAM mismatch; pre/post learning uplift over a static lesson; sufficient voluntary return to motivate expansion. No real participants have been measured and no retention metrics are asserted.

## Decision rule

Keep accessible as a **no-login educational beta** after URL verification. Do not pitch as a production-safe child social network, claim full historically accurate component-by-component physical assembly, or solicit real-money trades on a local-only ledger. Investment readiness requires evidence, not invented platform scale.
