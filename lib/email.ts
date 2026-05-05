import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "noreply@example.com";

type BookingLike = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: { name: string };
  organizer: { email: string; name: string };
  attendees: { user: { email: string; name: string } }[];
};

export async function sendBookingEmail(kind: "created" | "updated" | "cancelled", b: BookingLike) {
  if (!resend) return;
  const recipients = [b.organizer.email, ...b.attendees.map((a) => a.user.email)];
  const verb = kind === "created" ? "scheduled" : kind === "updated" ? "updated" : "cancelled";
  await resend.emails.send({
    from: FROM,
    to: recipients,
    subject: `[Scheduler] ${b.title} ${verb}`,
    html: `<p>${b.title} at <b>${b.location.name}</b></p>
           <p>${b.startsAt.toISOString()} → ${b.endsAt.toISOString()}</p>
           <p>Status: ${verb}</p>`,
  });
}
