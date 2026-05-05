import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Icon } from "@/components/Icon";

export async function TopBar({ title = "Scheduler", admin = false }: { title?: string; admin?: boolean }) {
  const session = await auth();
  const user = session?.user;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full px-md h-16 bg-surface/80 backdrop-blur-md border-b border-surface-variant">
      <Link href={admin ? "/admin" : "/calendar"} className="flex items-center gap-sm group">
        {!admin && (
          <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-soft group-hover:shadow-soft-lg transition-shadow">
            <Icon name="calendar_month" className="text-[20px]" />
          </span>
        )}
        <h1 className="font-manrope text-headline-md font-bold tracking-tight text-on-surface">{title}</h1>
      </Link>

      {!admin && (
        <nav className="hidden md:flex items-center gap-xs">
          <NavLink href="/calendar" icon="view_agenda">Lịch trình</NavLink>
          <NavLink href="/bookings" icon="event">Lịch của tôi</NavLink>
          <NavLink href="/calendar/resource" icon="meeting_room">Phòng</NavLink>
          <NavLink href="/bookings/new" icon="add" primary>Đặt lịch mới</NavLink>
        </nav>
      )}

      <div className="flex items-center gap-sm">
        {user && (
          <div className="hidden md:flex items-center gap-sm bg-surface-container-low border border-surface-variant rounded-full pl-1 pr-sm py-1">
            <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-caption font-bold flex items-center justify-center">
              {initials}
            </span>
            <span className="text-body-sm text-on-surface font-semibold leading-none">{user.name?.split(" ")[0]}</span>
          </div>
        )}
        <form action={logout}>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
            title="Đăng xuất"
          >
            <Icon name="logout" />
          </button>
        </form>
      </div>
    </header>
  );
}

function NavLink({ href, icon, children, primary }: { href: string; icon: string; children: React.ReactNode; primary?: boolean }) {
  const cls = primary
    ? "inline-flex items-center gap-xs px-sm py-xs rounded-full bg-primary text-on-primary font-semibold text-body-sm shadow-soft hover:shadow-soft-lg hover:opacity-95 transition-all"
    : "inline-flex items-center gap-xs px-sm py-xs rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-body-sm font-semibold transition-colors";
  return (
    <Link href={href} className={cls}>
      <Icon name={icon} className="text-[16px]" />
      {children}
    </Link>
  );
}
