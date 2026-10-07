/**
 * Single source of "now" for the API (timestamps, upcoming events, the active cycle).
 * Kept as a function so tests or demos can swap it in one place.
 */
export function now(): Date {
  return new Date();
}
