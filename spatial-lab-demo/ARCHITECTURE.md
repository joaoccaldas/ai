# Spatial Lab V0 Architecture

## Authority split

The platform standardizes **meaning, evidence and budgets** before standardizing every renderer implementation.

```
semantic mesh
  collision / physics / navigation / IDs / selection / WebGL fallback
        |
        +--> optional appearance representations
               KHR_gaussian_splatting / SPZ / baked imagery
```

The 2026-10-06 KONA research delta (`SPLAT_INTEROP_CONVERGENCE`, confidence 0.96) upgrades Gaussian splats from capture curiosity to a standards-track optional appearance layer. It does **not** make splats production authority: current Three.js KHR splat runtime depends on WebGPU and Blender 5.3 still has export/transform limitations.

## V0 rendering policy

- Three.js WebGL is the broad compatibility baseline.
- WebXR is feature-detected and optional.
- Screen quality adapts through DPR, shadows and optional XR foveation.
- KONA Speedmax remains a semantic GLB asset.
- procedural fallback prevents a remote asset failure from blanking the world.
- screen UI reflows independently of the 3D canvas.
- phone portrait and short landscape are explicit acceptance targets, not afterthoughts.

## Research lanes

1. `EXP-SPLAT-INTEROP-001`: same real room as KHR splat GLB, SPZ, semantic mesh and hybrid.
2. `EXP-BLENDER-ASSET-AS-CODE-001`: diffable procedural source -> generated Blender artifact -> deterministic rebuild.

Production remains mesh-first until those experiments generate comparative evidence.


## Asset delivery boundary

Browser worlds no longer depend directly on repository raw-file hosts.

```
semantic asset id
      |
      v
scene manifest
      |
      v
allowlisted delivery id
      |
      v
authenticated same-origin /api/asset
      |
      v
exact repo + revision + path + expected byte identity
```

This separates semantic identity, source authority, delivery representation and transport. V0 has one representation per asset. Future LOD/KTX2/splat variants should extend the delivery mapping without forking semantic identity or room code.
