import { LocationForm } from "../LocationForm";
import { requireAdmin } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";

export default async function NewLocation() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <PageHeader
        pillIcon="add_business"
        pillLabel="Phòng mới"
        title="Thêm"
        accent="phòng họp."
        description="Khai báo phòng đặt mới — sức chứa, giờ hoạt động và tiện nghi."
        crumbs={[
          { href: "/admin", label: "Quản trị" },
          { href: "/admin/locations", label: "Phòng họp" },
          { href: "#", label: "Mới" },
        ]}
      />
      <LocationForm />
    </div>
  );
}
