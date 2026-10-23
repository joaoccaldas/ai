> This file records the initial **v0.2 baseline audit**, preserved for provenance. For the current 38-test v0.2.1 release, remote first-build QA and GitHub deployment gate, see [release-gate.md](release-gate.md).

# Engineering review and verified evidence (October 23, 2026)

## Verified in this session

- Data model: 27 historical hardware items, 10 progressively more complex work orders, 5 time periods, 3 collector artifacts, 3 deterministic NPC offers, 5 daily trivia entries.
- Unit and integration: `node --test tests/*.test.mjs` **29 passed**. Cross-era no-grind solvability, revenue/reward integrity, missing-part errors, DDR2 incompatibility, unsafe power changes, save schema validation, NPC supply, invalid share tokens, DOM adapter interactions, and first-two-level experience are covered.
- Runtime code: `node --check` succeeds for each ES module; bundled single-file app JS passes independent Node syntax verification.
- Packaging: deterministic `scripts_bundle.py` generates an HTML file with CSS/JS inlined, with no external JS/font/image dependency.
- History: claims traced to IBM, CHM, Intel and AMD sources; see historical-sources.md. **Expert historical review has not happened.**

## Could not be verified here

- **Visual QA:** the managed Chromium browser blocked both `file://` and `http://localhost` navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. The scripted real-device viewport suite did not run. **Do not treat responsive appearance, 320px overflow, navigation focus order, keyboard accessibility or FPS as verified.** `tests/browser_verify.py` preserves the intended test steps for a normal local/CI browser environment.
- No production deploy, public availability probe, online player interactions, cloud identity or server load test were available when this review was written.
- No child safety audit, external security audit, usability observation, learning evaluation or retention measurements have been completed.

## Known design compromises

- Early motherboards and wiring are assumed provided. No physical jumper, cable, PSU or socket installation in the 1975–2005 simulations.
- Modern BIOS/firmware compatibility and thermals are approximated by selected item IDs. Current hardware matching is a curated-stage compatibility test, not a general PC configurator.
- Store and rewards live in `localStorage`. They are not secure against players modifying their own save. Server authority required before competitive leaderboards or real trading.
- No social profiles, chat, friends/contacts or actual P2P trading. Blueprint sharing is read-only.
- Ten stage starter kits are granted to protect the free educational loop. Economy balancing against real learner behavior is still unvalidated.

## Critical next gates

1. Normal-browser Playwright screenshots at 320/375/390/428/768 pixels + iOS Safari and Android Chrome touch QA, fix any overflow, occlusion and focus issues.
2. Test the first 2 minutes with 10 naive learners before adding more features.
3. Add game learning evidence and event instrumentation only with an age-appropriate privacy assessment.
4. Develop a safe blueprint sharing hosting/protocol and moderation plan before enabling community uploads.
5. If real player trading gains validated demand, implement a separate server-side auditable inventory ledger and atomic offer-confirm-settle lifecycle, with safeguards for minors.
