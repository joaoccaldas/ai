import { requireStudio } from "@/lib/session";
import { stripeConfigured } from "@/lib/stripe";
import SettingsClient from "./SettingsClient";

export const metadata = { title: "Settings — Stencil Studio" };

export default async function SettingsPage() {
  const { studio } = await requireStudio();
  const masked = studio.hfKeyId ? studio.hfKeyId.slice(0, 6) + "…" + studio.hfKeyId.slice(-3) : null;

  return (
    <div>
      <h1 className="h-display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", marginBottom: "1.4rem" }}>Settings</h1>
      <SettingsClient
        name={studio.name}
        tagline={studio.tagline}
        accentColor={studio.accentColor}
        logoUrl={studio.logoUrl}
        bookingEnabled={studio.bookingEnabled}
        depositHint={studio.depositHint ?? ""}
        hfConnected={studio.hfConnected}
        hfKeyIdMasked={masked}
        subscriptionStatus={studio.subscriptionStatus}
        stripeConfigured={stripeConfigured()}
      />
    </div>
  );
}
