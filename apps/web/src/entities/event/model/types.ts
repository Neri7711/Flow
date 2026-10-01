import type { TeamId } from "@/entities/team/@x/event";

export type CalendarEvent = {
  id: string;
  teamId: TeamId;
  title: string;
  startsAt: string;
  /** `null` for all-day events. */
  endsAt: string | null;
  /** Dot color in event lists. */
  tone: TeamId;
};
