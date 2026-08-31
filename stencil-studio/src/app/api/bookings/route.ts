import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public: a client requests a booking from a studio's share page.
const schema = z.object({
  token: z.string().min(6),
  clientName: z.string().min(1).max(80),
  clientContact: z.string().min(3).max(120),
  preferredDate: z.string().max(40).optional(),
  message: z.string().max(600).optional(),
  designName: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Please fill in your name and contact." }, { status: 400 });
  const b = parsed.data;

  const session = await prisma.clientSession.findUnique({
    where: { shareToken: b.token },
    select: { id: true, studioId: true, studio: { select: { bookingEnabled: true } } },
  });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!session.studio.bookingEnabled) return NextResponse.json({ error: "Bookings are closed." }, { status: 403 });

  await prisma.booking.create({
    data: {
      studioId: session.studioId,
      sessionId: session.id,
      clientName: b.clientName,
      clientContact: b.clientContact,
      preferredDate: b.preferredDate,
      message: b.message,
      designName: b.designName,
      status: "requested",
    },
  });

  return NextResponse.json({ ok: true });
}
