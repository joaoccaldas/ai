import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.studioId) return NextResponse.redirect(new URL("/login", req.url));
  if (!stripeConfigured()) return NextResponse.redirect(new URL("/app/settings#billing", req.url));

  const studio = await prisma.studio.findUnique({ where: { id: session.user.studioId } });
  if (!studio) return NextResponse.redirect(new URL("/login", req.url));

  const stripe = getStripe();
  const base = process.env.APP_URL || new URL(req.url).origin;

  let customerId = studio.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: studio.name,
      email: session.user.email ?? undefined,
      metadata: { studioId: studio.id },
    });
    customerId = customer.id;
    await prisma.studio.update({ where: { id: studio.id }, data: { stripeCustomerId: customerId } });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${base}/app/settings?billing=success#billing`,
    cancel_url: `${base}/app/settings#billing`,
    allow_promotion_codes: true,
    subscription_data: { metadata: { studioId: studio.id } },
  });

  return NextResponse.redirect(checkout.url!, { status: 303 });
}
