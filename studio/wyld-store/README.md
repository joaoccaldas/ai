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
- **Also on the page:** custom kit, brand story, journal, newsletter and footer.
- **App entry points:** a dismissible "Get the app" banner on phones, plus links in the menu and footer.

The typography matches ridewyld.com: Inknut Antiqua for headings and Instrument Sans for body text. The logo, product photos and campaign images load from the store's CDN.

## Mobile app (`app/`)

An installable Progressive Web App with its own mobile layout, published next to the website at `app/`. Visitors install it straight from the browser, with no app store:

- **Android / Chrome / Edge:** the in-app sheet shows an **Install app** button that triggers the browser's install prompt.
- **iPhone / iPad (Safari):** the sheet explains **Share → Add to Home Screen**.
- `app/?install=1` opens the install sheet directly (the website banner links here).

What's in it: a tab bar (Home, Shop, Search, Saved, Bag), a campaign carousel, sport tiles and product rails, filters and sorting, a product page with gallery, fit and size, share and a sticky add-to-bag bar, saved items, recent searches and a bag. Checkout opens ridewyld.com with the bag pre-filled. The bag is shared with the website, since both use the same browser storage.

Offline: a service worker (`app/sw.js`) keeps the app shell and catalog, plus the most recent 120 product images, so the app opens and browses without a connection.

### Safety and privacy

- A strict Content-Security-Policy: scripts only from the app's own origin, images only from the store CDN, no inline scripts or styles, no forms, no plugins.
- No accounts, no tracking, no analytics and no third-party scripts. Payments never touch the app; they happen on ridewyld.com.
- The only things stored on the device, in `localStorage`, are bag variant ids with quantities, saved product handles and up to six recent search terms. Everything read back from storage is validated against the catalog.
- All catalog text is HTML-escaped before rendering, and external links use `rel="noopener noreferrer"`.
- The service worker only caches `GET` requests from its own scope, the store's image CDN and Google Fonts, and it deletes old caches on update.

To ship an update, bump `VERSION` in `app/sw.js` so installed apps refresh their cache.

## Files

- `index.html`: page markup
- `src/store.css`: design system and responsive layout (breakpoints at 720px and 1080px)
- `src/store.js`: grid, filters, product view, bag, search, hero and 3D studio
- `src/catalog.js`: generated catalog (prices, variant ids, stock, images)
- `tools/sync_catalog.py`: rebuilds the catalog from the public feed
- `app/`: the mobile app (`index.html`, `app.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icons/`); it reuses `src/catalog.js`

## Refresh the catalog

```bash
python3 tools/sync_catalog.py            # fetches https://ridewyld.com/products.json
```

Private team kits (tagged `SSC`) are excluded from the retail shop.

## Run

```bash
python3 -m http.server 8788
# open http://localhost:8788/
```
