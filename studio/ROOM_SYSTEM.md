# Caldas Studio cinematic room system

`/studio/` is a hybrid gallery: photorealistic set-extension imagery supplies architectural realism, while Three.js provides atmosphere, depth, particles, a transition portal and subtle interactive motion. This avoids the toy-like result produced by building every room from primitive geometry.

## Files

| File | Responsibility |
| --- | --- |
| `index.html` | Accessible gallery shell, hero, room information, index and concept-variation drawer. |
| `gallery-shell.css` | Art direction, cinematic backplates, parallax, overlays, responsive layout and transition treatments. |
| `gallery-rooms.js` | Portfolio metadata, room order, concept links, palettes and alternative visual studies. |
| `gallery-engine.js` | Scene selection, crossfades, scroll journey, WebGL atmosphere, portal transitions, sound and interaction. |
| `gallery/` | Local portfolio artwork used by individual concepts and as reliable fallback media. |
| `.github/workflows/studio-visual-check.yml` | Launches the real page in Chromium and stores desktop/mobile screenshots as CI evidence. |

## Rendering model

Each room has two visual layers:

1. **Set extension:** a high-resolution architectural or concept image displayed full-screen. It carries realism, materials, lighting and spatial composition.
2. **WebGL atmosphere:** dust, bloom, a subtle sculptural orb and a portal that appears while crossing into the next room.

The set extension is deliberately dominant. Three.js supports the illusion rather than attempting to model every chair, plant, wall and light from simple geometry.

## Add a new room

### 1. Build the independent concept

Create the experience under:

```text
studio/<slug>/
```

The linked page must work independently before being added to the exhibition.

### 2. Add portfolio artwork

Add a representative image to:

```text
studio/gallery/<slug>.jpg
```

Recommended export:

- 1600–2400 px on the longest edge
- JPEG or WebP
- 75–85% quality
- preferably below 500 KB

This image remains the dependable local portfolio asset even when the cinematic room uses a separate set extension.

### 3. Register the concept

Add one object to the `rooms` array in `gallery-rooms.js`:

```js
{
  slug: 'new-concept',
  name: 'New Concept',
  type: 'Short category',
  url: 'new-concept/',
  image: 'gallery/new-concept.jpg',
  line: 'One memorable sentence.',
  description: 'How the concept should feel as a physical environment.',
  palette: ['#background', '#mid', '#accent', '#light'],
  wall: '#wall',
  floor: '#floor',
  ceiling: '#ceiling',
  accent: '#accent',
  fog: '#fog',
  centerpiece: 'optional-future-3d-type',
  transition: 'transition-name',
  studies: [
    { title: 'Direction one', note: 'What makes it different.', src: 'https://…', position: 'center' },
    { title: 'Direction two', note: 'What makes it different.', src: 'https://…', position: 'center' },
    { title: 'Direction three', note: 'What makes it different.', src: 'https://…', position: 'center' }
  ]
}
```

The array order defines the physical journey, the room rail and the full index.

### 4. Assign the cinematic backplate

Add the room to `ROOM_BACKPLATES` in `gallery-engine.js`:

```js
const ROOM_BACKPLATES = {
  // existing rooms
  'new-concept': 'https://images.example.com/new-concept-room.webp'
};
```

Use an image that already feels like a complete room, not a product cut-out. The strongest backplates have:

- clear foreground, middle ground and background
- a visible path or architectural opening
- restrained lighting with one focal zone
- enough negative space for the interface
- no embedded text or decorative browser chrome

A room without an explicit entry falls back to its first visual study and then to its local portfolio image.

### 5. Tune the composition

Use the room's `accent` for interface highlights and WebGL transition color. If the important subject is being cropped, set a room-specific background position in `gallery-shell.css` or extend the room schema with a positioning token.

Adjacent rooms should differ in at least three of these dimensions:

- dominant material
- color temperature
- spatial proportion
- focal object
- lighting direction
- density versus emptiness

### 6. Validate the actual render

A source-code check is not visual validation. Before merging:

1. Run the Studio Visual Render workflow.
2. Download the `studio-visual-evidence` artifact.
3. Inspect desktop lobby, desktop room and mobile lobby screenshots.
4. Compare them against the approved art-direction target.
5. Test the public GitHub Pages URL after deployment, not only the branch source.
6. Confirm that every room link, index card and concept-variation drawer works.
7. Verify reduced-motion and non-WebGL fallback behavior.

## Performance guardrails

- Keep essential room imagery at 1600–2400 px, compressed for web delivery.
- Preload only the lobby and room backplates, not every optional study image.
- Keep WebGL decorative: low particle counts, one portal and one subtle sculptural object.
- Reduce pixel ratio and particle count on mobile.
- Avoid video textures in the main walk. Load video only after explicit interaction.
- External images are acceptable for experiments, but flagship rooms should eventually use locally controlled optimized assets.

## Design principles

1. **The approved image is an acceptance target, not loose inspiration.**
2. **Realism comes from composition, materials and light before effects.**
3. **WebGL should deepen the room, not advertise itself.**
4. **Transitions must feel architectural, not like a slide carousel.**
5. **Every concept needs its own spatial identity.**
6. **The portfolio remains accessible through normal links and the room index.**
7. **Never call the gallery complete without screenshots of the deployed experience.**

## Current room order

1. Inner Group
2. Aurelia
3. Maison Lumen
4. PULSE
5. Vinöra
6. Wild Stem
7. Éden
8. Dunhaven
9. Ember & Oak
10. Belong Festival
