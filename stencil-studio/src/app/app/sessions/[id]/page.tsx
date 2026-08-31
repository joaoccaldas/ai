import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";
import ShareBar from "./ShareBar";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { studio } = await requireStudio();
  const session = await prisma.clientSession.findFirst({
    where: { id, studioId: studio.id },
    include: { renders: { orderBy: { createdAt: "desc" } } },
  });
  if (!session) notFound();

  async function deleteSession() {
    "use server";
    const { studio } = await requireStudio();
    await prisma.clientSession.deleteMany({ where: { id, studioId: studio.id } });
    redirect("/app");
  }

  const done = session.renders.filter((r) => r.status === "completed" && r.resultUrl);

  return (
    <div>
      <Link href="/app" className="navlink" style={{ fontSize: ".8rem" }}>← Dashboard</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", margin: ".6rem 0 1.4rem" }}>
        <div>
          <h1 className="h-display" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>{session.clientName || "Walk-in"}</h1>
          <p className="faint" style={{ fontSize: ".82rem" }}>
            {new Date(session.createdAt).toLocaleString()}
            {session.clientContact ? ` · ${session.clientContact}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link href="/app/try" className="btn btn-solid btn-sm">＋ New try-on</Link>
          <form action={deleteSession}><button className="btn btn-ghost btn-sm">Delete</button></form>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.4rem" }}>
        <span className="label">Share with the client</span>
        <ShareBar token={session.shareToken} />
      </div>

      {done.length === 0 ? (
        <div className="card muted">No completed renders in this session yet.</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
          {done.map((r) => (
            <figure key={r.id} className="card" style={{ padding: ".5rem" }}>
              <img src={r.resultUrl!} alt={r.designName || "render"} style={{ width: "100%", borderRadius: 8 }} />
              <figcaption style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginTop: ".4rem" }}>
                <span>{r.designName || "Design"}</span>
                <a href={r.resultUrl!} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>Open</a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
