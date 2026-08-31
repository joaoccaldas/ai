"use server";

import { revalidatePath } from "next/cache";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";
import { storeBuffer } from "@/lib/storage";

export type FormState = { ok?: boolean; error?: string };

export async function uploadDesignAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { studio } = await requireStudio();
  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  if (file.size > 8_000_000) return { error: "Image must be under 8 MB." };
  if (!file.type.startsWith("image/")) return { error: "That isn't an image." };

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await storeBuffer(buf, { filename: file.name || "design.png", contentType: file.type });
  await prisma.design.create({
    data: {
      studioId: studio.id,
      name: name || file.name.replace(/\.[^.]+$/, "") || "Design",
      imageUrl: stored.url,
      kind: "upload",
    },
  });
  revalidatePath("/app/library");
  return { ok: true };
}

export async function deleteDesignAction(formData: FormData) {
  const { studio } = await requireStudio();
  const id = String(formData.get("id") ?? "");
  await prisma.design.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/library");
}
