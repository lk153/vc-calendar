import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "ADMIN" | "USER"; timezone: string } & DefaultSession["user"];
  }
  interface User {
    role?: "ADMIN" | "USER";
    timezone?: string;
  }
}

const credSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(raw) {
        const parsed = credSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findFirst({
          where: { OR: [{ username: parsed.data.username }, { email: parsed.data.username }] },
        });
        if (!user || !user.passwordHash || !user.active) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, timezone: user.timezone };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await db.user.findUnique({ where: { email: user.email! } });
        if (!existing || !existing.active) return false;
        (user as { id?: string; role?: "ADMIN" | "USER"; timezone?: string }).id = existing.id;
        (user as { role?: "ADMIN" | "USER" }).role = existing.role;
        (user as { timezone?: string }).timezone = existing.timezone;
      }
      return true;
    },
  },
});
