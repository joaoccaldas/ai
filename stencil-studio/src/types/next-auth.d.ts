import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      studioId: string;
      role: string;
    } & DefaultSession["user"];
  }
  interface User {
    studioId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    studioId?: string;
    role?: string;
  }
}
