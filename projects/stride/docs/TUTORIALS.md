# STRIDE // Athlete Worlds — macOS App & Interactive Tutorials Guide (`v0.5.0`)

## 1. Launching & Using the Native macOS Application (`STRIDE.app`)

**Installed Bundles**:
- `/Users/joao/Applications/STRIDE.app`
- `/Users/joao/Desktop/STRIDE.app` (symlink)
- **Local Loopback Engine**: `http://127.0.0.1:8864` (`default-src 'self'`, zero external telemetry or third-party requests)

### Native macOS Menu Bar Shortcuts
| Menu | Item | Shortcut | Action |
|---|---|---|---|
| **STRIDE** | Reload STRIDE | `⌘R` | Reload the local 3D workspace |
| **STRIDE** | Hide / Quit STRIDE | `⌘H` / `⌘Q` | Standard macOS window lifecycle |
| **Experience** | Replay Mode | `⌘1` | Interactive 3D route orbit & split replay |
| **Experience** | Cinema Drone Mode | `⌘2` | Autonomous orbital drone reconstruction |
| **Experience** | Ghost Compare Sample | `⌘3` | Load synchronized ghost comparison effort |
| **Experience** | Worlds & Reuse Contracts | `⌘4` | Open `ActivitySpec v1`, `MomentSpec v1`, and 3D Reuse inventory |
| **Experience** | Interactive Tutorials & Academy | `⌘T` | Open the 8-step interactive Guided Tour & Feature Academy |
| **Experience** | Preset: Lava Coast (Kona) | `⌘5` | Switch to Volcanic Coast environment + Kona props |
| **Experience** | Preset: Red Canyon (St. George) | `⌘6` | Switch to Red Canyon environment + sandstone spire props |
| **Experience** | Preset: Alpine Morning (Nice) | `⌘7` | Switch to Alpine Morning environment + conifer/granite props |
| **Experience** | Export Privacy-Trimmed PNG | `⌘E` | Export 700 m endpoint + custom pin redacted PNG |
| **Experience** | Export Redacted `.stride.json` | `⌘S` | Export portable redacted Story Bundle (`stride.story-bundle.v1`) |
| **Tutorials** | Tutorials `01` – `08` | Click menu item | Jump directly to any of the 8 live interactive tutorials |

---

## 2. Step-by-Step Interactive Tutorials (`01` – `08`)

You can run every tutorial interactively inside `STRIDE.app` by clicking **Tutorials** in the top navigation bar (or pressing `⌘T` / clicking **Interactive Tutorials & Tour** in the left panel). Each tutorial includes a **"Run Live in Workspace →"** button that configures the 3D scene and highlights the active feature.

### Tutorial 01 · Bring Your Own Route (`GPX` · `TCX` · `FIT` · `.stride.json`)
- **Goal**: Import a personal activity file (`GPX`, `TCX`, binary `FIT`, or a shared `.stride.json` bundle) directly in memory without uploading data to any cloud server.
- **How It Works**:
  1. Click **Choose an activity file** (`#uploadZone`) in panel `01 CREATE YOUR WORLD`, or click **Explore sample activity →**.
  2. For binary `.fit` files, `parseFIT()` verifies the 14-byte header CRC-16 and trailing 2-byte file CRC-16 (`fitCRC16`), decodes compressed timestamp headers, skips Garmin invalid base-type sentinels (`0x7FFFFFFF`, `0xFF`, `0xFFFF`), and converts semicircle coordinates to WGS84 degrees.
  3. `normalize()` removes null-island dropouts (`|lat| < 1e-4 && |lon| < 1e-4`), out-of-order timestamps, and impossible GPS teleportation spikes (`> 45 m/s`).
- **Policy Guardrail**: Strava API / OAuth / MCP ingestion is disabled per the June 1, 2026 Strava API Policy.

