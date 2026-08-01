# AI

GitHub Pages site with two experiences:

- **`/`** — AI-native finance presentation (Joao Caldas · FP&A Director, Nordics)
  → https://joaoccaldas.github.io/ai/
- **`/belong/`** — *Belong*, an immersive scroll-driven 3D reimagining of
  [The Belong Festival](https://thebelongfestival.com/)
  → https://joaoccaldas.github.io/ai/belong/

A golden portal in the corner of the home page links into the Belong experience.

## Belong — a luxury immersive music experience

A single continuous scroll travels the desert through a full day→night→dawn cycle,
mirroring the festival's six emotional beats:

**Imagine · Curiosity · Interesting · Playfulness · Be Yourself · Love**

- Three.js scene with custom GLSL shaders: dunes that flow toward the viewer, a
  living sky, a sun that rises/sets and gives way to a rising moon, a starfield,
  and drifting embers
- Scroll-eased camera journey with a time-of-day indicator and progress rail
- All original festival content: the five pillars, the day/night experience, the
  gathering details, packages, and how to join — Jaisalmer · 27–29 November 2026

### Tech

- Self-contained `belong/index.html` (no build step)
- [Three.js](https://threejs.org/) r160 vendored locally in `vendor/` (no CDN dependency)
- Graceful fallbacks: content stays fully readable even if WebGL is unavailable,
  and the experience honours `prefers-reduced-motion`
