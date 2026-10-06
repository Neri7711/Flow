/**
 * Reference "now" mirroring the frontend's mock clock
 * (apps/web/src/shared/config/mock-clock.ts), so relative/upcoming
 * computations match the mockups while data is still seeded.
 *
 * Replace `now()` with `new Date()` once the app runs on live data.
 */
export const MOCK_NOW = new Date("2026-09-30T09:30:00-06:00");

export function now(): Date {
  return MOCK_NOW;
}
