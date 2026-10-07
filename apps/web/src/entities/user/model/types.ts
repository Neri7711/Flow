import type { TeamId } from "@/entities/team/@x/user";

export type UserRole = "leader" | "member";

export type User = {
  id: string;
  name: string;
  /** Short display name used in activity feeds ("Ana"). */
  shortName: string;
  initials: string;
  /** Sign-in address. */
  email: string;
  role: UserRole;
  /** Home space. */
  teamId: TeamId;
  /** Soft team tint for the initials avatar; `null` renders the neutral tone. */
  avatarTone: TeamId | null;
};
