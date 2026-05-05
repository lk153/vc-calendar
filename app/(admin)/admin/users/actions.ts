"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/rbac";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  username: z.string().min(2).max(60),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]),
});

export async function createUserAction(fd: FormData) {
  const admin = await requireAdmin();
  const data = createSchema.parse(Object.fromEntries(fd));
  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name: data.name, email: data.email, username: data.username, role: data.role, passwordHash },
    });
    await writeAudit(tx, { actorId: admin.id, entity: "User", entityId: u.id, action: "create" });
  });
  revalidatePath("/admin/users");
}

export async function toggleUserAction(id: string) {
  const admin = await requireAdmin();
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { active: !u.active } });
    await writeAudit(tx, { actorId: admin.id, entity: "User", entityId: id, action: u.active ? "deactivate" : "activate" });
  });
  revalidatePath("/admin/users");
}
