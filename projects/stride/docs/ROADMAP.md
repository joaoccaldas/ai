# STRIDE prioritized execution roadmap / 2026-10-19

Status labels: PROPOSED, SOURCE-INSPECTED, IMPLEMENTED-UNVERIFIED, TESTED-LOCAL, REVIEWED, RELEASED. Each completed item needs SHA/test/visual evidence. No invented timeline.

## North star

Within 90 seconds from entry, athlete can load an activity and jump into a clearly explained, memorable, smooth, truthful 3D highlight with no account. The product is meaningfully preferred to generic flyover in blinded head-to-head tests.

## Phase 0: Identity, viability and local working prototype

1. P0 Source/rights gate: verify Strava policy & exact feature boundaries, file-source compliance, name trademark check, privacy posture.
2. P0 Review all existing repo manifests, current code SHAs and the existing 3D/reconciliation functionality. Reuse before creating.
3. P0 Build direct-file parser and quality validator with test fixtures, fail-closed error handling and declared source semantics.
4. P0 Build deterministic activity analytics and source-aware moments; no invented metrics.
5. P0 Render procedural perspective, three themes, replay/seek/orbit and fallback UX.
6. P0 Add local-only route exports with privacy trimming and clear residual-risk explanation.
7. P0 Design mobile-first shell and error states, keyboard and reduced motion.
8. P0 Build source-level tests, adversarial tests, and real-device/browser visual QA.
9. P0 Run 5-user usability experiment against Strava/Relive alternatives without using Strava API scraping/benchmarking.
10. P0 Record first activity-to-moment completion metrics and qualitative gaps with real denominators.

## Phase 1: Complete standout MVP

11. Replace provisional FIT decoder with conformant/parser-vetted pipeline and checksum validation; add variants with explicit license.
12. Add pace-accurate continuous motion interpolation and systematic handling of stops, laps, multi-sport, sparse GPS.
13. Route comparison under owner-controlled source data; define matching algorithms and uncertainty rather than promise exact overlap.
14. Self-owned photo markers (on-device) with manual placement and no exfiltration.
15. Export a portable scene specification + safe story card; demonstrate offline/local rendering.
16. Time-/distance-indexed Moment Atlas with explanations and algorithm version.
17. Implement lightweight progressive WebGL renderer, deterministic materials, GPU/transfer budgets and 2D fallback.
18. Add a signed asset intake pipeline with GLB/meshopt/KTX2 eval and performance tiering.
19. Finish accessibility, CSP, input hardening, fallback modes, localization readiness, API versioning.
20. Closed beta with pre/post surveys, retention and costs, 2 complete sample race worlds only with rights clearance.

## Phase 2: Differentiating worlds

21. Geo reconstruction evaluation: DEM, OSM, attribution, optical imagery rights; compare to illustrative worlds.
22. Optional canonical bike/gear avatars, with legal identity/provenance signoff.
23. Granular historical race revisit, place narratives and source-backed environmental markers.
24. Consent-based Performance OS insights through read-only short-lived DTO adapter; keep training engine authority.
25. Race week companion linking via KONA.m, not embedding athlete secrets or duplicating accounts.
26. Quality-aware scene composer chooses proxy/hero assets by device benchmark; stream/dispose correctly.
27. Separate photo-realistic hero export worker only after mobile and legal ROI proven.
28. Scene comparison to observed reality using systematic error annotations, not cherry-picked screenshots.
29. Create athlete-owned Memory Atlas with explicit retention/deletion controls and secure portability.
30. Test commercial interest in event/coach/athlete studios with original files and cleared assets.

## Phase 3: Business and platform

31. SDK `ActivitySpec`, `MomentSpec`, `WorldSpec`, `AssetSpec`, `ShareSpec` and rights/consent interfaces.
32. Licensed event/world template marketplace only when rights and third-party asset attribution permit.
33. Event/race organizer media kits and an agency production workflow with service-level guarantees.
34. White-label embeds with isolated tenants, permissioned export, exact revocation and brand safeguards.
35. Optional direct provider adapters where independently licensed and technically supported; Strava remains withheld absent formal clearance.
36. Localization and disability-first motion alternatives; documentation and SDK.
37. Unit economics: render cost per 1000 activities, conversion, retention, cloud inference (should be zero by default), customer success.
38. Governance, policy-monitoring, penetration tests and privacy impact assessments as scope grows.
39. Cloud multi-tenant role-based design only when local-only product-market fit warrants complexity.
40. Evaluate more immersive XR/VR capabilities after verifying which interaction actually improves user value.

## Gate metrics (initial target hypotheses, not measured)

- Import success >=95% on curated supported files; 0 known silent data corruption; malformed files fail closed.
- Median first meaningful scene <=5 s on budget Android for small/medium GPX; p95 <=10 s, measured with real-device protocol.
- Stable >=30 fps low-end Android; >=55 fps desktop for reference route (budget hypothesis).
- GPS distance <1% deviation versus a benchmark parser on clean fixtures, segment split error within specified interpolation tolerance.
- 0 exports that include start/end GPS within the 700m trim contract in automated tests; independently challenge privacy weaknesses.
- >=70% first-session moment engagement; >=40% participants prefer STRIDE moment experience over baseline in blind tests as initial falsifiable targets, not market facts.
- No unapproved data transmission, no prohibited Strava API ingestion, no branded material without rights.

## Top ten next actions after current scaffold

1. Fix/verify privacy-export pixel output and add screenshot regression on actual browser; P0 because a visible button is an unverified security boundary.
2. End-to-end import tests for varied GPX/TCX/FIT incl. corrupt/timezone/paused samples; data-integrity critical.
3. Review and replace provisional FIT implementation with validated supported standard implementation; avoid data corruption.
4. Add local-only data-flow tests and strict CSP headers for hosted variant; establish privacy claim.
5. Accessible keyboard camera controls, status announcements and reduced-motion playback; quality and inclusion.
6. Capture mobile portrait, landscape, laptop visual evidence on real hardware; prevent overflows and poor GPU assumptions.
7. Formal `ActivitySpec/MomentSpec` versioned JSON schema and golden fixtures, import/export clarity.
8. Exact compiler/render profiling and interactive performance budgets; establish real baseline.
9. Rights/provenance review of each proposed KONA/AI asset and terrain imagery; prevent legal debt.
10. Conduct 5 external user tests against Strava/Relive, gather evidence before adding worlds.

## Stop/hold list

Hold direct Strava API integration, third-party MCP, permanent graph of Strava data, automatic upload/share, personal model training, real terrain using unlicensed imagery, mass import of branded bike meshes and broad world/room consolidation before beta engagement data.