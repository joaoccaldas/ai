# Deploying Stencil Studio

You connect four services — all have free tiers to start. Estimated time: ~30 min.

## 1. Database — Postgres (Neon)

1. Create a project at [neon.tech](https://neon.tech) (or Vercel Postgres / Supabase).
2. Copy the **pooled** connection string → this is `DATABASE_URL`.
3. Locally, create the schema:
   ```bash
   npm install
   DATABASE_URL="postgres://…" npm run db:push
   ```

## 2. File storage — Vercel Blob

Client photos and placement composites must be at public URLs the AI can fetch.

1. In Vercel → your project → **Storage → Blob → Create**.
2. Copy the read/write token → `BLOB_READ_WRITE_TOKEN`.

## 3. Billing — Stripe

1. In Stripe, create a **Product** with a recurring **Price** (e.g. £49/mo). Copy the
   price id → `STRIPE_PRICE_ID`.
2. Copy your secret key → `STRIPE_SECRET_KEY`, publishable key →
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Add a webhook endpoint → `https://YOURDOMAIN/api/stripe/webhook`, subscribe to
   `checkout.session.completed` and `customer.subscription.*`. Copy the signing
   secret → `STRIPE_WEBHOOK_SECRET`.

## 4. Deploy to Vercel

1. Import the repo in Vercel. **If this app lives in a subfolder of a larger repo,
   set Root Directory = `stencil-studio`.**
2. Add every variable from `.env.example` in **Settings → Environment Variables**:
   - `APP_URL`, `NEXTAUTH_URL` → your production URL
   - `AUTH_SECRET` → `openssl rand -base64 32`
   - `APP_ENCRYPTION_KEY` → `openssl rand -base64 32` (32 bytes) — encrypts studios' AI secrets
   - `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`
   - `RENDER_PROVIDER=higgsfield`, `HIGGSFIELD_API_BASE=https://platform.higgsfield.ai`
   - the four `STRIPE_*` / Stripe values
3. Deploy. The build runs `prisma generate && next build`. Run `npm run db:push`
   once against the production `DATABASE_URL` (or add a migration step).

## 5. Each studio connects their own AI key

Studios sign up, then in **Settings → AI connection** paste their Higgsfield
**Key ID** and **Key Secret** (from [cloud.higgsfield.ai](https://cloud.higgsfield.ai)
→ API). The secret is encrypted with `APP_ENCRYPTION_KEY` before it's stored, and
only decrypted server-side to submit renders.

## After deploy — verify in 3 checks

1. **Health:** open `https://YOURDOMAIN/api/health`. It returns `ok: true` plus which
   integrations are configured (database, blob, stripe, render provider). Anything
   missing is named in `missingRequired`.
2. **Seed a demo (optional):** `npm run db:seed` against the prod `DATABASE_URL`
   creates a login `demo@stencil.studio` / `demo12345` with one design, so you can
   click through immediately.
3. **AI key:** a studio connects its key in **Settings → AI connection** and clicks
   **Test connection** — this validates the key against Higgsfield *without spending
   credits* (it sends an intentionally invalid request that only checks auth).

## Verifying without spending

Set `RENDER_PROVIDER=mock` in any environment to exercise the full flow (sign-up →
photo → placement → "render" → share → booking) without an AI key, blob token, or
spend. The mock returns the placement composite as the result.

## Notes on the AI endpoint

The provider adapter (`src/lib/render/higgsfield.ts`) targets
`POST {base}/higgsfield-ai/popcorn/auto` with body `{ input: { prompt, image_urls } }`
and polls the returned `status_url`. If your Higgsfield account expects a flat body
(no `input` wrapper), set `HIGGSFIELD_BODY_MODE=flat`. Confirm the exact model path
against your account's API dashboard and adjust `SUBMIT_PATH` if needed.
