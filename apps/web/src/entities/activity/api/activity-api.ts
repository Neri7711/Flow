import type { Activity } from "../model/types";

const ACTIVITY: readonly Activity[] = [
  { id: "act-1", teamId: "pl", actorId: "u-ana", summary: "comentó en Guía de estilo de arte", at: "2026-09-30T09:10:00-06:00" },
  { id: "act-2", teamId: "pl", actorId: "u-fer", summary: "completó 2 tareas", at: "2026-09-30T08:30:00-06:00" },
  { id: "act-3", teamId: "pl", actorId: "u-nico", summary: "agregó Playtest interno al calendario", at: "2026-09-30T06:30:00-06:00" },
];

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getRecentActivity(teamId: string, limit = 3): Promise<readonly Activity[]> {
  return ACTIVITY.filter((item) => item.teamId === teamId)
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
