# Mobile Lighthouse, lab only

Measured against the local static server `http://127.0.0.1:8765/site/`, mobile defaults (simulated slow 4G, 4× CPU). This is not field Core Web Vitals. INP was not collected. Scores are 0–100.

Before is commit `c858415`, the numbers recorded in the previous lab note on this branch (Lighthouse 12). After is the denominator, fetch-timing, and observatory coverage change, measured with Lighthouse 13 on the same throttle.

| Page | | Performance | Accessibility | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Home | Before (`c858415`) | 98 | 93 | 2.26s | 0 | 0ms |
| Home | After | 98 | 94 | 2.27s | 0 | 0ms |
| Explore | Before (`c858415`) | 85 | 93 | 4.06s | 0.090 | 0ms |
| Explore | After | 98 | 93 | 1.35s | 0.090 | 0ms |
| Odin journey | Before (`c858415`) | 85 | 100 | 4.35s | 0.046 | 0ms |
| Odin journey | After | 100 | 100 | 1.20s | 0 | 0ms |
| Observatory | Before (`c858415`) | 86 | 98 | 3.17s | 0.160 | 0ms |
| Observatory | After | 91 | 98 | 3.50s | 0 | 0ms |

The `c858415` Explore figure of 4.06s sat in the same spread as an earlier run on `3c16e26` (performance 86, LCP 4.06s, and one faster run at 1.21s). The after Explore and journey numbers are under 3s on this run. Observatory LCP moved from 3.17s to 3.50s. The LCP element there is the story-mode card, which is injected by script.

What changed between the runs:

- The Odin question and its denominator are in the first HTML. Catalog and media files load after the first paint, so they are not on the LCP path.
- Explore keeps the denominator in the first HTML. The compact search index (about 493KB) starts after the first paint. Loading it during first paint was what held simulated LCP near 4s.
- The observatory coverage panel has a reserved height, so filling it from `research-health.json` no longer grows the box. The WebGL note is in the first HTML. Three.js still loads only after “Open the 3D view”.

Still open for G4: observatory LCP under this throttle (3.50s), Explore CLS at 0.090, field INP, and a manual accessibility audit. Home, Explore, and the Odin journey are under the 2.5s LCP target on this lab run. Observatory CLS is under 0.1.
