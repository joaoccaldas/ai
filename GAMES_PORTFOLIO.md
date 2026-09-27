# Games & Interactive Learning Portfolio

This document maps the public game and game-like learning projects in João Caldas's GitHub portfolio.

These are personal, self-directed learning projects. AI tools are used extensively across research, game design, coding, debugging, testing, asset ideation, and documentation. AI output is treated as input to review, not proof of correctness.

## Portfolio map

### Blocks family

**Canonical / flagship candidate:** `blockscreate`

- browser-based block-building civilization/history sandbox
- mature test suite and CI
- persistence, crafting, enemies, era progression, generated assets, world/chunk work
- useful source of patterns for save versioning, world state, game-system decomposition and deterministic content generation

Historical iterations:

- `blockscreate1` — very early asset/style snapshot
- `blockscreate1.1` — earlier crafting/tools/world iteration
- `blockscreateworld` — early world experiment

Rule: preserve the iterations for history; new reusable work should normally originate from the current `blockscreate` project.

### Bloxy family

- `bloxy1`
- `bloxyrivals`
- `bloxyrivals2`

All three now have staged syntax verification. The codebases share substantial ancestry, especially `bloxyrivals` and `bloxyrivals2`, so this family should converge around one canonical lineage rather than receive parallel feature work indefinitely.

Potential reusable patterns:
- entity/state managers
- score/ranking/achievement systems
- character configuration
- input/collision primitives
- game-mode and UI state transitions

Do not extract these into a shared library until the canonical Bloxy version is chosen and duplicated behavior is compared.

### Rawdog family

- `rawdog` — preserved 2D survival-game predecessor
- `rawdogging` — active 3D survival game, flagship candidate
- `rawdog3d` — archived predecessor that already points to `rawdogging`

Useful 3D patterns in `rawdogging` include:
- camera/input separation
- world and renderer layers
- save/persistence
- quests and achievements
- inventory/crafting systems
- performance utilities
- world events and environmental systems

The 2D and 3D games should remain separate as learning artifacts.

### Tucano Flap

**Flagship candidate / focused arcade lab**

TypeScript + Canvas game focused on game feel, browser/TV input, Brazilian visual identity and Samsung TV constraints.

Cross-pollination candidates:
- input-device adapters
- deterministic timing/game loop
- lightweight audio
- performance checks
- synthetic player-profile defaults
- TV-safe focus/navigation patterns

The portfolio audit replaced a hard-coded personal player identity with a synthetic default and introduced real regression tests.

### Adeline

**Playable multiplayer lab**

Node/Express + Socket.IO server with a browser JavaScript client.

Cross-pollination candidates:
- shared client/server rule modules
- room lifecycle
- reconnect semantics
- deterministic game-state transitions
- network boundary tests

This should remain the main networking/multiplayer learning lab rather than pushing networking complexity into every game.

### Educational game family

#### Wordbound / EnglishLearningApp
Story-driven English learning game with spaced repetition, missions, XP, streaks, local profiles and parent-facing learning reports.

#### kids-python-game-platform
Browser-based Python/game-building learning environment using Skulpt.

#### scratch-klon
Visual-programming/creative-coding experiment.

#### Nova's Realm
Experimental human + AI collaborative coding/adventure game.

Cross-pollination candidates:
- learner progress events
- challenge/mission schema
- XP and achievement primitives
- local-only learner state
- accessible feedback
- safe child-oriented defaults
- content/review separation
- evidence for educational claims

A shared learning contract is more valuable than a shared UI framework.

### Roblox Hangout

Family/social Roblox experiment.

Useful learning areas:
- server/client separation
- RemoteEvent boundaries
- social-space design
- activities and teleportation
- avatar/environment customization

Privacy rule: public source and fixtures must stay anonymous/synthetic.

### nonof-brawl-stars

**ARCHIVED / PRIVACY QUARANTINE**

The default branch was intentionally reduced to a privacy notice after personal/family identifiers were found throughout source/generated artifacts.

Do not restore the old public game directly. Any revival should be rebuilt from sanitized source with synthetic identities.

This repository is a useful portfolio lesson in privacy-by-design, not a cleanup target to make "green".

## Cross-project capability map

| Capability | Best learning source | Potential consumers | Recommendation |
| --- | --- | --- | --- |
| Save/versioned local state | BlocksCreate, Rawdogging | Bloxy, learning games, Tucano | Define a small save-envelope convention, not a framework |
| Keyboard/touch/TV input | Tucano, BlocksCreate | Rawdogging, learning games | Compare adapters and extract only repeated device-normalization logic |
| 3D camera/rendering | Rawdogging | future 3D experiments | Consolidate Rawdogging internally first |
| Achievements/progression | BlocksCreate, Bloxy, Wordbound | most games | Share event/schema concepts; keep reward tuning game-specific |
| Learning progression | Wordbound, kids-python, Nova | educational games | Define learner-event and challenge contracts |
| Multiplayer rooms/networking | Adeline, Roblox | future multiplayer titles | Reuse network-state lessons, not direct browser/server coupling |
| Performance instrumentation | BlocksCreate, Tucano, Rawdogging | all real-time games | Create a tiny optional local performance probe |
| Asset generation/manifests | BlocksCreate | Bloxy, Rawdogging, Tucano | Standardize provenance/manifest metadata before sharing tooling |
| Privacy-safe defaults | Brawl quarantine, Tucano cleanup | every public game | Synthetic identities and no family data by default |
| CI baseline | BlocksCreate + 2026-09-27 audit | all active games | Every active repo should at least parse/build/test its canonical path |

## What should not be shared

Some things should remain game-specific:

- physics tuning
- art direction
- world lore
- level design
- difficulty curves
- rewards/economy values
- exact UI components
- narrative content

Sharing these prematurely makes games feel like skins over one engine.

## Extraction rule

A reusable package is justified only when:

1. the capability is independently needed by at least three projects, or two projects with clear repeated maintenance;
2. the common behavior can be described with a small API;
3. it has tests;
4. adopting it reduces complexity for consumers;
5. privacy/security assumptions remain explicit;
6. games can still diverge creatively.

Until then, cross-pollinate ideas and tests rather than dependencies.

## Current convergence priorities

1. choose one canonical Bloxy lineage after behavior/file comparison;
2. consolidate duplicate renderer/input variants inside Rawdogging;
3. define a small versioned save-envelope convention;
4. define educational-game progress/challenge events;
5. strengthen Adeline's shared client/server rule tests;
6. create a tiny performance instrumentation pattern from BlocksCreate/Tucano/Rawdogging;
7. keep synthetic identity/privacy checks in all public games;
8. preserve historical iterations rather than deleting their learning history.
