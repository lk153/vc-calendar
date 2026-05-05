import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { formatInTz } from "@/lib/tz";
import { Icon } from "@/components/Icon";
import { AgendaEmptyState } from "@/components/AgendaEmptyState";
import { PrimaryButton, StatusPill } from "@/components/ui";
import { startOfDay, endOfDay, addDays } from "date-fns";

type AgendaBooking = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: { name: string };
  attendees: { user: { name: string } }[];
};

export default async function CalendarPage() {
  const user = await requireUser();
  const tz = user.timezone;
  const now = new Date();
  const todayEnd = endOfDay(now);
  const tomorrowStart = startOfDay(addDays(now, 1));
  const tomorrowEnd = endOfDay(addDays(now, 1));
  const weekEnd = endOfDay(addDays(now, 7));

  const all = (await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startsAt: { gte: startOfDay(now), lte: weekEnd },
      OR: [{ organizerId: user.id }, { attendees: { some: { userId: user.id } } }],
    },
    include: { location: true, attendees: { include: { user: true } } },
    orderBy: { startsAt: "asc" },
  })) as unknown as AgendaBooking[];

  const today = all.filter((b) => b.startsAt <= todayEnd);
  const tomorrow = all.filter((b) => b.startsAt >= tomorrowStart && b.startsAt <= tomorrowEnd);
  const later = all.filter((b) => b.startsAt > tomorrowEnd);
  const allEmpty = all.length === 0;

  const greeting = greetingFor(now);
  const firstName = user.name?.trim().split(" ").slice(-1)[0] ?? "";

  return (
    <main className="px-md md:px-lg pt-md pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-lg max-w-[1280px] w-full mx-auto">
      <header className="mb-md">
        <div className="flex items-center justify-between gap-sm mb-xs">
          <h1 className="font-manrope font-bold text-headline-lg md:text-headline-xl text-on-surface leading-tight">
            Lịch trình
          </h1>
          <div className="hidden md:block">
            <PrimaryButton href="/bookings/new" icon="add">
              Đặt lịch mới
            </PrimaryButton>
          </div>
        </div>
        <p className="text-body-md text-on-surface-variant">
          {greeting}{firstName ? `, ${firstName}` : ""} · {all.length === 0 ? "Chưa có lịch họp trong 7 ngày tới" : `${all.length} lịch họp trong 7 ngày tới`} · {formatInTz(now, tz, "EEEE, dd MMMM")}
        </p>
      </header>

      <Link
        href="/bookings/new"
        aria-label="Đặt lịch mới"
        title="Đặt lịch mới"
        className="md:hidden fixed z-40 right-md bottom-[calc(env(safe-area-inset-bottom)+16px)] w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_24px_rgba(5,150,105,0.35)] hover:shadow-[0_12px_28px_rgba(5,150,105,0.4)] active:scale-95 transition-all"
      >
        <Icon name="add" className="text-[28px]" />
      </Link>

      {allEmpty ? (
        <AgendaEmptyState userName={user.name} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm mb-md">
            <Stat icon="today" label="Hôm nay" count={today.length} />
            <Stat icon="event_upcoming" label="Ngày mai" count={tomorrow.length} />
            <Stat icon="date_range" label="Phần còn lại tuần" count={later.length} />
          </div>
          <Section title="Hôm nay" bookings={today} tz={tz} now={now} emptyHint="Không có lịch họp hôm nay." />
          <Section title="Ngày mai" bookings={tomorrow} tz={tz} now={now} emptyHint="Ngày mai chưa có lịch nào." />
          <Section title="Cuối tuần này" bookings={later} tz={tz} now={now} compact emptyHint="Không có lịch họp xa hơn trong tuần." />
        </>
      )}
    </main>
  );
}

