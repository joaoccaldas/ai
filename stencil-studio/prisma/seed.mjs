// Seed a demo studio you can log in to immediately.
//   email: demo@stencil.studio   password: demo12345
// Run: npm run db:seed   (idempotent)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "demo@stencil.studio";

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log("Demo already seeded — nothing to do.");
  process.exit(0);
}

const studio = await prisma.studio.create({
  data: {
    name: "Ironside Tattoo Co.",
    slug: "ironside-demo",
    plan: "studio",
    subscriptionStatus: "trialing",
    trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
    accentColor: "#d24b3f",
    tagline: "See it before you ink",
    depositHint: "A £50 deposit secures your slot",
  },
});

await prisma.user.create({
  data: {
    email,
    name: "Demo Owner",
    passwordHash: await bcrypt.hash("demo12345", 10),
    studioId: studio.id,
    role: "owner",
  },
});

const rose =
  "<path d='M100 92 C90 82 74 86 78 100 C66 94 58 110 72 118 C63 130 76 144 90 135 C95 149 116 149 121 135 C137 144 150 128 140 116 C154 108 148 90 133 94 C138 78 118 74 111 86 C108 79 100 80 100 92 Z'/><path d='M100 135 C100 152 98 168 108 185'/>";
const roseUrl =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none' stroke='#161616' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'>${rose}</svg>`
  );

await prisma.design.create({
  data: { studioId: studio.id, name: "Fine-line rose", imageUrl: roseUrl, kind: "flash" },
});

console.log("Seeded demo studio.\n  Login:  demo@stencil.studio  /  demo12345");
process.exit(0);