### Tutorial 02 · 3D Camera Orbit, Follow & Autonomous Cinema Drone
- **Goal**: Explore your activity from any perspective using pointer gestures, keyboard navigation, rider-follow tracking, or autonomous drone reconstruction.
- **How It Works**:
  1. **Orbit & Zoom**: Drag anywhere on the 3D stage (or press `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) to orbit yaw and pitch. Scroll or press `+` / `-` to zoom (`0.5×` to `2.7×`). Press `R` or click `↺ Reset view` to restore the default camera.
  2. **Follow Mode (`◎ Follow`)**: Locks the 3D focal center onto the moving rider marker as it progresses along the route.
  3. **Cinema Drone Mode (`◈ Cinema` / `⌘2`)**: Engages an autonomous orbital camera sweep (`yaw += dt * 0.22`) with sinusoidal pitch modulation. Automatically respects `prefers-reduced-motion: reduce`.

### Tutorial 03 · Moment Atlas & Multi-Lap / Triathlon Transitions
- **Goal**: Automatically surface the most meaningful segments of an activity and jump the 3D camera directly to them.
- **How It Works**:
  1. Look at the right-hand **MOMENT ATLAS (`03 / INSIGHTS`)** panel.
  2. STRIDE deterministically calculates:
     - **FASTEST KILOMETER** (`kind: 'fastest_kilometer'`) via distance-interpolated timestamps.
     - **STEEPEST 1 KM GAIN** (`kind: 'steepest_kilometer_gain'`) with `0.75 m` vertical hysteresis.
     - **SLOWEST KILOMETER** (`kind: 'slowest_kilometer'`).
     - **TRANSITION / LAP BOUNDARIES** (`kind: 'lap_transition'`) from FIT Lap/Session messages (`19`/`18`) and TCX `<Lap>` tags (e.g. `TRANSITION · CYCLING → RUNNING`).
  3. Click any Moment card to pause playback and jump the 3D playhead and elevation contour directly to that kilometer or transition.

### Tutorial 04 · Interactive 2D Elevation & Split Contour Scrubbing
- **Goal**: Inspect grade, elevation range, and split boundaries along a synchronized 2D contour and scrub directly across climbs.
- **How It Works**:
  1. Beneath the playback transport bar, locate the **ELEVATION & SPLIT CONTOUR** canvas (`#profileCanvas`).
  2. Vertical guide lines mark every kilometer split:
     - **Lime band (`#dbfa94`)**: Fastest kilometer split.
     - **Amber band (`#f4c59b`)**: Steepest 1 km elevation gain.
  3. Click or drag horizontally anywhere along `#profileCanvas` to scrub the 3D rider position and inspect live **Recorded elevation**, **Estimated segment speed**, and **Recorded heart rate**.

### Tutorial 05 · Synchronized Ghost Compare (`stride.comparison.v1`)
- **Goal**: Race a previous effort or a training partner's file over the same route corridor and see where time was gained or lost.
- **How It Works**:
  1. Click **Load ghost comparison (+18s pace) ⇄** or click **Import second file to compare +** to load a second `.gpx`, `.tcx`, or `.fit` file.
  2. `compareActivities()` checks whether both tracks share a start corridor (`≤ 400 m`) and 10-point spatial alignment (`≤ 500 m`).
  3. In the 3D scene, the dashed cyan trajectory and cyan Ghost marker move in lockstep by distance.
  4. The transport bar displays the live time gap (`Ghost +0:18`), and the Moment Atlas adds a **LARGEST GHOST GAP SPLIT** card so you can jump straight to the decisive kilometer.

### Tutorial 06 · Stylized World Presets, 3D Studio Scenery & KONA.m Bicycles
- **Goal**: Customize the stylized 3D environment using verified assets from `ai/studio` and `konam` without claiming surveyed satellite imagery.
- **How It Works**:
  1. In `02 WORLD TREATMENT`, switch between:
     - **Lava coast (Kona preset)** (`volcanic`)
     - **Red canyon (St. George preset)** (`canyon`)
     - **Alpine morning (Nice preset)** (`alpine`)
  2. Toggle **Procedural studio props** (`#propsToggleBtn`) to show/hide 24 deterministic corridor props mapped to `studio/shared/procedural-assets/registry.json` (`kona_palm_cluster`, `basalt_outcrop`, `sandstone_spire`, `alpine_pine_tall`, etc.).
  3. Open **KONA.m equipment ID** (`#equipmentSelect`) to bind one of the canonical bicycle studies from `konam/museum/catalog/products.json` (e.g. `Speedmax CFR AXS (2027)`).

### Tutorial 07 · Self-Owned Local Photo Memories in 3D
- **Goal**: Pin personal activity photos onto your 3D route in memory without uploading images to any cloud server.
- **How It Works**:
  1. Click **Pin local photo on route** (`#photoInput`) and select one or more `JPEG`, `PNG`, or `WebP` files.
  2. `matchLocalPhotosToRoute()` matches each photo's timestamp (`lastModified`) against the activity's GPS timestamps (or pins it at the current playhead distance if the timestamp falls outside the activity window).
  3. Amber 3D photo beacons render along the route in the 3D scene, and **PHOTO MEMORY** cards appear in the Moment Atlas for one-click camera teleportation.

### Tutorial 08 · Privacy Redaction Pins, PNG & `.stride.json` Story Bundles
- **Goal**: Share a visual route memory or portable `.stride.json` bundle while protecting home/work endpoints, return loops, and mid-route stops.
- **How It Works**:
  1. By default, `planPrivateShare()` removes the first and last **700 m** of travel **and** every intermediate return pass within **700 m** of the start or finish coordinate, returning disjoint subpaths so hidden segments are never reconnected by a straight line.
  2. Move the playhead to any sensitive mid-route location (such as a cafe stop or workplace) and click **Pin 500 m redaction zone at playhead** (`#redactPinBtn`).
  3. Click **Export privacy-trimmed PNG ↗** (`#shareBtn`) to download a clean, privacy-trimmed 3D route poster (`stride-privacy-trimmed.png`), or click **Export redacted .stride.json ⇩** (`#bundleBtn`) to save a portable `stride.story-bundle.v1` JSON file that can be re-opened in STRIDE at any time.
  4. If an activity is a short local loop where no safe segment remains outside the 700 m privacy zones, STRIDE **fails closed** and blocks the export rather than leaking endpoints.
