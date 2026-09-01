// Guard which URLs the server will hand to the render provider. Without this an
// authenticated user could make our server submit an arbitrary URL to the AI API.
// We only allow media we produced: our own app origin (local dev uploads) or a
// Vercel Blob host.
export function isAllowedMediaUrl(u: string): boolean {
  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;

  let appHost = "";
  try {
    if (process.env.APP_URL) appHost = new URL(process.env.APP_URL).host;
  } catch {
    /* ignore */
  }
  if (appHost && url.host === appHost) return true;
  if (/(^|\.)blob\.vercel-storage\.com$/.test(url.hostname)) return true;
  return false;
}
