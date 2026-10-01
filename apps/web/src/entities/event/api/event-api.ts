import { now } from "@/shared/config";

import type { CalendarEvent } from "../model/types";

const EVENTS: readonly CalendarEvent[] = [
  { id: "ev-kickoff", teamId: "pl", title: "Kickoff game jam", startsAt: "2026-10-02T17:00:00-06:00", endsAt: "2026-10-02T18:30:00-06:00", tone: "pl" },
  { id: "ev-playtest", teamId: "pl", title: "Playtest interno", startsAt: "2026-10-07T16:00:00-06:00", endsAt: "2026-10-07T17:00:00-06:00", tone: "cs" },
  { id: "ev-builds", teamId: "pl", title: "Entrega de builds", startsAt: "2026-10-10T00:00:00-06:00", endsAt: null, tone: "ii" },
  { id: "ev-cs-review", teamId: "cs", title: "Revisión de arquitectura", startsAt: "2026-10-03T12:00:00-06:00", endsAt: "2026-10-03T13:00:00-06:00", tone: "cs" },
];

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getUpcomingEvents(teamId: string, limit = 3): Promise<readonly CalendarEvent[]> {
  const reference = now().toISOString();
  return EVENTS.filter((event) => event.teamId === teamId && event.startsAt >= reference)
    .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
}
