# Calendar Booking — Revised Implementation Plan

## Context

Plan.MD lists a large feature set (admin + user sites, booking, locations, recurring, attendees, RSVP, reporting, PWA, etc.) targeting an MVP for internal company use, deployable to Vercel. Repo is empty — greenfield build.

The original brief is a feature wishlist, not an implementation plan. As principal architect, this revision cuts MVP scope, locks the stack, and lays out a phased build that ships a usable system fast and leaves room for the non-MVP items behind clear seams.

## Review of original Plan.MD

**Strengths:** good coverage of differentiator (locations as first-class resources), correct call on UTC storage, conflict detection, internal-auth simplification, no external calendar sync.

**Problems:**
- Scope too broad for MVP. Recurring exceptions, suggested times, free-busy lookup, check-in/QR, drag-to-reschedule, full reporting — all post-MVP.
- No stack decision (Mongo *or* Postgres). Booking conflict detection wants relational constraints + transactions → **Postgres**.
- No auth strategy named. Internal use + Google OAuth + username/password → **Auth.js (NextAuth v5)** with Credentials + Google providers.
- No conflict-detection mechanism specified. Naive `SELECT` then `INSERT` races. Need DB-level guard (exclusion constraint).
- Admin "manage scheduled registered by user" is vague — interpreted as: list/filter/cancel any booking.
- PWA + drag-reschedule + keyboard shortcuts are UX polish, defer.

## User-confirmed decisions

- Recurring meetings → **Phase 2**, not MVP.
- Attendee double-book → **warn-and-allow** (show conflicts in modal, organizer proceeds).
- Registration → **admin-invite only**. No public `/register` route. Admin creates user (sets username + temp password, or sends Google-link invite). Brief's "Register page" item dropped from MVP.
- DB → **Postgres**.

Still open (non-blocking): Resend sender domain — placeholder `noreply@<tbd>` until provided.

## Stack

- **Framework:** Next.js 15 (App Router) on Vercel. Single deploy serves both admin + user sites via route groups.
- **DB:** Postgres (Vercel Postgres or Neon). Use `btree_gist` extension for booking exclusion constraint.
- **ORM:** Prisma (with raw SQL for the exclusion constraint via migration).
- **Auth:** Auth.js v5 — Credentials (bcrypt) + Google OAuth.
- **UI:** Tailwind + shadcn/ui. Calendar grid: FullCalendar (resource-timeline plugin covers resource view).
- **Validation:** Zod on all server actions / route handlers.
- **Time:** store `timestamptz` UTC; render with user TZ from profile (fallback `Intl.DateTimeFormat().resolvedOptions().timeZone`).
- **Email:** Resend for change/cancel emails.

## MVP scope (Phase 1 — ship this)

In:
- Auth: login (user/pass + Google), logout, session. **No public register** — admin creates users.
- Roles: `ADMIN`, `USER`. Seeded admin.
- Locations CRUD (admin): name, address, capacity, amenities[], active flag, operating hours, buffer minutes.
- Bookings: create / edit / cancel single (non-recurring) bookings — title, description, start, end, location, organizer, attendees (internal users only).
- **Conflict prevention** at DB level for `(location_id, time_range)` where `status='CONFIRMED'`.
- Calendar views: month, week, day, agenda. Filter by location.
- Resource view (rooms × time) — core differentiator, keep in MVP.
- Admin: list/filter/cancel any booking; activate/deactivate users; create user.
- Email on create / change / cancel via Resend.
- Audit log table (append-only) for booking + user + location mutations.

Out (Phase 2+):
- Recurring meetings (and exception handling).
- External attendees, RSVP, free-busy, suggested times.
- Capacity vs actual, check-in / QR, no-show.
- Reporting dashboards.
- PWA, drag-to-reschedule, keyboard shortcuts.
- Reminders w/ configurable lead time.

## Data model (Prisma)

```
User        id, email (unique), username (unique), passwordHash?, googleId?, name,
            role (ADMIN|USER), timezone, active, createdAt
Location    id, name, address, capacity, amenities (text[]), active,
            opensAt (time), closesAt (time), bufferMinutes
Booking     id, title, description, startsAt (timestamptz), endsAt (timestamptz),
            locationId, organizerId, status (CONFIRMED|CANCELLED), createdAt, updatedAt
            -- generated col: during tstzrange(startsAt, endsAt, '[)')
BookingAttendee  bookingId, userId   (PK composite)
AuditLog    id, actorId, entity, entityId, action, diff (jsonb), createdAt
Account/Session/VerificationToken  -- Auth.js standard tables
```

Migration adds:
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Booking" ADD COLUMN during tstzrange
  GENERATED ALWAYS AS (tstzrange("startsAt","endsAt",'[)')) STORED;
ALTER TABLE "Booking" ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist ("locationId" WITH =, during WITH &&)
  WHERE (status = 'CONFIRMED');
```
Makes double-booking a single location impossible at DB layer — eliminates TOCTOU race. App catches `23P01` and returns 409.

Organizer/attendee conflicts: service-layer query inside same txn. For attendees, return warnings to UI; user proceeds if intended.

## Routes / file layout

```
app/
  (auth)/login                        -- only login; no register
  (user)/
    calendar/                         month|week|day|agenda + ?view=&date=&location=
    calendar/resource                 resource-timeline view
    bookings/                         "Lịch của tôi" — tabs (Tôi tạo / Được mời) + status filter
    bookings/[id]                     detail / edit
    bookings/new
  (admin)/admin/
    users/  locations/  bookings/  audit/
  api/
    auth/[...nextauth]
    (mutations preferred as server actions)
