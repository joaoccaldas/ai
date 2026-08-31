import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { higgsfieldProvider } from "./higgsfield";
import type { HfCreds, RenderProvider } from "./types";

export * from "./types";

export function isMock(): boolean {
  return process.env.RENDER_PROVIDER === "mock";
}

export function getProvider(): RenderProvider {
  // Only higgsfield is implemented today; the interface is provider-agnostic so
  // another image-edit backend can be dropped in here.
  return higgsfieldProvider;
}

/** Resolve a studio's decrypted Higgsfield credentials, or null if not connected. */
export async function studioCreds(studioId: string): Promise<HfCreds | null> {
  const s = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { hfKeyId: true, hfKeySecretEnc: true, hfConnected: true },
  });
  if (!s?.hfConnected || !s.hfKeyId || !s.hfKeySecretEnc) return null;
  return {
    keyId: s.hfKeyId,
    keySecret: decryptSecret(s.hfKeySecretEnc),
    base: process.env.HIGGSFIELD_API_BASE || "https://platform.higgsfield.ai",
  };
}

/** The instruction that turns a placement composite into a realistic tattoo. */
export function tryOnPrompt(designName?: string): string {
  return (
    "This photo shows a tattoo design overlaid on a person's skin. " +
    "Transform that overlaid design into a REAL tattoo on the skin: keep its exact " +
    "position, size, orientation and shape, but make the ink sit in the skin — " +
    "following the body's curvature, matching the photo's lighting and shadows, with " +
    "subtle skin translucency and a healed matte finish so colours are slightly muted. " +
    "Do not move, resize, crop or restyle the design" +
    (designName ? ` (a ${designName})` : "") +
    ". Keep the body, pose, framing and background identical. Photorealistic, high detail."
  );
}
