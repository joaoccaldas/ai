# Stencil Studio

**White-label AI tattoo try-on for tattoo parlours.** Studios sign up, connect
their own AI (Higgsfield) key, upload their artists' flash, and run client
try-ons on a kiosk: snap the client's photo, place a design, and generate a
**photorealistic render of the tattoo on their skin** — then save it, share a
client link, and turn it into a booking.

This is a standalone Next.js app (App Router) meant to deploy to Vercel. It is a
sibling to the free client-side demo at `/stencil/` in the parent site.

## How it's monetised

- **Flat software licence** (Stripe subscription) with a free trial. We charge for
  the software; **studios bring their own AI key**, so render costs are billed to
  them at cost by the AI provider.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, server actions) · TypeScript |
| Styling | Tailwind v4 + a small CSS design system (`globals.css`) |
| DB / ORM | PostgreSQL + Prisma (multi-tenant) |
| Auth | Auth.js v5 (credentials, JWT sessions) |
| Billing | Stripe (subscription checkout, portal, webhooks) |
| Storage | Vercel Blob (public URLs the render provider can fetch) |
| AI render | Higgsfield REST (`popcorn/auto`), per-studio key, AES-256-GCM at rest |

## The render pipeline

1. In the browser the client photo and chosen design are composited on a canvas
   (same-origin sources, so the export never taints).
2. The **placement composite** is uploaded to blob storage → a public URL.
3. `POST /api/render` submits `{ prompt, image_urls: [compositeUrl] }` to the
   studio's Higgsfield account. The prompt turns the overlaid design into a real
   tattoo that follows the skin and light while keeping its exact placement.
4. The client polls `GET /api/render/:id`; on completion the result is saved to the
   session and shown as before/after with a shareable client link.

`RENDER_PROVIDER=mock` renders locally (returns the composite) so the whole flow
works with no key — useful for demos and CI.

## Local development

```bash
cp .env.example .env.local     # fill in the values (see below)
npm install                    # runs `prisma generate`
npm run db:push                # create the schema in your dev database
RENDER_PROVIDER=mock npm run dev
```

Open http://localhost:3000, create a studio, and run a try-on. With
`RENDER_PROVIDER=mock` you don't need an AI key or blob token.

## Data model

`Studio` (tenant) → `User` (owner/artist), `Design` (uploaded flash),
`ClientSession` (a client visit, with a public `shareToken`), `Render`
(one AI generation). Everything is scoped by `studioId`.

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) — Vercel + Neon Postgres + Stripe + each studio's
own Higgsfield key. Point Vercel's **Root Directory** at `stencil-studio` if this
lives inside the parent repo.

## Status

MVP. Implemented: auth, multi-tenant studios, white-label branding, BYO-key AI
connection, flash upload, the full client try-on (photo → placement → AI render →
save → share), Stripe licence billing, and a marketing/pricing landing page.
Booking/deposit capture and richer analytics are the next milestone.
