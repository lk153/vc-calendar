"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/rbac";

const upsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(240),
  floor: z.string().max(60).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(1000),
  amenities: z.string().optional(),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
});

export async function upsertLocationAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const data = upsertSchema.parse(Object.fromEntries(fd));
  const amenities = (data.amenities ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  await db.$transaction(async (tx) => {
    const created = data.id
      ? await tx.location.update({
          where: { id: data.id },
          data: { ...data, amenities, floor: data.floor ?? null },
        })
      : await tx.location.create({ data: { ...data, amenities, floor: data.floor ?? null, id: undefined } });
    await writeAudit(tx, { actorId: admin.id, entity: "Location", entityId: created.id, action: data.id ? "update" : "create" });
  });

  revalidatePath("/admin/locations");
  redirect(`/admin/locations`);
}

export async function toggleLocationAction(id: string) {
  const admin = await requireAdmin();
  const loc = await db.location.findUnique({ where: { id } });
  if (!loc) return;
  await db.$transaction(async (tx) => {
    await tx.location.update({ where: { id }, data: { active: !loc.active } });
    await writeAudit(tx, { actorId: admin.id, entity: "Location", entityId: id, action: loc.active ? "deactivate" : "activate" });
  });
  revalidatePath("/admin/locations");
}
