import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill, inputCls, FilterCard } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { adminCancelBooking } from "./actions";

const STATUS_LABEL: Record<string, string> = { CONFIRMED: "Đã xác nhận", CANCELLED: "Đã hủy" };

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ q?: string; locationId?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const bookings = await db.booking.findMany({
    where: {
      ...(sp.locationId ? { locationId: sp.locationId } : {}),
      ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}),
    },
    include: { location: true, organizer: true, attendees: true },
    orderBy: { startsAt: "desc" },
    take: 100,
  });
  const locations = await db.location.findMany({ orderBy: { name: "asc" } });
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;

  return (
    <>
      <PageHeader
        pillIcon="event"
        pillLabel="Lịch đặt"
        title="Tất cả"
        accent="lịch đặt."
        description={`${bookings.length} hiển thị · ${confirmed} đã xác nhận · ${bookings.length - confirmed} đã hủy`}
      />

      <FilterCard>
        <form className="flex flex-wrap gap-sm items-end w-full">
          <label className="flex flex-col gap-xs flex-1 min-w-[200px]">
            <span className="text-label-md uppercase text-on-surface-variant">Tìm kiếm</span>
            <div className="relative">
              <Icon name="search" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Tiêu đề…" className={`${inputCls} pl-10`} />
            </div>
          </label>
          <label className="flex flex-col gap-xs">
            <span className="text-label-md uppercase text-on-surface-variant">Phòng</span>
            <select name="locationId" defaultValue={sp.locationId ?? ""} className={inputCls}>
              <option value="">Tất cả phòng</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <SubmitButton icon="filter_alt" variant="primary" pendingLabel="Đang lọc…">
            Áp dụng
          </SubmitButton>
        </form>
      </FilterCard>

      <section className="bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
        <div className="px-md py-sm border-b border-surface-variant bg-surface-container-low flex items-center justify-between">
          <h3 className="font-manrope font-bold text-headline-md text-on-surface flex items-center gap-sm">
            <Icon name="list_alt" className="text-on-surface-variant" /> Mới nhất trước
          </h3>
          <span className="text-caption text-on-surface-variant">Hiển thị {bookings.length}</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr className="text-label-md uppercase text-on-surface-variant">
              <th className="px-md py-sm">Tiêu đề</th>
              <th className="px-md py-sm">Thời gian</th>
              <th className="px-md py-sm">Phòng</th>
              <th className="px-md py-sm">Người tổ chức</th>
              <th className="px-md py-sm">Trạng thái</th>
              <th className="px-md py-sm" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-md py-sm">
                  <Link href={`/bookings/${b.id}`} className="font-semibold text-on-surface hover:text-primary transition-colors">
                    {b.title}
                  </Link>
                  <div className="text-caption text-on-surface-variant">{b.attendees.length + 1} người tham dự</div>
                </td>
                <td className="px-md py-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                  {b.startsAt.toLocaleString("vi-VN", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </td>
                <td className="px-md py-sm text-body-sm">{b.location.name}</td>
                <td className="px-md py-sm text-body-sm">{b.organizer.name}</td>
                <td className="px-md py-sm">
                  <StatusPill
                    tone={b.status === "CONFIRMED" ? "primary" : "neutral"}
                    icon={b.status === "CONFIRMED" ? "check_circle" : "event_busy"}
                  >
                    {STATUS_LABEL[b.status]}
                  </StatusPill>
                </td>
                <td className="px-md py-sm text-right">
                  {b.status === "CONFIRMED" && (
                    <form action={adminCancelBooking.bind(null, b.id)}>
                      <SubmitButton size="sm" variant="outline-danger" icon="event_busy" pendingLabel="Đang hủy…">
                        Hủy
                      </SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={6} className="px-md py-md text-center text-body-sm text-on-surface-variant">Không có lịch nào phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
