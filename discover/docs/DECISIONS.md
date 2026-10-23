# ONDA Discover V1 — decisions & validation, 23 October 2026

## Product thesis

Learn through intrinsic curiosity: authored immersive experiences combine French dialogues, interacting with objects, active recall, and separately scheduled spaced reviews. 3D is a *presentation capability*, not a measure of learning outcomes. Avoid claiming evidence of faster learning until randomized or matched study verifies it.

## Competitor lessons

| Product | Observed strength | Why our choice differs |
| --- | --- | --- |
| Duolingo | High-frequency bite-size practice and mastery scaffolding | Our learning loop begins with a narrative objective and grounded objects, not isolated translation screens. |
| Lingopie | Interactive TV subtitles, looping and pronunciation | We don't compete on a licensed video catalog. Users choose dialogue and explore authored story worlds. |
| LingQ | Interest-based reading/listening, vocabulary collection | ONDA connects each discovery to a location, character, and narrative goal. |
| Speak | AI conversation, adaptive practice | V1 relies on deterministic and reviewed content; open-ended AI tutors are a separate safety/product decision. |
| Mondly VR / Immerse | Situational immersive practice | Phone browser as baseline; no VR hardware. |\n| Unfold (iOS, Paul Hangas) | Rotate, pinch and unfold 3D shapes to learn by direct manipulation | V1 supports 3D clue picking, but **does not yet offer equally rich direct manipulation**. Make that an explicit V2 gate. |\n| Nativik | Explore named objects in a 3D kid-oriented world and practice with an AI companion | Not novel to label objects in a 3D world. Adult narrative depth, rigorous recall and dual-subject mastery remain the hypotheses to validate. |\n| FabuLingua | Story-based vocabulary, guided speaking and games | Use deliberate recurring characters and delay-based recall, not mere story packaging. |

Source URLs: https://help.lingopie.com/support/solutions/articles/150000076263-how-to-use-video-features-on-lingopie- ; https://www.lingq.com ; https://www.speak.com ; https://pubmed.ncbi.nlm.nih.gov/41567469/ ; https://doi.org/10.1111/bjet.13603 ; https://apps.apple.com/us/app/unfold/id557099803 ; https://nativik.com/ ; https://www.fabulingua.com/ . These sources should be rechecked before any comparative marketing.

## Canonical reuse

- `joaoccaldas/ai/studio/hall/assets/hall.glb` and `hall_lightmap.jpg`: existing published 3D model and baked lightmap.
- `joaoccaldas/ai/studio/gallery/*.jpg`: first-party artwork images for world cards/2D fallback. No files cloned/copied.
- `joaoccaldas/ai/studio2/world.js`: code *pattern* (one active scene, disposal, constrained DPR). New app owns its small implementation to avoid modifying Studio2 internals.
- `joaoccaldas/EnglishLearningApp/js/wordbound/`: design reference for mission structure & SM2-ish review, not code migration.
- `joaoccaldas/archquestos`: future candidate for learner graphs, not current dependency.

## Why `ai/discover/` and not a new repo?

The existing `joaoccaldas/ai` repo is public, serves Github Pages, and contains the reusable Studio 1/Studio 2 assets. Adding a self-contained new folder minimizes deploy and runtime coupling, avoids duplicating the hall GLB and images, and allows the existing Pages workflow to host the app after a reviewed PR is merged.

## Accessibility & privacy

- All vocabulary hotspots also exist as DOM buttons, so 3D is not a gate to lessons.
- `prefers-reduced-motion` respected in CSS/WebGL camera movement.
- No accounts, personal profiling, remote content ingestion or third-party tracking. Browser TTS; mic speech-to-text requires user click and browser permission, may be unavailable.
- `localStorage` contains local non-sensitive lesson progress only; no sync.
- 2D reading/interactions remain functional when external Three.js dependency, GLB or WebGL fails.

## Verification status

- Node syntax of all shipped JS files: **PASS**.
- Pure learning-domain unit tests: **7/7 PASS** (content invariants, normalization, discovery, review scheduling, hydration, streak, progression).
- Static resource path/repo source audit: **PASS for source references** (published rendering not yet verified).
- Local Chromium Playwright screenshot and interactive browser run: **BLOCKED BY TEST INFRASTRUCTURE** (`ERR_BLOCKED_BY_ADMINISTRATOR` for http, file, data); not counted as pass.
- Remote browser QA (TinyFish, 23 Oct 2026): **PARTIAL PASS**. Public preview opened without authentication, onboarding completed, three world cards and museum dialogue/clue buttons rendered, all three artwork images loaded, and no obvious browser errors. Full dialogue → typed recall → completion and Journey/My Words flows were **not completed** within the remote session. No mobile screenshot or WebGL frame metrics were recorded.
- Hotspot buttons received explicit IDs, labels and pressed-state semantics after remote QA. 3D scene markers now rebuild on chapter changes, and WebGL scene cleans up on navigation away from the lesson.
- Published WebGL performance, live 3D scene acceptance, and cross-device QA: **NOT YET VERIFIED**.

## Next release gates

1. Verify actual GitHub Pages preview and 3D renderer: Android 390x844, iPhone 375x812, desktop 1440x900. Capture 3D screenshot and validate that CSS/photo fallback works when modules blocked.
2. Audit ergonomics, localization, screen reader, contrast, touch targets, escape/back navigation, and speech under browser permission denial.
3. Add content QA by French teacher (A1/A2 CEFR), then delayed retrieval study and product retention study with 20–50 users.
4. Add optional sync only after identity/privacy and RLS boundaries are designed; do not put secrets in client source.
5. Instrument privacy-preserving aggregate usage only with an explicit notice/consent and impact rationale.
6. Evaluate licensed educational video later, after source rights and terms verified.

## Unfold-inspired V2 design gate (not yet built)

The relevant Unfold lesson is *direct manipulation teaches*. Require: orbit/pinch/tap controls tested on mobile, physical clue artifacts with appropriate affordances, camera focus transitions that teach French spatial terms, and an explicit 2D/keyboard equivalent. Avoid copying the children's aesthetic or making extra 3D interaction mandatory for learning. Prioritize an object-focused interaction pilot against the current DOM-button flow and measure delayed recall, frustration, completion and GPU cost.
