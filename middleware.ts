import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|api/auth|favicon.ico|sw.js|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json|webmanifest)$).*)",
  ],
};
