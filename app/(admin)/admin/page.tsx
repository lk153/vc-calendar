import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard, PrimaryButton, GhostButton } from "@/components/ui";
import { startOfDay, endOfDay, subDays } from "date-fns";

const ACTION_LABEL: Record<string, string> = {
  create: "Đã tạo",
  update: "Đã cập nhật",
  cancel: "Đã hủy",
  activate: "Đã kích hoạt",
  deactivate: "Đã ngưng",
};

const ENTITY_LABEL: Record<string, string> = {
  Booking: "lịch họp",
  Location: "phòng",
  User: "người dùng",
};

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [todayCount, yestCount, activeUsers, totalUsers, locations, recent] = await Promise.all([
    db.booking.count({ where: { status: "CONFIRMED", startsAt: { gte: todayStart, lte: todayEnd } } }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        startsAt: { gte: startOfDay(subDays(now, 1)), lte: endOfDay(subDays(now, 1)) },
      },
    }),
    db.user.count({ where: { active: true } }),
    db.user.count(),
    db.location.count({ where: { active: true } }),
    db.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } }),
  ]);

  const delta = yestCount === 0 ? 0 : Math.round(((todayCount - yestCount) / yestCount) * 100);
  const utilizationPct = locations === 0 ? 0 : Math.min(100, Math.round((todayCount / Math.max(locations, 1)) * 25));

  return (
    <>
      <PageHeader
        pillIcon="dashboard"
        pillLabel={`Chào ${admin.name?.split(" ").slice(-1)[0] ?? "quản trị viên"}`}
        title="Tổng quan"
        accent="vận hành."
        description="Tóm tắt hoạt động, công suất và thay đổi gần đây trong toàn hệ thống."
        trailing={
          <>
            <GhostButton href="/admin/bookings" icon="event">Tất cả lịch</GhostButton>
            <PrimaryButton href="/admin/locations/new" icon="add_business">Thêm phòng</PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
        <MetricCard
          label="Lịch họp hôm nay"
          value={todayCount}
          icon="event_available"
          trail={
            <>
              <Icon name={delta >= 0 ? "trending_up" : "trending_down"} className={`text-[14px] ${delta >= 0 ? "text-primary" : "text-error"}`} />
              {delta >= 0 ? "+" : ""}
              {delta}% so với hôm qua
            </>
          }
        />
        <MetricCard
          label="Phòng đang hoạt động"
          value={locations}
          icon="meeting_room"
          bar={{ pct: utilizationPct }}
          trail={
            <>
              <Icon name="bolt" className="text-[14px] text-primary" /> ~{utilizationPct}% công suất hôm nay
            </>
          }
        />
        <MetricCard
          label="Người dùng hoạt động"
          value={activeUsers}
          icon="group"
          trail={
            <>
              <Icon name="people" className="text-[14px] text-on-surface-variant" /> trên tổng số {totalUsers}
            </>
          }
        />
      </div>

      <section className="bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
        <div className="px-md py-sm flex items-center justify-between border-b border-surface-variant bg-surface-container-low">
          <h3 className="font-manrope font-bold text-headline-md text-on-surface flex items-center gap-sm">
            <Icon name="history" className="text-on-surface-variant" />
            Hoạt động gần đây
          </h3>
          <a href="/admin/audit" className="text-label-md text-primary hover:underline">Xem tất cả →</a>
        </div>
        {recent.length === 0 ? (
          <p className="px-md py-md text-body-sm text-on-surface-variant">Chưa có hoạt động.</p>
        ) : (
          <ul className="divide-y divide-surface-variant">
            {recent.map((a) => (
              <li key={a.id} className="px-md py-sm flex items-start gap-sm hover:bg-surface-container-low/50 transition-colors">
                <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-label-md shrink-0">
                  {a.actor.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface">
                    <span className="font-semibold">{a.actor.name}</span>{" "}
                    <span className="text-on-surface-variant">{ACTION_LABEL[a.action] ?? a.action}</span>{" "}
                    <span className="font-semibold">{ENTITY_LABEL[a.entity] ?? a.entity}</span>
                  </p>
                  <p className="text-caption text-on-surface-variant mt-xs">{a.createdAt.toLocaleString("vi-VN")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
