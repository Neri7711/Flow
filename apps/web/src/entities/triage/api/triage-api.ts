import type { TriageRequest } from "../model/types";

const REQUESTS: readonly TriageRequest[] = [
  { id: "tr-1", fromTeamId: "me", toTeamId: "pl", title: "Medidas del control para el stand", requesterId: null, createdAt: "2026-09-30T08:00:00-06:00" },
  { id: "tr-2", fromTeamId: "me", toTeamId: "pl", title: "Validar sprites del robot", requesterId: null, createdAt: "2026-09-30T08:20:00-06:00" },
];

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getTriageRequests(teamId: string): Promise<readonly TriageRequest[]> {
  return REQUESTS.filter((request) => request.toTeamId === teamId);
}
