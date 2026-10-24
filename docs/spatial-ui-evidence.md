# Spatial web UI before/after evidence

A real-browser screenshot + structural-layout capture for **two deployed or locally served revisions** of any spatial app.

```sh
npm install --no-save playwright@1.54.1
npx playwright install chromium
node --test tools/spatial-ui-audit.test.mjs
node tools/spatial-ui-audit.mjs http://127.0.0.1:4001/ http://127.0.0.1:4002/ /tmp/spatial-evidence
```

You must provide two real URLs, one serving the baseline commit and the other serving the candidate commit. Both browsers use the same viewport dimensions, reduced motion setting, and initial wait. Results include screenshots, SHA256 hashes, JS console errors, overflow, canvas and control counts, HTTP status and deltas.

This **does not** assert perceptual superiority, measure GPU frame time, run scripted in-world camera paths, prove WCAG compliance, or compare equivalent app state beyond initial load. Reviewer must add journey scripts, device traces, human visual inspection, and scene-specific benchmarks before release.

Apply independently to KONA.m, Bellagio, Studio-Kona, AI Studio, and Gaudí gallery, reusing their existing navigation/test fixtures where available. Never compare two different routes and call it a regression. Do not publish screenshots containing personal or sensitive material. Do not embed authentication credentials in URLs.

Suggested review gate: no critical visual clipping/overflow, no novel browser errors, no navigation regression, readable labels and interaction targets, then measure performance separately using device/browser profilers. Store evidence with exact revisions, date and reviewer signoff. This script does not alter application UI.
