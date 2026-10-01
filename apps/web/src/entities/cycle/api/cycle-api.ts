import type { Cycle } from "../model/types";

const CYCLES: readonly Cycle[] = [
  { id: "pl-c4", teamId: "pl", number: 4, startsAt: "2026-09-29T00:00:00-06:00", endsAt: "2026-10-12T23:59:00-06:00" },
];

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getActiveCycle(teamId: string): Promise<Cycle | undefined> {
  return CYCLES.find((cycle) => cycle.teamId === teamId);
}

export async function getCycle(id: string): Promise<Cycle | undefined> {
  return CYCLES.find((cycle) => cycle.id === id);
}
