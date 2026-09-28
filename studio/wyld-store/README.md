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

## Mobile app

The same app ships in two forms:

1. **Android app (`.apk`)**: a native app built with Capacitor from `native/`. The app's files are bundled inside it, so it runs from the phone rather than a browser tab. It has the WYLD "W" launcher icon and a splash screen, and it requests only internet access. It runs on Android 7 and newer. The `WYLD Android App` workflow builds it, installs it on an emulator as a smoke test, and publishes it to `downloads/WYLD.apk` on the site.
2. **Web app (`app/`)**: an installable Progressive Web App for iPhone (Safari → Share → Add to Home Screen) and any other browser. Installing from the website also opens the app, because the site links the app manifest and redirects home-screen launches to `app/`.

The website's "Get the app" banner opens `app/?install=1`. That sheet offers the APK download on Android and the Add to Home Screen steps on iPhone.

The layout fills any screen: phones, foldables and tablets. On phones whose browser reports a desktop-width page (such as "Desktop view"), the app scales itself back to the phone's real width.

The app has a tab bar (Home, Shop, Search, Saved, Bag), a campaign carousel, sport tiles and product rails, filters and sorting, and a product page with gallery, fit and size, share and a sticky add-to-bag bar. It also has saved items, recent searches and a bag. Checkout opens ridewyld.com with the bag pre-filled.

Offline: the service worker (`sw.js`, which covers both the site and the app) serves our own files network-first with a cached fallback, and keeps the most recent 120 product images.

### Building the Android app locally

Requires Node 22, JDK 21 and the Android SDK (platform 36).

```bash
cd native
npm ci
npm run icons   # regenerate launcher icons and splash from native/assets
npm run apk     # android/app/build/outputs/apk/release/app-release.apk
```

**Signing:** set `WYLD_KEYSTORE_FILE`, `WYLD_KEYSTORE_PASSWORD`, `WYLD_KEY_ALIAS` and `WYLD_KEY_PASSWORD` to sign with a release key. In CI, add them as the repository secrets `WYLD_KEYSTORE_BASE64` (the keystore, base64-encoded), `WYLD_KEYSTORE_PASSWORD`, `WYLD_KEY_ALIAS` and `WYLD_KEY_PASSWORD`. Without them the build uses a debug key, which installs fine, but each CI build gets a different key. A new build then only installs after removing the old one, so a release key is recommended. Keystores are git-ignored and must never be committed.

**iPhone:** to publish a native iOS app, run `npx cap add ios` on a Mac and build it in Xcode. Distribution then needs an Apple Developer account and the App Store or TestFlight.

### Safety and privacy

- A strict Content-Security-Policy: scripts only from the app's own origin, images only from the store CDN, no inline scripts or styles, no forms, no plugins.
- No accounts, no tracking, no analytics and no third-party scripts. Payments never touch the app; they happen on ridewyld.com.
- The only things stored on the device, in `localStorage`, are bag variant ids with quantities, saved product handles and up to six recent search terms. Everything read back from storage is validated against the catalog.
- All catalog text is HTML-escaped before rendering, and external links use `rel="noopener noreferrer"`.
- The service worker only caches `GET` requests from its own scope, the store's image CDN and Google Fonts, and it deletes old caches on update.
- Android app: only the `INTERNET` permission, no cleartext traffic, no app-data backup, and WebView debugging disabled. External links open in the phone's browser.

To ship an update, bump `VERSION` in `sw.js` so installed web apps refresh their cache.

## Files

- `index.html`: page markup
- `src/store.css`: design system and responsive layout (breakpoints at 720px and 1080px)
- `src/store.js`: grid, filters, product view, bag, search, hero and 3D studio
- `src/catalog.js`: generated catalog (prices, variant ids, stock, images)
- `tools/sync_catalog.py`: rebuilds the catalog from the public feed
- `app/`: the mobile app (`index.html`, `app.css`, `app.js`, `manifest.webmanifest`, `icons/`); it reuses `src/catalog.js`
- `sw.js`: service worker for the site and the app
- `native/`: the Capacitor Android project, with icons and splash sources in `native/assets/`
- `downloads/WYLD.apk`: the latest Android build, published by CI

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
