import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, StatusPill } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { toggleLocationAction } from "./actions";

const AMENITY_ICON: Record<string, string> = {
  Video: "videocam",
  Projector: "tv",
  Whiteboard: "edit_note",
  Whiteboards: "edit_note",
  Phone: "call",
  TV: "tv",
};

export default async function LocationsPage() {
  await requireAdmin();
  const locations = await db.location.findMany({ orderBy: { name: "asc" } });
  const active = locations.filter((l) => l.active).length;
  return (
    <>
      <PageHeader
        pillIcon="location_on"
        pillLabel="Phòng họp"
        title="Quản lý"
        accent="phòng họp."
        description={`${active} đang hoạt động · ${locations.length - active} ngưng hoạt động`}
        trailing={
          <PrimaryButton href="/admin/locations/new" icon="add">
            Thêm phòng
          </PrimaryButton>
        }
      />

      {locations.length === 0 ? (
        <div className="bg-surface border border-surface-variant rounded-xl shadow-soft p-lg flex flex-col items-center text-center gap-sm">
          <span className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
            <Icon name="meeting_room" className="text-on-primary-container text-[32px]" />
          </span>
          <h3 className="font-manrope font-bold text-headline-md text-on-surface">Chưa có phòng</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm">Thêm phòng đặt đầu tiên để bắt đầu.</p>
          <PrimaryButton href="/admin/locations/new" icon="add">Thêm phòng đầu tiên</PrimaryButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {locations.map((l) => (
            <div
              key={l.id}
              className={`relative bg-surface rounded-xl border shadow-soft p-md flex flex-col overflow-hidden hover:shadow-soft-lg transition-shadow ${
                l.active ? "border-surface-variant" : "border-surface-variant opacity-80"
              }`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30"
                style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.5), transparent 70%)" }}
              />
              <div className="relative flex justify-between items-start mb-sm">
                <div className="flex items-start gap-sm min-w-0">
                  <span className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <Icon name="meeting_room" className="text-[24px]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-manrope font-bold text-headline-md text-on-surface truncate">{l.name}</h3>
                    <p className="text-caption text-on-surface-variant mt-xs truncate">{l.floor ?? l.address}</p>
                  </div>
                </div>
                <StatusPill tone={l.active ? "primary" : "neutral"}>{l.active ? "Hoạt động" : "Ngưng"}</StatusPill>
              </div>

              <div className="relative grid grid-cols-2 gap-sm mb-sm">
                <Cell icon="groups" label="Sức chứa" value={`${l.capacity}`} />
                <Cell icon="schedule" label="Giờ mở" value={`${l.opensAt}–${l.closesAt}`} />
              </div>

              {l.amenities.length > 0 && (
                <div className="relative flex flex-wrap gap-xs mb-sm">
                  {l.amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container-low border border-outline-variant text-caption text-on-surface-variant"
                    >
                      <Icon name={AMENITY_ICON[a] ?? "check_circle"} className="text-[14px]" />
                      {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="relative flex gap-sm pt-sm border-t border-surface-variant mt-auto">
                <Link
                  href={`/admin/locations/${l.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-xs bg-surface-container-low text-on-surface border border-outline-variant py-sm rounded-lg text-label-md hover:bg-surface-container transition-colors"
                >
                  <Icon name="edit" className="text-[16px]" /> Sửa
                </Link>
                <form action={toggleLocationAction.bind(null, l.id)} className="flex-1">
                  <SubmitButton
                    size="sm"
                    variant={l.active ? "outline-danger" : "outline-primary"}
                    icon={l.active ? "do_disturb_on" : "check_circle"}
                    pendingLabel={l.active ? "Đang ngưng…" : "Đang kích hoạt…"}
                    className="w-full"
                  >
                    {l.active ? "Ngưng" : "Kích hoạt"}
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Cell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-lg border border-outline-variant px-sm py-xs">
      <p className="text-caption text-on-surface-variant uppercase tracking-wide mb-xs">{label}</p>
      <p className="text-body-md font-semibold text-on-surface flex items-center gap-xs">
        <Icon name={icon} className="text-[18px] text-on-surface-variant" /> {value}
      </p>
    </div>
  );
}
