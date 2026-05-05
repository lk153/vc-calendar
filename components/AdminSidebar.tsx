"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const items = [
  { href: "/admin", icon: "dashboard", label: "Bảng điều khiển" },
  { href: "/admin/locations", icon: "location_on", label: "Phòng họp" },
  { href: "/admin/bookings", icon: "event", label: "Lịch đặt" },
  { href: "/admin/users", icon: "group", label: "Người dùng" },
  { href: "/admin/audit", icon: "history", label: "Nhật ký" },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bottom-0 flex-col bg-surface border-r border-surface-variant z-40">
      <div className="px-md py-md border-b border-surface-variant">
        <Link href="/admin" className="flex items-center gap-sm group">
          <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-soft group-hover:shadow-soft-lg transition-shadow">
            <Icon name="calendar_month" className="text-[22px]" />
          </span>
          <div>
            <span className="block font-manrope font-bold text-headline-md text-on-surface leading-none">Scheduler</span>
            <span className="text-caption text-on-surface-variant uppercase tracking-wider">Quản trị</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 flex flex-col gap-xs px-sm py-md overflow-y-auto">
        <span className="px-sm pb-xs text-caption uppercase tracking-wider text-on-surface-variant font-bold">Quản lý</span>
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/admin" && path.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-sm px-sm py-sm rounded-lg text-body-md font-semibold transition-colors ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <Icon
                name={it.icon}
                className={`text-[20px] ${active ? "text-primary" : ""}`}
              />
              {it.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-md py-sm border-t border-surface-variant text-caption text-on-surface-variant">
        Nội bộ · v0.1
      </div>
    </aside>
  );
}
