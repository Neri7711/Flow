import type { TeamId } from "@/entities/team/@x/cycle";

/** Two-week iteration; unfinished work rolls over to the next cycle. */
export type Cycle = {
  id: string;
  teamId: TeamId;
  number: number;
  startsAt: string;
  endsAt: string;
};