lib/
  db.ts (Prisma)        auth.ts (Auth.js config)
  bookings/service.ts   conflict-aware create/update; maps 23P01 → ConflictError
  audit.ts              writeAudit() called inside same txn as mutation
  rbac.ts               requireRole(...)
  tz.ts                 toUtc, fromUtc, formatInTz
emails/                 React Email templates (created/updated/cancelled)
prisma/                 schema.prisma + migrations (incl. raw SQL above)
```

## Auth & RBAC

- Auth.js with PrismaAdapter. Credentials provider: bcrypt(12). Google provider: link to existing email if match (auto-provision disabled — user must already exist, since invite-only).
- Middleware (`middleware.ts`) gates `/admin/*` to `role=ADMIN`; `/calendar`, `/bookings/*` to authenticated.
- Inactive users (`active=false`) — block at `signIn` callback.
- All mutating server actions call `requireRole()` first.

## Conflict detection — definitive rules

1. Location: DB exclusion constraint (above). Catch `23P01` → 409 with conflicting-booking detail.
2. Organizer: txn check `WHERE organizerId=? AND status='CONFIRMED' AND during && tstzrange(?,?,'[)')`. Hard block.
3. Attendees: same query against `BookingAttendee` join. **Warn-and-allow** — UI lists busy attendees; organizer confirms to proceed.
4. Location operating hours + bufferMinutes: validate in service before insert.
5. Editing a booking: same checks, exclude self by id.

## Notifications (MVP)

- On create/update/cancel → enqueue Resend email to organizer + attendees. Use Next.js `after()` so request returns fast. Failures logged, not retried in MVP.

## UI

- shadcn/ui primitives. Forms via react-hook-form + zod resolver.
- Calendar: FullCalendar React with `dayGridMonth`, `timeGridWeek`, `timeGridDay`, `listWeek`, `resourceTimelineDay`. Locations = resources.
- Filter bar: location multiselect, my-bookings toggle.
- Booking modal: title, desc, start/end (with TZ note), location select (shows capacity + amenities), attendee multi-select, attendee-conflict warning panel.

## My Schedules page (`/bookings`)

Implements the "Scheduler List" item from Plan.MD (user site → 3).

- Server component at `app/(user)/bookings/page.tsx`.
- Two tabs via `?view=created|invited` (default `created`):
  - **Tôi tạo** — `where: { organizerId = me }`
  - **Được mời** — `where: { attendees: { some: { userId = me } }, NOT: { organizerId: me } }`
- Status filter via `?status=upcoming|past|cancelled` (default `upcoming`):
  - upcoming: `status = CONFIRMED AND endsAt >= now()`, order `startsAt asc`
  - past: `status = CONFIRMED AND endsAt < now()`, order `startsAt desc`
  - cancelled: `status = CANCELLED`, order `updatedAt desc`
- Optional `?q=` filters by title (case-insensitive `contains`).
- Reuses the agenda booking-row component from `/calendar` for visual consistency (time block, status pill, location/attendee meta, hover lift).
- Per-tab empty state:
  - Tôi tạo empty → "Bạn chưa tạo lịch nào." + primary CTA "Đặt lịch mới"
  - Được mời empty → "Chưa được mời vào lịch nào." (no CTA — passive)
- Tabs rendered as M3 segmented buttons; status filter as M3 filter chips.
- Counts shown in tab labels (e.g. "Tôi tạo · 12") via two `db.booking.count()` calls scoped to the user.
- Add `Lịch của tôi` link to `components/TopBar.tsx` (between Lịch trình and Phòng).
- No pagination in MVP (cap at 100 results, ordered as above; add cursor pagination later if needed).
- No CSV export in MVP.

## Verification

- `pnpm prisma migrate dev` — confirm exclusion constraint exists: `\d+ "Booking"` shows `booking_no_overlap`.
- Unit: service layer — overlap, edge-touching `[)` ranges, edit-self-exclusion, operating-hours rejection.
- Integration: two parallel POSTs for same room+time — exactly one succeeds (proves DB guard, not just app check).
- E2E (Playwright):
  1. Admin creates user → user logs in → creates booking → sees it in month + resource view.
  2. Second user attempts same room/time → 409 with friendly message.
  3. Attendee already busy → modal shows warning, organizer can still proceed.
  4. Admin deactivates user → user blocked at login.
  5. Admin cancels booking → email sent (Resend dev inbox), audit row written.
  6. TZ: organizer in `Asia/Ho_Chi_Minh`, attendee in `America/New_York` — both see correct local time, DB row UTC.
- Manual: Vercel preview deploy — Google OAuth round-trip works with prod redirect URIs.

## Phased delivery

- **P1 (MVP, above):** ~1–2 weeks single dev.
- **P2:** recurring (RRULE storage + materialization on read), reminders, reporting basics, drag-to-reschedule.
- **P3:** external attendees + RSVP, free-busy + suggested times, check-in, PWA, audit UI filters.


# NOTE

It still look poor, refactor it to be more beautiful, professional and friendly following Material design (https://m3.material.io/) and consistent with current System Design (`design/DESIGN.md`)