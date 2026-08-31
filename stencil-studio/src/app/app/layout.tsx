import Link from "next/link";
import { requireStudio } from "@/lib/session";
import { signOut } from "@/auth";
import { isActive } from "@/lib/plans";
import Nav from "./Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { studio } = await requireStudio();

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const trialLeft =
    studio.subscriptionStatus === "trialing" && studio.trialEndsAt
      ? Math.max(0, Math.ceil((studio.trialEndsAt.getTime() - Date.now()) / 86_400_000))
      : null;

  return (
    <div>
      <header className="topbar">
        <Link href="/app" className="brand">STEN<b>·</b>CIL</Link>
        <Nav signOut={doSignOut} />
      </header>

      {!isActive(studio.subscriptionStatus) && (
        <div style={{ background: "color-mix(in srgb, var(--accent) 16%, var(--bg))", borderBottom: "1px solid var(--line)" }}>
          <div className="wrap" style={{ padding: ".7rem 0", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: ".88rem" }}>Your subscription is inactive — start it to keep running client try-ons.</span>
            <Link href="/app/settings#billing" className="btn btn-solid btn-sm">Start subscription</Link>
          </div>
        </div>
      )}
      {trialLeft !== null && (
        <div style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--line)" }}>
          <div className="wrap" style={{ padding: ".55rem 0", display: "flex", gap: "1rem", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: ".82rem" }}>
              Free trial — {trialLeft} day{trialLeft === 1 ? "" : "s"} left.
            </span>
            <Link href="/app/settings#billing" className="navlink" style={{ color: "var(--gold)" }}>Add billing →</Link>
          </div>
        </div>
      )}

      <main className="wrap" style={{ padding: "2rem 0 4rem" }}>{children}</main>
    </div>
  );
}
