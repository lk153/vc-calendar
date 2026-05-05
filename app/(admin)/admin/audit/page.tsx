import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/ui";

const ACTION_TONE: Record<string, "primary" | "neutral" | "warning" | "danger"> = {
  create: "primary",
  update: "neutral",
  activate: "primary",
  deactivate: "warning",
  cancel: "danger",
};

const ACTION_LABEL: Record<string, string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  cancel: "Hủy",
  activate: "Kích hoạt",
  deactivate: "Ngưng",
};

const ENTITY_LABEL: Record<string, string> = {
  Booking: "Lịch họp",
  Location: "Phòng",
  User: "Người dùng",
};

export default async function AuditPage() {
  await requireAdmin();
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });
  return (
    <>
      <PageHeader
        pillIcon="history"
        pillLabel="Nhật ký"
        title="Hoạt động"
        accent="hệ thống."
        description="Nhật ký chỉ thêm cho mọi hành động của quản trị viên và người dùng."
      />

      <section className="bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
        <div className="px-md py-sm border-b border-surface-variant bg-surface-container-low flex items-center justify-between">
          <h3 className="font-manrope font-bold text-headline-md text-on-surface flex items-center gap-sm">
            <Icon name="receipt_long" className="text-on-surface-variant" /> 200 mục mới nhất
          </h3>
          <span className="text-caption text-on-surface-variant">Mới nhất trước</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr className="text-label-md uppercase text-on-surface-variant">
              <th className="px-md py-sm">Thời gian</th>
              <th className="px-md py-sm">Người thực hiện</th>
              <th className="px-md py-sm">Hành động</th>
              <th className="px-md py-sm">Đối tượng</th>
              <th className="px-md py-sm">Thay đổi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-md py-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                  {l.createdAt.toLocaleString("vi-VN")}
                </td>
                <td className="px-md py-sm">
                  <div className="flex items-center gap-sm">
                    <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container text-caption font-bold flex items-center justify-center">
                      {l.actor.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-on-surface truncate">{l.actor.name}</div>
                      <div className="text-caption text-on-surface-variant truncate">{l.actor.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-sm">
                  <StatusPill tone={ACTION_TONE[l.action] ?? "neutral"}>{ACTION_LABEL[l.action] ?? l.action}</StatusPill>
                </td>
                <td className="px-md py-sm">
                  <span className="text-body-sm text-on-surface">{ENTITY_LABEL[l.entity] ?? l.entity}</span>
                  <span className="text-caption text-on-surface-variant ml-xs">#{l.entityId.slice(0, 8)}</span>
                </td>
                <td className="px-md py-sm">
                  <code className="text-caption text-on-surface-variant bg-surface-container-low px-xs py-0.5 rounded">
                    {l.diff ? JSON.stringify(l.diff).slice(0, 80) : "—"}
                  </code>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-md py-md text-center text-body-sm text-on-surface-variant">Chưa có nhật ký.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
