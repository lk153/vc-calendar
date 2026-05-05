import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { vi } from "date-fns/locale";

export function toUtc(localISO: string, tz: string): Date {
  return fromZonedTime(localISO, tz);
}

export function formatInTz(d: Date, tz: string, fmt = "PPp"): string {
  return format(toZonedTime(d, tz), fmt, { timeZone: tz, locale: vi });
}
