import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { formatInTz } from "@/lib/tz";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/ui";
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

  return (
    <main className="px-md md:px-lg pt-md pb-lg max-w-3xl mx-auto w-full">
      <PageHeader
        pillIcon="event"
        pillLabel="Lịch họp"
        title={b.title}
        crumbs={[{ href: "/calendar", label: "Lịch" }, { href: "#", label: "Chi tiết" }]}
        trailing={
          isOwner && b.status === "CONFIRMED" ? (
            <form action={cancel}>
              <SubmitButton variant="outline-danger" icon="event_busy" pendingLabel="Đang hủy…">
                Hủy lịch
              </SubmitButton>
            </form>
          ) : null
        }
      />

      <section className="bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-on-primary-fixed text-on-primary p-md relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30"
            style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.4), transparent 70%)" }}
          />
          <div className="relative flex items-start justify-between gap-sm">
            <div>
              <span className="text-caption font-bold uppercase tracking-wider opacity-90">
                {formatInTz(b.startsAt, tz, "EEEE, dd MMMM")}
              </span>
              <h2 className="font-manrope font-bold text-headline-lg mt-xs leading-tight">{b.title}</h2>
              <p className="text-body-md opacity-90 mt-xs">
                {formatInTz(b.startsAt, tz, "HH:mm")} – {formatInTz(b.endsAt, tz, "HH:mm")} · {b.location.name}
              </p>
            </div>
            {b.status === "CONFIRMED" ? (
              <StatusPill tone="primary" icon="check_circle">Đã xác nhận</StatusPill>
            ) : (
              <StatusPill tone="neutral" icon="event_busy">Đã hủy</StatusPill>
            )}
          </div>
        </div>

        {b.description && (
          <div className="p-md border-b border-surface-variant">
            <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{b.description}</p>
          </div>
        )}

        <dl className="p-md grid grid-cols-1 md:grid-cols-2 gap-md">
          <DetailRow icon="schedule" label="Thời gian" value={`${formatInTz(b.startsAt, tz, "PPp")} → ${formatInTz(b.endsAt, tz, "p")}`} hint={tz} />
          <DetailRow
            icon="meeting_room"
            label="Địa điểm"
            value={b.location.name}
            hint={[b.location.floor, b.location.address].filter(Boolean).join(" · ")}
          />
          <DetailRow icon="person" label="Người tổ chức" value={b.organizer.name} hint={b.organizer.email} />
          <DetailRow
            icon="group"
            label={`Người tham dự (${b.attendees.length + 1})`}
            value={
              <div className="flex flex-wrap gap-xs mt-xs">
                <AttendeeChip name={b.organizer.name} role="Tổ chức" />
                {b.attendees.map((a) => (
                  <AttendeeChip key={a.user.email} name={a.user.name} role={a.user.email} />
                ))}
              </div>
            }
          />
        </dl>
      </section>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-sm">
      <span className="w-10 h-10 rounded-xl bg-primary-container/60 text-on-primary-container flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-[20px]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-caption uppercase text-on-surface-variant tracking-wide mb-xs">{label}</div>
        <div className="text-body-md text-on-surface">{value}</div>
        {hint && <div className="text-caption text-on-surface-variant mt-xs">{hint}</div>}
      </div>
    </div>
  );
}

function AttendeeChip({ name, role }: { name: string; role: string }) {
  const initials = name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span className="inline-flex items-center gap-xs pl-xs pr-sm py-xs rounded-full bg-surface-container-low border border-outline-variant text-body-sm">
      <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold flex items-center justify-center">
        {initials}
      </span>
      <span className="text-on-surface font-semibold">{name}</span>
      <span className="text-caption text-on-surface-variant">· {role}</span>
    </span>
  );
}
