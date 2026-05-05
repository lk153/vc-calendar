"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { createBookingAction } from "./actions";

type Location = {
  id: string;
  name: string;
  address: string;
  floor: string | null;
  capacity: number;
  amenities: string[];
};
type UserOpt = { id: string; name: string; email: string };

const AMENITY_ICON: Record<string, string> = {
  Video: "videocam",
  Projector: "tv",
  Whiteboard: "edit_note",
  Whiteboards: "edit_note",
  Phone: "call",
  TV: "tv",
};

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const STEP_PALETTE = [
  { id: "section-details", icon: "event_note", label: "Chi tiết" },
  { id: "section-when", icon: "schedule", label: "Thời gian" },
  { id: "section-room", icon: "meeting_room", label: "Phòng" },
  { id: "section-attendees", icon: "group", label: "Người tham dự" },
];

function pad(n: number) { return String(n).padStart(2, "0"); }
function initials(s: string) {
  return s.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function nowLocalRoundedToHalfHour(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function addMinutes(localISO: string, mins: number): string {
  if (!localISO) return "";
  const d = new Date(localISO);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() + mins);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function combine(date: string, time: string): string {
  if (!date || !time) return "";
  return `${date}T${time}`;
}
function splitISO(localISO: string): { date: string; time: string } {
  if (!localISO) return { date: "", time: "" };
  const [date, time] = localISO.split("T");
  return { date: date ?? "", time: (time ?? "").slice(0, 5) };
}
function durationMinutes(s: string, e: string): number | null {
  if (!s || !e) return null;
  const a = new Date(s).getTime();
  const b = new Date(e).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return Math.round((b - a) / 60000);
}
function fmtDuration(m: number | null) {
  if (m == null) return null;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return [h ? `${h}h` : null, r ? `${r}m` : null].filter(Boolean).join(" ") || "0m";
}
function fmtDateLong(d: string) {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function fmtTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${pad(m)} ${ampm}`;
}

export function NewBookingForm({
  locations,
  users,
  userTimezone,
  userName,
}: {
  locations: Location[];
  users: UserOpt[];
  userTimezone: string;
  userName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [allowAttendeeOverride, setAllowAttendeeOverride] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationId, setLocationId] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const start = nowLocalRoundedToHalfHour();
    const end = addMinutes(start, 60);
    const a = splitISO(start);
    const b = splitISO(end);
    setDate(a.date);
    setStartTime(a.time);
    setEndTime(b.time);
  }, []);

  const startsAt = combine(date, startTime);
  const endsAt = combine(date, endTime);
  const durMin = durationMinutes(startsAt, endsAt);

  const selectedLocation = useMemo(() => locations.find((l) => l.id === locationId), [locations, locationId]);
  const selectedAttendees = useMemo(() => users.filter((u) => attendees.includes(u.id)), [users, attendees]);
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const stepDone = [
    Boolean(title.trim()),
    Boolean(date && startTime && endTime && (durMin ?? 0) > 0),
    Boolean(locationId),
    true,
  ];
  const stepCount = stepDone.filter(Boolean).length;
  const canSubmit = stepDone[0] && stepDone[1] && stepDone[2];

  function applyDuration(mins: number) {
    if (!startTime) return;
    const fakeStart = combine("2000-01-01", startTime);
    const fakeEnd = addMinutes(fakeStart, mins);
    setEndTime(splitISO(fakeEnd).time);
  }

  function toggleAttendee(id: string) {
    setAttendees((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("startsAt", startsAt);
    fd.set("endsAt", endsAt);
    fd.set("locationId", locationId);
    fd.set("attendeeIds", attendees.join(","));
    fd.set("allowAttendeeOverride", allowAttendeeOverride ? "1" : "0");
    startTransition(async () => {
      const res = await createBookingAction(fd);
      if (res.ok) router.push(`/bookings/${res.id}`);
      else if (res.kind === "attendee-warn") setWarning(res.error);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-md items-start">
      <div className="flex flex-col gap-md min-w-0">
        <Stepper steps={STEP_PALETTE} done={stepDone} />

        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-sm flex items-start gap-sm border border-error/20 shadow-soft">
            <Icon name="error" className="text-[20px] mt-0.5" />
            <span className="text-body-sm">{error}</span>
          </div>
        )}

        <Card
          id="section-details"
          step={1}
          done={stepDone[0]}
          icon="event_note"
          title="Chi tiết sự kiện"
          subtitle="Đặt tên và mô tả nội dung cuộc họp."
        >
          <Field label="Tiêu đề" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="VD: Họp kế hoạch Q3"
              className={inputCls}
            />
          </Field>
          <Field label="Mô tả" hint="Nội dung, liên kết, hoặc bối cảnh.">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Không bắt buộc…"
              className={`${inputCls} resize-none py-sm h-auto`}
            />
          </Field>
        </Card>

        <Card
          id="section-when"
          step={2}
          done={stepDone[1]}
          icon="schedule"
          title="Thời gian"
          subtitle="Chọn ngày và khoảng thời gian diễn ra."
          trailing={fmtDuration(durMin) ? <Pill>{fmtDuration(durMin)}</Pill> : null}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
            <Field label="Ngày" className="md:col-span-1">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Bắt đầu">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  const v = e.target.value;
                  const prev = durMin ?? 60;
                  setStartTime(v);
                  if (v) {
                    const fakeStart = combine("2000-01-01", v);
                    setEndTime(splitISO(addMinutes(fakeStart, prev)).time);
                  }
                }}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Kết thúc">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 p-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between gap-sm">
              <span className="inline-flex items-center gap-xs text-body-sm font-semibold text-on-surface">
                <Icon name="bolt" className="text-[16px] text-primary" />
                Thời lượng nhanh
              </span>
              <span className="text-caption text-on-surface-variant">Bấm để đặt giờ kết thúc</span>
            </div>
            <div role="radiogroup" aria-label="Thời lượng nhanh" className="grid grid-cols-3 sm:grid-cols-6 gap-xs">
              {DURATION_PRESETS.map((m) => {
                const active = durMin === m;
                const label = m < 60 ? `${m} phút` : `${m / 60} giờ`;
                return (
                  <button
                    type="button"
                    key={m}
                    role="radio"
                    aria-checked={active}
                    onClick={() => applyDuration(m)}
                    className={`group relative h-10 px-sm rounded-full border text-body-sm font-semibold inline-flex items-center justify-center gap-xs transition-all whitespace-nowrap ${
                      active
                        ? "bg-primary-container text-on-primary-container border-primary shadow-soft"
                        : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low hover:text-on-surface hover:border-outline"
                    }`}
                  >
                    {active ? (
                      <Icon name="check" className="text-[16px] text-primary" />
                    ) : (
                      <Icon name="schedule" className="text-[14px] text-on-surface-variant/60 group-hover:text-on-surface-variant" />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card
          id="section-room"
          step={3}
          done={stepDone[2]}
          icon="meeting_room"
          title="Chọn phòng"
          subtitle="Phòng có sức chứa và tiện nghi phù hợp."
          trailing={selectedLocation ? <Pill>{selectedLocation.name}</Pill> : null}
        >
          {locations.length === 0 ? (
            <EmptyHint icon="info" text="Chưa có phòng nào hoạt động. Liên hệ quản trị viên để thêm." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {locations.map((l) => (
                <RoomCard
                  key={l.id}
                  location={l}
                  active={l.id === locationId}
                  onClick={() => setLocationId(l.id === locationId ? "" : l.id)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card
          id="section-attendees"
          step={4}
          done={stepDone[3]}
          icon="group"
          title="Người tham dự"
          subtitle="Mời đồng nghiệp tham gia cuộc họp."
          optional
          trailing={selectedAttendees.length > 0 ? <Pill>{selectedAttendees.length} đã thêm</Pill> : null}>
          <div className="relative">
            <Icon name="search" className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email…"
              className={`${inputCls} pl-10`}
            />
          </div>

          {selectedAttendees.length > 0 && (
            <div className="flex flex-wrap gap-xs">
              {selectedAttendees.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-xs pl-xs pr-1 py-0.5 rounded-full bg-primary-container text-on-primary-container text-caption shadow-soft"
                >
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                    {initials(u.name)}
                  </span>
                  {u.name}
                  <button
                    type="button"
                    onClick={() => toggleAttendee(u.id)}
                    className="w-5 h-5 rounded-full hover:bg-on-primary-container/10 flex items-center justify-center"
                    aria-label={`Xóa ${u.name}`}
                  >
                    <Icon name="close" className="text-[14px]" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface">
            {filteredUsers.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant py-md text-center">Không tìm thấy người phù hợp.</p>
            ) : (
              <ul className="divide-y divide-outline-variant max-h-72 overflow-y-auto">
                {filteredUsers.map((u) => {
                  const checked = attendees.includes(u.id);
                  return (
                    <li key={u.id}>
                      <label
                        className={`flex items-center justify-between gap-sm px-sm py-sm cursor-pointer transition-colors ${
                          checked ? "bg-primary-container/30 hover:bg-primary-container/40" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <span className="flex items-center gap-sm min-w-0">
                          <span className={`w-9 h-9 rounded-full text-body-sm font-bold flex items-center justify-center shrink-0 transition-colors ${
                            checked ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"
                          }`}>
                            {initials(u.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-body-sm font-semibold text-on-surface truncate">{u.name}</span>
                            <span className="block text-caption text-on-surface-variant truncate">{u.email}</span>
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAttendee(u.id)}
                          className="w-5 h-5 rounded text-primary border-outline focus:ring-primary"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {warning && (
          <div className="bg-error-container text-on-error-container rounded-xl p-sm flex flex-col gap-xs border border-error/20 shadow-soft">
            <div className="flex items-center gap-xs">
              <Icon name="warning" />
              <span className="text-body-sm font-semibold">{warning}</span>
            </div>
            <label className="text-body-sm flex items-center gap-xs cursor-pointer">
              <input
                type="checkbox"
                checked={allowAttendeeOverride}
                onChange={(e) => setAllowAttendeeOverride(e.target.checked)}
                className="w-4 h-4 rounded text-error focus:ring-error"
              />
              Vẫn xác nhận (ghi đè bởi người tổ chức)
            </label>
          </div>
        )}

        <div className="sticky bottom-0 -mx-md md:-mx-lg px-md md:px-lg py-sm bg-surface/95 backdrop-blur-md border-t border-surface-variant flex gap-sm pb-[calc(env(safe-area-inset-bottom)+12px)] z-20">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1 h-12 rounded-lg bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="flex-[2] h-12 rounded-lg bg-primary text-on-primary font-semibold shadow-soft hover:shadow-soft-lg hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-xs"
          >
            {isPending ? (
              <>
                <Icon name="progress_activity" className="animate-spin text-[18px]" /> Đang lưu…
              </>
            ) : (
              <>
                <Icon name="event_available" className="text-[18px]" /> Xác nhận đặt lịch
              </>
            )}
          </button>
        </div>
      </div>

      <SummaryPanel
        title={title}
        description={description}
        date={date}
        startTime={startTime}
        endTime={endTime}
        durMin={durMin}
        location={selectedLocation}
        attendees={selectedAttendees}
        userName={userName}
        userTimezone={userTimezone}
        canSubmit={!!canSubmit}
        isPending={isPending}
        progress={stepCount}
        onCancel={() => router.back()}
      />
    </form>
  );
}

function RoomCard({
  location: l,
  active,
  onClick,
}: {
  location: Location;
  active: boolean;
  onClick: () => void;
}) {
  const seed = hashSeed(l.id);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative text-left rounded-xl bg-surface overflow-hidden transition-all focus:outline-none focus:ring-4 focus:ring-primary/15 ${
        active
          ? "ring-2 ring-primary shadow-soft-lg"
          : "ring-1 ring-surface-variant shadow-soft hover:ring-outline hover:shadow-soft-lg hover:-translate-y-0.5"
      }`}
    >
      <RoomCover seed={seed} active={active} l={l} />
      <div className="p-md flex flex-col gap-sm">
        <div className="min-w-0">
          <h4 className="font-manrope font-bold text-headline-md text-on-surface leading-tight truncate">{l.name}</h4>
          <p className="text-body-sm text-on-surface-variant flex items-center gap-xs mt-xs truncate">
            <Icon name="place" className="text-[14px] text-on-surface-variant/70" />
            {[l.floor, l.address].filter(Boolean).join(" · ")}
          </p>
        </div>
        {l.amenities.length > 0 && (
          <div className="flex items-center gap-xs flex-wrap pt-sm border-t border-surface-variant">
            {l.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-xs h-7 px-sm rounded-full bg-surface-container-low border border-outline-variant text-caption text-on-surface-variant"
              >
                <Icon name={AMENITY_ICON[a] ?? "check_circle"} className="text-[14px]" />
                {a}
              </span>
            ))}
            {l.amenities.length > 4 && (
              <span className="text-caption text-on-surface-variant self-center">+{l.amenities.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function RoomCover({ seed, active, l }: { seed: number; active: boolean; l: Location }) {
  // Two distinct palette presets cycled by seed for visual variety while staying on-brand.
  const palette =
    seed % 2 === 0
      ? { from: "#a7f3d0", to: "#10b981" }
      : { from: "#d1fae5", to: "#059669" };

  return (
    <div
      className={`relative aspect-[16/9] overflow-hidden ${active ? "" : ""}`}
      style={{ background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)` }}
      aria-hidden
    >
      {/* Decorative architectural lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`fade-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* sun glow */}
        <circle cx={50 + (seed % 60)} cy={40} r="60" fill="#ffffff" opacity="0.18" />
        {/* horizon */}
        <rect x="0" y="118" width="320" height="62" fill="#ffffff" opacity="0.10" />
        {/* building silhouettes */}
        <g fill="#ffffff" fillOpacity="0.18">
          <rect x="20" y="80" width="40" height="38" rx="2" />
          <rect x="68" y="62" width="50" height="56" rx="2" />
          <rect x="124" y="92" width="34" height="26" rx="2" />
          <rect x="166" y="70" width="44" height="48" rx="2" />
          <rect x="218" y="82" width="58" height="36" rx="2" />
          <rect x="284" y="96" width="28" height="22" rx="2" />
        </g>
        {/* windows */}
        <g fill="#ffffff" fillOpacity="0.45">
          <rect x="76" y="70" width="6" height="6" />
          <rect x="86" y="70" width="6" height="6" />
          <rect x="96" y="70" width="6" height="6" />
          <rect x="76" y="82" width="6" height="6" />
          <rect x="86" y="82" width="6" height="6" />
          <rect x="174" y="80" width="6" height="6" />
          <rect x="184" y="80" width="6" height="6" />
          <rect x="174" y="92" width="6" height="6" />
        </g>
        <rect x="0" y="0" width="320" height="180" fill={`url(#fade-${seed})`} />
      </svg>

      {/* Subtle glass card showing room glyph */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/40 shadow-soft">
          <Icon name="meeting_room" className="text-on-primary text-[28px]" />
        </span>
      </div>

      {/* Top-left: capacity chip */}
      <span className="absolute top-sm left-sm inline-flex items-center gap-xs h-7 pl-xs pr-sm rounded-full bg-on-primary/95 text-primary text-caption font-bold shadow-soft">
        <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center">
          <Icon name="group" className="text-[12px]" />
        </span>
        {l.capacity} người
      </span>

      {/* Top-right: status badge */}
      <span
        className={`absolute top-sm right-sm inline-flex items-center gap-xs h-7 px-sm rounded-full text-caption font-bold transition-all shadow-soft ${
          active
            ? "bg-primary text-on-primary scale-100"
            : "bg-on-primary/95 text-on-surface-variant"
        }`}
      >
        {active ? (
          <>
            <Icon name="check_circle" className="text-[14px]" />
            Đã chọn
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-primary" />
            Trống
          </>
        )}
      </span>
    </div>
  );
}

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Stepper({ steps, done }: { steps: typeof STEP_PALETTE; done: boolean[] }) {
  const total = steps.length;
  const completed = done.filter(Boolean).length;
  const pct = Math.round((completed / total) * 100);
  const currentIdx = done.findIndex((d) => !d);
  const allDone = currentIdx === -1;

  function jump(id: string) {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Tiến độ đặt lịch"
      className="sticky top-0 z-30 -mx-md md:-mx-lg px-md md:px-lg bg-background/85 backdrop-blur-md"
    >
      <div className="bg-surface border border-surface-variant rounded-full shadow-soft pl-xs pr-sm h-12 flex items-center gap-xs overflow-hidden">
        <span
          className={`shrink-0 inline-flex items-center gap-xs h-9 pl-xs pr-sm rounded-full ${
            allDone ? "bg-primary text-on-primary" : "bg-primary-container text-on-primary-container"
          }`}
          title={allDone ? "Sẵn sàng" : `Bước ${currentIdx + 1}/${total}`}
        >
          <span className="w-7 h-7 rounded-full bg-white/90 text-primary flex items-center justify-center font-manrope font-bold text-caption">
            {allDone ? <Icon name="check" className="text-[16px]" /> : currentIdx + 1}
          </span>
          <span className="font-bold text-body-sm hidden sm:inline">
            {allDone ? "Sẵn sàng xác nhận" : steps[currentIdx].label}
          </span>
        </span>

        <ol className="flex-1 flex items-center min-w-0 overflow-x-auto no-scrollbar gap-1">
          {steps.map((s, i) => {
            const isDone = done[i];
            const isCurrent = i === currentIdx;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => jump(s.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`group inline-flex items-center gap-xs h-9 pl-xs pr-sm rounded-full text-body-sm font-semibold transition-all whitespace-nowrap ${
                    isDone
                      ? "text-on-surface hover:bg-surface-container-low"
                      : isCurrent
                      ? "text-primary hover:bg-primary/10"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-manrope font-bold transition-all ${
                      isDone
                        ? "bg-primary text-on-primary"
                        : isCurrent
                        ? "bg-surface text-primary border-2 border-primary"
                        : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {isDone ? <Icon name="check" className="text-[14px]" /> : i + 1}
                  </span>
                  <span className="hidden md:inline">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <span
          className="shrink-0 text-caption font-bold text-on-surface-variant tabular-nums tracking-wider px-xs hidden sm:inline"
          aria-label={`${pct} phần trăm hoàn tất`}
        >
          {pct}%
        </span>
      </div>
      <div
        aria-hidden
        className="-mt-px h-0.5 mx-md rounded-full bg-surface-variant overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </nav>
  );
}

function SummaryPanel(props: {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  durMin: number | null;
  location?: Location;
  attendees: UserOpt[];
  userName: string;
  userTimezone: string;
  canSubmit: boolean;
  isPending: boolean;
  progress: number;
  onCancel: () => void;
}) {
  const { title, date, startTime, endTime, durMin, location, attendees, userName, userTimezone, canSubmit, isPending, onCancel } = props;
  const ready = canSubmit;

  return (
    <aside className="hidden lg:block sticky top-md self-start">
      <div className="bg-surface border border-surface-variant rounded-xl shadow-soft-lg overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-on-primary-fixed text-on-primary p-md relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30"
            style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.4), transparent 70%)" }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-xs text-caption font-bold uppercase tracking-wider opacity-90">
              <Icon name="visibility" className="text-[14px]" />
              Xem trước
            </span>
            <h3 className="font-manrope font-bold text-headline-md mt-xs leading-tight">
              {title || <span className="opacity-70 italic">Cuộc họp chưa đặt tên</span>}
            </h3>
            <p className="text-body-sm opacity-90 mt-xs">
              {date ? new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", month: "short", day: "numeric" }) : "Chọn ngày"}
              {startTime && endTime && ` · ${fmtTime(startTime)} – ${fmtTime(endTime)}`}
            </p>
          </div>
        </div>

        <DayTimeline startTime={startTime} endTime={endTime} />

        <div className="p-md flex flex-col gap-sm">
          <SummaryRow icon="schedule" label="Thời lượng">
            <span className={durMin ? "text-on-surface font-semibold" : "text-on-surface-variant italic"}>
              {fmtDuration(durMin) ?? "Chưa đặt"}
            </span>
          </SummaryRow>
          <SummaryRow icon="public" label="Múi giờ">
            <span className="text-on-surface">{userTimezone}</span>
          </SummaryRow>
          <SummaryRow icon="meeting_room" label="Phòng">
            {location ? (
              <div className="flex flex-col">
                <span className="text-on-surface font-semibold">{location.name}</span>
                <span className="text-caption text-on-surface-variant truncate">
                  {[location.floor, location.address].filter(Boolean).join(" · ")} · sức chứa {location.capacity}
                </span>
              </div>
            ) : (
              <span className="text-on-surface-variant italic">Chưa chọn</span>
            )}
          </SummaryRow>
          <SummaryRow icon="group" label={`Người tham dự (${attendees.length + 1})`}>
            <div className="flex -space-x-2 items-center">
              <span
                className="w-8 h-8 rounded-full ring-2 ring-surface bg-primary text-on-primary text-caption font-bold flex items-center justify-center"
                title={`${userName} (bạn)`}
              >
                {initials(userName)}
              </span>
              {attendees.slice(0, 5).map((u) => (
                <span
                  key={u.id}
                  className="w-8 h-8 rounded-full ring-2 ring-surface bg-secondary-container text-on-secondary-container text-caption font-bold flex items-center justify-center"
                  title={u.name}
                >
                  {initials(u.name)}
                </span>
              ))}
              {attendees.length > 5 && (
                <span className="w-8 h-8 rounded-full ring-2 ring-surface bg-surface-variant text-on-surface-variant text-caption font-bold flex items-center justify-center">
                  +{attendees.length - 5}
                </span>
              )}
            </div>
          </SummaryRow>
        </div>

        <div className="border-t border-surface-variant p-md flex flex-col gap-xs">
          <button
            type="submit"
            disabled={!ready || isPending}
            className="w-full h-12 rounded-lg bg-primary text-on-primary font-semibold shadow-soft hover:shadow-soft-lg hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-xs"
          >
            {isPending ? (
              <>
                <Icon name="progress_activity" className="animate-spin text-[18px]" /> Đang lưu…
              </>
            ) : (
              <>
                <Icon name="event_available" className="text-[18px]" /> Xác nhận đặt lịch
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="w-full h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-body-sm font-semibold transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <p className="text-caption text-on-surface-variant text-center mt-xs flex items-center justify-center gap-xs">
            <Icon name="lock" className="text-[14px]" />
            Xung đột phòng được chặn tự động
          </p>
        </div>
      </div>
    </aside>
  );
}

function DayTimeline({ startTime, endTime }: { startTime: string; endTime: string }) {
  const startMin = startTime ? toMinutes(startTime) : null;
  const endMin = endTime ? toMinutes(endTime) : null;
  const dayStart = 6 * 60;
  const dayEnd = 22 * 60;
  const range = dayEnd - dayStart;
  const left = startMin != null ? Math.max(0, ((startMin - dayStart) / range) * 100) : null;
  const width =
    startMin != null && endMin != null && endMin > startMin
      ? Math.min(100 - (left ?? 0), ((endMin - startMin) / range) * 100)
      : null;

  return (
    <div className="px-md py-sm bg-surface-container-low border-b border-surface-variant">
      <div className="flex items-center justify-between text-caption text-on-surface-variant mb-xs">
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>10 PM</span>
      </div>
      <div className="relative h-2 bg-surface-variant rounded-full overflow-hidden">
        {[9, 12, 15, 18].map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-outline-variant"
            style={{ left: `${((h * 60 - dayStart) / range) * 100}%` }}
          />
        ))}
        {left != null && width != null && (
          <div
            className="absolute top-0 bottom-0 bg-primary rounded-full shadow-soft transition-all duration-300"
            style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-caption mt-xs">
        <span className="text-on-surface-variant">
          {startTime ? fmtTime(startTime) : "—"}
        </span>
        <span className="text-on-surface-variant">
          {endTime ? fmtTime(endTime) : "—"}
        </span>
      </div>
    </div>
  );
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const inputCls =
  "w-full h-12 px-md rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all hover:border-outline focus:border-primary focus:ring-4 focus:ring-primary/15";

function Card({
  id,
  step,
  done,
  icon,
  title,
  subtitle,
  optional,
  trailing,
  children,
}: {
  id?: string;
  step: number;
  done: boolean;
  icon: string;
  title: string;
  subtitle?: string;
  optional?: boolean;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{ scrollMarginTop: "5rem" }}
      className={`relative bg-surface border rounded-xl transition-all overflow-hidden ${
        done ? "border-primary/30 shadow-soft" : "border-surface-variant shadow-soft"
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${done ? "bg-primary" : "bg-surface-variant"}`}
        aria-hidden
      />
      <header className="flex items-center justify-between gap-sm px-md pt-md pb-sm">
        <div className="flex items-center gap-sm min-w-0">
          <span
            className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              done
                ? "bg-primary text-on-primary shadow-soft"
                : "bg-primary-container/60 text-on-primary-container"
            }`}
          >
            <Icon name={done ? "check" : icon} className="text-[22px]" />
            <span
              className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[11px] font-manrope font-bold flex items-center justify-center ring-2 ring-surface ${
                done ? "bg-surface text-primary" : "bg-primary text-on-primary"
              }`}
              aria-hidden
            >
              {step}
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="font-manrope font-bold text-body-lg text-on-surface leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-caption text-on-surface-variant mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          {optional && (
            <span className="text-caption text-on-surface-variant tracking-wide italic">tuỳ chọn</span>
          )}
          {trailing}
        </div>
      </header>
      <div className="px-md pb-md flex flex-col gap-md">{children}</div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-sm py-0.5 rounded-full bg-primary-container text-on-primary-container text-caption font-bold">
      {children}
    </span>
  );
}

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-xs ${className ?? ""}`}>
      <span className="inline-flex items-center gap-xs text-body-sm font-semibold text-on-surface">
        {label}
        {required && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-error"
            aria-label="bắt buộc"
            title="bắt buộc"
          />
        )}
      </span>
      {children}
      {hint && (
        <span className="text-caption text-on-surface-variant flex items-center gap-xs">
          <Icon name="info" className="text-[14px] text-outline" /> {hint}
        </span>
      )}
    </label>
  );
}

function EmptyHint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl px-md py-sm flex items-center gap-sm">
      <Icon name={icon} className="text-on-surface-variant" />
      <p className="text-body-sm text-on-surface-variant">{text}</p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-sm">
      <span className="w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center shrink-0">
        <Icon name={icon} className="text-on-surface-variant text-[18px]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-caption uppercase text-on-surface-variant tracking-wide mb-0.5">{label}</div>
        <div className="text-body-sm">{children}</div>
      </div>
    </div>
  );
}
