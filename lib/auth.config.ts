import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/login" || pathname.startsWith("/api/auth")) return true;
      if (!auth) return false;
      if (pathname.startsWith("/admin") && auth.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/calendar", request.nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.role = (user as { role?: "ADMIN" | "USER" }).role ?? "USER";
        token.timezone = (user as { timezone?: string }).timezone ?? "UTC";
      }
      void trigger;
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        session.user.id = token.uid as string;
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
        session.user.timezone = (token.timezone as string) ?? "UTC";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
