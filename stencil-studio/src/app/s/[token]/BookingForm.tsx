"use client";

import { useState } from "react";

export default function BookingForm({ token, studioName, depositHint }: { token: string; studioName: string; depositHint?: string | null }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          clientName: fd.get("clientName"),
          clientContact: fd.get("clientContact"),
          preferredDate: fd.get("preferredDate") || undefined,
          message: fd.get("message") || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="card" style={{ textAlign: "center", borderColor: "var(--gold)" }}>
        <h3 className="serif" style={{ fontSize: "1.5rem", fontWeight: 400 }}>Request sent ✓</h3>
        <p className="muted" style={{ marginTop: ".5rem" }}>{studioName} will be in touch to lock in your appointment.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card">
      <h3 className="serif" style={{ fontSize: "1.5rem", fontWeight: 400, marginBottom: ".3rem" }}>Love it? Book it.</h3>
      <p className="muted" style={{ fontSize: ".9rem", marginBottom: "1.1rem", fontWeight: 300 }}>
        Request an appointment with {studioName}.{depositHint ? ` ${depositHint}` : ""}
      </p>
      <div style={{ display: "grid", gap: ".2rem", gridTemplateColumns: "1fr 1fr" }} className="bk-grid">
        <label className="field"><span className="label">Your name</span><input className="input" name="clientName" required /></label>
        <label className="field"><span className="label">Email or phone</span><input className="input" name="clientContact" required /></label>
      </div>
      <label className="field"><span className="label">Preferred date (optional)</span><input className="input" name="preferredDate" placeholder="e.g. weekend of the 12th" /></label>
      <label className="field"><span className="label">Anything to add? (optional)</span><textarea className="textarea" name="message" placeholder="Placement, size, questions…" /></label>
      {error && <p style={{ color: "var(--bad)", fontSize: ".85rem", marginBottom: ".6rem" }}>{error}</p>}
      <button type="submit" className="btn btn-solid btn-block btn-lg" disabled={busy}>{busy ? "Sending…" : "Request appointment"}</button>
      <style>{`@media(max-width:520px){.bk-grid{grid-template-columns:1fr !important}}`}</style>
    </form>
  );
}
