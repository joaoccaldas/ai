# Public GitHub Portfolio Map

This is a working map of João Caldas's public repositories. It is not a quality ranking. The goal is to make the portfolio easier to understand, preserve experiments, and identify where projects can learn from one another.

## Project philosophy

These are personal, self-directed learning projects. I learn by building real things, studying how systems work, breaking ideas into smaller parts, and iterating. AI tools are used extensively across research, design, coding, debugging, testing, and documentation.

AI-generated suggestions are inputs to the process, not evidence that something is correct. Important behavior should be tested, limitations should be documented, and security/privacy boundaries should be explicit.

## Portfolio structure

### AI, research and interactive computing

- **ai** — public lab/monorepo for AI, finance, research and interactive web experiments, including Noema and Studio work.
- **brazil-ai-pipeline** — AI/data pipeline experiment.
- **nexusflow-backend** — backend/flow experimentation.
- **styleshift-ai** — AI-assisted visual/style experiment.
- **ghost-architect** — compact experimental project.

### Finance and FP&A

- **fp-a-metric-monitor** — FP&A metric-monitoring experiment.
- **fpa-monitor-app** — related FP&A monitoring application.
- **fpahub** — finance/FP&A hub experiment.
- **fpa-trends-web** — web-facing FP&A experiment.

These projects should share finance concepts and data contracts where useful rather than being mechanically merged.

### Local automation and human-computer interaction

- **ProximityJarvis** — hardened local macOS control/proximity experiment.
- **proxiflow** — visual automation/proximity studio.
- **caldas-companion** — companion-app distribution surface.

Current cross-pollination priority: reuse ProximityJarvis's fail-closed authentication and bounded-action model in ProxiFlow while preserving ProxiFlow's visual workflow UX.

### 3D, games and playful interfaces

- **blockscreate** — larger Blocks/Create project.
- **blockscreate1**, **blockscreate1.1**, **blockscreateworld** — related iterations/experiments.
- **bloxy1**, **bloxyrivals**, **bloxyrivals2** — related game/interaction lineage.
- **rawdog**, **rawdogging**, **rawdog3d** — related visual/game lineage.
- **tucano-flap** — game experiment.
- **nova-realm** — world/game experiment.
- **scratch-klon** — Scratch-inspired experiment.
- **roblox-hangout-place** — Roblox experiment.
- **kids-python-game-platform** — learning/game platform.
- **sauna-web-concepts** — visual/web concept studies.

Cross-pollination candidates include shared asset loading, camera/input handling, scene lifecycle, performance instrumentation, responsive overlays and reusable interaction primitives.

### Learning and education

- **EnglishLearningApp** — learning application.
- **kids-python-game-platform** — game-based programming/learning experiment.
- **scratch-klon** — creative coding experiment.

Potential shared layer: progress/event schema, challenge primitives, feedback loops and accessibility patterns.

### Space, science and data visualization

- **3I-ATLAS.github.io** — 3I/ATLAS web experience.
- **nasa-space-dashboard** — NASA/space data dashboard.

Potential shared layer: sourced-data cards, time-series visualization, provenance display, loading/error states and public-data adapters.

### Small personal/creative experiments

Projects such as **laundry**, **livrosdavida**, **leotheo**, **pantera**, **countdown**, **innerloom**, **innergroup**, **coinsnap-collector**, **oicaldas** and others are intentionally allowed to remain small. Not every experiment needs to become a product.

## Repository lifecycle labels

The portfolio will gradually use four simple labels in documentation:

- **FLAGSHIP CANDIDATE** — worth investing in as a polished public demonstration.
- **LAB** — active experiment where learning is the main output.
- **ITERATION** — part of a project lineage; may later converge with a canonical repository.
- **ARCHIVE** — preserved for history/learning but no longer actively developed.

A repository can move between labels as it evolves.

## Cross-project reuse rule

Do not create a shared framework merely because two projects look similar.

Prefer extraction when:

1. the same capability appears in at least three places, or two places with clearly recurring maintenance;
2. the abstraction removes real duplicated logic rather than only renaming it;
3. the dependency does not make simple projects harder to run;
4. security/privacy boundaries remain explicit;
5. the extracted component has tests and a small documented API.

## Current high-value convergence opportunities

1. **ProximityJarvis → ProxiFlow:** security/authentication and bounded execution.
2. **blocks / bloxy / rawdog families:** reusable 3D/game infrastructure after lineage comparison.
3. **FP&A family:** common finance metric/data contracts and calculation primitives.
4. **NASA dashboard ↔ 3I-ATLAS:** reusable sourced-data and visualization components.
5. **Learning/game projects:** common progress, challenge and feedback primitives.
6. **AI/Noema:** provenance/evidence patterns that can inform other research-heavy public projects.

## What stays private

Private systems, personal data, credentials, health information, family/contact/location data, employer material, and private operational databases are intentionally excluded from this public map. Reusable ideas from private projects should reach public repositories only through reviewed, clean-room extraction where appropriate.
