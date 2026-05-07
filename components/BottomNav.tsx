"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const ITEMS = [
  { href: "/calendar", label: "Lịch trình", icon: "view_agenda", match: (p: string) => p === "/calendar" || p.startsWith("/calendar/") && !p.startsWith("/calendar/resource") },
  { href: "/bookings", label: "Lịch của tôi", icon: "event", match: (p: string) => p === "/bookings" || (p.startsWith("/bookings/") && p !== "/bookings/new") },
  { href: "/calendar/resource", label: "Phòng", icon: "meeting_room", match: (p: string) => p.startsWith("/calendar/resource") },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Điều hướng chính"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-outline-variant pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around h-16">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="h-full flex flex-col items-center justify-center gap-0.5 text-on-surface-variant active:scale-95 transition-transform"
              >
                <span
                  className={`flex items-center justify-center w-16 h-7 rounded-full transition-colors ${
                    active ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"
                  }`}
                >
                  <Icon name={item.icon} className="text-[22px]" />
                </span>
                <span className={`text-caption font-semibold ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
