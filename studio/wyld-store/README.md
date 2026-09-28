# WYLD Store

A minimal, editorial retail storefront for [ridewyld.com](https://ridewyld.com/), designed mobile-first and built without a build step.

## What's in it

- **Hero:** a full-bleed campaign slideshow using WYLD's own photography. Swipe it on mobile.
- **Shop by sport:** Cycling, Triathlon, Run WYLD and Accessories. The tiles scroll horizontally on mobile and sit in a grid on desktop.
- **Race Fit edit:** an editorial split with a product rail.
- **Collection:** a sticky category bar (All, Cycling, Triathlon, Run, Accessories, Sale). Each category has sub-type and Women/Men filters, plus sorting.
- **Product view:** a swipeable gallery on mobile and a two-column gallery on desktop. It has fit and size pickers with sold-out sizes crossed out, a sticky add-to-bag bar on mobile, and "You may also like". Each product has a deep link at `#/p/{handle}`.
- **Bag drawer:** stored in localStorage. Checkout hands the bag to ridewyld.com through a Shopify cart permalink (`/cart/{variant}:{qty},…`), so the order completes on the real store.
- **Search overlay, menu drawer and toast.**
- **WYLD Studio:** the Blender GLBs in `assets/blender/`, shown in `<model-viewer>`, with live colourways that recolour the `FABRIC_PRIMARY` material.
- **Also on the page:** custom kit, founder story, journal, newsletter and footer.

The typography matches ridewyld.com: Inknut Antiqua for headings and Instrument Sans for body text. The logo, product photos and campaign images load from the store's CDN.

## Files

- `index.html`: page markup
- `src/store.css`: design system and responsive layout (breakpoints at 720px and 1080px)
- `src/store.js`: grid, filters, product view, bag, search, hero and 3D studio
- `src/catalog.js`: generated catalog (prices, variant ids, stock, images)
- `tools/sync_catalog.py`: rebuilds the catalog from the public feed

## Refresh the catalog

```bash
python3 tools/sync_catalog.py            # fetches https://ridewyld.com/products.json
```

Private team kits (the Synergy Sport Collective, tagged `SSC`) are excluded from the retail shop.

## Run

```bash
python3 -m http.server 8788
# open http://localhost:8788/
```
