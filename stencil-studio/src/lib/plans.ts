// Flat software-licence billing. Studios bring their own AI key, so we charge for
// the software, not per render. One primary plan + a free trial.

export const TRIAL_DAYS = 14;

export const PLAN = {
  id: "studio",
  name: "Studio",
  priceLabel: "£49",
  period: "/mo",
  blurb: "Everything a shop needs to run AI try-ons with clients.",
  features: [
    "Unlimited AI try-on renders (your own AI key)",
    "White-label kiosk — your brand, your colours",
    "Upload your artists' flash library",
    "Client sessions, saved galleries & share links",
    "Consent capture & photo controls",
    "Unlimited staff seats",
  ],
};

export function isActive(status?: string | null): boolean {
  return status === "active" || status === "trialing";
}
