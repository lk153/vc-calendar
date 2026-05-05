import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill, inputCls } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createUserAction, toggleUserAction } from "./actions";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Quản trị", USER: "Người dùng" };

export default async function UsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  const active = users.filter((u) => u.active).length;
  const admins = users.filter((u) => u.role === "ADMIN").length;

  return (
    <>
      <PageHeader
        pillIcon="group"
        pillLabel="Nhân sự"
        title="Người dùng &"
        accent="quyền truy cập."
        description={`${users.length} tổng cộng · ${active} đang hoạt động · ${admins} quản trị viên`}
      />

      <section className="bg-surface border border-surface-variant rounded-xl shadow-soft p-md mb-md">
        <div className="flex items-center gap-sm mb-sm border-b border-surface-variant pb-sm">
          <span className="w-9 h-9 rounded-xl bg-primary-container/60 text-on-primary-container flex items-center justify-center">
            <Icon name="person_add" className="text-[20px]" />
          </span>
          <h2 className="font-manrope font-bold text-headline-md text-on-surface">Mời người dùng</h2>
        </div>
        <form action={createUserAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-sm">
          <Field label="Họ tên" required><input name="name" required placeholder="Nguyễn Văn A" className={inputCls} /></Field>
          <Field label="Email" required><input name="email" type="email" required placeholder="a@congty.com" className={inputCls} /></Field>
          <Field label="Tên đăng nhập" required><input name="username" required placeholder="nva" className={inputCls} /></Field>
          <Field label="Mật khẩu tạm" required><input name="password" type="password" required placeholder="••••••••" className={inputCls} /></Field>
          <Field label="Vai trò"><select name="role" defaultValue="USER" className={inputCls}><option value="USER">Người dùng</option><option value="ADMIN">Quản trị</option></select></Field>
          <SubmitButton icon="send" variant="primary" pendingLabel="Đang tạo…" className="lg:col-span-5 mt-xs w-full">
            Tạo người dùng
          </SubmitButton>
        </form>
      </section>

      <section className="bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
        <div className="px-md py-sm flex items-center justify-between border-b border-surface-variant bg-surface-container-low">
          <h3 className="font-manrope font-bold text-headline-md text-on-surface flex items-center gap-sm">
            <Icon name="list_alt" className="text-on-surface-variant" /> Danh bạ
          </h3>
          <span className="text-caption text-on-surface-variant">{users.length} mục</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr className="text-label-md uppercase text-on-surface-variant">
              <th className="px-md py-sm">Người dùng</th>
              <th className="px-md py-sm">Tên đăng nhập</th>
              <th className="px-md py-sm">Vai trò</th>
              <th className="px-md py-sm">Trạng thái</th>
              <th className="px-md py-sm" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-md py-sm">
                  <div className="flex items-center gap-sm">
                    <span className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container font-bold text-label-md flex items-center justify-center">
                      {u.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-body-md font-semibold text-on-surface truncate">{u.name}</div>
                      <div className="text-caption text-on-surface-variant truncate">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-sm text-body-sm text-on-surface-variant">@{u.username}</td>
                <td className="px-md py-sm">
                  <StatusPill tone={u.role === "ADMIN" ? "primary" : "neutral"}>{ROLE_LABEL[u.role]}</StatusPill>
                </td>
                <td className="px-md py-sm">
                  <StatusPill tone={u.active ? "primary" : "neutral"}>{u.active ? "Hoạt động" : "Ngưng"}</StatusPill>
                </td>
                <td className="px-md py-sm text-right">
                  <form action={toggleUserAction.bind(null, u.id)}>
                    <SubmitButton
                      size="sm"
                      variant={u.active ? "outline-danger" : "outline-primary"}
                      icon={u.active ? "do_disturb_on" : "check_circle"}
                      pendingLabel={u.active ? "Đang ngưng…" : "Đang kích hoạt…"}
                    >
                      {u.active ? "Ngưng" : "Kích hoạt"}
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-md py-md text-center text-body-sm text-on-surface-variant">Chưa có người dùng.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-md uppercase text-on-surface-variant flex items-center gap-xs">
        {label}
        {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}
