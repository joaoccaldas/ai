import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProvider, studioCreds } from "@/lib/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const render = await prisma.render.findFirst({ where: { id, studioId: session.user.studioId } });
  if (!render) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Terminal or non-provider states: return as-is.
  if (render.status === "completed" || render.status === "failed" || render.provider === "mock") {
    return NextResponse.json({ status: render.status, resultUrl: render.resultUrl, error: render.error });
  }

  const creds = await studioCreds(render.studioId);
  if (!creds || !render.providerRequestId) {
    return NextResponse.json({ status: render.status, resultUrl: render.resultUrl, error: render.error });
  }

  try {
    const poll = await getProvider().poll(
      { requestId: render.providerRequestId, statusUrl: render.providerStatusUrl ?? undefined },
      creds
    );
    if (poll.status === "completed" || poll.status === "failed") {
      await prisma.render.update({
        where: { id: render.id },
        data: { status: poll.status, resultUrl: poll.resultUrl, error: poll.error },
      });
    } else if (poll.status !== render.status) {
      await prisma.render.update({ where: { id: render.id }, data: { status: poll.status } });
    }
    return NextResponse.json({ status: poll.status, resultUrl: poll.resultUrl, error: poll.error });
  } catch (e) {
    return NextResponse.json({ status: "processing", error: e instanceof Error ? e.message : "poll failed" });
  }
}
