// Central view of which environment is configured. Used by /api/health and the
// setup surfaces so a fresh deploy can tell you exactly what's missing.

const REQUIRED = ["DATABASE_URL", "AUTH_SECRET", "APP_ENCRYPTION_KEY"] as const;

export function missingRequired(): string[] {
  return REQUIRED.filter((k) => !process.env[k]);
}

export function integrations() {
  return {
    database: Boolean(process.env.DATABASE_URL),
    auth: Boolean(process.env.AUTH_SECRET),
    encryption: Boolean(process.env.APP_ENCRYPTION_KEY),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    renderProvider: process.env.RENDER_PROVIDER || "higgsfield",
  };
}
