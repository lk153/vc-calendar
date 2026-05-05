I need to build a web application could be deployed and run on Vercel, about DB for data storage could be consider using MongoDB or Postgres
It has 2 sites: Admin & normal users
# Features:
- On Admin site:
    1. Manage users (active/deactivate, create new user with username & password)
    2. Manage scheduled has been register by user
    3. Mange locations (add new location, active/deactive location, edit location info)

- On User site:
    1. Login page
    2. Register page (username password or Google OAuth 2.0)
    3. Scheduler List (List of Registered scheduler with title, registered date & time, who registered, location)
        - Two tabs: "Tôi tạo" (Created — organizer = current user) and "Được mời" (Invited — current user is attendee, organizer is someone else)
        - Status filter per tab: Sắp tới / Đã qua / Đã hủy (default: Sắp tới)
        - Optional search by title (?q=)
        - Empty states per tab
        - Nav entry "Lịch của tôi" in TopBar

Beside that we have summarize main components also need to build:

# Core booking
  - Create / edit / cancel meetings — title, description, attendees, organizer
  - Date & time picker — start, end, duration, all-day option
  - Time zone handling — store in UTC, display in user's TZ; critical if attendees span regions
  - Recurring meetings — daily/weekly/monthly/custom patterns, end conditions, exception handling (edit single occurrence vs. series)
  - Conflict detection — for organizer, attendees, and the location

# Location / resource management
This is the differentiator from a plain calendar. Treat locations as first-class resources:

- Location CRUD — name, address/floor, capacity, photos
- Amenities & attributes — projector, whiteboard, video conf gear, accessibility, parking
- Availability rules per location — operating hours, blackout dates, buffer time between bookings
- Capacity enforcement — block bookings exceeding room size

# Attendees
- Invite internal & external users — distinguish the two
- RSVP states — accept / decline / tentative / no response
- Free-busy lookup — show attendee availability when scheduling
- Suggested times — auto-find slots that work for everyone + a room
- Guest limits & permissions — can guests invite others, see attendee list, modify

# Calendar views

- Day / week / month — standard
- Resource view — rooms as rows, time as columns (key for location-centric UX)
- Agenda / list view — for mobile and quick scan
- Filter bookings

# Notifications

- Reminders — configurable lead time, multiple per event
- Change notifications — time/location/attendee updates
- Cancellation notices

# Permissions & policies

- Roles — admin, room owner, regular user, guest
- Booking policies — max duration, max advance booking, max per user per week
- Audit log — who changed what, when

# Operational features (often skipped, then desperately needed)

- Check-in — confirm attendance via QR code, kiosk, or button; auto-release if no check-in

# Reporting

- Room utilization — % booked, peak hours, dead zones
- No-show rate per user / room
- Booking lead time distribution
- Capacity vs. actual attendance — if you capture check-ins

# Mobile & UX essentials

- PWA web
- Drag-to-reschedule on the calendar grid
- Keyboard shortcuts for power users|

Note:
- When user make booking, or view existed booking, Remember to avoid conflict booking with same datetime and also same location
- Internal company use, simpler auth, no payments
- DO NOT need two-way sync with Google/Outlook calendars
- MVP target