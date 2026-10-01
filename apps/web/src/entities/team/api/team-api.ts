import type { Team, TeamId } from "../model/types";
import { TEAMS } from "./fixtures";

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getTeams(): Promise<readonly Team[]> {
  return TEAMS;
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return TEAMS.find((team) => team.id === id);
}

export function isTeamId(value: string): value is TeamId {
  return TEAMS.some((team) => team.id === value);
}
