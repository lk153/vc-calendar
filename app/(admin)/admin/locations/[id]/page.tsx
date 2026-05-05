import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { LocationForm } from "../LocationForm";
import { PageHeader } from "@/components/PageHeader";

export default async function EditLocation({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loc = await db.location.findUnique({ where: { id } });
  if (!loc) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader
        pillIcon="edit_location"
        pillLabel="Sửa phòng"
        title={loc.name}
        description="Cập nhật sức chứa, giờ hoạt động hoặc tiện nghi."
        crumbs={[
          { href: "/admin", label: "Quản trị" },
          { href: "/admin/locations", label: "Phòng họp" },
          { href: "#", label: loc.name },
        ]}
      />
      <LocationForm location={loc} />
    </div>
  );
}
