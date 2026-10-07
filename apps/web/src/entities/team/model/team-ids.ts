import type { TeamId } from "./types";

/**
 * Every team id, in display order. Teams are fixed by design (each has its own theme
 * tokens and mascot), so this list is static and safe to use at build time.
 */
export const TEAM_IDS = ["cs", "pl", "me", "ii"] as const satisfies readonly TeamId[];

export function isTeamId(value: string): value is TeamId {
  return (TEAM_IDS as readonly string[]).includes(value);
}
