import Link from "next/link";
import { PLAN, TRIAL_DAYS } from "@/lib/plans";

export default function Landing() {
  return (
    <main>
      {/* nav */}
      <header className="topbar">
        <Link href="/" className="brand">STEN<b>·</b>CIL <span style={{ fontSize: ".7rem", letterSpacing: ".2em", color: "var(--muted)" }}>STUDIO</span></Link>
        <nav style={{ marginLeft: "auto", display: "flex", gap: "1.4rem", alignItems: "center" }}>
          <Link href="#how" className="navlink">How it works</Link>
          <Link href="#pricing" className="navlink">Pricing</Link>
          <Link href="/login" className="navlink">Sign in</Link>
          <Link href="/signup" className="btn btn-solid btn-sm">Start free trial</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="wrap" style={{ padding: "clamp(3rem,8vw,6rem) 0 clamp(2rem,5vw,4rem)" }}>
        <div style={{ display: "grid", gap: "clamp(1.5rem,4vw,3rem)", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,.85fr)", alignItems: "center" }} className="hero-grid">
          <div>
            <div className="kicker">AI tattoo try-on · for tattoo studios</div>
            <h1 className="h-display" style={{ fontSize: "clamp(2.4rem,6vw,4.6rem)", marginTop: "1.2rem" }}>
              Let clients see the tattoo<br /><span style={{ color: "var(--gold)" }}>on their own skin</span> — before the needle.
            </h1>
            <p className="muted" style={{ fontSize: "1.1rem", marginTop: "1.4rem", maxWidth: "52ch", fontWeight: 300 }}>
              A white-label kiosk for your shop. Snap the client&apos;s photo, drop on a design from your
              artists&apos; flash, and generate a photorealistic preview that wraps to their body — then
              turn it into a booking.
            </p>
            <div style={{ display: "flex", gap: ".7rem", marginTop: "2rem", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn btn-solid btn-lg">Start {TRIAL_DAYS}-day free trial</Link>
              <Link href="#how" className="btn btn-ghost btn-lg">See how it works</Link>
            </div>
            <p className="faint" style={{ fontSize: ".8rem", marginTop: "1rem" }}>
              Bring your own AI key · no per-render fees from us · cancel anytime.
            </p>
          </div>
          <div style={{ position: "relative" }}>
            <img src="/demo-render.jpg" alt="A koi tattoo previewed on a forearm" style={{ width: "100%", borderRadius: 16, border: "1px solid var(--line)", boxShadow: "0 40px 80px -40px rgba(0,0,0,.8)" }} />
            <span className="badge" style={{ position: "absolute", left: 14, bottom: 14, background: "var(--bg-2)" }}>AI preview · real photo</span>
          </div>
        </div>
        <style>{`@media(max-width:820px){.hero-grid{grid-template-columns:1fr !important}}`}</style>
      </section>

      {/* value props */}
      <section className="wrap" style={{ paddingBottom: "3rem" }}>
        <div className="grid-cards">
          {[
            ["Close more bookings", "When a client sees it on themselves, hesitation drops. Turn the preview into a booking and a deposit on the spot."],
            ["Sell your artists' work", "Upload each artist's flash. Clients try that shop's designs — not generic clip-art — so the preview sells the artist."],
            ["Your brand, on an iPad", "White-label kiosk: your name, your logo, your colours. Looks like your studio built it."],
          ].map(([h, p]) => (
            <div className="card" key={h}>
              <h3 className="serif" style={{ fontSize: "1.4rem", fontWeight: 400, marginBottom: ".5rem" }}>{h}</h3>
              <p className="muted" style={{ fontWeight: 300 }}>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="wrap" style={{ padding: "3rem 0" }}>
        <div className="kicker">How it works</div>
        <h2 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", margin: "1rem 0 2rem" }}>Four steps at the counter.</h2>
        <div className="grid-cards">
          {[
            ["1", "Snap or upload", "Take a photo of the placement — forearm, shoulder, calf — right on the kiosk."],
            ["2", "Place the design", "Pick from your flash library, drag it onto the skin, size and angle it."],
            ["3", "Generate", "One tap renders a photoreal tattoo that follows the body and the light."],
            ["4", "Share & book", "Save to the client&apos;s gallery, text them the mockup, take the deposit."],
          ].map(([n, h, p]) => (
            <div className="card" key={n}>
              <div className="serif" style={{ fontSize: "2rem", color: "var(--accent)" }}>{n}</div>
              <h3 style={{ fontSize: "1.05rem", margin: ".3rem 0 .4rem" }}>{h}</h3>
              <p className="muted" style={{ fontSize: ".92rem", fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: p }} />
            </div>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="wrap" style={{ padding: "3rem 0 5rem" }}>
        <div className="kicker">Pricing</div>
        <h2 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", margin: "1rem 0 2rem" }}>One simple licence.</h2>
        <div style={{ maxWidth: 460 }}>
          <div className="card" style={{ borderColor: "var(--gold)" }}>
            <div className="badge warn">Most popular</div>
            <h3 className="serif" style={{ fontSize: "1.8rem", fontWeight: 400, margin: ".8rem 0 .2rem" }}>{PLAN.name}</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: ".3rem" }}>
              <span className="serif" style={{ fontSize: "3rem" }}>{PLAN.priceLabel}</span>
              <span className="muted">{PLAN.period}</span>
            </div>
            <p className="muted" style={{ fontWeight: 300, margin: ".6rem 0 1.2rem" }}>{PLAN.blurb}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.4rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {PLAN.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: ".6rem", fontWeight: 300 }}>
                  <span style={{ color: "var(--gold)" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn btn-solid btn-block btn-lg">Start {TRIAL_DAYS}-day free trial</Link>
            <p className="faint" style={{ fontSize: ".78rem", marginTop: ".8rem", textAlign: "center" }}>
              You connect your own AI (Higgsfield) key — render costs are billed to you at cost, by them.
            </p>
          </div>
        </div>
      </section>

      <footer className="hairline">
        <div className="wrap" style={{ padding: "2rem 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <span className="brand" style={{ fontSize: "1rem" }}>STEN<b>·</b>CIL STUDIO</span>
          <span className="faint" style={{ fontSize: ".8rem" }}>A concept product · designs are for visualisation only.</span>
        </div>
      </footer>
    </main>
  );
}
