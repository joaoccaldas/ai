# Stencil — Tattoo Try-On Studio

**See it before you ink.** Stencil is a browser tattoo try-on: drop a design onto
a photo of where it will go, blend the ink into the skin, and export a preview to
keep or send to your artist. Everything runs client-side — no upload, no account,
no build step.

→ Live: https://joaoccaldas.github.io/ai/stencil/

## What it does

- **Bring your own canvas.** Upload a photo (forearm, shoulder, calf, back…),
  start from one of the sample skins, or pick a blank skin tone.
- **Three design sources.**
  - A hand-drawn **flash** library — minimalist fine-line SVG designs that stay
    razor-sharp at any size and can be re-tinted to any ink colour.
  - An **AI pack** — richer illustrative pieces (koi, luna moth, dagger & rose,
    mandala…) generated with Higgsfield and cut out to transparent PNGs.
  - **Your own art** — drop in any image; a transparent PNG works best.
- **Place it like a real stencil.** Drag to move, pull a corner to scale, use the
  top handle to rotate. Add as many designs as you like and reorder them.
- **Blend it into skin.** Per-design opacity, blend mode (multiply for fresh ink,
  soft-light for healed, screen for white ink…), edge softness, a grain pass that
  settles the ink into the skin, flip, and ink-colour tinting for flash designs.
- **Export.** Download a PNG of the composed try-on.

## How it works

A single `<canvas>` composites the base photo and every design layer each frame.
Realism comes from real compositing, not filters bolted on top:

- **Multiply** blend by default, so dark ink darkens the skin and follows its
  shadows instead of sitting on top like a sticker.
- Each layer is pre-baked to an offscreen canvas where a **grain pass** is
  confined to the artwork's own silhouette (`destination-in` masking), so the ink
  picks up skin texture without haloing.
- **Softness** is a live `ctx.filter` blur; **opacity** and **blend mode** are set
  per draw. Flash designs are rasterised from inline SVG with `currentColor`, so
  re-tinting is just re-rasterising at a new colour.

Selection handles are drawn on a second, transparent overlay canvas, so the
compose canvas stays clean and export needs no special-casing.

Nothing leaves the browser: photos are read with `FileReader`, and the export is a
local `canvas.toBlob` download.

## Files

```
stencil/
├── index.html        # markup + panel UI
├── app.css           # charcoal / bone / vermilion styling
├── app.js            # compositing engine, interaction, library, export
├── flash.js          # built-in SVG flash designs  (window.STENCIL_FLASH)
├── library/
│   ├── pack.js       # AI-pack manifest            (window.STENCIL_PACK)
│   └── *.png         # transparent AI designs
├── skins/
│   ├── skins.js      # sample-skin manifest        (window.STENCIL_SKINS)
│   └── *.jpg         # sample base photos
└── tests/smoke.mjs   # Playwright production checks
```

The three data files each define a global and are loaded before `app.js`. Missing
data degrades gracefully — the app still runs with just the flash set and uploads.

## Adding designs

- **Flash:** append `{ id, name, tags, body }` to the array in `flash.js`, where
  `body` is inner SVG markup on a `0 0 200 200` viewBox using `currentColor`.
- **AI pack:** drop a transparent PNG in `library/` and add a
  `{ file, name }` row to `library/pack.js`.
- **Sample skin:** drop a photo in `skins/` and add a row to `skins/skins.js`.

## Development

No build step — open `index.html` through any static server:

```sh
python3 -m http.server 4173      # then visit /stencil/
npm run check                    # syntax-check the scripts
npm test                         # Playwright smoke test (headless Chromium)
```

The AI designs and sample skins were generated with
[Higgsfield](https://higgsfield.ai) (Nano Banana Pro for the flash art, Soul 2.0
for the skins) and are shipped as static assets — the deployed app makes no API
calls. A Caldas Studio concept tool. Designs are for visualisation only.
