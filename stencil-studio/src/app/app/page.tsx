import Link from "next/link";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  const { studio } = await requireStudio();

  const [sessionCount, renderCount, designCount, newRequests, recent] = await Promise.all([
    prisma.clientSession.count({ where: { studioId: studio.id } }),
    prisma.render.count({ where: { studioId: studio.id, status: "completed" } }),
    prisma.design.count({ where: { studioId: studio.id } }),
    prisma.booking.count({ where: { studioId: studio.id, status: "requested" } }),
    prisma.clientSession.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { renders: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const setup = [
    { done: studio.hfConnected, label: "Connect your AI (Higgsfield) key", href: "/app/settings#ai" },
    { done: designCount > 0, label: "Upload your studio's flash", href: "/app/library" },
    { done: Boolean(studio.logoUrl), label: "Add your logo & brand colour", href: "/app/settings#brand" },
  ];
  const setupLeft = setup.filter((s) => !s.done);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "1.6rem" }}>
        <div>
          <div className="kicker">{studio.name}</div>
          <h1 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", marginTop: ".5rem" }}>Studio dashboard</h1>
        </div>
        <Link href="/app/try" className="btn btn-solid btn-lg">＋ New client try-on</Link>
      </div>

      {newRequests > 0 && (
        <Link href="/app/bookings" className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.6rem", borderColor: "var(--gold)" }}>
          <span className="badge warn">{newRequests} new</span>
          <span>You have {newRequests} booking request{newRequests === 1 ? "" : "s"} waiting.</span>
          <span style={{ marginLeft: "auto", color: "var(--gold)" }}>Open bookings →</span>
        </Link>
      )}

      {setupLeft.length > 0 && (
        <div className="card" style={{ marginBottom: "1.6rem", borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)" }}>
          <div className="badge warn" style={{ marginBottom: ".8rem" }}>Finish setup</div>
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {setup.map((s) => (
              <Link key={s.label} href={s.href} style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
                <span style={{ color: s.done ? "var(--good)" : "var(--faint)" }}>{s.done ? "✓" : "○"}</span>
                <span style={{ color: s.done ? "var(--muted)" : "var(--ink)", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid-cards" style={{ marginBottom: "2rem" }}>
        <div className="card stat"><div className="v">{sessionCount}</div><div className="k">Client sessions</div></div>
        <div className="card stat"><div className="v">{renderCount}</div><div className="k">AI renders</div></div>
        <div className="card stat"><div className="v">{newRequests}</div><div className="k">Booking requests</div></div>
        <div className="card stat"><div className="v">{designCount}</div><div className="k">Your designs</div></div>
      </div>

      <h2 className="serif" style={{ fontSize: "1.3rem", fontWeight: 400, marginBottom: "1rem" }}>Recent sessions</h2>
      {recent.length === 0 ? (
        <div className="card muted">No sessions yet. Start your first client try-on.</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
          {recent.map((s) => {
            const img = s.renders[0]?.resultUrl;
            return (
              <Link key={s.id} href={`/app/sessions/${s.id}`} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ aspectRatio: "3/4", background: "#000 center/cover no-repeat", backgroundImage: img ? `url(${img})` : undefined, display: "grid", placeItems: "center" }}>
                  {!img && <span className="faint" style={{ fontSize: ".8rem" }}>No render yet</span>}
                </div>
                <div style={{ padding: ".8rem 1rem" }}>
                  <div style={{ fontSize: ".95rem" }}>{s.clientName || "Walk-in"}</div>
                  <div className="faint" style={{ fontSize: ".72rem" }}>{new Date(s.createdAt).toLocaleDateString()}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
