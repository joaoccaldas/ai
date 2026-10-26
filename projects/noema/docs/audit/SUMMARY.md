# NOEMA visual audit

Headless Chromium via Playwright, served from `projects/noema` so site and data paths resolve. Viewports: 390×844, 768×1024, 1440×900. Every HTML page in `site/` is included.

| Pass | Report | Screenshots |
| --- | --- | --- |
| Before the MVP fixes | [before/SUMMARY.md](before/SUMMARY.md), [before/report.json](before/report.json) | [before/screenshots](before/screenshots), P0 in [before/p0](before/p0) |
| After the MVP fixes | [after/SUMMARY.md](after/SUMMARY.md), [after/report.json](after/report.json) | [after/screenshots](after/screenshots), P0 in [after/p0](after/p0) |

P0 frames use the pattern `p0/<page>-<viewport>-<before|after>.jpg`.

## What the before pass showed

- `index.html` meta-refreshed to `observatory.html`. The observatory brand linked back to `index.html`, so Home was a loop. The before screenshots of Home are therefore the observatory.
- Primary navigation disagreed by page: Home used Explore / Atlas / Analyze / Library / Research; the shell used Analyze; older pages used World; the observatory used Compare / Patterns / Review and hid the bar under 1100px.
- The observatory document was wider than the viewport at 390, 768, and 1440, and `THREE` threw when the CDN script did not run.
- The atlas had no primary nav. Its back link pointed at `./`, which was the redirect.
- Eleven pages overflowed horizontally. Four had a console or page error. Compare appending `?a=GOD-ODIN&b=GOD-ZEUS` is in-page state, not a redirect.

## What the after pass showed on P0

Home, Observatory, Explore, Atlas, Connections, Patterns, and Compare: no horizontal overflow at the three viewports, no console or page errors, and the shared Home / Explore / Atlas / Connections / Research nav. Home no longer refreshes.

Still failing outside P0: horizontal overflow on altered-states, belief-systems, rituals, cognition, sources, automation pulse, religion decomposition, dashboard, and observatory-v6. Dashboard still throws `Cannot set properties of null (setting 'innerHTML')`. See [PAGE_DISPOSITION.md](PAGE_DISPOSITION.md).

Remote Art Institute images and the jsDelivr Three.js build were blocked in this environment (`net::ERR_BLOCKED_BY_ORB`). The observatory now keeps its text interface when that happens. Those hosts may still load in a normal browser.
