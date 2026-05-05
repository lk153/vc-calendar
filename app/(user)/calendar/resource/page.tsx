import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { GhostButton } from "@/components/ui";
import { startOfDay, endOfDay, addDays, addHours } from "date-fns";

const HOUR_START = 8;
const HOUR_END = 19;
const HOUR_W = 80;

export default async function ResourceCalendar({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const dayStart = startOfDay(sp.date ? new Date(sp.date) : new Date());
  const dayEnd = endOfDay(dayStart);

  const locations = await db.location.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED", startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
    include: { organizer: { select: { name: true } } },
  });

  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const prev = addDays(dayStart, -1).toISOString().slice(0, 10);
  const next = addDays(dayStart, 1).toISOString().slice(0, 10);
  const todayISO = new Date().toISOString().slice(0, 10);
  const dayLabel = dayStart.toLocaleDateString("vi-VN", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="px-md md:px-lg pt-md pb-lg max-w-[1280px] w-full mx-auto">
      <PageHeader
        pillIcon="meeting_room"
        pillLabel="Phòng"
        title="Dòng thời gian"
        accent="phòng họp."
        description={`Xem nhanh tình trạng đặt phòng của tất cả phòng đang hoạt động — ${dayLabel}.`}
        trailing={
          <div className="flex items-center gap-xs bg-surface border border-surface-variant rounded-lg shadow-soft p-xs">
            <a href={`?date=${prev}`} className="w-9 h-9 rounded-md hover:bg-surface-variant flex items-center justify-center" title="Ngày trước">
              <Icon name="chevron_left" />
            </a>
            <a href={`?date=${todayISO}`} className="px-sm h-9 rounded-md hover:bg-surface-variant flex items-center text-body-sm font-semibold text-on-surface" title="Hôm nay">
              Hôm nay
            </a>
            <a href={`?date=${next}`} className="w-9 h-9 rounded-md hover:bg-surface-variant flex items-center justify-center" title="Ngày kế">
              <Icon name="chevron_right" />
            </a>
          </div>
        }
      />

      <div className="bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
        <div className="flex border-b border-surface-variant bg-surface-container-low">
          <div className="w-32 shrink-0 border-r border-surface-variant p-sm flex items-center justify-center text-label-md uppercase text-on-surface-variant">
            Phòng
          </div>
          <div className="flex-1 overflow-x-auto no-scrollbar flex">
            {hours.map((h) => (
              <div
                key={h}
                style={{ width: HOUR_W }}
                className="shrink-0 p-sm border-r border-surface-variant flex items-center justify-center text-label-md uppercase text-on-surface-variant"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          {locations.map((loc) => {
            const locBookings = bookings.filter((b) => b.locationId === loc.id);
            return (
              <div key={loc.id} className="flex border-b border-surface-variant last:border-0 bg-surface hover:bg-surface-container-low/50 transition-colors">
                <div className="w-32 shrink-0 border-r border-surface-variant p-sm flex flex-col justify-center items-start gap-xs">
                  <span className="font-manrope font-bold text-body-md text-on-surface leading-tight">{loc.name}</span>
                  <span className="inline-flex items-center gap-xs text-caption text-on-surface-variant">
                    <Icon name="group" className="text-[12px]" /> {loc.capacity}
                  </span>
                </div>
                <div className="flex-1 overflow-x-auto no-scrollbar flex relative h-20">
                  <div className="absolute inset-0 flex">
                    {hours.map((h) => (
                      <div key={h} style={{ width: HOUR_W }} className="shrink-0 border-r border-surface-variant hover:bg-primary-container/20 transition-colors" />
                    ))}
                  </div>
                  <div className="absolute top-2 bottom-2 left-0 right-0">
                    {locBookings.map((b) => {
                      const dayStartHour = addHours(dayStart, HOUR_START);
                      const left = Math.max(0, ((b.startsAt.getTime() - dayStartHour.getTime()) / 3600000) * HOUR_W);
                      const width = ((b.endsAt.getTime() - b.startsAt.getTime()) / 3600000) * HOUR_W;
                      return (
                        <a
                          key={b.id}
                          href={`/bookings/${b.id}`}
                          className="absolute h-full bg-gradient-to-r from-primary to-primary-container border-l-4 border-on-primary-fixed rounded-md px-sm py-xs flex flex-col justify-center shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 overflow-hidden transition-all"
                          style={{ left, width }}
                        >
                          <span className="text-caption font-bold text-on-primary truncate">{b.title}</span>
                          <span className="text-caption text-on-primary/80 truncate">{b.organizer.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {locations.length === 0 && (
            <div className="px-md py-lg flex flex-col items-center text-center gap-sm">
              <Icon name="meeting_room" className="text-outline text-[40px]" />
              <p className="text-body-md text-on-surface-variant">Chưa có phòng nào hoạt động. Liên hệ quản trị viên để thêm phòng.</p>
              <GhostButton href="/admin/locations" icon="add_business">Quản lý phòng</GhostButton>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
