# Studio validation — 5 October 2026

Implementation branch: `codex/studio-portfolio`, based on AI main `9e2e45f94880770ea929bc3876ee755e1fa63a50`. Local verification; this revision has not been pushed or publicly deployed.

## Passed

- Build and validator: six generated case studies, local links, derivative counts/bytes/material slots and bounds; 342 continuously sampled obstacle-safe guided routes.
- Reproducibility: all 12 generated landing, case, catalogue and renderer files reproduce byte for byte.
- Chrome browser flows: desktop hero/orbit mode switch, filters/search/reset and case navigation; 390 px touch entry and mobile archive filtering; no-JavaScript navigation; reduced-motion poster; WebGL failure; dialog focus; pre-entry tour; an actual entrance-to-Éclat walk without teleporting; movement and rendering suspension behind dialogs; rapid iframe reopen; all optional HDRs unavailable; missing-bike recovery; quality selection; bounded wing texture residency; opening the Konam case study from the central bike.
- Every gallery wing and the atrium rendered in desktop and emulated touch contexts. Screenshot luminance was above the black-frame threshold at all 12 stops. Resident artwork textures stayed at most 11 desktop / 8 touch, with zero wing artwork textures loaded at the entrance.
- Shared paint replacement preserves material arrays and shared material identity when upgrading to physical clearcoat.
- JavaScript syntax, Studio workflow YAML parsing and `git diff --check`.
- Original AI checkout remains clean. Konam and other inspected projects were read without editing.

## Rendering measurements

| Bike | Triangles | Primitives | Bytes |
| --- | ---: | ---: | ---: |
| Source | 509,624 | 74 | 2,081,248 |
| Desktop derivative | 131,772 | 20 | 628,612 |
| Mobile derivative | 44,717 | 20 | 276,572 |

The landing stage reports 22 draw calls and 132,678 triangles including its plinth. The bike's original SHA-256, commit, bounds and finish are pinned in `assets/bike-provenance.json`.

At one fixed atrium view in local Chrome, the complete composed frame reports:

| Quality | Draw submissions | Submitted triangles | DPR |
| --- | ---: | ---: | ---: |
| Balanced | 163 | 386,567 | 1.2 |
| Cinematic | 339 | 773,147 | 1.75 |

These totals include reflection/transmission/postprocessing passes and repeated geometry submissions. They are not unique model triangle counts, frame-time measurements or physical-phone FPS claims. The diagnostic renderer resets counters once per complete composed frame rather than reporting only the final fullscreen pass.

## Evidence and practical limits

Local screenshots are in `output/playwright/`: `gallery-bike-atrium.png`, `portfolio-desktop-final.png`, `portfolio-mobile.png`, `portfolio-case-study.png`, `museum-guided-arrival.png`, and `desktop-gallery-*` / `mobile-gallery-*`. This directory is intentionally excluded from Git. CI now runs the meaningful interaction checks as well as room renders; no remote CI run is claimed for this unpublished branch.

Physical phones, Safari, sustained frame times and context-loss recovery remain unmeasured. Existing room lightmaps were authored around the katana. The bike, registry, case pages and rendering improvements are implemented; project-specific NOEMA/Gaudí installations, new room bakes and complete room streaming remain subsequent creative work.

The source study is saved beside this task as `3D_RENDERING_STUDY_2026-10-05.md`; the original reproduced-bug audit is `STUDIO_AUDIT_2026-10-05.md`. Knowledge-hub outcome `ba7eab6b-dfd4-4dcb-b368-ff9fc3cbbeec` is agent-reported; reusable flow `3ca3978c-4c82-451b-9489-2dc3bb328ebf` is agent-authored and not independently validated. Their historical citation supplies reuse context; current runtime evidence is this report, the browser output and screenshots.
