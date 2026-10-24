# Caldas Studio mobile portfolio remediation
2026-10-23. This narrow PR uses findings previously documented in caldas-video-studio/STUDIO_AUDIT_2026-10-05.md, then rechecks current `joaoccaldas/ai` source.

## Confirmed in current code
- `studio/mobile/index.html` had `.work{display:block}` but no `.work[hidden]` override; filter JS sets `hidden` and updates the count, leaving items visually present.
- `studio/index.html` primary mobile Portfolio link targeted `#mobilePortfolio`, hidden via `display:none!important` on mobile; its destination was inaccessible.

## Minimal fixes
- Add `.work[hidden]{display:none!important}`, restoring actual filtered layout.
- Make primary mobile Portfolio link navigate to the existing `mobile/` page.
- Add source-level tests. No new shell, route, 3D renderer, backend or tracking.

## QA required before merge
1. Execute `node --test studio/tests/mobile-portfolio-contract.test.mjs`.
2. Browser test 320/390/430 px and desktop; select each filter and compare visible cards to displayed count.
3. Keyboard and screen-reader review: hidden cards must not remain in tab sequence or accessibility tree.
4. Follow top Portfolio link from mobile, confirm visible destination and Back navigation; exercise reduced motion.
5. Check public live deployment only after exact-SHA release and smoke.

## Still open, not fixed here
- Guided museum route blocking central dais.
- Pre-entry selection starts hidden tour behind intro overlay.
- Focus escaping All Works dialog.
- Asset source/rights catalog and real device performance.
These require distinct baseline/test evidence and separate small PRs.
