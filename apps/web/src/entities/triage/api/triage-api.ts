"use server";

import { api, query } from "@/shared/api";

import type { TriageRequest } from "../model/types";

/** Requests waiting for this team's decision. */
export async function getTriageRequests(teamId: string): Promise<readonly TriageRequest[]> {
  return api.get<TriageRequest[]>(`/triage${query({ teamId })}`);
}
