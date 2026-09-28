# WYLD Store

A minimal, editorial retail storefront and mobile app for [ridewyld.com](https://ridewyld.com/). It's static, needs no server, and is built to be found by search engines and AI assistants.

## What's in it

- **Hero:** a full-bleed campaign slideshow using WYLD's own photography. Swipe it on mobile.
- **Shop by sport:** Cycling, Triathlon, Run WYLD and Accessories. The tiles scroll horizontally on mobile and sit in a grid on desktop.
- **Shop by colour:** a colour index built from WYLD's colourways (Raspberry, Grape, Blueberry, Olive, Tiffany, Blush and more). Each swatch filters the collection to that colour.
- **Race Fit edit:** an editorial split with a product rail.
- **Kit builder:** two swipeable rows, jerseys over bib shorts, to put a kit together, with a live total. "Choose sizes" adds both pieces to the bag in one step.
- **Size band:** an oversized XXS → 4XL scrolling band, the size-inclusive range as a visual signature.
- **Collection:** a sticky category bar (All, Cycling, Triathlon, Run, Accessories, Sale). Each category has sub-type and Women/Men filters, plus sorting.
- **Product view:** a swipeable gallery on mobile and a two-column gallery on desktop. It has fit and size pickers with sold-out sizes crossed out, a sticky add-to-bag bar on mobile, and "You may also like". Each product has a deep link at `#/p/{handle}`.
- **Bag drawer:** stored in localStorage. Checkout hands the bag to ridewyld.com through a Shopify cart permalink (`/cart/{variant}:{qty},…`), so the order completes on the real store.
- **Search overlay, menu drawer and toast.**
- **WYLD Studio:** the Blender GLBs in `assets/blender/`, shown in `<model-viewer>`, with live colourways that recolour the `FABRIC_PRIMARY` material.
- **Also on the page:** custom kit, brand story, FAQ, journal, newsletter and footer.
- **Upcoming releases (`upcoming/`):** a playful sign-up page for new drops, linked from the menu.
- **Bike Porn (`bike-porn/`):** eight WYLD "bike movies" in a Three.js 3D studio, using the fully equipped Speedmax CFR AXS design study from the open Canyon Museum project. Each film pairs a custom livery with a persona rider and its own movie set:

  | Film | Persona | Livery | Set |
  |---|---|---|---|
  | Aero Glam | The Alien | Alien Glam, with neon wheel rings and a full rear disc | Crop circle, UFO |
  | Couture | The Supermodel | Blush Couture | Runway with paparazzi |
  | Offshore | The Surfer | Tiffany Tide | Golden-hour beach |
  | Hex | The Witch | Witching Hour | Moonlit woods with a cauldron |
  | Stay Weird | The Weirdo | Stay Weird | Sticker dream |
  | Sunny Side | The Babysitter | WYLD Dye | Midsummer meadow |
  | The Lake House | The Final Girl | Lake Fog | Haunted cabin by a lake |
  | Sanctuary | The Doll | Stained Glass | Haunted chapel |

  Each film has a 20-second cinematic trailer: letterbox, grain, hard cuts, title cards, the set's own climax (lightning, flashes, the UFO beam and so on) and an end card. The sets use bloom; the Light and Dark studios use ambient occlusion. Orbit, camera views, Spin, Ride and Random controls are included, plus shareable `#film` links.

  The source is in `bike-porn/src/`:
  - `main.js`: renderer, camera and trailer director
  - `sets.js`: the movie sets (`kit.js` holds their building blocks)
  - `dye.js`: the livery shader (dye, checker, spots and stained-glass mosaic)
  - `wheels.js`: the disc and neon rings
  - `liveries.js`: the films

  The persona art is in `bike-porn/personas.svg`. Rebuild with `cd bike-porn/src && npm ci && npm run build`, which writes `bike-porn/app.js`. It's an unofficial design study, not affiliated with Canyon.
- **Free-shipping progress:** the bag shows how far the customer is from the store's free-shipping threshold.
- **App entry points:** a dismissible "Get the app" banner on phones, plus links in the menu and footer.

The typography matches ridewyld.com: Inknut Antiqua for headings and Instrument Sans for body text. Both are self-hosted from `fonts/` under the SIL Open Font License (see `fonts/OFL-*.txt`), so no font requests go to third parties. The logo, product photos and campaign images load from the store's CDN.

## Structure

```
config/site.js        brand, contact channels, policies, currency, free-shipping threshold (edit here)
data/                 generated: catalog.json + catalog.js (daily sync), app-version.json (Android CI)
src/core/             shared by website, app and builds
  format.js           prices, images, escaping
  model.js            catalog validation, categories, colours, sizes, variant logic, search, related
  storage.js          bag and saved items, checkout link, free-shipping progress
  live.js             live catalog refresh and app update check (Android app)
  runtime.js          build-time settings (overwritten by the Android build)
src/card.js           product card shared by the store and the pre-rendered pages
src/store.js, store.css   website
app/                  mobile web app (PWA), also bundled into the Android app
native/               Capacitor Android project
tools/sync_catalog.py pulls live prices and stock from the official store feed
tools/build_site.mjs  pre-renders SEO pages, sitemap and llms.txt
p/, c/, colour/       generated product, category and colour pages
upcoming/             upcoming releases page
fonts/                self-hosted fonts and licences
sw.js                 service worker for site and app
```

New categories, colours or copy go in `src/core/model.js`; brand and contact details go in `config/site.js`. The website, the app and the SEO build all read these files.

## Real prices and stock

`.github/workflows/wyld-site.yml` runs daily, on changes to the store, and on demand. It:
1. Runs `tools/sync_catalog.py`, which fetches the official Shopify feed (retrying if rate-limited). It writes `data/` only when prices or stock actually change, and keeps the last good catalog if the store can't be reached.
2. Runs `tools/build_site.mjs` to regenerate the SEO pages.
3. Commits the results and republishes GitHub Pages.

Checkout always happens on ridewyld.com through a Shopify cart permalink, so the store's own prices are final.

## SEO and AI search

`tools/build_site.mjs` generates HTML that crawlers and AI assistants can read without running JavaScript:
- **Product pages:** a static page for every product at `p/<handle>/`, with `Product` structured data (price, currency, availability, brand, colour, sizes) and breadcrumbs.
- **Collection pages:** `c/<category>/` and `colour/<colour>/`, with `ItemList` structured data.
- **Homepage:** the full product grid pre-rendered, plus `Organization`, `WebSite`, `ItemList` and `FAQPage` structured data, and a visible FAQ written from store facts.
- **Metadata:** canonical URLs, Open Graph and Twitter cards, descriptive titles and meta descriptions.
- **Crawler files:** `sitemap.xml`, `robots.txt`, `llms.txt` and `llms-full.txt` (for AI assistants).

Absolute URLs come from `SITE_URL`. CI uses the GitHub Pages address, or the repository variable `WYLD_SITE_URL` when a custom domain is set. `robots.txt` and `llms.txt` only take effect at the root of a domain, so serve the store from its own domain for the full benefit, and submit `sitemap.xml` in Google Search Console.

## Contact details

Set `contact.email`, `contact.phone` and `contact.whatsapp` in `config/site.js`. They then appear in the site footer, the app, the structured data and `llms.txt`. Leave them empty to show only the contact form and social channels. Use business channels only, never personal ones.

## Mobile app

The same app ships in two forms:

1. **Android app:** `native/` wraps `app/` with Capacitor. The `WYLD Android App` workflow builds it, smoke-tests it on an emulator, and publishes `downloads/WYLD.apk` plus `data/app-version.json`.
2. **Web app:** `app/` is an installable PWA for iPhone (Safari → Share → Add to Home Screen) and other browsers.

**Updating the app as it evolves:**
- **Prices and stock** reach installed apps without a new build. The Android app refreshes from the published `data/catalog.json` at launch and when it returns to the foreground. It caches the result for offline use.
- **Design and features** ship by changing `app/`, `src/core/` or `config/`. CI then builds a new APK with a higher version number, and installed apps show an "Update WYLD" prompt that downloads it.
- **Web app:** loads the latest files network-first, so it updates on the next visit. When `sw.js` changes, bump its `VERSION`.
- **Signing:** set the repository secrets `WYLD_KEYSTORE_BASE64`, `WYLD_KEYSTORE_PASSWORD`, `WYLD_KEY_ALIAS` and `WYLD_KEY_PASSWORD` so every build is signed with the same key. Updates then install over the old version. Without them, CI signs with a new debug key each time, so users must uninstall before updating.

**Building locally:** requires Node 22, JDK 21 and the Android SDK (platform 36).

```bash
cd native
npm ci
npm run icons    # regenerate launcher icons and splash from native/assets
SITE_URL=https://your-site/ WYLD_VERSION_CODE=100 npm run apk
```

**iPhone:** to publish a native iOS app, run `npx cap add ios` on a Mac. Distribution then needs an Apple Developer account and the App Store or TestFlight.

## Safety and privacy

Website:
- A Content-Security-Policy allows scripts only from this site, plus the 3D viewer from Google's library CDN. There are no inline scripts, and the newsletter form may post only to ridewyld.com.
- The 3D viewer script loads only when the studio section is about to appear, and is pinned with Subresource Integrity (SRI).
- Product links use a `Map` lookup and a strict handle pattern. The bag read from storage is validated against the catalog and synced across tabs.
- `tools/sync_catalog.py` validates every field it takes from the product feed (handles, image paths, variant ids, text) and drops anything unexpected.
- CI jobs run with read-only permissions; only the publish step can write.

App:
- A strict Content-Security-Policy: scripts only from the app's own origin, images only from the store CDN, no inline scripts or styles, no forms, no plugins.
- No accounts, no tracking, no analytics and no third-party scripts. Payments never touch the app; they happen on ridewyld.com.
- The only things stored on the device, in `localStorage`, are bag variant ids with quantities, saved product handles and up to six recent search terms. Everything read back from storage is validated against the catalog.
- All catalog text is HTML-escaped before rendering, and external links use `rel="noopener noreferrer"`.
- The service worker only caches small `GET` files from its own scope plus product images (at most 120). Downloads such as the APK and 3D models are never cached. It deletes old caches on update.
- Android app: only the `INTERNET` permission, no cleartext traffic, no app-data backup, and WebView debugging disabled. External links open in the phone's browser.


## Run locally

```bash
python3 tools/sync_catalog.py   # refresh prices (optional)
node tools/build_site.mjs       # regenerate SEO pages (relative links without SITE_URL)
python3 -m http.server 8788     # open http://localhost:8788/
```
