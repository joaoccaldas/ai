# Wepartner — website redesign

A professional, clean and immersive single-page redesign of
[wepartner.se](https://www.wepartner.se) — *Employer Solutions Nordic AB*.

→ https://joaoccaldas.github.io/ai/wepartner/

Wepartner is **Sveriges bredaste nätverk av kvalificerade interimskonsulter** —
one counterpart giving clients access to the entire consulting market across
Finance, Lön & HR and Supply chain.

## What this is

A self-contained `index.html` (no build step, no framework) that keeps the
brand's own identity while lifting the experience to a modern, immersive
standard — and adds **AI, automation and machine learning** as a clear
differentiator.

### Brand fidelity

- **Accent colour `#BF5233`** — the exact terracotta/rust taken from the
  original Wepartner "W" logo SVG. Recreated as an inline vector mark and
  favicon.
- **Warm neutral palette** — off-white paper, warm charcoal ink, light-grey
  section dividers — matching the site's clean, minimalist Scandinavian look.
- **Clean modern sans-serif** (Inter, with a full system-font fallback stack).
- **All original copy preserved** verbatim (in Swedish) from every page —
  home, *Så jobbar vi*, *Våra nätverk*, *Rekrytering* and *Kontakta oss* —
  including the full partner team, testimonials and company details.

### The differentiator: AI · Automation · Machine learning

A dedicated immersive section frames how technology accelerates and de-risks
matching — AI-driven candidate ranking, automated search across the network,
predictive quality assurance (EPROVED knowledge tests) — while keeping the
human partners in the driver's seat. *"Teknik i tjänst av omdöme."*

## Features

- Immersive animated **network/neural canvas** (hero + AI section) that ties
  the "network of consultants" story to the AI theme
- Sticky glass navigation with scroll progress, mobile drawer menu
- Scroll-reveal animations and count-up statistics
- Three division cards (Finance / Lön & HR / Supply chain) linking to the real
  subdomains
- Process timeline, recruitment methodology, network benefits, testimonials
- Full partner team grid with `tel:` / `mailto:` links
- Fully responsive, keyboard-accessible, semantic HTML
- Honours `prefers-reduced-motion`; content is readable with JavaScript disabled
- SEO: meta/OG/Twitter tags, `Organization` JSON-LD, canonical, `og.png`

## Files

| File | Purpose |
|------|---------|
| `index.html` | The complete self-contained site |
| `favicon.svg` | The Wepartner "W" mark (`#BF5233`) |
| `og.png` | 1200×630 social-share image |

## Notes

This is a design/redesign concept built for the site owner. Contact details,
team roster and company registration data are reproduced from the public
wepartner.se site. External fonts load from Google Fonts with a robust local
fallback, so the page degrades gracefully offline.
