# STRIDE / Athlete Worlds

**Working name only, pending trademark clearance.** A local-first, source-transparent activity-to-interactive-world prototype. Version: 0.1 / 19 Oct 2026. Not affiliated with or endorsed by Strava.

## The single job

Within 60 seconds of choosing an activity file, an athlete can revisit their recorded route in an immersive stylized scene, jump to the most meaningful kilometer, and understand exactly which elements came from data versus art direction.

## Run

```bash
python3 -m http.server 8765
# open http://localhost:8765
node --test tests/*.test.mjs
```

No build dependencies, API tokens, accounts or server-side activity uploads. Supported formats: GPX, TCX and a subset of FIT record streams. Fit parsing is intentionally MVP-scoped; unsupported variants can fail closed. 16 MB file limit. Desktop and mobile progressive layout. The current scene uses software 3D projection into Canvas 2D; this is deliberately *not* photogrammetry, surveyed terrain, WebGL or a geospatial digital twin.

## What works in source

- Browsing a fictional sample or loading a local file.
- GPS geodesic distance from haversine; duration from source timestamp range; conservative ascent estimate; average HR if present; full-kilometer splits, fastest/slowest kilometer and ascent highlight.
- 3 visual environments (volcanic coast, canyon, alpine), orbit/zoom, scrub/play/speed.
- Local image export with first and last 700m of GPS track omitted in output, blocked when too short. This is a basic privacy guard, **not** a guarantee of anonymization. Never auto-share.
- Deterministic parser and analysis tests. No synthetic athlete data used for real athlete evidence.

## Important limitations

- Browser/device visual QA may require a real interactive browser. A passing parser test is not a proof of rendered UX.
- FIT parser currently supports selected record and field encodings; it is not a production FIT-conformance implementation and FIT CRC verification is still required.
- GPX/TCX handling is intentionally lightweight and needs adversarial/parser-security review.
- Detected 'climb' is the greatest raw ascent within a kilometer, not a graded climb or physiological claim.
- Privacy trim must eventually consider sensitive locations along the full route, not only start/end.
- No automated Strava API integration is implemented. Use only legitimately available user-owned source files. Do not imply Strava bulk exports remove contractual restrictions on API-derived data.

## Project layout

```text
index.html              semantic accessible app shell
style.css               responsive visual system
app.mjs                 procedural scene, playback, UI, local-only import
core.mjs                parsers, normalization, distance, splits, share trim
package.json            local test script
AGENTS.md               build, privacy, evidence, review instructions
.github/workflows/ci.yml tests, static checks
src/contracts/           schema and adapter boundaries (design)
tests/                  deterministic data-quality cases
docs/                   PRD, UX, competitor matrix, architecture, integration, risks, roadmap, automation
```

## Design principle

**Truth underneath. Wonder on top.** GPS, elevation, time and HR must be declared explicitly as measured/estimated/missing. Shaders, vegetation, terrain and atmospheric effects are representations, not measurements.

## Ownership boundaries

- STRIDE owns reconstruction, timeline, interaction and approved self-owned share outputs.
- Performance OS owns training physiology, sources, reconciliation, models and consent; STRIDE receives opt-in presentation DTOs only, never a shadow copy of a health database.
- KONA.m owns race identity, its bike/asset catalog and heritage rooms. STRIDE references canonical IDs and adopts only rights-reviewed assets.
- Studio-kona/AI procedural factory owns scene patterns and reusable production recipes, not STRIDE user data.
- jOS controls optional governed automation, but never becomes a Strava API relay or an independent athlete database.

Roadmap and decision gates: [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).