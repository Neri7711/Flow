import type { TeamId } from "@/entities/team/@x/activity";

export type Activity = {
  id: string;
  teamId: TeamId;
  actorId: string;
  /** What the actor did, rendered after their name ("comentó en Guía de estilo de arte"). */
  summary: string;
  at: string;
};
