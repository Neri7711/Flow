/**
 * Reference "now" while all data is static fixtures, so relative dates
 * ("hace 2 h", "quedan 8 días", greetings) stay consistent with the mockups.
 * Replace usages with the real clock once data comes from the backend.
 */
export const MOCK_NOW = new Date("2026-09-30T09:30:00-06:00");

export function now(): Date {
  return MOCK_NOW;
}
