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
  if (!studio?.stripeCustomerId) return NextResponse.redirect(new URL("/app/settings#billing", req.url));

  const base = process.env.APP_URL || new URL(req.url).origin;
  const portal = await getStripe().billingPortal.sessions.create({
    customer: studio.stripeCustomerId,
    return_url: `${base}/app/settings#billing`,
  });
  return NextResponse.redirect(portal.url, { status: 303 });
}
