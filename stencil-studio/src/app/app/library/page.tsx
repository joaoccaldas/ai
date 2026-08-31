import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";
import LibraryClient from "./LibraryClient";
import { deleteDesignAction } from "./actions";

export const metadata = { title: "Library — Stencil Studio" };

export default async function LibraryPage() {
  const { studio } = await requireStudio();
  const designs = await prisma.design.findMany({ where: { studioId: studio.id }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", marginBottom: ".4rem" }}>Your flash library</h1>
      <p className="muted" style={{ marginBottom: "1.4rem", fontWeight: 300 }}>
        Upload your artists&apos; designs. Clients try these on in the studio kiosk.
      </p>

      <div style={{ marginBottom: "1.6rem" }}><LibraryClient /></div>

      {designs.length === 0 ? (
        <div className="card muted">No designs yet. Add your first above — the built-in flash set is always available in try-ons too.</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
          {designs.map((d) => (
            <div key={d.id} className="card" style={{ padding: ".6rem", textAlign: "center" }}>
              <div style={{ aspectRatio: "1", background: "var(--bg)", borderRadius: 8, display: "grid", placeItems: "center", overflow: "hidden" }}>
                <img src={d.imageUrl} alt={d.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ fontSize: ".82rem", margin: ".5rem 0 .3rem" }}>{d.name}</div>
              <form action={deleteDesignAction}>
                <input type="hidden" name="id" value={d.id} />
                <button className="btn btn-ghost btn-sm">Remove</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
