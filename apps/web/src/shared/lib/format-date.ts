import { now } from "@/shared/config";

const LOCALE = "es-MX";
const TIME_ZONE = "America/Mexico_City";

const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto", style: "short" });
const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone: TIME_ZONE });
const dayFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", timeZone: TIME_ZONE });
const dayMonthFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});
const hourFormat = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE });
const weekdayDayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "short", timeZone: TIME_ZONE });
const monthYearFormat = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: TIME_ZONE });

/** Mexico City has had no daylight saving time since 2022, so its UTC offset is fixed. */
const UTC_OFFSET = "-06:00";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Calendar day in the app's time zone as a sortable "YYYY-MM-DD" key. */
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

/** Calendar days between two dates in the app's time zone (yesterday = -1). */
function calendarDayDiff(date: Date, reference: Date): number {
  return Math.round((Date.parse(dayKeyFormat.format(date)) - Date.parse(dayKeyFormat.format(reference))) / DAY);
}

/** Same day: "hace 20 min", "hace 2 h". Other days: "ayer", "hace 3 días". */
export function formatRelative(iso: string, reference: Date = now()): string {
  const date = new Date(iso);
  const dayDiff = calendarDayDiff(date, reference);
  if (dayDiff !== 0) return relativeFormat.format(dayDiff, "day");

  const diff = date.getTime() - reference.getTime();
  if (Math.abs(diff) < HOUR) return relativeFormat.format(Math.round(diff / MINUTE), "minute");
  return relativeFormat.format(Math.round(diff / HOUR), "hour");
}

/** "oct" (without the trailing dot some locales add). */
export function formatMonthShort(iso: string): string {
  return monthFormat.format(new Date(iso)).replace(".", "");
}

/** "2" */
export function formatDayOfMonth(iso: string): string {
  return dayFormat.format(new Date(iso));
}

/** "29 sep" */
export function formatDayMonth(iso: string): string {
  return dayMonthFormat.format(new Date(iso)).replace(".", "");
}

/** "17:00" */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** "viernes 2 oct" */
export function formatWeekdayDay(iso: string): string {
  return weekdayDayFormat.format(new Date(iso)).replace(".", "").replace(",", "");
}

/** "octubre de 2026" */
export function formatMonthYear(iso: string): string {
  return monthYearFormat.format(new Date(iso));
}

/** "2026-10-02": the calendar day an instant falls on, in the app's time zone. */
export function dayKey(date: string | Date): string {
  return dayKeyFormat.format(new Date(date));
}

/** ISO instant of a calendar day ("2026-10-02") at a wall-clock time ("17:30") in the app's time zone. */
export function zonedIso(day: string, time = "00:00"): string {
  return new Date(`${day}T${time}:00${UTC_OFFSET}`).toISOString();
}

/** Whole days from `reference` until `iso` (negative when past). */
export function daysUntil(iso: string, reference: Date = now()): number {
  return Math.ceil((new Date(iso).getTime() - reference.getTime()) / DAY);
}

/** "Buenos días" / "Buenas tardes" / "Buenas noches" in the app's time zone. */
export function greetingFor(reference: Date = now()): string {
  const hour = Number(hourFormat.format(reference));
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
