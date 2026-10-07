import type { TeamId } from "@/entities/team/@x/triage";

/** A request from another team (or a new member) waiting for a leader's decision. */
export type TriageRequest = {
  id: string;
  fromTeamId: TeamId;
  toTeamId: TeamId;
  title: string;
  requesterId: string | null;
  createdAt: string;
  /** Lists only show pending requests; decisions return the final state. */
  status?: "pending" | "accepted" | "declined";
  /** Task created when the request was accepted. */
  taskId?: string | null;
};
