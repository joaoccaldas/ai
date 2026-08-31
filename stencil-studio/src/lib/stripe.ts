import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily construct Stripe so `next build` doesn't require the key. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // apiVersion pinned loosely; cast avoids coupling the build to one literal.
  _stripe = new Stripe(key, { apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion });
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
