# Spatial Lab V0 Evidence

Date: 2026-10-06
Production modified: **no**
Git branch: `feat/spatial-lab-v0`

## Build evidence

| Claim | Evidence | Status | Confidence |
|---|---|---:|---:|
| World Zero is isolated from current KONA/Bellagio production | only `ai/spatial-lab-demo/` changed on a feature branch | PASS | 99% |
| Static world source exists remotely | GitHub commits `194bdaeeea`, `e57e4e1e87` | PASS | 99% |
| Remote deployment built successfully | Vercel deployment `dpl_3QUcLN4pa7HfN294AZD4SdAcpvHH`, READY | PASS | 99% |
| Remote deployment is not public | Vercel project reports SSO protection enabled for all except custom domains | PASS | 98% |
| Runtime uses current Three.js line | exact browser import `three@0.186.1`; npm registry verified current 0.186.1 | PASS | 99% |
| WebXR path is standards-based | Three.js WebXR + runtime feature detection; Quest physical test still required | IMPLEMENTED / NOT_RUN ON HEADSET | 90% |
| KONA asset reuse | Speedmax URL pinned to `konam@6feb3203ec` plus procedural fallback | IMPLEMENTED / LIVE ASSET FETCH NOT YET VERIFIED | 92% |
| Adaptive quality | low/balanced/high/ultra DPR, shadows, optional XR foveation | IMPLEMENTED | 94% |
| Mobile layout safety | mobile-first reflow + short-landscape rules | IMPLEMENTED / PHYSICAL TEST NOT_RUN | 85% |
| Quest performance | needs headset frame-time and thermal evidence | NOT_RUN | 0% |

## Required next evidence

1. Open protected deployment on phone portrait and landscape.
2. Verify no horizontal overflow, touch reachability, browser console errors and real Speedmax fetch.
3. Open on Quest Browser and confirm `immersive-vr` session entry.
4. Record refresh rate, FPS, median/p95 frame time, draw calls, triangles, DPR, thermal trend and visible reprojection/stutter.
5. Only then promote performance claims.

No production or public KONA route is changed by this work.

## Live auth-boundary verification — 2026-10-06

- Deployment `dpl_ANZgL1FFsgmopzvYonucgXcs5pf7`: READY.
- Vercel SSO: disabled after app gate deployed.
- Independent public fetch of `/`: redirected to `/login.html?next=%2F`.
- Independent public fetch of `/login.html`: returned the Spatial Lab owner-login page.
- Protected-world authenticated rendering: NOT_RUN by automation because no owner credentials are stored in test tooling.
- Physical phone and Quest evidence: NOT_RUN.

Confidence that signed-out world access is gated: **98%**. Confidence in authenticated world rendering remains **not yet measured** until owner login is exercised.

## Session delta — 2026-10-06 07:20–07:42 UTC

### Authentication blocker

User reported that login did not work. Live browser automation with intentionally invalid credentials proved:
- login JavaScript executes;
- Supabase password endpoint is reachable and returns a normal invalid-credentials response;
- the failure occurs before `/api/session` when Supabase rejects the password.

Remediation:
- added **Reset KONA password**;
- reused KONA's canonical hosted recovery callback `https://joaoccaldas.github.io/konam/index.html`;
- did not create a second recovery system;
- live automation on the current release confirmed the reset control is visible, functional and returns generic non-enumerating messaging.

Confidence that the recovery path itself works: **98%**.
Actual owner password login after reset: **NOT_RUN by automation** because no owner credential is stored in test tooling.

### Bellagio semantic room extraction

Source inspection proved Bellagio's Blender bake merges lobby + passage + conservatory into one `BAKED_INTERIOR` atlas. Therefore simple object-level visibility could not isolate the lobby.

Implemented:
- authoritative lobby bounds from pinned Bellagio manifest;
- runtime triangle-centroid cropping of the shared baked geometry while retaining UV attributes;
- realtime-mesh bounds culling;
- reuse of Bellagio's existing Fiori di Como procedural reconstruction from `chihuly_pieces`;
- fixed XR origin / OrbitControls local-vs-world coordinate mismatch;
- deliberately excludes the ~11.94 MB city GLB from the lobby benchmark.

This is a reusable hypothesis: **semantic bounds can drive geometry residency from one canonical shared asset instead of duplicating room GLBs**.

### CI and deployment evidence

- GitHub workflow `Spatial Lab checks` now gates auth storage, owner allowlist, responsive contracts, XR entry, fallbacks, scene source pinning, room extraction, diagnostics and JS syntax.
- Exact semantic-extraction CI SHA `6d7ed313532e4d2c3b277f72afb06782b056bd91`: PASS.
- Exact diagnostics/mobile-safety SHA `c6af8e75cf0e2b6ab18f6650f98e789269567603`: PASS.
- Vercel deployment `dpl_9FGskZYssKBRnhQmtAdfp2nBZdMT`: READY.
- Live `/api/health` reports release SHA `c6af8e75cf0e2b6ab18f6650f98e789269567603`.
- Live signed-out `/diagnostics.html` and `/bellagio.html` both redirect to owner login.

### Mobile regression prevention

Adding P95 telemetry initially created a plausible 320 px overflow risk. Before deployment, mobile telemetry was changed to a three-column strip showing only FPS, P95 and DPR; draw calls and triangle counts remain on larger screens. CI asserts the responsive rule exists.

Physical Samsung and Quest visual evidence remains **NOT_RUN**.

## Physical Android landscape evidence — 2026-10-06 07:48 UTC

Owner screenshot captured on the live Spatial Lab in Android landscape (source image 1536 × 709 px).

Observed:
1. The 3D scene and telemetry were active at ~60 FPS / DPR 1.25 / P95 ~17.1 ms, proving a real WebGL renderer existed.
2. The **SAFE FALLBACK / WebGL unavailable** overlay was simultaneously visible. Root cause: author CSS `.fallback{display:grid}` overrode the element's `hidden` state.
3. Phone CSS set every control to `width:100%`; the short-landscape media rule changed the container to flex but did not cancel the child width. Result: oversized Bellagio / Device / Reset / Sign out rows colliding with the viewport.
4. The screenshot therefore falsified our previous assumption that static responsive rules were sufficient evidence.

Remediation:
- global `[hidden]{display:none!important}` contract on both worlds;
- short-landscape explicitly resets action children to `width:auto`;
- compact 38 px landscape actions, hidden low-value note, reduced hero footprint;
- remove throwaway WebGL preflight context entirely;
- the actual `THREE.WebGLRenderer` constructor is now the single capability test;
- fallback is displayed only when the real renderer initialization throws.

This physical screenshot materially increased confidence in the debugging model because it showed **renderer success and fallback visibility at the same time**, isolating the bug to presentation state rather than GPU availability.

Status after source fix: CI pending; new physical Android visual evidence required after deployment.
