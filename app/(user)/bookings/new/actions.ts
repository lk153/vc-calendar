"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { toUtc } from "@/lib/tz";
import { ConflictError, ValidationError, createBooking } from "@/lib/bookings/service";

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  locationId: z.string().min(1),
  attendeeIds: z.string().optional(),
  allowAttendeeOverride: z.string().optional(),
});

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; kind: "validation" | "conflict" | "attendee-warn"; error: string };

export async function createBookingAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, kind: "validation", error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;
  const attendeeIds = (data.attendeeIds ?? "").split(",").filter(Boolean);

  try {
    const booking = await createBooking(
      {
        title: data.title,
        description: data.description ?? undefined,
        startsAt: toUtc(data.startsAt, user.timezone),
        endsAt: toUtc(data.endsAt, user.timezone),
        locationId: data.locationId,
        organizerId: user.id,
        attendeeIds,
        timezone: user.timezone,
      },
      { allowAttendeeConflict: data.allowAttendeeOverride === "1" }
    );
    revalidatePath("/calendar");
    revalidatePath("/calendar/resource");
    return { ok: true, id: booking.id };
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, kind: "validation", error: e.message };
    if (e instanceof ConflictError) {
      const isAttendee = e.message.toLowerCase().includes("người tham dự") || e.message.toLowerCase().includes("attendee");
      return { ok: false, kind: isAttendee ? "attendee-warn" : "conflict", error: e.message };
    }
    console.error("[createBookingAction] unhandled error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, kind: "validation", error: `Lỗi không xác định: ${msg}` };
  }
}
