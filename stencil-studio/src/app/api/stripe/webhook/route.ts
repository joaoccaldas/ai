import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const studio = await prisma.studio.findFirst({ where: { stripeCustomerId: customerId } });
  if (!studio) return;
  await prisma.studio.update({
    where: { id: studio.id },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status, // active|trialing|past_due|canceled|…
      plan: sub.status === "active" || sub.status === "trialing" ? "studio" : studio.plan,
    },
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 400 });

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `signature: ${e instanceof Error ? e.message : "bad"}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.subscription) {
          const sub = await getStripe().subscriptions.retrieve(cs.subscription as string);
          await syncSubscription(sub);
        }
        break;
      }
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
