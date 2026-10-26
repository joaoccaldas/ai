# Mobile Lighthouse, lab only

Measured with Lighthouse 12, mobile defaults (simulated slow 4G, 4× CPU), local static server `http://127.0.0.1:8765/site/`. This is not field Core Web Vitals. INP was not collected. Scores are 0–100.

Before is commit `3c16e26` (Home was already a real page; the journey page did not exist). After is the journey, search, and script-loading change on the same branch.

| Page | | Performance | Accessibility | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Home | Before | 99 | 92 | 2.11s | 0 | 0ms |
| Home | After | 98 | 93 | 2.26s | 0 | 0ms |
| Explore | Before | 99 | 93 | 1.21s | 0.069 | 0ms |
| Explore | After | 85 | 93 | 4.06s | 0.090 | 0ms |
| Odin journey | Before | — | — | — | — | — |
| Odin journey | After | 85 | 100 | 4.35s | 0.046 | 0ms |
| Observatory | Before | 83 | 98 | 3.55s | 0.159 | 0ms |
| Observatory | After | 86 | 98 | 3.17s | 0.160 | 0ms |

An earlier lab run on the same before commit recorded Explore at performance 86 and LCP 4.06s. The 1.21s before figure above is one run, not a stable baseline. The after Explore number sits in that spread.

What changed between the runs:

- Home, Explore, and the observatory scripts use `defer`, so they are not parser-blocking.
- The compact search index (about 493KB) loads on Home only after the search field is used. Loading it during first paint dropped Home to performance 82 and LCP 4.81s; that version was not kept.
- The hero image has width and height. It is not lazy-loaded, because it sits in the first screen. Observatory reference images are lazy-loaded and sized.
- Three.js (`three@0.180.0`) is not requested until “Open the 3D view”. Observatory CLS is still above 0.1.

Still open for G4: observatory CLS, journey and Explore LCP under this throttle, and any field INP measurement.
