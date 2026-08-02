# Caldas Studio — the immersive-site engine & the business around it

A productized service: **scout local businesses → build them an immersive website *before* they ask → let them approve → sell it done.** This document is the operating manual: the reusable design system, how to standardize and reuse it, and the end‑to‑end workflow that turns it into recurring revenue.

Live portfolio: **`/studio/`** · Flagship: **`/belong/`**

---

## 1. Why this works

Local SMBs (restaurants, gyms, salons, hotels, cafés) mostly have **no site, a dead Facebook page, or a tired template**. They don't have time, skills, or budget to fix it. The classic agency model fails them: it asks for a brief, a deposit, and weeks of back‑and‑forth.

We invert it. **The product is already built when we reach out.** The prospect sees *their own* business, live, immersive, on a private link. The ask isn't "hire us" — it's "do you want to keep this?" That collapses the sales cycle and makes the value undeniable.

The thing that makes it *profitable* rather than exhausting is the **reusable kit**: each new site is 80% assembly, 20% bespoke.

---

## 2. The reusable kit (the "standardize once" layer)

Everything lives in **`/studio/kit.css`** + **`/studio/kit.js`** — zero build step, zero dependencies, works on GitHub Pages or any static host.

### 2.1 Design tokens (`kit.css` `:root`)
One site = one small block of CSS variables. Change these, re‑skin everything:

```css
:root{
  --bg; --ink; --muted; --accent; --accent-2; --line; --card;
  --serif; --sans; --maxw; --radius;
}
```

Per‑vertical presets (starting points):
| Vertical | Mood | Fonts | Accent |
|---|---|---|---|
| Restaurant | warm, candlelit | Cormorant + Jost | gold |
| Gym | bold, electric | Oswald + Jost | lime / red |
| Salon | soft, editorial | Fraunces + Jost | blush |
| Hotel | luxe, coastal | Cormorant + Jost | brass / teal |
| Café | craft, warm | Fraunces + Jost | burnt orange |

### 2.2 The immersive engine (`kit.js`)
- **`LivingBackground`** — a dependency‑free WebGL fragment‑shader background (flowing fbm noise, glow orbs, optional aurora ribbons). Themed by 3 colors + a `mode` (`haze` / `embers` / `pulse` / `aurora`). Falls back to a CSS gradient if WebGL is unavailable. This single file gives *every* site an immersive, always‑moving hero for near‑zero cost.
- **Motion primitives**, all auto‑initialised from HTML attributes: scroll‑reveal, kinetic hero letters (`[data-kin]`), parallax (`[data-parallax]`), card tilt, magnetic buttons, custom cursor, sticky nav, progress rail, count‑up stats (`[data-count]`), marquee, loader.

### 2.3 The blocks (`kit.css`)
Reusable, responsive, accessible sections — the vocabulary every site is assembled from:
`nav` · `hero` (kinetic) · `card grid` (g2/g3/g4) · `stats` · `marquee` · `tile` (parallax media) · `list` (menu/pricing rows) · `foot`.

