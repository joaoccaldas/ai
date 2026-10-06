# Spatial Lab — Session 01

Date: 2026-10-06
Status: isolated research implementation. Production KONA/Bellagio unchanged.

## Objective

Prove the smallest reusable cross-device 3D world before scaling content:
- one room
- one bike-shaped hero object / later pinned KONA Speedmax
- responsive desktop + phone shell
- WebGL baseline with later WebXR/Quest host
- measurable renderer telemetry
- auth-gated remote deployment in the hosted version

## Frozen decisions

### Representation contract

Semantic mesh is authoritative for:
- object identity
- collision
- physics
- navigation
- selection
- interaction
- fallback rendering

Optional appearance representations may include KHR_gaussian_splatting when runtime support exists. Gaussian splats must never be the only production representation until WebGL/mobile/XR fallback coverage is proven.

Evidence: KHR_gaussian_splatting is Complete/Ratified in Khronos glTF; Three.js current GaussianSplat path requires WebGPURenderer; Blender 5.3 imports/renders PLY/SPZ splats but documents current limitations.

Decision confidence: 0.96.

### Procedural source authority

Current .blend files and deterministic generators remain production authority. Prototype text-reviewable procedural sources (Python/node definitions + parameters + provenance) and generated .blend artifacts. Do not cut over until round-trip fidelity, deterministic rebuilds and CI review usefulness are measured.

Direction confidence: 0.94.
Implementation-maturity confidence: 0.78.

## V0 release gates

1. No modification to KONA/Bellagio production runtime.
2. No horizontal overflow at 320/390/430 portrait and short landscape.
3. WebGL failure leaves usable non-3D shell.
4. Adaptive DPR/quality selection is bounded.
5. Frame/draw/triangle telemetry is visible.
6. Existing KONA asset reuse is commit-pinned.
7. Remote version is owner-authenticated before world/assets.
8. Quest claims remain NOT_RUN until physical-headset evidence exists.

## Evidence labels

PASS / FAIL / NOT_RUN / UNKNOWN only. No performance claim is promoted from desktop emulation to Quest.
