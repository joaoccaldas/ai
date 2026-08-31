import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await prisma.clientSession.findUnique({
    where: { shareToken: token },
    include: { studio: true, renders: { where: { status: "completed" }, orderBy: { createdAt: "desc" } } },
  });
  if (!session) notFound();
  const { studio } = session;

  return (
    <main style={{ minHeight: "100dvh", ["--accent" as string]: studio.accentColor }}>
      <header className="topbar" style={{ justifyContent: "center", gap: ".8rem" }}>
        {studio.logoUrl ? (
          <img src={studio.logoUrl} alt={studio.name} style={{ height: 30, width: "auto" }} />
        ) : (
          <span className="brand">{studio.name}</span>
        )}
      </header>

      <div className="wrap" style={{ padding: "clamp(2rem,6vw,4rem) 0" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="kicker" style={{ justifyContent: "center" }}>Your tattoo preview</div>
          <h1 className="h-display" style={{ fontSize: "clamp(2rem,6vw,3.4rem)", marginTop: ".6rem" }}>
            {session.clientName ? `${session.clientName}, here's the look` : "Here's the look"}
          </h1>
          <p className="muted" style={{ marginTop: ".6rem" }}>{studio.tagline}</p>
        </div>

        {session.renders.length === 0 ? (
          <p className="card muted" style={{ textAlign: "center" }}>Your preview is being prepared — check back shortly.</p>
        ) : (
          <div style={{ display: "grid", gap: "1.2rem", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            {session.renders.map((r) => (
              <figure key={r.id} className="card" style={{ padding: ".6rem" }}>
                <img src={r.resultUrl!} alt={r.designName || "tattoo preview"} style={{ width: "100%", borderRadius: 8 }} />
                {r.designName && <figcaption style={{ textAlign: "center", marginTop: ".5rem", fontSize: ".85rem" }} className="muted">{r.designName}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {studio.bookingEnabled && session.renders.length > 0 && (
          <div style={{ maxWidth: 560, margin: "2.5rem auto 0" }}>
            <BookingForm token={session.shareToken} studioName={studio.name} depositHint={studio.depositHint} />
          </div>
        )}

        <p className="faint" style={{ textAlign: "center", marginTop: "2.5rem", fontSize: ".8rem" }}>
          A preview by {studio.name}. Final results vary — book a consultation to make it yours.
        </p>
      </div>
    </main>
  );
}
