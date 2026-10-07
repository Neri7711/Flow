import { dayKey, zonedIso } from "@/shared/lib/format-date";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

export type MonthGrid = {
  /** "2026-10" */
  month: string;
  /** Monday-first weeks of "YYYY-MM-DD" days, including the neighbor months' days that complete them. */
  weeks: string[][];
  /** ISO range covering every visible day (for fetching events). */
  from: string;
  to: string;
  previous: string;
  next: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Normalizes month overflow (month 0 -> December of the previous year). */
function monthKey(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** `?month=` when valid, otherwise the month of `reference` in the app's time zone. */
export function parseMonth(value: string | undefined, reference: Date): string {
  return value && MONTH_KEY.test(value) ? value : dayKey(reference).slice(0, 7);
}

/** Calendar days as plain dates (UTC arithmetic): no time-zone drift. */
export function buildMonthGrid(month: string): MonthGrid {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = Date.UTC(year, monthNumber - 1, 1);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leading = (new Date(first).getUTCDay() + 6) % 7; // Monday = 0
  const weekCount = Math.ceil((leading + daysInMonth) / 7);
  const start = first - leading * DAY_MS;

  const days = Array.from({ length: weekCount * 7 }, (_, index) => new Date(start + index * DAY_MS).toISOString().slice(0, 10));
  const weeks = Array.from({ length: weekCount }, (_, week) => days.slice(week * 7, week * 7 + 7));
  const afterLast = new Date(start + weekCount * 7 * DAY_MS).toISOString().slice(0, 10);

  return {
    month,
    weeks,
    from: zonedIso(days[0]),
    to: zonedIso(afterLast),
    previous: monthKey(year, monthNumber - 1),
    next: monthKey(year, monthNumber + 1),
  };
}
