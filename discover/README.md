# ONDA Discover · French

A working, local-first PWA for learning French through cinematic stories rather than flashcards alone. **Current release: 1.0 (bounded first production slice).**

## Run

From the `ai` repository root: `python3 -m http.server 8800` then open `http://localhost:8800/discover/`.

After merge into `joaoccaldas/ai` (GitHub Pages from main), expected path: `https://joaoccaldas.github.io/ai/discover/`. This is a **proposed** link until that deployment has actually been verified.

## Features implemented

- Seven original French scenes spanning art, café conversations, and science; narrative progression with choices and feedback
- Three real clue objects per scene, each collectible as authored vocabulary
- French browser speech synthesis, optional browser speech-to-text for dictation (where supported); **not** automated pronunciation grading
- Deterministic typed phrase recall with accent tolerance
- Local per-device progress, streak, attempt ledger, spaced review scheduling (SM-2-inspired), user-controlled review ratings
- 3D environment: reuses Caldas Studio's existing `studio/hall/assets/hall.glb` and `hall_lightmap.jpg` *in place* for the museum scene, and adapts the procedural one-active-world lifecycle from `studio2/world.js` for café and astronomy scenes
- No large assets copied or generated; original gallery artwork reused through relative paths
- Browser-side graceful 2D fallback, keyboard/touch-accessible vocabulary and scene controls, reduced-motion support, lazy 3D, PWA install/offline learning shell
- English/Portuguese meaning options and self-reported starting level; content currently authored at approximately A1/A2 regardless of preference

## Known limitations and next acceptance gates

- Progress persists only in localStorage: no sign-in/cross-device sync, no server database, no payments
- Browser voice voices vary; microphone recognition may not be available or accurate. Voice transcription **does not grade pronunciation**.
- WebGL depends on lazy-loaded Three.js from esm.sh (offline learning still works in 2D, WebGL may not). The existing hall asset is a real Blender model but scene loading requires browser network and GPU capability.
- On-device measured 3D performance, full screen-reader audit, app store packaging, CEFR-calibrated validation, cloud auth, and learner outcome trials remain pending. Do not market as a fully validated language-teaching system.
- All stories, dialogue and images are original first-party content; no unauthorized Netflix or YouTube extraction.
- `localStorage` is not secure for sensitive personal data; do not store health or identity details.

## Quality gates

`npm run check`

Run Chromium Playwright UI smoke tests against `http://localhost:8800/discover/` and record desktop/mobile screenshots. Test 3D loading only against the published repository with real assets and network access. 

## Source assets and provenance

- [Caldas Studio architecture](../studio/ROOM_SYSTEM.md): `hall.glb` (Blender/Cycles/meshopt), `hall_lightmap.jpg` (Cycles bake).
- [Caldas Studio 2](../studio2/README.md): single active scene, disposal, capped DPR and motion fallback.
- [Wordbound EnglishLearningApp](https://github.com/joaoccaldas/EnglishLearningApp): spacing/mission patterns referenced but no child-oriented artwork or code copied.
- [ARCHQUEST OS](https://github.com/joaoccaldas/archquestos): evidence graph and learner calibration are future integration possibilities, not current features.

The new `/discover/` folder is isolated from existing `ai/studio` and `ai/studio2` runtimes. No existing host navigation is modified in this release.
