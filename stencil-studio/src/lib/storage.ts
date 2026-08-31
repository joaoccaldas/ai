import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Uploads must end up at a PUBLIC url — the render provider fetches them by URL.
// Production: Vercel Blob. Local dev without a token: write to /public/uploads
// and return an absolute APP_URL (only reachable by the provider if APP_URL is
// publicly tunnelled; otherwise use RENDER_PROVIDER=mock in dev).

export type StoredFile = { url: string };

export async function storeBuffer(
  buf: Buffer,
  opts: { filename: string; contentType: string }
): Promise<StoredFile> {
  const safe = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${opts.filename}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${safe}`, buf, {
      access: "public",
      contentType: opts.contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }

  // Local fallback
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safe), buf);
  const base = process.env.APP_URL || "http://localhost:3000";
  return { url: `${base}/uploads/${safe}` };
}

export async function storeDataUrl(dataUrl: string, filename: string): Promise<StoredFile> {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) throw new Error("expected a data: URL");
  return storeBuffer(Buffer.from(m[2], "base64"), { filename, contentType: m[1] });
}
