import Link from "next/link";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";
import { setBookingStatus, toggleDeposit, deleteBooking } from "./actions";

export const metadata = { title: "Bookings — Stencil Studio" };

const COLUMNS: { key: string; label: string }[] = [
  { key: "requested", label: "New requests" },
  { key: "booked", label: "Booked" },
  { key: "completed", label: "Completed" },
];

function StatusButton({ id, to, label }: { id: string; to: string; label: string }) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <button className="btn btn-ghost btn-sm">{label}</button>
    </form>
  );
}

export default async function BookingsPage() {
  const { studio } = await requireStudio();
  const bookings = await prisma.booking.findMany({
    where: { studioId: studio.id, status: { not: "cancelled" } },
    orderBy: { createdAt: "desc" },
    include: { session: { select: { id: true } } },
  });

  const byStatus = (s: string) => bookings.filter((b) => b.status === s);

  return (
    <div>
      <h1 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", marginBottom: ".4rem" }}>Bookings</h1>
      <p className="muted" style={{ marginBottom: "1.6rem", fontWeight: 300 }}>
        Every client who requests an appointment from a preview lands here.
      </p>

      {bookings.length === 0 ? (
        <div className="card muted">No booking requests yet. They arrive when clients tap “Book it” on a shared preview.</div>
      ) : (
        <div style={{ display: "grid", gap: "1.2rem", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", alignItems: "start" }}>
          {COLUMNS.map((col) => {
            const items = byStatus(col.key);
            return (
              <div key={col.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".7rem" }}>
                  <h2 className="serif" style={{ fontSize: "1.15rem", fontWeight: 400 }}>{col.label}</h2>
                  <span className="badge">{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".8rem" }}>
                  {items.length === 0 && <p className="faint" style={{ fontSize: ".82rem" }}>—</p>}
                  {items.map((b) => (
                    <div key={b.id} className="card" style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}>
                        <strong>{b.clientName}</strong>
                        {b.depositPaid && <span className="badge good">Deposit</span>}
                      </div>
                      <div className="muted" style={{ fontSize: ".85rem", margin: ".2rem 0" }}>{b.clientContact}</div>
                      {b.designName && <div className="faint" style={{ fontSize: ".8rem" }}>Design: {b.designName}</div>}
                      {b.preferredDate && <div className="faint" style={{ fontSize: ".8rem" }}>Prefers: {b.preferredDate}</div>}
                      {b.message && <p style={{ fontSize: ".85rem", margin: ".5rem 0", fontWeight: 300 }}>“{b.message}”</p>}
                      <div className="faint" style={{ fontSize: ".72rem", marginTop: ".3rem" }}>{new Date(b.createdAt).toLocaleDateString()}</div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".8rem" }}>
                        {b.session && <Link href={`/app/sessions/${b.session.id}`} className="btn btn-ghost btn-sm">Preview</Link>}
                        {col.key === "requested" && <StatusButton id={b.id} to="booked" label="Mark booked" />}
                        {col.key === "booked" && (
                          <>
                            <form action={toggleDeposit}>
                              <input type="hidden" name="id" value={b.id} />
                              <button className="btn btn-ghost btn-sm">{b.depositPaid ? "Deposit ✓" : "Deposit taken"}</button>
                            </form>
                            <StatusButton id={b.id} to="completed" label="Complete" />
                          </>
                        )}
                        <form action={deleteBooking}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>✕</button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
