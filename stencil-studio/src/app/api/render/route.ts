import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isActive } from "@/lib/plans";
import { getProvider, isMock, studioCreds, tryOnPrompt } from "@/lib/render";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().optional(),
  clientName: z.string().max(80).optional(),
  clientContact: z.string().max(120).optional(),
  consent: z.boolean().optional(),
  photoUrl: z.string().url(),
  compositeUrl: z.string().url(),
  designName: z.string().max(80).optional(),
  placement: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const studioId = session.user.studioId;

  const studio = await prisma.studio.findUnique({ where: { id: studioId } });
  if (!studio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isActive(studio.subscriptionStatus)) {
    return NextResponse.json({ error: "Your subscription is inactive.", code: "inactive" }, { status: 402 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const b = parsed.data;

  // Reuse or create the client session.
  let sessionId = b.sessionId;
  if (sessionId) {
    const owned = await prisma.clientSession.findFirst({ where: { id: sessionId, studioId } });
    if (!owned) return NextResponse.json({ error: "session not found" }, { status: 404 });
  } else {
    const cs = await prisma.clientSession.create({
      data: {
        studioId,
        clientName: b.clientName,
        clientContact: b.clientContact,
        consent: b.consent ?? false,
        photoUrl: b.photoUrl,
      },
    });
    sessionId = cs.id;
  }

  const render = await prisma.render.create({
    data: {
      studioId,
      sessionId,
      status: "queued",
      designName: b.designName,
      bodyUrl: b.photoUrl,
      compositeUrl: b.compositeUrl,
      placement: (b.placement ?? undefined) as Prisma.InputJsonValue | undefined,
      prompt: tryOnPrompt(b.designName),
      provider: isMock() ? "mock" : "higgsfield",
    },
  });

  // Dev mock: the composite IS the result.
  if (isMock()) {
    await prisma.render.update({ where: { id: render.id }, data: { status: "completed", resultUrl: b.compositeUrl } });
    return NextResponse.json({ renderId: render.id, sessionId, status: "completed" });
  }

  const creds = await studioCreds(studioId);
  if (!creds) {
    await prisma.render.update({ where: { id: render.id }, data: { status: "failed", error: "AI key not connected" } });
    return NextResponse.json({ error: "Connect your AI key in Settings first.", code: "no_key" }, { status: 400 });
  }

  try {
    const submit = await getProvider().submit(
      { prompt: render.prompt!, imageUrls: [b.compositeUrl] },
      creds
    );
    await prisma.render.update({
      where: { id: render.id },
      data: { status: "processing", providerRequestId: submit.requestId, providerStatusUrl: submit.statusUrl },
    });
    return NextResponse.json({ renderId: render.id, sessionId, status: "processing" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "submit failed";
    await prisma.render.update({ where: { id: render.id }, data: { status: "failed", error: msg } });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