> **Adding to the library:** harvest patterns from real inspiration (e.g. the Grigoletto Figma pack's ideas — glassmorphism, 3D mockups, editorial heroes, aurora lighting) and **rebuild them as your own coded blocks** — never ship someone else's licensed files. Each new block is written once, themed forever.

### 2.4 Author a new site in ~1 file
```html
<link rel="stylesheet" href="../kit.css">
<style>:root{ --bg:…; --ink:…; --accent:…; --serif:'…'; }</style>
<canvas class="studio-bg" data-bg data-colors="#a,#b,#c" data-mode="embers"></canvas>
<!-- compose blocks, drop [data-kin]/[data-count]/.reveal on elements -->
<script src="../kit.js"></script>
```
That's the whole standard. The five sites under `/studio/` are worked examples.

---

## 3. Three quality tiers (match the tool to the business)

| Tier | Tech | Best for | Why |
|---|---|---|---|
| **Clean & Fast** | static + CSS/canvas motion | restaurants, salons, cafés | Mobile speed + local SEO win the customer. Don't ship heavy 3D to a taco shop. |
| **Premium** | scroll storytelling + subtle 3D | hotels, venues, clinics | Wants to *feel* special without hurting performance. |
| **Immersive** | full WebGL (Belong‑level) | flagship clients, launches | A site people *share*. Also your portfolio magnet. |

Matching tier to business is a **strategic decision, not a default** — it protects conversion and Core Web Vitals, and it lets you price honestly.

---

## 4. The end‑to‑end workflow

```
SCOUT → ENRICH → SCORE → GENERATE → APPROVE → BUILD → DELIVER → OUTREACH → CLOSE → RETAIN → IMPROVE
```

1. **Scout** — pull local businesses by category + city from Google Places / OpenStreetMap. Keep a living list (Airtable / Sheets), de‑duped, refreshed on a schedule.
2. **Enrich** — for each: has a website? PageSpeed / Core Web Vitals score, mobile‑friendly?, last‑updated signals, review count/rating, socials. (PageSpeed Insights API, headless checks.)
3. **Score** — an **opportunity score**: high review count + weak/no site = hot lead (they clearly have demand, just no digital home). Rank the list.
4. **Generate** — the generator fills a **recipe** (blocks + vertical preset + the business's real name, hours, and — where available — photos) and outputs a real site to a per‑prospect subdomain.
5. **Approve (yours)** — render the generated site to **PNG/PDF** (headless screenshot) for your quick internal sign‑off before it ever goes out. This is the human‑in‑the‑loop gate.
6. **Build** — nothing to rebuild: the prototype *was* code. Polish, add real content.
7. **Deliver** — publish to `their‑name.caldas.studio` as a private preview.
8. **Outreach** — cold email: *"We already built your new website — here's the live link. Want it?"* Personalised, with a before/after and the preview URL.
9. **Close** — pricing below; contract + domain handover.
10. **Retain** — hosting & care plan (monthly): updates, uptime, small changes.
11. **Improve** — every won/lost deal feeds back: which verticals convert, which hero/mode/copy wins. A/B the outreach and the templates. The kit compounds.

### Automation surface
- Orchestrate with a scheduler (cron / n8n / a small worker). Steps 1‑5 and 7‑8 are automatable; **5 and 9 keep a human in the loop.**
- Store state (prospect, score, generated URL, outreach status, replies) in Airtable/Sheets so the pipeline is inspectable and improvable.

---

## 5. Pricing (starting points, SEK)

| | One‑time build | Care / hosting |
|---|---|---|
| Clean & Fast | from 8 900 | from 290/mo |
| Premium | from 18 900 | from 390/mo |
| Immersive | from 34 900 | from 590/mo |

Optional add‑ons: copywriting, photography, booking/menu integration, multi‑language (SE/EN), analytics. The **care plan is the compounding revenue** — build once, earn monthly.

---

## 6. Do‑it‑right notes (Sweden / EU)

- **GDPR & cold email:** B2B outreach is defensible under *legitimate interest*, but: identify yourself clearly, target the **business** contact (not personal data), keep it relevant, and include an easy opt‑out. Log consent/opt‑outs. Don't scrape or store personal data you don't need.
- **Spec mockups:** using a prospect's name/logo/photos in a proposal concept is fine, but **label it a concept** and swap to their owned assets on launch — same honest framing used on the Belong concept ("independent concept redesign, not affiliated").
- **Licensing:** learn from inspiration packs; **ship only code you wrote.** The `/studio/kit` is 100% original and yours to reuse commercially.
- **Accessibility & performance** are features you can sell: `prefers-reduced-motion`, keyboard nav, fast LCP. The kit already respects reduced motion and degrades without WebGL.

---

## 7. Repository map

```
/                      finance presentation (existing)
/belong/               flagship immersive experience (3 palette modes)
/studio/               ← the portfolio hub (entry point)
  kit.css  kit.js      the reusable engine (standardize once)
  restaurant/  gym/  salon/  hotel/  cafe/   five worked SMB examples
/docs/WORKFLOW.md      this document
```

**Branches:** the consolidated, linkable portfolio ships from `main` (GitHub Pages serves one branch, so everything must co‑exist for the hub to link centrally). Per‑UI branches `ui/<vertical>` exist for **isolated iteration** on a single business site; merge back to `main` to update the live hub.

---

*Build it first. Let them say yes.*
