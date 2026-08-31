import Link from "next/link";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";
import TryOn from "./TryOn";

export const metadata = { title: "New try-on — Stencil Studio" };

export default async function TryPage() {
  const { studio } = await requireStudio();
  const designs = await prisma.design.findMany({
    where: { studioId: studio.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, imageUrl: true },
  });
  const mock = process.env.RENDER_PROVIDER === "mock";

  return (
    <div>
      <h1 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", marginBottom: "1rem" }}>New client try-on</h1>
      {!studio.hfConnected && !mock && (
        <div className="card" style={{ marginBottom: "1.2rem", borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)" }}>
          <span className="muted" style={{ fontSize: ".9rem" }}>
            Connect your AI key to generate renders.{" "}
            <Link href="/app/settings#ai" style={{ color: "var(--gold)" }}>Go to Settings →</Link>
          </span>
        </div>
      )}
      <TryOn designs={designs} />
    </div>
  );
}
