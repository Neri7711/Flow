import type { TeamId } from "@/entities/team/@x/invitation";
import type { UserRole } from "@/entities/user/@x/invitation";

/** A pending invitation to join a team (the link's token is never part of it). */
export type Invitation = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: TeamId;
  invitedById: string;
  createdAt: string;
  expiresAt: string;
};

export type NewInvitation = {
  email: string;
  name: string;
  role: UserRole;
};

/** What an invitation link shows before it's accepted. */
export type InvitationPreview = {
  email: string;
  name: string;
  role: UserRole;
  teamId: TeamId;
  teamName: string;
};
