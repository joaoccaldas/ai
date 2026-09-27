# Concept layer — making every portfolio site sellable

`studio/concept.js` is loaded (deferred) by all 17 portfolio pages. It adds:

| Piece | What it does |
|---|---|
| Conversion flow | Each concept's main call to action (Reserve, Book, Order, Subscribe, Start free…) and every `mailto:` link opens a working drawer: choices, dates, a stepper or a cart, a live total, validation, and a confirmation with a reference (e.g. `ML-7C5C`). The last booking and contact details are remembered in `localStorage`. |
| Honest demo | Nothing is sent or charged. The confirmation says so and names what the flow connects to at launch (Bokabord, Stripe, Shopify…). Links that only go live at launch (social, docs, sign-in) show a short note instead of going nowhere. |
| "Make it yours" | A pill at the bottom right opens a sales sheet: what's included, a 2–4 week launch, a fixed quote, full ownership, and a link to the studio's Commission section (`studio/#cta`). Client work (Laurie, Belong, Inner Group) reads "Built by Caldas Studio". |

The per-site flows live in the `C` table at the top of `concept.js`. Prices come from each site's own copy. The sales-sheet claims (2–4 weeks, fixed quote) are placeholders for the owner to confirm.

## Also changed in this pass
- `kit.js` / `kit.css`: kinetic headings break only between words (fixes "GET ST / RONG."). The page root clips horizontal overflow.
- Every page has an Open Graph image and card, a canonical URL and a favicon.
- `laurie/`: rebuilt from a 24-word stub into a full filmmaker portfolio. It has a letterboxed hero, a keyboard-navigable film reel, an approach section and public-profile contact only (no private details, as before). The letterbox-cropped thumbnails are new `img/c_*.jpg` files. The originals are kept.

## Verification (2026-09-27)
- Playwright ran on a real GPU (Metal ANGLE) at 1440×900 and 390×844. Every conversion flow completed, showed a reference, closed with Esc and opened the sales sheet.
- The regression over all 17 pages found no page errors, no 4xx responses, no horizontal overflow and no heading word overflow.
- Known limit: under pure software rendering (SwiftShader), the WebGL-heavy pages (jewelry, eclat, florist) starve the main thread and headless clicks time out. Real machines with any GPU are fine.
- CI: the `Studio Gallery Check` workflow asserts that each page loads `concept.js` and has an `og:image` and a favicon.
