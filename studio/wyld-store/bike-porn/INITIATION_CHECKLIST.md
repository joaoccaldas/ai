# Bike Porn Initiation — Production Checklist

Target: a replayable ~30-second horror-comedy initiation in front of the existing Bike Porn Three.js studio.

## Experience
- [x] Existing Bike Porn studio preserved underneath the gate
- [x] 30-second theatrical cold open
- [x] Horror-comedy tone: scare → harmless explanation → escalation
- [x] Klaus: drunken koala master of ceremonies
- [x] Valentino: ceremonial alien supermodel
- [x] Boo: compliance ghost / jump-scare
- [x] Medieval archive door + ceremonial stage language
- [x] Skip ceremony control, without skipping the trials
- [x] Session unlock so normal revisits do not replay automatically
- [x] `?init` replay hook
- [x] `?trials` puzzle-only debug hook
- [x] Reduced-motion handling

## Five-pattern puzzle
- [x] Trial 1 — Persistence: “What’s your name?”; submissions 1–3 fail, #4 passes, independent of text
- [x] Trial 2 — Consistency: repeat any arbitrary choice three times
- [x] Trial 3 — Vanilla Protocol: two quick inputs, deliberate pause, final input; flavor selected is irrelevant
- [x] Trial 4 — Restraint: five seconds without input; interaction resets timer
- [x] Trial 5 — Disobedience: press the explicitly forbidden red button
- [x] Answers are not treated as secrets or correctness data
- [x] Final unlock returns to the existing Bike Porn experience

## 3D assets
- [x] Blender/Higgsfield full 30-second stage source scene
- [x] Blender/Higgsfield web character-pack source scene
- [x] Web-optimized Klaus GLB
- [x] Web-optimized Valentino GLB
- [x] Web-optimized Boo GLB
- [x] Local GLB assets, no expiring media URLs
- [x] model-viewer pinned with Subresource Integrity
- [x] 3D characters remain presentation-only; puzzle logic does not depend on rendering

## Code / resilience
- [x] Initiation code isolated in `initiation.js`
- [x] Initiation styling isolated in `initiation.css`
- [x] Existing `app.js` / Three.js Bike Porn runtime not refactored
- [x] Existing horror movie sets retained
- [x] CSP explicitly allows only the pinned model-viewer host in addition to self
- [x] No Michelle source photos, likeness, private chats, or biometrics added to public assets
- [x] Accessible labels and live feedback text
- [x] Mobile responsive rules
- [x] Gate degrades independently from the Bike Porn studio

## Release verification
- [x] Branch diff reviewed against current main
- [ ] Pull request opened
- [ ] Pull request merged
- [ ] GitHub Pages serves the new files
- [ ] Browser smoke test: landing
- [ ] Browser smoke test: 30-second ceremony
- [ ] Browser smoke test: all five patterns
- [ ] Browser smoke test: successful unlock into existing studio
- [ ] Browser console checked for asset/CSP/JavaScript errors
- [ ] Mobile viewport checked

## Security boundary
The “5D quantum encryption” is intentionally theatrical. GitHub Pages is a public static host, so this interaction must not be described as real access control. If the archive itself must be genuinely private, authenticated server-side authorization and non-public asset storage are a separate requirement.
