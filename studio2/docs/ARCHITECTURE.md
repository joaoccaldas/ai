# Studio 2 Architecture

## Goals

1. Story first, catalogue second.
2. One source of truth for projects.
3. High visual quality without loading every room.
4. Desktop and mobile use the same project data and narrative model.
5. Failure/archival state is a first-class concept.

## Layers

```text
projects.js         canonical public project registry
      ↓
app.js              story state, search, drawers, project evidence UI
      ↓
world.js            disposable act scene, one active group at a time
      ↓
Three.js WebGL      adaptive DPR / pause / mobile cap

Blender source      optional production-grade hero assets
Higgsfield          concept / mood / storyboard references
```

## Scene streaming contract

At runtime there is exactly one `act:*` group. `setAct()` removes and recursively disposes the previous group's geometries, materials and textures before constructing the next.

Next production milestone:

```text
act manifest
  ├── shell GLB (small)
  ├── lightmap KTX2
  ├── hero LOD0/1/2
  ├── props instances
  └── collision/navigation metadata
```

Preload only the next probable act when the visitor approaches a transition. Keep the previous lightweight shell only during the crossfade, then dispose it.

## Performance budget targets

Mobile balanced target:
- initial JS + CSS < 400 KB before Three.js CDN cache
- initial authored geometry < 3 MB compressed
- active room textures < 32 MB GPU memory target
- DPR <= 1.05 by default
- 30 FPS acceptable for ambient scenes

Desktop target:
- DPR <= 1.4 auto, <= 1.75 explicit high
- 60 FPS target
- hero LOD0 only inside inspection radius

## Data policy

Only public repositories belong in the public Studio 2 registry. A project can link to:

- `repo`
- `live`
- `frontend`
- `backend`
- `knowledge`

Unknown URLs are omitted rather than inferred.

## Status semantics

- `living`: actively useful/current
- `prototype`: exploratory or incomplete
- `archived`: intentionally superseded/closed
- `buried`: preserved primarily for lessons/postmortem

A later repository scanner should propose registry updates through PRs rather than mutating the public portfolio at runtime.