function Stat({ icon, label, count }: { icon: string; label: string; count: number }) {
  const empty = count === 0;
  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-sm flex items-center gap-sm">
      <span
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${empty ? "bg-surface-container text-on-surface-variant" : "bg-primary-container text-on-primary-container"}`}
      >
        <Icon name={icon} className="text-[20px]" />
      </span>
      <div className="min-w-0">
        <div className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">{label}</div>
        <div className="font-manrope font-bold text-headline-md text-on-surface leading-none mt-xs">
          {count} <span className="text-body-sm font-normal text-on-surface-variant">lịch họp</span>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  bookings,
  tz,
  now,
  compact,
  emptyHint,
}: {
  title: string;
  bookings: AgendaBooking[];
  tz: string;
  now: Date;
  compact?: boolean;
  emptyHint: string;
}) {
  return (
    <section className="mb-md">
      <div className="flex items-center gap-sm mb-sm">
        <h3 className="font-manrope font-bold text-on-surface" style={{ fontSize: 20, lineHeight: "28px" }}>
          {title}
        </h3>
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-caption text-on-surface-variant uppercase tracking-wider font-semibold">
          {bookings.length} lịch họp
        </span>
      </div>
      {bookings.length === 0 ? (
        <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl px-md py-sm flex items-center gap-sm">
          <span className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0">
            <Icon name="event_available" className="text-on-surface-variant text-[20px]" />
          </span>
          <p className="text-body-sm text-on-surface-variant">{emptyHint}</p>
        </div>
      ) : compact ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="group bg-surface border border-outline-variant rounded-xl p-sm flex items-center justify-between gap-sm shadow-soft hover:shadow-soft-lg hover:border-primary/40 transition-all"
            >
              <div className="min-w-0">
                <span className="block text-caption font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                  {formatInTz(b.startsAt, tz, "EEE, HH:mm")} · {b.location.name}
                </span>
                <h4 className="font-inter font-semibold text-body-md text-on-surface truncate">{b.title}</h4>
              </div>
              <Icon name="chevron_right" className="text-outline group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-sm">
          {bookings.map((b) => {
            const live = now >= b.startsAt && now < b.endsAt;
            return (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="group bg-surface border border-outline-variant rounded-xl p-md flex gap-md shadow-soft relative overflow-hidden hover:shadow-soft-lg hover:border-primary/40 transition-all"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${live ? "bg-primary" : "bg-primary/60"}`} />
                <div className="flex flex-col items-start min-w-[60px] pl-xs">
                  <span className="font-manrope font-bold text-headline-md text-on-surface leading-none">
                    {formatInTz(b.startsAt, tz, "HH:mm")}
                  </span>
                  <span className="text-caption text-on-surface-variant uppercase tracking-wider font-semibold mt-xs">
                    {formatInTz(b.startsAt, tz, "dd MMM")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-xs mb-sm">
                    <h4 className="font-inter font-semibold text-body-md text-on-surface min-w-0 break-words">
                      {b.title}
                    </h4>
                    {live ? (
                      <StatusPill tone="primary" icon="sensors">Đang diễn ra</StatusPill>
                    ) : (
                      <StatusPill tone="primary" icon="check_circle">Đã xác nhận</StatusPill>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-md gap-y-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-xs text-body-sm">
                      <Icon name="meeting_room" className="text-[16px]" />
                      {b.location.name}
                    </span>
                    <span className="inline-flex items-center gap-xs text-body-sm">
                      <Icon name="schedule" className="text-[16px]" />
                      {formatInTz(b.startsAt, tz, "HH:mm")} – {formatInTz(b.endsAt, tz, "HH:mm")}
                    </span>
                    <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container text-on-surface-variant text-caption font-semibold">
                      <Icon name="group" className="text-[14px]" />
                      {b.attendees.length + 1} người
                    </span>
                  </div>
                </div>
                <Icon
                  name="chevron_right"
                  className="text-outline self-center group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Khuya rồi";
  if (h < 12) return "Chào buổi sáng";
  if (h < 17) return "Chào buổi chiều";
  return "Chào buổi tối";
}
