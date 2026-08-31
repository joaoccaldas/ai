import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { studioCreds } from "@/lib/render";
import { higgsfieldTest } from "@/lib/render/higgsfield";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.studioId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await studioCreds(session.user.studioId);
  if (!creds) return NextResponse.json({ ok: false, message: "No AI key connected." }, { status: 400 });

  const result = await higgsfieldTest(creds);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
