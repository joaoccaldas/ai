# Cross-repository reuse inventory / observed 2026-10-19

Counts reflect *catalog records*, not independent high-fidelity production-ready assets.

| Source | Observed and link | Reuse decision | Gate |
|---|---|---|---|
| AI shared procedural asset factory | 66 registry records; https://github.com/joaoccaldas/ai/blob/main/studio/shared/procedural-assets/registry.json | REUSE headless Blender generators and provenance/build-meta contract | rerun export, inspect license and GPU budgets |
| AI Gaudí real-time/realism playbook | measured sun/sky/PBR/mist/instancing learnings; https://github.com/joaoccaldas/ai/blob/main/projects/gaudi-nexus/docs/REALISM_PLAYBOOK.md | ADAPT shader/material recipes and reproducible visual comparisons | independent runtime evaluation, no unverifiable photoreal claim |
| Kona.m museum areas | 17 hand-built areas in museum/world/rooms.json; `app/admin-assets.json` lists 36 room records | REUSE room ontology/ID strategy, not runtime wholesale | current SHA, room runtime status and rights |
| Kona.m admin asset projection | 107 asset records; 47 generated catalogue products, 21 bicycle studies; https://github.com/joaoccaldas/konam/blob/main/docs/PORTFOLIO_PROJECTION.md | REUSE stable IDs and portfolio projection patterns | assets may overlap, unknown rights, pending preview QA |
| Kona.m world streamer | https://github.com/joaoccaldas/konam/blob/main/docs/WORLD_STREAMING_V1.md | ADAPT none/proxy/museum/hero/engineering LOD and disposer | actual measured phone memory, decode speed |
| Studio Kona | https://github.com/joaoccaldas/studio-kona/blob/main/HANDOVER.md | ADAPT terrain/tile ingestion, swim/ocean/road experiments | ESRI imagery research-only; OSM attribution, real-mobile QA incomplete |
| Performance OS | https://github.com/joaoccaldas/phoenix/blob/main/README.md | ADAPT dedup, provenance, metric-authority principles, owner-scoped DTO | strict health privacy and isolation; NO raw data copy |
| jOS | https://github.com/joaoccaldas/jarvisOS/blob/main/README.md | ADAPT governance, evaluation, workflow checkpoints | no duplicated scheduler, no unauthorized Strava MCP |
| AI studio hall | https://github.com/joaoccaldas/ai/blob/main/studio/ROOM_SYSTEM.md | REUSE concept of canonical source and digital acquisition paths | scene-specific assets not generic terrain |

Do not assert total unique assets by adding catalog counts. Do not equate a named room with a working wired runtime or rights-cleared commercial world.

## World candidates

- Generic procedural **Volcanic Coast** (MVP, entirely illustrative).
- Generic procedural **Red Canyon** (MVP, entirely illustrative).
- Generic procedural **Alpine Morning** (MVP, entirely illustrative).
- Kona, St George and Nice are destination-specific *future scenes*: require separate geometry, provenance, cultural/place accuracy and commercial license reviews.

## First transferable skills

`activity-file-parse`, `moment-analysis`, `privacy-trim-export`, `track-to-scene`, `environment-presets`, `LOD-budget`, `visual-regression`, `asset-rights-audit`, `experiment-and-eval`, `3-hour-checkpoint`. Each evolves via a versioned contract, fixture, test suite and promotion log; never promote a skill solely from an LLM assertion.