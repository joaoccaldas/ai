# Belong — A Luxury Immersive Music Experience

An immersive, scroll-driven 3D reimagining of [The Belong Festival](https://thebelongfestival.com/),
built with Three.js and WebGL shaders.

Live site: https://joaoccaldas.github.io/ai/

## The journey

A single continuous scroll travels the desert through a full day→night→dawn cycle,
mirroring the festival's six emotional beats:

**Imagine · Curiosity · Interesting · Playfulness · Be Yourself · Love**

- Shader-generated dunes that flow toward the viewer as you scroll
- A living sky that shifts from golden dawn to a deep starfield and back to the light
- A sun that rises, sets, and gives way to a rising moon over the dunes
- Drifting embers/fireflies, a full starfield, and cinematic depth
- All original festival content: the five pillars, the day/night experience, the
  gathering details, packages, and how to join — Jaisalmer · 27–29 November 2026

## Tech

- Single self-contained `index.html` (no build step)
- [Three.js](https://threejs.org/) r160 vendored locally in `vendor/` (no CDN dependency)
- Custom GLSL vertex/fragment shaders for the dunes, sky, and embers
- Graceful fallbacks: content stays fully readable even if WebGL is unavailable,
  and the experience honours `prefers-reduced-motion`
