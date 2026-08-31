"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { storeBuffer } from "@/lib/storage";

const brandSchema = z.object({
  name: z.string().min(2).max(60),
  tagline: z.string().max(80),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #d24b3f"),
  depositHint: z.string().max(80),
});

export type FormState = { ok?: boolean; error?: string };

export async function saveBrandingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { studio } = await requireStudio();
  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline"),
    accentColor: formData.get("accentColor"),
    depositHint: formData.get("depositHint") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const bookingEnabled = formData.get("bookingEnabled") === "on";

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > 2_000_000) return { error: "Logo must be under 2 MB." };
    const buf = Buffer.from(await logo.arrayBuffer());
    const stored = await storeBuffer(buf, { filename: logo.name || "logo.png", contentType: logo.type || "image/png" });
    logoUrl = stored.url;
  }

  await prisma.studio.update({
    where: { id: studio.id },
    data: { ...parsed.data, bookingEnabled, ...(logoUrl ? { logoUrl } : {}) },
  });
  revalidatePath("/app/settings");
  return { ok: true };
}

const keySchema = z.object({
  hfKeyId: z.string().min(4, "Enter your Key ID"),
  hfKeySecret: z.string().min(8, "Enter your Key Secret"),
});

export async function connectKeyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { studio } = await requireStudio();
  const parsed = keySchema.safeParse({
    hfKeyId: formData.get("hfKeyId"),
    hfKeySecret: formData.get("hfKeySecret"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  await prisma.studio.update({
    where: { id: studio.id },
    data: {
      hfKeyId: parsed.data.hfKeyId.trim(),
      hfKeySecretEnc: encryptSecret(parsed.data.hfKeySecret.trim()),
      hfConnected: true,
    },
  });
  revalidatePath("/app/settings");
  return { ok: true };
}

export async function disconnectKeyAction() {
  const { studio } = await requireStudio();
  await prisma.studio.update({
    where: { id: studio.id },
    data: { hfKeyId: null, hfKeySecretEnc: null, hfConnected: false },
  });
  revalidatePath("/app/settings");
}
