# Caldas Studio 2 · The Build

Studio 2 is a completely separate successor experiment to `studio/`. It does not replace or mutate Studio 1.

## Product idea

A cinematic portfolio about **how things get built** rather than a conventional gallery of finished work.

The visitor moves through seven acts:

1. **The Cave** — origin projects, tiny experiments, old branches
2. **The Workshop** — prototypes and active experimentation
3. **The Cemetery** — archived/superseded work, with lessons preserved
4. **The Arcade** — games and playful systems
5. **The Observatory** — space, simulation, research and NOEMA
6. **The Machine** — current AI, finance, automation and 3D systems
7. **The Horizon** — future work and resurrection candidates

The visual language is intentionally heterogeneous while the information model stays consistent. Each project can expose intent, what was built, status, lessons, source, frontend, backend and knowledge links.

## Runtime principle

**Never render the entire portfolio world at once.**

`world.js` keeps one procedural scene group active at a time. Switching acts disposes the previous scene's geometry, materials and textures before building the next. Rendering is capped by device class, pauses when the tab is hidden, and automatically drops DPR if sustained frame rate is low.

The current implementation uses procedural Three.js as the shippable baseline. `blender/build_world.py` defines a Blender production path for later hero props and room kits without making the runtime depend on Blender assets.

## Higgsfield concept frame

Studio 2 art direction started from an original environment frame generated in Higgsfield (`soul_location`). The generation metadata is in `assets/higgsfield/concept.json`. It is used as an art-direction reference and appears inside the Studio 2 project card.

## Run

From repository root:

```bash
python3 -m http.server 8802
```

Open:

```text
http://127.0.0.1:8802/studio2/
```

## Validate

```bash
cd studio2
npm run check
```

## Deliberate boundaries

- No copyrighted characters, logos or recognizable franchise props.
- The tone borrows only abstract qualities: cozy retro mystery, deadpan humor, accidental-chaos warmth and cosmic wonder.
- Private repositories are not listed in the public registry.
- Live/backend links are shown only when explicitly known. Unknown endpoints are not guessed.
- Studio 1 remains untouched while Studio 2 proves a different architecture.
