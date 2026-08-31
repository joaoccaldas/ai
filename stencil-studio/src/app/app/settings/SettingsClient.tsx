"use client";

import { useActionState } from "react";
import { saveBrandingAction, connectKeyAction, disconnectKeyAction } from "./actions";

type Props = {
  name: string;
  tagline: string;
  accentColor: string;
  logoUrl: string | null;
  hfConnected: boolean;
  hfKeyIdMasked: string | null;
  subscriptionStatus: string;
  stripeConfigured: boolean;
};

function Saved({ ok }: { ok?: boolean }) {
  if (!ok) return null;
  return <span className="badge good" style={{ marginLeft: ".6rem" }}>Saved</span>;
}

export default function SettingsClient(p: Props) {
  const [brand, brandAction, brandPending] = useActionState(saveBrandingAction, {});
  const [key, keyAction, keyPending] = useActionState(connectKeyAction, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", maxWidth: 640 }}>
      {/* branding */}
      <section id="brand" className="card">
        <h2 className="serif" style={{ fontSize: "1.3rem", fontWeight: 400, marginBottom: ".2rem" }}>
          Branding <Saved ok={brand.ok} />
        </h2>
        <p className="muted" style={{ fontSize: ".88rem", marginBottom: "1.2rem", fontWeight: 300 }}>
          How your kiosk and client share-pages look.
        </p>
        <form action={brandAction}>
          <label className="field">
            <span className="label">Studio name</span>
            <input className="input" name="name" defaultValue={p.name} required />
          </label>
          <label className="field">
            <span className="label">Tagline</span>
            <input className="input" name="tagline" defaultValue={p.tagline} />
          </label>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <label className="field" style={{ flex: "0 0 auto" }}>
              <span className="label">Accent colour</span>
              <input className="input" name="accentColor" type="color" defaultValue={p.accentColor} style={{ width: 64, height: 42, padding: 4 }} />
            </label>
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              <span className="label">Logo {p.logoUrl && <span className="faint">(uploaded)</span>}</span>
              <input className="input" name="logo" type="file" accept="image/*" />
            </label>
          </div>
          {brand.error && <p style={{ color: "var(--bad)", fontSize: ".85rem" }}>{brand.error}</p>}
          <button className="btn btn-solid" disabled={brandPending}>{brandPending ? "Saving…" : "Save branding"}</button>
        </form>
      </section>

      {/* AI key */}
      <section id="ai" className="card">
        <h2 className="serif" style={{ fontSize: "1.3rem", fontWeight: 400, marginBottom: ".2rem" }}>AI connection</h2>
        <p className="muted" style={{ fontSize: ".88rem", marginBottom: "1.2rem", fontWeight: 300 }}>
          Stencil renders with <b>your</b> Higgsfield account, so render costs are billed to you at cost.
          Create a key at{" "}
          <a href="https://cloud.higgsfield.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>cloud.higgsfield.ai</a>{" "}
          → API. Your secret is encrypted at rest.
        </p>
        {p.hfConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span className="badge good">Connected</span>
            <span className="muted" style={{ fontSize: ".85rem" }}>Key ID {p.hfKeyIdMasked}</span>
            <form action={disconnectKeyAction} style={{ marginLeft: "auto" }}>
              <button className="btn btn-ghost btn-sm">Disconnect</button>
            </form>
          </div>
        ) : (
          <form action={keyAction}>
            <label className="field">
              <span className="label">Key ID</span>
              <input className="input" name="hfKeyId" placeholder="hf_key_…" required />
            </label>
            <label className="field">
              <span className="label">Key Secret</span>
              <input className="input" name="hfKeySecret" type="password" placeholder="••••••••••••" required />
            </label>
            {key.error && <p style={{ color: "var(--bad)", fontSize: ".85rem" }}>{key.error}</p>}
            <button className="btn btn-solid" disabled={keyPending}>{keyPending ? "Connecting…" : "Connect AI key"}</button>
          </form>
        )}
      </section>

      {/* billing */}
      <section id="billing" className="card">
        <h2 className="serif" style={{ fontSize: "1.3rem", fontWeight: 400, marginBottom: ".2rem" }}>Billing</h2>
        <p className="muted" style={{ fontSize: ".88rem", marginBottom: "1.2rem", fontWeight: 300 }}>
          Status: <b style={{ color: "var(--ink)" }}>{p.subscriptionStatus}</b>
        </p>
        {!p.stripeConfigured ? (
          <p className="faint" style={{ fontSize: ".85rem" }}>
            Billing isn&apos;t configured on this deployment yet (set the Stripe keys in the environment).
          </p>
        ) : p.subscriptionStatus === "active" ? (
          <form action="/api/stripe/portal" method="post">
            <button className="btn btn-ghost">Manage billing</button>
          </form>
        ) : (
          <form action="/api/stripe/checkout" method="post">
            <button className="btn btn-solid">Start subscription</button>
          </form>
        )}
      </section>
    </div>
  );
}
