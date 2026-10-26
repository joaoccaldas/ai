# Android preview — retired

The earlier `greatlinq-showcase/android` project was a WebView wrapper around the old Spatial Studio catalog. It bundled a fixed file list (`index.html`, `app.js`, `model.js`, `styles.css`, `mark.svg`, `pump.svg`, `fallback-world.svg`, `VISITOR-NOTE.txt`), package `ai.ond.spatialshowcase`, and the workflow `.github/workflows/greatlinq-showcase-android.yml` built a debug APK and published it as a GitHub Release.

That catalog is no longer this folder. The published site is the Mac Demo.app studio: nested `v2/` experiences, vendored Three.js, film, and `profile.json`. Those files do not fit the old asset list, and a WebView of the retired catalog would not match the page.

The Android project and the release workflow are removed so a push cannot ship an APK of the old showcase. This demo is the browser page at `/ai/greatlinq-showcase/`.
