"use server";

import { api, segment } from "@/shared/api";

import type { Team } from "../model/types";

export async function getTeams(): Promise<readonly Team[]> {
  return api.get<Team[]>("/teams");
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return api.find<Team>(`/teams/${segment(id)}`);
}

/** Leaders of the team only; empty clears it. */
export async function updateWeeklyNote(teamId: string, weeklyNote: string | null): Promise<Team> {
  return api.patch<Team>(`/teams/${segment(teamId)}`, { weeklyNote });
}
