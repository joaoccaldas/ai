# Studio render acceptance

The Studio landing page is accepted only when all of the following are true:

- The intro renders over the Blender-built hall, with the SŌKAI dais visible.
- Walking the hall (scroll or arrows) reaches every work; each niche shows its artwork, and the commission frame closes the hall.
- No station renders a black or blank frame (the visual check measures frame luminance).
- Desktop and mobile screenshots are attached as CI evidence.
- The deployed GitHub Pages URL serves the same version as `main`.
- No uncaught browser errors occur during the automated render.

The `Studio Visual Render` workflow captures this evidence for every Studio pull request; `Studio Gallery Check` validates files, the works list and sizes.
