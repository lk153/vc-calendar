import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { formatInTz } from "@/lib/tz";
import { Icon } from "@/components/Icon";
import { StatusPill, LiveBadge } from "@/components/ui";
import { cancelBooking } from "@/lib/bookings/service";
import { revalidatePath } from "next/cache";
import { SubmitButton } from "@/components/SubmitButton";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const b = await db.booking.findUnique({
    where: { id },
    include: { location: true, organizer: true, attendees: { include: { user: true } } },
  });
  if (!b) notFound();
  const tz = user.timezone;

  async function cancel() {
    "use server";
    const u = await requireUser();
    await cancelBooking(id, u.id);
    revalidatePath("/calendar");
    redirect("/calendar");
  }

  const isOwner = b.organizerId === user.id || user.role === "ADMIN";
  const now = new Date();
  const live = b.status === "CONFIRMED" && now >= b.startsAt && now < b.endsAt;
  const past = now >= b.endsAt;

  return (
    <main className="px-md md:px-lg pt-md pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-lg max-w-3xl mx-auto w-full">
      <Link
        href="/calendar"
        className="inline-flex items-center gap-xs text-body-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-sm"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Quay lại lịch trình
      </Link>

      <section
        className={`relative overflow-hidden rounded-xl border bg-surface mb-md shadow-soft ${
          live ? "border-2 border-primary ring-1 ring-primary/20 bg-primary-container/30" : "border-outline-variant"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 w-[24rem] h-[24rem] rounded-full opacity-50"
          style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.55), transparent 72%)" }}
        />
        <div className="relative p-md md:p-lg">
          <div className="flex items-start justify-between gap-sm mb-xs">
            <span className="text-caption font-bold uppercase tracking-wider text-primary whitespace-nowrap">
              {formatInTz(b.startsAt, tz, "EEEE, dd/MM")}
            </span>
            {b.status === "CANCELLED" ? (
              <StatusPill tone="neutral" icon="event_busy">Đã hủy</StatusPill>
            ) : live ? (
              <LiveBadge />
            ) : past ? (
              <StatusPill tone="neutral" icon="check">Đã kết thúc</StatusPill>
            ) : (
              <StatusPill tone="primary" icon="check_circle">Đã xác nhận</StatusPill>
            )}
          </div>

          <h1 className="font-manrope font-bold text-headline-lg md:text-headline-xl text-on-surface leading-tight break-words">
            {b.title}
          </h1>

          <div className="mt-md flex items-center gap-sm font-manrope font-bold text-on-surface tabular-nums" style={{ fontSize: 22, lineHeight: "28px" }}>
            <Icon name="schedule" className="text-primary text-[22px]" />
            {formatInTz(b.startsAt, tz, "HH:mm")} – {formatInTz(b.endsAt, tz, "HH:mm")}
          </div>
          <div className="mt-xs flex flex-wrap items-center gap-x-sm gap-y-xs text-body-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-xs">
              <Icon name="meeting_room" className="text-[16px]" />
              {b.location.name}
            </span>
            <span aria-hidden className="text-outline">·</span>
            <span className="inline-flex items-center gap-xs">
              <Icon name="group" className="text-[16px]" />
              {b.attendees.length + 1} người
            </span>
          </div>
        </div>
      </section>

      {b.description && (
        <section className="bg-surface border border-outline-variant rounded-xl shadow-soft p-md mb-md">
          <div className="text-caption uppercase tracking-wider font-semibold text-on-surface-variant mb-xs">Mô tả</div>
          <p className="text-body-md text-on-surface whitespace-pre-wrap">{b.description}</p>
        </section>
      )}

      <section className="bg-surface border border-outline-variant rounded-xl shadow-soft mb-md divide-y divide-outline-variant overflow-hidden">
        <DetailRow
          icon="schedule"
          label="Thời gian"
          value={`${formatInTz(b.startsAt, tz, "HH:mm")} → ${formatInTz(b.endsAt, tz, "HH:mm")}`}
          hint={`${formatInTz(b.startsAt, tz, "EEEE, dd MMMM yyyy")} · Múi giờ ${tz.replace("_", " ")}`}
        />
        <DetailRow
          icon="meeting_room"
          label="Địa điểm"
          value={b.location.name}
          hint={[b.location.floor, b.location.address].filter(Boolean).join(" · ") || undefined}
          chips={
            <>
              {b.location.capacity > 0 && (
                <AmenityChip icon="groups" label={`${b.location.capacity} chỗ`} />
              )}
              {b.location.amenities.map((a) => (
                <AmenityChip key={a} icon={amenityIcon(a)} label={a} />
              ))}
            </>
          }
        />
        <DetailRow icon="person" label="Người tổ chức" value={b.organizer.name} hint={b.organizer.email} />
      </section>

      <section className="bg-surface border border-outline-variant rounded-xl shadow-soft p-md mb-md">
        <div className="flex items-baseline justify-between gap-sm mb-sm">
          <h2 className="font-manrope font-bold text-on-surface" style={{ fontSize: 18, lineHeight: "24px" }}>
            Người tham dự
          </h2>
          <span className="text-caption font-bold uppercase tracking-wider text-on-surface-variant">
            {b.attendees.length + 1} người
          </span>
        </div>
        <ul className="flex flex-col">
          <AttendeeRow name={b.organizer.name} email={b.organizer.email} role="Tổ chức" highlight />
          {b.attendees.map((a) => (
            <AttendeeRow key={a.user.email} name={a.user.name} email={a.user.email} role="Tham dự" />
          ))}
        </ul>
      </section>

      {isOwner && b.status === "CONFIRMED" && !past && (
        <form action={cancel}>
          <SubmitButton
            variant="outline-danger"
            icon="event_busy"
            pendingLabel="Đang hủy…"
            className="w-full md:w-auto"
          >
            Hủy lịch họp
          </SubmitButton>
        </form>
      )}
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
  hint,
  chips,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  chips?: React.ReactNode;
}) {
  return (
    <div className="p-md flex items-start gap-md">
      <span className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-[20px]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-caption font-bold uppercase tracking-wider text-on-surface-variant mb-xs">{label}</div>
        <div className="font-inter font-semibold text-body-lg text-on-surface break-words leading-snug">{value}</div>
        {hint && <div className="text-body-sm text-on-surface-variant mt-xs break-words">{hint}</div>}
        {chips && <div className="flex flex-wrap gap-xs mt-sm">{chips}</div>}
      </div>
    </div>
  );
}

const AMENITY_ICONS: Record<string, string> = {
  video: "videocam",
  videocall: "videocam",
  "video call": "videocam",
  camera: "videocam",
  projector: "cast",
  "máy chiếu": "cast",
  whiteboard: "edit_note",
  "bảng trắng": "edit_note",
  wifi: "wifi",
  "wi-fi": "wifi",
  tv: "tv",
  monitor: "tv",
  "màn hình": "tv",
  phone: "call",
  "điện thoại": "call",
  coffee: "coffee",
  "cà phê": "coffee",
  water: "water_drop",
  "nước uống": "water_drop",
  ac: "ac_unit",
  "máy lạnh": "ac_unit",
  "điều hòa": "ac_unit",
  printer: "print",
  "máy in": "print",
};

function amenityIcon(name: string): string {
  return AMENITY_ICONS[name.toLowerCase().trim()] ?? "check_circle";
}

function AmenityChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container text-on-surface text-caption font-semibold border border-outline-variant">
      <Icon name={icon} className="text-[14px] text-primary" />
      {label}
    </span>
  );
}

function AttendeeRow({
  name,
  email,
  role,
  highlight,
}: {
  name: string;
  email: string;
  role: string;
  highlight?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <li className="flex items-center gap-sm min-w-0 py-xs">
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-caption font-bold ${
          highlight ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"
        }`}
      >
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-inter font-semibold text-body-md text-on-surface truncate leading-tight">{name}</div>
        <div className="text-body-sm text-on-surface-variant truncate mt-0.5">{email}</div>
      </div>
      <span
        className={`text-caption font-bold uppercase tracking-wider px-sm py-0.5 rounded-full whitespace-nowrap shrink-0 ${
          highlight ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
        }`}
      >
        {role}
      </span>
    </li>
  );
}
