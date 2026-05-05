import Link from "next/link";
import { Icon } from "@/components/Icon";

export function AgendaEmptyState({ userName }: { userName?: string | null }) {
  const greeting = greetingFor(new Date());
  return (
    <section
      aria-labelledby="empty-headline"
      className="relative overflow-hidden rounded-xl border border-surface-variant bg-surface shadow-soft"
    >
      <DecorativeBackdrop />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-lg p-md md:p-lg">
        <div className="flex flex-col justify-center">
          <span className="inline-flex items-center self-start gap-xs px-sm py-xs rounded-full bg-primary-container text-on-primary-container text-caption font-semibold uppercase tracking-wide">
            <Icon name="auto_awesome" className="text-[14px]" />
            Trống lịch
          </span>

          <h3 id="empty-headline" className="font-manrope font-bold text-headline-lg text-on-surface mt-sm">
            {greeting}
            {userName ? `, ${firstName(userName)}` : ""}.
            <br />
            <span className="text-primary">Tuần của bạn đang rảnh.</span>
          </h3>

          <p className="text-body-md text-on-surface-variant max-w-md mt-sm">
            Chưa có cuộc họp nào trong 7 ngày tới. Hãy đặt lịch mới hoặc xem những phòng đang trống.
          </p>

          <div className="flex flex-wrap gap-sm mt-md">
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded-lg font-semibold shadow-soft hover:shadow-soft-lg hover:opacity-95 transition-all"
            >
              <Icon name="add" className="text-[18px]" />
              Đặt cuộc họp
            </Link>
            <Link
              href="/calendar/resource"
              className="inline-flex items-center gap-xs bg-surface-container-low text-on-surface border border-outline-variant px-md py-sm rounded-lg font-semibold hover:bg-surface-container transition-colors"
            >
              <Icon name="meeting_room" className="text-[18px]" />
              Xem phòng trống
            </Link>
          </div>

          <ul className="mt-md flex flex-col gap-xs text-body-sm text-on-surface-variant">
            <Tip icon="bolt" text="Nhấn 'Đặt lịch mới' để tạo lịch 30 phút từ bây giờ." />
            <Tip icon="schedule" text="Xung đột phòng được chặn tự động; xung đột người tham dự sẽ được cảnh báo." />
            <Tip icon="public" text="Tất cả thời gian hiển thị theo múi giờ của bạn." />
          </ul>
        </div>

        <div className="hidden lg:flex items-center justify-center">
          <CalendarIllustration />
        </div>
      </div>
    </section>
  );
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-start gap-sm">
      <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon} className="text-[16px] text-on-surface-variant" />
      </span>
      <span>{text}</span>
    </li>
  );
}

function DecorativeBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-60"
        style={{ background: "radial-gradient(closest-side, rgba(167,243,208,0.6), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(209,250,229,0.7), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />
    </>
  );
}

function CalendarIllustration() {
  return (
    <svg viewBox="0 0 320 280" className="w-full max-w-md drop-shadow-[0_18px_40px_rgba(15,23,42,0.10)]" role="img" aria-hidden>
      <defs>
        <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="header" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#059669" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      <circle cx="40" cy="60" r="12" fill="#a7f3d0" />
      <rect x="270" y="40" width="22" height="22" rx="6" fill="#d1fae5" transform="rotate(18 281 51)" />
      <circle cx="290" cy="220" r="8" fill="#a7f3d0" />
      <rect x="20" y="220" width="14" height="14" rx="3" fill="#cbd5e1" />

      <ellipse cx="160" cy="252" rx="110" ry="10" fill="#0f172a" opacity="0.06" filter="url(#soft)" />

      <g>
        <rect x="50" y="50" width="220" height="190" rx="18" fill="url(#card)" stroke="#e2e8f0" />
        <rect x="50" y="50" width="220" height="48" rx="18" fill="url(#header)" />
        <rect x="50" y="84" width="220" height="14" fill="url(#header)" />
        <circle cx="78" cy="74" r="6" fill="#ffffff" opacity="0.9" />
        <circle cx="100" cy="74" r="6" fill="#ffffff" opacity="0.7" />
        <text x="160" y="80" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="14" fontWeight="700" fill="#ffffff">
          TUẦN NÀY
        </text>

        {Array.from({ length: 15 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const x = 70 + col * 36;
          const y = 118 + row * 36;
          const isToday = i === 6;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill={isToday ? "#059669" : "#f8fafc"} stroke={isToday ? "#059669" : "#e2e8f0"} />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill={isToday ? "#ffffff" : "#475569"}
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        <g transform="translate(225,215)">
          <path d="M0,-10 L2,-2 L10,0 L2,2 L0,10 L-2,2 L-10,0 L-2,-2 Z" fill="#10b981" />
        </g>
      </g>

      <g transform="translate(232,52)">
        <circle r="22" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2" />
        <circle r="16" fill="#059669" />
        <path d="M-7,0 L-2,5 L8,-5" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Khuya rồi";
  if (h < 12) return "Chào buổi sáng";
  if (h < 17) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function firstName(s: string) {
  const parts = s.trim().split(" ");
  return parts[parts.length - 1];
}
