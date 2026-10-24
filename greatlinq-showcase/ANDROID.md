# ond.ai Spatial Showcase — Android preview

This app is an Android WebView wrapper around the reviewed, visitor-only
`greatlinq-showcase` static app. It **does not connect to** the private Atlas,
Neon, Supabase, company APIs, or research repos. JavaScript is enabled only
for the static showcase and its optional Three.js viewer. External site
visits require a user click and open the Android browser.

- Package: `ai.ond.spatialshowcase`
- Platform: Android 8.0+ (API 26), builds against Android 15 (API 35)
- Permission: `INTERNET` only, for approved portfolio preview imagery, models and CDN Three.js.
- Entrypoint: AndroidX WebViewAssetLoader HTTPS origin, with local HTML/CSS/JS/SVG inside APK.
- Build: `cd android && gradle assembleDebug` with Android SDK 35 and Java 17/21.
- CI: `.github/workflows/greatlinq-showcase-android.yml` builds and smoke tests the APK, then publishes a GitHub Release download.

This is a *debug-signed evaluation APK*, not a verified store/release build. Since
GitHub runners use temporary debug signing identities, future builds may
require uninstalling the previous evaluation APK before installing the new one.
Production updates require a stable, user-controlled signing key held in
GitHub Actions secrets, Play Integrity/device testing and rights review.

The UI itself is bundled locally and opens even without network; externally
hosted images/GLB files will gracefully display their local fallback when
there is no connection. No local user data is stored intentionally.

**Source & licensing:** the demo URLs link to existing public source portfolio
media, some of which may need additional rights clearance for external business
use. This preview is not an integrated Greatlinq product, formal partnership,
or a validated T.2 SDK deployment.