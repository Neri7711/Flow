import { ForbiddenException } from "@nestjs/common";

import type { SessionUser } from "./session";

/** Team administration (triage decisions, members, invitations) is for that team's leaders. */
export function assertLeaderOf(user: SessionUser, teamId: string): void {
  if (user.role !== "leader" || user.teamId !== teamId) {
    throw new ForbiddenException("Solo los líderes del equipo pueden hacer esto");
  }
}
