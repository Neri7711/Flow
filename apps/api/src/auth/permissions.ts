import { ForbiddenException } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

import type { SessionUser } from "./session";

/** The user's role in a space, or undefined when they don't belong to it. */
export function roleIn(user: SessionUser, teamId: string): UserRole | undefined {
  return user.memberships.find((membership) => membership.teamId === teamId)?.role;
}

/** Space administration (triage, members, invitations, settings) is for that space's leaders. */
export function assertLeaderOf(user: SessionUser, teamId: string): void {
  if (roleIn(user, teamId) !== "leader") {
    throw new ForbiddenException("Solo los líderes del equipo pueden hacer esto");
  }
}
