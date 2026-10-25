# STRIDE architecture / authority map

## Local-first pipeline

ACTIVITY FILE (local, consented) -> parse adapter (GPX/TCX/FIT) -> typed observations -> invariant validation -> immutable in-memory sample stream -> derived metrics and deterministic moments -> route projection -> LOD scene composition -> interaction/renderer -> local privacy-reviewed export.

No server, cloud account, location API, AI API or persistent athlete datastore is needed for v0.1. Browser static assets may be served over HTTPS; athlete files remain in memory. Any future privacy-related browser storage needs explicit opt-in and expiry/deletion.

## Typed contracts (next iteration)

Observation {t_s:number|null, lat:number|null, lon:number|null, elevation_m:number|null, hr_bpm:number|null, power_w:number|null, speed_mps:number|null, source:{provider, file_hash, field, observed_at}, quality_flags:string[] }.

Activity {id:sha256(local file, opt-in), sport:enum|null, start_time_s:number|null, observations:Observation[], consent_ref, source_class:direct_file|strava_api|approved_direct_provider}. The API-origin class is permanently isolated behind a denied-by-default adapter until reviewed.

Moment {id,activity_ref,start_distance_m,end_distance_m,time_s|null,kind,metric,value,units,confidence,algorithm_version,provenance,complete:boolean}; no invented speed/HR.

WorldSpec {id,visual_preset,terrain_source,terrain_licence,geometry_reference,asset_manifest,LOD,atmosphere_preset,performance_budget,truth_label}; WorldSpec must never claim real terrain based on a decorative preset.

AssetSpec {id,source_repo,source_path,license,rights_review_sha,representation_class,sha256,triangles,bytes,texture_bytes,LODs,places,validation_state}; candidate != released.

## Modular design

`core/parse` adapters produce a canonical portable route; `core/metrics` computes deterministic moments; `core/privacy` supports export transforms; `scene/` consumes a read-only activity DTO; `ui/` owns navigation and themes; `integrations/` carries explicit source ACLs and only declared outbound intents; `ops/` holds reproducible benchmarks and evidence.

## Renderer evolution

v0.1 canvas software perspective is graceful fallback. Next: progressive Three.js/Babylon/WebGPU only when it provides measurable improvements. Keep a lightweight path for cheap Android hardware. Prefer tiled procedural backgrounds without licensed imagery for beta. Benchmark real terrain DEM/OSM/photo-derived reconstructions separately; their source rights are material.

## Cross-project boundaries

- `joaoccaldas/ai/studio/shared/procedural-assets`: original generated scenery. Reuse definitions and headless manifests with proper license audit, never blindly import all GLBs.
- `joaoccaldas/studio-kona`: study of terrain, tiles, water, camera and place-to-scene methods. Its imagery carries licensing caveats and cannot be reused blindly.
- `joaoccaldas/konam`: asset intake, authored bikes, room registry, progressive shell, LOD and provenance. Use catalog IDs, not duplicate asset files. Rights review needed for brands/gear/history.
- `joaoccaldas/phoenix`: only owner-approved, scope-limited presentation data via server-authenticated DTOs. Reuse its observation/reconciliation standards, never its cloud raw data or credentials.
- `joaoccaldas/jarvisOS`: optional governed jobs/evals, no private athlete content in LLM knowledge graph, no proxy to Strava API.

## Security and reliability

Untrusted files: hard 16 MB limit, bounded points, no remote fetching, no eval/DOM injection, reject GPS jumps/out-of-order timestamps, avoid infinite loops and memory blowups. Future: byte/point/time budgets, streaming parsers, FIT CRC, fuzz cases, CSP, sandboxed previews, threat model. No data is ever silently transferred or published.

## Rights decision

Do not treat an athlete's own Strava bulk export as automatic authorization to use Strava API materials commercially. Parse self-owned activity files lawfully obtained by users; provenance remains visible. Any source bridge with Strava must be policy-reviewed, scope-limited, non-AI, non-persistent, non-social and subject to written approval of the exact operation.