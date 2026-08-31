import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { integrations, missingRequired } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deploy sanity check: DB connectivity + which integrations are configured.
export async function GET() {
  const missing = missingRequired();
  let db = false;
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db error";
  }

  const ok = db && missing.length === 0;
  return NextResponse.json(
    { ok, db, dbError, missingRequired: missing, integrations: integrations() },
    { status: ok ? 200 : 503 }
  );
}
