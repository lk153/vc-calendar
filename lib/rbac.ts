import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() { super("Unauthorized"); }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new UnauthorizedError();
  return user;
}
