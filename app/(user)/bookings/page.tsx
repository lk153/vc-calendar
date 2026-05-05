import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { formatInTz } from "@/lib/tz";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, StatusPill, inputCls } from "@/components/ui";

type View = "created" | "invited";
type Status = "upcoming" | "past" | "cancelled";

const VIEW_LABEL: Record<View, string> = { created: "Tôi tạo", invited: "Được mời" };
const STATUS_LABEL: Record<Status, string> = {
  upcoming: "Sắp tới",
  past: "Đã qua",
  cancelled: "Đã hủy",
};
const STATUS_ICON: Record<Status, string> = {
  upcoming: "schedule",
  past: "history",
  cancelled: "event_busy",
};

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; q?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const view: View = sp.view === "invited" ? "invited" : "created";
  const status: Status =
    sp.status === "past" ? "past" : sp.status === "cancelled" ? "cancelled" : "upcoming";
  const q = (sp.q ?? "").trim();
  const tz = user.timezone;
  const now = new Date();

  const baseWhere =
    view === "created"
      ? { organizerId: user.id }
      : {
          attendees: { some: { userId: user.id } },
          NOT: { organizerId: user.id },
        };

  const statusWhere =
    status === "upcoming"
      ? { status: "CONFIRMED" as const, endsAt: { gte: now } }
      : status === "past"
      ? { status: "CONFIRMED" as const, endsAt: { lt: now } }
      : { status: "CANCELLED" as const };

  const titleWhere = q ? { title: { contains: q, mode: "insensitive" as const } } : {};

  const where = { ...baseWhere, ...statusWhere, ...titleWhere };
  const orderBy =
    status === "upcoming"
      ? ({ startsAt: "asc" } as const)
      : status === "past"
      ? ({ startsAt: "desc" } as const)
      : ({ updatedAt: "desc" } as const);

  const [bookings, createdCount, invitedCount] = await Promise.all([
    db.booking.findMany({
      where,
      include: { location: true, organizer: true, attendees: { include: { user: true } } },
      orderBy,
      take: 100,
    }),
    db.booking.count({ where: { organizerId: user.id } }),
    db.booking.count({
      where: { attendees: { some: { userId: user.id } }, NOT: { organizerId: user.id } },
    }),
  ]);

  return (
    <main className="px-md md:px-lg pt-md pb-lg max-w-[1280px] w-full mx-auto">
      <PageHeader
        pillIcon="event"
        pillLabel="Lịch của tôi"
        title="Lịch họp"
        accent="của bạn."
        description="Xem lại tất cả lịch bạn đã tạo và những lịch được mời tham dự."
        trailing={
          <PrimaryButton href="/bookings/new" icon="add">
            Đặt lịch mới
          </PrimaryButton>
        }
      />

      <div className="flex flex-col gap-sm mb-md">
        <SegmentedTabs view={view} status={status} q={q} createdCount={createdCount} invitedCount={invitedCount} />
        <div className="flex items-center gap-sm flex-wrap">
          <StatusFilter view={view} status={status} q={q} />
          <form className="flex-1 min-w-[200px]">
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="status" value={status} />
            <div className="relative">
              <Icon name="search" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm theo tiêu đề…"
                className={`${inputCls} pl-10`}
              />
            </div>
          </form>
        </div>
      </div>

      {bookings.length === 0 ? (
        <EmptyState view={view} status={status} q={q} />
      ) : (
        <div className="flex flex-col gap-sm">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} tz={tz} viewerId={user.id} />
          ))}
        </div>
      )}
    </main>
  );
}

