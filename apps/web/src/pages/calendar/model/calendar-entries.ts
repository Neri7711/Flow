import type { Cycle } from "@/entities/cycle";
import type { CalendarEvent } from "@/entities/event";
import type { Project } from "@/entities/project";
import type { TeamId } from "@/entities/team";
import { dayKey } from "@/shared/lib/format-date";

/** Anything placed on a calendar day. Each belongs to a team, so the "Mostrar" filter applies to all. */
export type CalendarEntry = {
  key: string;
  teamId: TeamId;
  /** "YYYY-MM-DD" in the app's time zone. */
  day: string;
  /** ISO instant used for ordering. */
  at: string;
} & (
  | { kind: "event"; event: CalendarEvent }
  | { kind: "milestone"; name: string }
  | { kind: "cycle"; label: string }
);

const KIND_ORDER: Record<CalendarEntry["kind"], number> = { event: 0, milestone: 1, cycle: 2 };

export function eventEntry(event: CalendarEvent): CalendarEntry {
  return { kind: "event", key: `event-${event.id}`, teamId: event.teamId, day: dayKey(event.startsAt), at: event.startsAt, event };
}

export function milestoneEntries(project: Project | undefined): CalendarEntry[] {
  if (!project) return [];
  return project.milestones.map((milestone) => ({
    kind: "milestone",
    key: `milestone-${milestone.id}`,
    teamId: project.teamId,
    day: dayKey(milestone.date),
    at: milestone.date,
    name: milestone.name,
  }));
}

export function cycleEntries(cycle: Cycle | undefined): CalendarEntry[] {
  if (!cycle) return [];
  return [
    { kind: "cycle", key: `cycle-${cycle.id}-start`, teamId: cycle.teamId, day: dayKey(cycle.startsAt), at: cycle.startsAt, label: `Inicio del ciclo ${cycle.number}` },
    { kind: "cycle", key: `cycle-${cycle.id}-end`, teamId: cycle.teamId, day: dayKey(cycle.endsAt), at: cycle.endsAt, label: `Fin del ciclo ${cycle.number}` },
  ];
}

/** Events first (chronological), then milestones, then cycle bounds. */
function sortEntries(entries: readonly CalendarEntry[]): CalendarEntry[] {
  return [...entries].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.at.localeCompare(b.at));
}

export function groupByDay(entries: readonly CalendarEntry[]): Map<string, CalendarEntry[]> {
  const byDay = new Map<string, CalendarEntry[]>();
  for (const entry of sortEntries(entries)) byDay.set(entry.day, [...(byDay.get(entry.day) ?? []), entry]);
  return byDay;
}
