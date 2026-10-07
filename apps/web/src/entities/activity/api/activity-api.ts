"use server";

import { api, query } from "@/shared/api";

import type { Activity } from "../model/types";

export async function getRecentActivity(teamId: string, limit = 3): Promise<readonly Activity[]> {
  return api.get<Activity[]>(`/activity/recent${query({ teamId, limit })}`);
}
