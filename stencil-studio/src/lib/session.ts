import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Studio } from "@prisma/client";

export type SessionUser = { id: string; studioId: string; role: string; email?: string | null; name?: string | null };

/** For server components/actions in the app area: require a logged-in studio. */
export async function requireStudio(): Promise<{ user: SessionUser; studio: Studio }> {
  const session = await auth();
  if (!session?.user?.studioId) redirect("/login");
  const studio = await prisma.studio.findUnique({ where: { id: session.user.studioId } });
  if (!studio) redirect("/login");
  return { user: session.user as SessionUser, studio };
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return base || "studio";
}
