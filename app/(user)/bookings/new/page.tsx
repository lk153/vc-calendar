import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { Icon } from "@/components/Icon";
import { NewBookingForm } from "./NewBookingForm";

export default async function NewBookingPage() {
  const user = await requireUser();
  const [locations, users] = await Promise.all([
    db.location.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { active: true, NOT: { id: user.id } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-container/30 via-background to-background">
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.7), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/3 w-[28rem] h-[28rem] rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(110,231,183,0.55), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at top, black 30%, transparent 70%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-md md:px-lg pt-md pb-md">
          <div className="flex items-center gap-sm text-caption text-on-surface-variant mb-md">
            <Link href="/calendar" className="inline-flex items-center gap-xs hover:text-on-surface transition-colors">
              <Icon name="arrow_back" className="text-[16px]" />
              Lịch
            </Link>
            <Icon name="chevron_right" className="text-[14px] text-outline" />
            <span className="text-on-surface font-semibold">Đặt lịch mới</span>
          </div>

          <div className="flex items-end justify-between gap-md flex-wrap">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface text-on-primary-container border border-primary-container/60 text-caption font-bold uppercase tracking-wider shadow-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Lập lịch
              </span>
              <h1 className="font-manrope font-bold text-headline-xl text-on-surface mt-sm leading-tight">
                Đặt cuộc họp <span className="text-primary">trong vài giây.</span>
              </h1>
              <p className="text-body-lg text-on-surface-variant mt-xs">
                Chọn thời gian, đặt phòng, mời đúng người. Hệ thống sẽ tự xử lý xung đột và gửi thông báo.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-sm bg-surface border border-surface-variant rounded-full px-md py-xs shadow-soft">
              <Icon name="public" className="text-on-surface-variant text-[18px]" />
              <span className="text-body-sm text-on-surface-variant">Múi giờ:</span>
              <span className="text-body-sm font-semibold text-on-surface">{user.timezone}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-md md:px-lg py-md pb-[calc(96px+env(safe-area-inset-bottom))]">
        <NewBookingForm
          locations={locations}
          users={users}
          userTimezone={user.timezone}
          userName={user.name ?? "Bạn"}
        />
      </main>
    </div>
  );
}
