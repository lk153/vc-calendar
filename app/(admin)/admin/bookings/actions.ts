"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { cancelBooking } from "@/lib/bookings/service";

export async function adminCancelBooking(id: string) {
  const admin = await requireAdmin();
  await cancelBooking(id, admin.id);
  revalidatePath("/admin/bookings");
  revalidatePath("/calendar");
}
