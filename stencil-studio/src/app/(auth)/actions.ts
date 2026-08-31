"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { slugify } from "@/lib/session";
import { TRIAL_DAYS } from "@/lib/plans";

export type ActionState = { error?: string };

const signupSchema = z.object({
  studioName: z.string().min(2, "Studio name is too short").max(60),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const taken = await prisma.studio.findUnique({ where: { slug } });
    if (!taken) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    studioName: formData.get("studioName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const { studioName, email, password } = parsed.data;
  const lower = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) return { error: "An account with that email already exists." };

  const studio = await prisma.studio.create({
    data: {
      name: studioName,
      slug: await uniqueSlug(studioName),
      plan: "studio",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
    },
  });
  await prisma.user.create({
    data: {
      email: lower,
      passwordHash: await bcrypt.hash(password, 10),
      studioId: studio.id,
      role: "owner",
    },
  });

  // Signs in and redirects to /app (throws a redirect on success).
  await signIn("credentials", { email: lower, password, redirectTo: "/app" });
  return {};
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    await signIn("credentials", { email, password, redirectTo: "/app" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // re-throw redirects
  }
}
