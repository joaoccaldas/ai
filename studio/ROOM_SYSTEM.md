# Caldas Studio immersive room system

`/studio/` is a data-driven Three.js exhibition. The visitor does not browse a grid of portfolio cards: the camera travels through a continuous building in which every concept becomes a distinct architectural room.

## Files

| File | Responsibility |
| --- | --- |
| `index.html` | Accessible interface shell, loader, room labels, index, visual-studies drawer and fallback. |
| `gallery-shell.css` | Fixed gallery UI, responsive behavior, overlays and non-WebGL fallback. |
| `gallery-rooms.js` | The source of truth for room order, portfolio metadata, theme tokens and alternative visual studies. |
| `gallery-engine.js` | Three.js renderer, architecture, centerpieces, camera path, transitions, interactions, loading and synthesized ambience. |
| `gallery/` | Local artwork textures used inside the 3D rooms. Prefer optimized `.jpg` or `.webp` images. |

## Add a new room

### 1. Add the portfolio experience

Create the new concept under `studio/<slug>/`. It should work as an independent page before it is added to the exhibition.

### 2. Add a local gallery image

Add a landscape or portrait image to:

```text
studio/gallery/<slug>.jpg
```

Recommended source size: 1600–2400 px on the longest edge. Export at 75–85% quality and keep the file below roughly 500 KB where practical. The 3D engine applies its own frame and lighting, so avoid adding a decorative frame inside the image.

### 3. Register the room

Add one object to the `rooms` array in `gallery-rooms.js`:

```js
{
  slug: 'new-concept',
  name: 'New Concept',
  type: 'Short category',
  url: 'new-concept/',
  image: 'gallery/new-concept.jpg',
  line: 'One memorable sentence.',
  description: 'How the digital concept translates into architecture, light and movement.',
  palette: ['#background', '#mid', '#accent', '#light'],
  wall: '#wall',
  floor: '#floor',
  ceiling: '#ceiling',
  accent: '#accent',
  fog: '#fog',
  centerpiece: 'gem',
  transition: 'iris',
  studies: [
    { title: 'Direction one', note: 'What makes it different.', src: 'https://…', position: 'center' },
    { title: 'Direction two', note: 'What makes it different.', src: 'https://…', position: 'center' },
    { title: 'Direction three', note: 'What makes it different.', src: 'https://…', position: 'center' }
  ]
}
```

The array order is the physical order of the rooms. Moving an object changes both the camera journey and the index.

### 4. Choose or build a centerpiece

The `centerpiece` value maps to a builder in `gallery-engine.js`:

- `forum`: circular seating and a living centre
- `gem`: faceted object on a plinth
- `table`: ceremonial dining table and candlelight
- `pulse`: kinetic performance sculpture and neon bars
- `wine`: translucent vessels and liquid halo
- `bloom`: botanical stem and sculptural flower
- `mirror`: repeated arches and reflective planes
- `tide`: shallow water plane and coastal rocks
- `coffee`: copper rings and cup ritual
- `belong`: floating orb, spectral rings and particles

For a genuinely new spatial idea, add a function with this signature:

```js
function addNewCenterpiece(group, room, z) {
  // Add Three.js objects to `group` around the room centre `z`.
  // Use room.accent and the other room tokens instead of hard-coded brand colors.
}
```

Then register it in `centerpieceBuilders`:

```js
const centerpieceBuilders = {
  // existing builders
  newCenterpiece: addNewCenterpiece
};
```

### 5. Tune material and light

The room object controls the base architecture:

- `wall`, `floor`, `ceiling`: material colors
- `accent`: frames, highlights, local lights and UI accent
- `fog`: atmospheric transition color
- `palette`: supporting colors available to room-specific geometry

Keep adjacent rooms visibly different. The transition should feel like crossing a threshold, not merely changing the background color.

### 6. Test the journey

Test these paths before merging:

1. Fresh desktop load on Chrome and Safari.
2. Mobile portrait with the device throttled.
3. Scroll from lobby through every room without jumping.
4. Use the room rail and full index to jump between rooms.
5. Click both framed artworks in each room.
6. Open and close Visual studies.
7. Disable WebGL and verify the fallback opens the portfolio index.
8. Enable reduced motion and verify the experience remains usable.

## Performance guardrails

- Keep each room under roughly 50 simple meshes unless it is the current flagship room.
- Reuse geometry and materials where possible.
- Avoid shadow-casting point lights. One directional shadow plus baked/fake local shadows is usually enough.
- Use `mobile` to reduce subdivisions, particles and expensive effects.
- Do not add video textures to every room. Load them only after a visitor explicitly enters a room or visual study.
- Prefer local optimized artwork for the 3D scene. External images are acceptable for optional visual studies, not for essential navigation.

## Design principles

1. **Architecture first.** Each concept must change the room itself, not only the framed image.
2. **One memorable object.** Every room needs a clear spatial protagonist.
3. **Thresholds matter.** The visitor should feel the transition between concepts.
4. **The portfolio remains usable.** Every room is available through the index and direct URL.
5. **Luxury comes from restraint.** Use fewer, stronger lights and deliberate materials rather than constant visual noise.
6. **The gallery is not the product page.** It creates desire and context; the linked concept contains the complete experience.

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