function SegmentedTabs({
  view,
  status,
  q,
  createdCount,
  invitedCount,
}: {
  view: View;
  status: Status;
  q: string;
  createdCount: number;
  invitedCount: number;
}) {
  function href(v: View) {
    const params = new URLSearchParams();
    params.set("view", v);
    params.set("status", status);
    if (q) params.set("q", q);
    return `/bookings?${params.toString()}`;
  }
  const tabs: { v: View; icon: string; count: number }[] = [
    { v: "created", icon: "edit_calendar", count: createdCount },
    { v: "invited", icon: "groups", count: invitedCount },
  ];
  return (
    <div
      role="tablist"
      aria-label="Loại lịch"
      className="inline-flex p-1 rounded-full bg-surface-container-low border border-outline-variant self-start shadow-soft"
    >
      {tabs.map((t) => {
        const active = view === t.v;
        return (
          <Link
            key={t.v}
            role="tab"
            aria-selected={active}
            href={href(t.v)}
            className={`inline-flex items-center gap-xs h-10 px-md rounded-full text-body-sm font-semibold transition-all ${
              active
                ? "bg-primary text-on-primary shadow-soft"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <Icon name={t.icon} className="text-[18px]" />
            {VIEW_LABEL[t.v]}
            <span
              className={`tabular-nums text-caption font-bold rounded-full px-xs h-5 inline-flex items-center justify-center ${
                active ? "bg-on-primary/20 text-on-primary" : "bg-surface-variant text-on-surface-variant"
              }`}
            >
              {t.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function StatusFilter({ view, status, q }: { view: View; status: Status; q: string }) {
  function href(s: Status) {
    const params = new URLSearchParams();
    params.set("view", view);
    params.set("status", s);
    if (q) params.set("q", q);
    return `/bookings?${params.toString()}`;
  }
  const items: Status[] = ["upcoming", "past", "cancelled"];
  return (
    <div role="radiogroup" aria-label="Trạng thái" className="inline-flex items-center gap-xs flex-wrap">
      {items.map((s) => {
        const active = status === s;
        return (
          <Link
            key={s}
            role="radio"
            aria-checked={active}
            href={href(s)}
            className={`inline-flex items-center gap-xs h-10 px-sm rounded-full text-body-sm font-semibold transition-all ${
              active
                ? "bg-primary-container text-on-primary-container border-2 border-primary shadow-soft"
                : "bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <Icon
              name={active ? "check" : STATUS_ICON[s]}
              className={`text-[16px] ${active ? "text-primary" : ""}`}
            />
            {STATUS_LABEL[s]}
          </Link>
        );
      })}
    </div>
  );
}

type BookingWithRelations = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: "CONFIRMED" | "CANCELLED";
  location: { name: string };
  organizer: { id: string; name: string };
  attendees: { user: { name: string } }[];
};

function BookingRow({ booking: b, tz, viewerId }: { booking: BookingWithRelations; tz: string; viewerId: string }) {
  const isOrganizer = b.organizer.id === viewerId;
  const isCancelled = b.status === "CANCELLED";
  return (
    <Link
      href={`/bookings/${b.id}`}
      className={`group bg-surface border border-surface-variant rounded-xl p-md flex gap-sm shadow-soft relative overflow-hidden hover:shadow-soft-lg hover:-translate-y-0.5 transition-all ${
        isCancelled ? "opacity-75" : ""
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${isCancelled ? "bg-outline-variant" : "bg-primary"}`}
      />
      <div
        className={`flex flex-col items-center justify-center min-w-[72px] rounded-lg py-xs ${
          isCancelled ? "bg-surface-variant" : "bg-primary-container/30"
        }`}
      >
        <span
          className={`font-manrope text-headline-md font-bold leading-none ${
            isCancelled ? "text-on-surface-variant" : "text-on-primary-container"
          }`}
        >
          {formatInTz(b.startsAt, tz, "HH:mm")}
        </span>
        <span
          className={`text-caption mt-xs ${
            isCancelled ? "text-on-surface-variant/80" : "text-on-primary-container/80"
          }`}
        >
          {formatInTz(b.startsAt, tz, "dd MMM")}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-xs gap-sm">
          <h4 className="font-manrope font-bold text-body-lg text-on-surface truncate">{b.title}</h4>
          {isCancelled ? (
            <StatusPill tone="neutral" icon="event_busy">Đã hủy</StatusPill>
          ) : (
            <StatusPill tone="primary" icon="check_circle">Đã xác nhận</StatusPill>
          )}
        </div>
        <div className="flex items-center gap-sm text-on-surface-variant flex-wrap">
          <span className="inline-flex items-center gap-xs text-body-sm">
            <Icon name="meeting_room" className="text-[16px]" />
            {b.location.name}
          </span>
          <span className="text-outline">·</span>
          <span className="inline-flex items-center gap-xs text-body-sm">
            <Icon name="schedule" className="text-[16px]" />
            {formatInTz(b.startsAt, tz, "HH:mm")} – {formatInTz(b.endsAt, tz, "HH:mm")}
          </span>
          <span className="text-outline">·</span>
          <span className="inline-flex items-center gap-xs text-body-sm">
            <Icon name={isOrganizer ? "person" : "groups"} className="text-[16px]" />
            {isOrganizer ? "Bạn tổ chức" : `${b.organizer.name} mời`}
          </span>
          <span className="text-outline">·</span>
          <span className="inline-flex items-center gap-xs text-body-sm">
            <Icon name="group" className="text-[16px]" />
            {b.attendees.length + 1}
          </span>
        </div>
      </div>
      <Icon name="chevron_right" className="text-outline self-center group-hover:text-on-surface transition-colors" />
    </Link>
  );
}

function EmptyState({ view, status, q }: { view: View; status: Status; q: string }) {
  const isSearch = q.length > 0;
  if (isSearch) {
    return (
      <div className="bg-surface border border-surface-variant rounded-xl shadow-soft p-lg flex flex-col items-center text-center gap-sm">
        <span className="w-14 h-14 rounded-full bg-surface-variant flex items-center justify-center">
          <Icon name="search_off" className="text-on-surface-variant text-[28px]" />
        </span>
        <h3 className="font-manrope font-bold text-headline-md text-on-surface">Không tìm thấy lịch nào</h3>
        <p className="text-body-md text-on-surface-variant">
          Không có kết quả phù hợp với <span className="font-semibold">"{q}"</span>.
        </p>
      </div>
    );
  }
  const messages: Record<View, Record<Status, { title: string; body: string; cta?: boolean }>> = {
    created: {
      upcoming: {
        title: "Bạn chưa có lịch sắp tới",
        body: "Tạo lịch họp mới để bắt đầu.",
        cta: true,
      },
      past: { title: "Chưa có lịch đã qua", body: "Lịch họp đã hoàn tất sẽ hiển thị ở đây." },
      cancelled: { title: "Không có lịch đã hủy", body: "Các lịch bạn hủy sẽ xuất hiện ở đây." },
    },
    invited: {
      upcoming: {
        title: "Chưa được mời vào lịch nào",
        body: "Khi đồng nghiệp mời, bạn sẽ thấy lịch ở đây.",
      },
      past: { title: "Chưa có lịch đã qua", body: "Lịch bạn từng tham dự sẽ hiển thị ở đây." },
      cancelled: { title: "Không có lịch đã hủy", body: "Lịch bạn từng được mời nhưng đã bị hủy." },
    },
  };
  const m = messages[view][status];
  return (
    <div className="bg-surface border border-surface-variant rounded-xl shadow-soft p-lg flex flex-col items-center text-center gap-sm">
      <span className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
        <Icon name={STATUS_ICON[status]} className="text-on-primary-container text-[28px]" />
      </span>
      <h3 className="font-manrope font-bold text-headline-md text-on-surface">{m.title}</h3>
      <p className="text-body-md text-on-surface-variant max-w-sm">{m.body}</p>
      {m.cta && (
        <PrimaryButton href="/bookings/new" icon="add">
          Đặt lịch mới
        </PrimaryButton>
      )}
    </div>
  );
}
