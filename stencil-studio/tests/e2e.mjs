/* Stencil Studio — end-to-end product test (mock render, SQLite).
   Proves the sellable loop: sign up → AI try-on → session → client share →
   booking request → studio sees the booking.
   Expects a server already running at BASE (see the runner in package/CI notes).
   Run: BASE=http://127.0.0.1:3111 node tests/e2e.mjs */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:3111";
const email = `owner+${Date.now()}@e2e.test`;
const password = "supersecret123";
const studioName = "E2E Ink Co.";

// tiny valid PNG (8x8) as a data URL, used as the fake photo + composite
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAF0lEQVR4nGP8z8Dwn4EIwESMolGF9FEIAG2eA/9C1i0nAAAAAElFTkSuQmCC";

const checks = [];
let failed = 0;
const ok = (name) => { checks.push(`PASS ${name}`); console.log(`PASS ${name}`); };
const bad = (name, e) => { failed++; checks.push(`FAIL ${name}: ${e}`); console.error(`FAIL ${name}: ${e}`); };
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, baseURL: BASE });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("pageerror:", e.message));

try {
  // 1) sign up
  await page.goto("/signup", { waitUntil: "networkidle" });
  await page.fill('input[name="studioName"]', studioName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL("**/app", { timeout: 20000 }), page.click('button[type="submit"]')]);
  assert(page.url().endsWith("/app"), "did not land on /app after signup");
  ok("sign up creates a studio and logs in");

  // 2) upload (photo + composite) via the API, using the auth cookie
  const compositeUrl = await page.evaluate(async (dataUrl) => {
    const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, filename: "composite.png" }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "upload failed");
    return j.url;
  }, PNG);
  assert(typeof compositeUrl === "string" && compositeUrl.length > 0, "no composite url");
  ok("authenticated upload returns a URL");

  // 3) render (mock provider completes synchronously)
  const render = await page.evaluate(async (compositeUrl) => {
    const r = await fetch("/api/render", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: compositeUrl, compositeUrl, designName: "Koi", consent: true, clientName: "Alex Client" }),
    });
    return { ok: r.ok, body: await r.json() };
  }, compositeUrl);
  assert(render.ok, "render request failed: " + JSON.stringify(render.body));
  assert(render.body.status === "completed", "mock render not completed: " + JSON.stringify(render.body));
  const sessionId = render.body.sessionId;
  assert(sessionId, "no sessionId");
  ok("try-on render completes and creates a client session");

  // 4) session page shows the render + a share link
  await page.goto(`/app/sessions/${sessionId}`, { waitUntil: "networkidle" });
  assert(await page.locator("img").count() >= 1, "session page has no render image");
  const shareUrl = await page.locator('input[readonly]').first().inputValue();
  const token = shareUrl.split("/s/")[1];
  assert(token, "no share token on session page");
  ok("session page renders result and a share link");

  // 5) public share page shows the render + booking form
  await page.goto(`/s/${token}`, { waitUntil: "networkidle" });
  assert((await page.content()).includes("Book it"), "share page missing booking form");
  ok("public share page shows the preview and a booking CTA");

  // 6) client requests a booking
  await page.fill('input[name="clientName"]', "Alex Client");
  await page.fill('input[name="clientContact"]', "alex@example.com");
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Request sent", { timeout: 10000 });
  ok("client can request a booking from the preview");

  // 7) studio sees the booking in the pipeline
  await page.goto("/app/bookings", { waitUntil: "networkidle" });
  assert((await page.content()).includes("Alex Client"), "booking not visible to studio");
  ok("studio sees the booking request in the pipeline");
} catch (e) {
  bad("e2e flow", e?.message || String(e));
}

await browser.close();
console.log(`\n${checks.filter((c) => c.startsWith("PASS")).length} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
