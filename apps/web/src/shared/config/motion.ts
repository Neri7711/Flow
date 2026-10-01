import type { Transition } from "motion/react";

/**
 * Motion tokens for the `motion` library. Mirror of the CSS tokens in
 * `src/app/styles/globals.css` (`--ease-*`, `--motion-*`) — keep both in sync.
 *
 * Rule of thumb (frequency of use): keyboard-triggered and 100+/day actions don't
 * animate; frequent actions get short feedback; rare moments may take `slow`.
 */

/** Seconds, as `motion` expects. */
export const duration = {
  press: 0.14,
  fast: 0.18,
  base: 0.24,
  slow: 0.32,
} as const;

export const ease = {
  /** Entering/exiting elements: starts fast, feels responsive. */
  out: [0.23, 1, 0.32, 1],
  /** Elements moving or morphing on screen. */
  inOut: [0.77, 0, 0.175, 1],
  /** Side panels and trays. */
  drawer: [0.32, 0.72, 0, 1],
} as const;

/** Physical motion (drag & drop, layout reflow): interruptible, no visible bounce. */
export const spring = {
  type: "spring",
  duration: 0.35,
  bounce: 0.12,
} as const satisfies Transition;
