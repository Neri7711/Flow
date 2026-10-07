/**
 * Single source of "now" for the app (relative dates, greetings, "today", progress).
 * Values derived from it while rendering can differ between the server render and
 * hydration, so elements that show them use `suppressHydrationWarning`.
 */
export function now(): Date {
  return new Date();
}
