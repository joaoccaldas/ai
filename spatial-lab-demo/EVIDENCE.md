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
