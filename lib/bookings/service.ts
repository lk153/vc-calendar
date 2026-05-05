import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { sendBookingEmail } from "@/lib/email";
import type { BookingStatus } from "@prisma/client";

export class ConflictError extends Error {
  constructor(public detail: string) { super(detail); }
}
export class ValidationError extends Error {}

export type CreateInput = {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  locationId: string;
  organizerId: string;
  attendeeIds: string[];
  timezone: string;
};

function assertWindow(start: Date, end: Date) {
  if (end <= start) throw new ValidationError("Giờ kết thúc phải sau giờ bắt đầu");
}

function wallClockMinutes(d: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (h % 24) * 60 + m;
}

async function assertWithinHours(locationId: string, start: Date, end: Date, tz: string) {
  const loc = await db.location.findUnique({ where: { id: locationId } });
  if (!loc) throw new ValidationError("Không tìm thấy phòng");
  if (!loc.active) throw new ValidationError("Phòng đang ngưng hoạt động");
  const [oh, om] = loc.opensAt.split(":").map(Number);
  const [ch, cm] = loc.closesAt.split(":").map(Number);
  const sm = wallClockMinutes(start, tz);
  const em = wallClockMinutes(end, tz);
  if (sm < oh * 60 + om || em > ch * 60 + cm) {
    throw new ValidationError(`Ngoài giờ hoạt động (${loc.opensAt}–${loc.closesAt})`);
  }
}

export async function checkOrganizerConflict(organizerId: string, start: Date, end: Date, excludeId?: string) {
  return db.booking.findFirst({
    where: {
      organizerId,
      status: "CONFIRMED",
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      AND: [{ startsAt: { lt: end } }, { endsAt: { gt: start } }],
    },
  });
}

export async function findAttendeeConflicts(attendeeIds: string[], start: Date, end: Date, excludeId?: string) {
  if (attendeeIds.length === 0) return [];
  return db.booking.findMany({
    where: {
      status: "CONFIRMED",
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      AND: [{ startsAt: { lt: end } }, { endsAt: { gt: start } }],
      attendees: { some: { userId: { in: attendeeIds } } },
    },
    include: { attendees: { include: { user: true } } },
  });
}

export async function createBooking(input: CreateInput, opts: { allowAttendeeConflict?: boolean } = {}) {
  assertWindow(input.startsAt, input.endsAt);
  await assertWithinHours(input.locationId, input.startsAt, input.endsAt, input.timezone);

  const orgConflict = await checkOrganizerConflict(input.organizerId, input.startsAt, input.endsAt);
  if (orgConflict) throw new ConflictError("Người tổ chức đã có lịch trong khoảng thời gian này");

  const attendeeConflicts = await findAttendeeConflicts(input.attendeeIds, input.startsAt, input.endsAt);
  if (attendeeConflicts.length && !opts.allowAttendeeConflict) {
    throw new ConflictError("Một số người tham dự đang bận. Xác nhận để tiếp tục.");
  }

  try {
    const booking = await db.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          title: input.title,
          description: input.description,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          locationId: input.locationId,
          organizerId: input.organizerId,
          attendees: { create: input.attendeeIds.map((userId) => ({ userId })) },
        },
        include: { location: true, organizer: true, attendees: { include: { user: true } } },
      });
      await writeAudit(tx, {
        actorId: input.organizerId,
        entity: "Booking",
        entityId: created.id,
        action: "create",
        diff: { title: created.title, startsAt: created.startsAt, endsAt: created.endsAt, locationId: created.locationId },
      });
      return created;
    });
    void sendBookingEmail("created", booking).catch(() => {});
    return booking;
  } catch (e) {
    if (isExclusionViolation(e)) throw new ConflictError("Phòng đã được đặt vào thời gian này");
    throw e;
  }
}

export async function cancelBooking(bookingId: string, actorId: string) {
  const booking = await db.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" satisfies BookingStatus },
      include: { location: true, organizer: true, attendees: { include: { user: true } } },
    });
    await writeAudit(tx, { actorId, entity: "Booking", entityId: bookingId, action: "cancel" });
    return updated;
  });
  void sendBookingEmail("cancelled", booking).catch(() => {});
  return booking;
}

function isExclusionViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2010" ||
    (typeof err === "object" && err !== null && "meta" in err && JSON.stringify((err as { meta?: unknown }).meta ?? "").includes("23P01")) ||
    String(err).includes("booking_no_overlap");
}
