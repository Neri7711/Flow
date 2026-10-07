"use server";

import { api, segment } from "@/shared/api";

import type { Team } from "../model/types";

export async function getTeams(): Promise<readonly Team[]> {
  return api.get<Team[]>("/teams");
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return api.find<Team>(`/teams/${segment(id)}`);
}
