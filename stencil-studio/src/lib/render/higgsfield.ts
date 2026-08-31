import type { HfCreds, PollResult, RenderInput, RenderProvider, SubmitResult } from "./types";

// Adapter for the Higgsfield public REST API.
// Auth:   Authorization: Key <KEY_ID>:<KEY_SECRET>
// Submit: POST {base}/higgsfield-ai/popcorn/auto  (text+image → image; up to 8 image_urls)
// Poll:   GET  {status_url returned by submit}  →  { status, images: [{ url }] }
//
// The request body is wrapped in `input` (matches the official SDK). If your
// account expects a flat body, set HIGGSFIELD_BODY_MODE=flat.

const SUBMIT_PATH = "/higgsfield-ai/popcorn/auto";

function authHeader(c: HfCreds): string {
  return `Key ${c.keyId}:${c.keySecret}`;
}

// Verify a studio's key WITHOUT spending credits: send an intentionally invalid
// (empty) body. A valid key is rejected for the body (400/422) rather than for
// auth (401/403), so no job is created either way.
export async function higgsfieldTest(creds: HfCreds): Promise<{ ok: boolean; status: number; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${creds.base}${SUBMIT_PATH}`, {
      method: "POST",
      headers: { Authorization: authHeader(creds), "Content-Type": "application/json" },
      body: JSON.stringify({ input: {} }),
    });
  } catch (e) {
    return { ok: false, status: 0, message: e instanceof Error ? e.message : "network error" };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, status: res.status, message: "Key rejected — check the Key ID and Secret." };
  }
  if (res.status >= 500) {
    return { ok: false, status: res.status, message: "The AI service is unavailable right now." };
  }
  // 200/400/404/422 etc. → auth was accepted
  return { ok: true, status: res.status, message: "Connection looks good." };
}

export const higgsfieldProvider: RenderProvider = {
  name: "higgsfield",

  async submit(input: RenderInput, creds: HfCreds): Promise<SubmitResult> {
    const inner = { prompt: input.prompt, image_urls: input.imageUrls.slice(0, 8) };
    const body = process.env.HIGGSFIELD_BODY_MODE === "flat" ? inner : { input: inner };

    const res = await fetch(`${creds.base}${SUBMIT_PATH}`, {
      method: "POST",
      headers: {
        Authorization: authHeader(creds),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Higgsfield submit failed (${res.status}): ${text.slice(0, 400)}`);
    }
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Higgsfield submit returned non-JSON: ${text.slice(0, 200)}`);
    }
    const requestId = (json.request_id ?? json.id) as string | undefined;
    const statusUrl = (json.status_url ?? json.statusUrl) as string | undefined;
    if (!requestId && !statusUrl) {
      throw new Error(`Higgsfield submit missing request_id/status_url: ${text.slice(0, 200)}`);
    }
    return { requestId: requestId ?? statusUrl!, statusUrl };
  },

  async poll(ref, creds): Promise<PollResult> {
    const url = ref.statusUrl ?? `${creds.base}/requests/${ref.requestId}/status`;
    const res = await fetch(url, { headers: { Authorization: authHeader(creds) } });
    const text = await res.text();
    if (!res.ok) return { status: "failed", error: `status ${res.status}: ${text.slice(0, 200)}` };

    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text);
    } catch {
      return { status: "processing" };
    }

    const raw = String(json.status ?? "").toLowerCase();
    if (raw === "completed" || raw === "success" || raw === "succeeded") {
      const images = (json.images as Array<{ url?: string }> | undefined) ?? [];
      const single = (json.image as { url?: string } | undefined)?.url;
      const resultUrl = images[0]?.url ?? single;
      return resultUrl
        ? { status: "completed", resultUrl }
        : { status: "failed", error: "completed without an image url" };
    }
    if (raw === "failed" || raw === "nsfw" || raw === "canceled" || raw === "error") {
      return { status: "failed", error: (json.error as string) || raw };
    }
    if (raw === "in_progress" || raw === "processing" || raw === "running") return { status: "processing" };
    return { status: "queued" };
  },
};
