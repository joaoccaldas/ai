# Bike Porn Access Trials — Production Checklist

The Bike Porn page keeps only the five playful access trials in front of the existing Three.js studio.

## Current scope
- [x] Existing Bike Porn studio preserved underneath the gate
- [x] Five-pattern access puzzle retained
- [x] No ceremony/preroll video on this page
- [x] No ceremony performer GLBs loaded on this page
- [x] No `<model-viewer>` dependency
- [x] One Three.js runtime: the existing Bike Porn `app.js`
- [x] CSP remains self-hosted for scripts and media
- [x] Reduced-motion handling
- [x] `?trials` puzzle debug hook
- [x] Default page, including `#tiffany-tide` and the other film hashes, opens the studio with no gate

## Five-pattern puzzle
- [x] Trial 1 — Persistence
- [x] Trial 2 — Consistency
- [x] Trial 3 — Vanilla Protocol
- [x] Trial 4 — Restraint
- [x] Trial 5 — Disobedience
- [x] Final unlock returns to the existing Bike Porn experience

## Separation rule
The Ceremony video/performer experience belongs to another app and must not be reintroduced here.

Any future Bike Porn 3D additions should reuse the page's existing Three.js runtime rather than introducing a second 3D renderer/library.

## Security
- [x] No private photos, likeness data, private chats, or biometrics
- [x] No external model-viewer host
- [x] No external ceremony media host
- [x] `default-src 'self'`
- [x] `connect-src 'self' blob: data:`

## Release verification
- [ ] Browser smoke test: landing
- [ ] Browser console has no multiple-Three warning
- [ ] Browser console has no model-viewer typed-array error
- [ ] Five trials complete successfully
- [ ] Successful unlock into the existing studio
- [ ] Mobile viewport checked
