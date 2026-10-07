"use server";

import { api, query, segment } from "@/shared/api";

import type { TriageRequest } from "../model/types";

/** Requests waiting for this team's decision. */
export async function getTriageRequests(teamId: string): Promise<readonly TriageRequest[]> {
  return api.get<TriageRequest[]>(`/triage${query({ teamId })}`);
}

/** Asks another team for something; it lands in their inbox. */
export async function createTriageRequest(toTeamId: string, title: string): Promise<TriageRequest> {
  return api.post<TriageRequest>("/triage", { toTeamId, title });
}

/** Leaders only: turns the request into a task on their board and returns its id. */
export async function acceptTriageRequest(id: string): Promise<string> {
  const { task } = await api.post<{ task: { id: string } }>(`/triage/${segment(id)}/accept`);
  return task.id;
}

export async function declineTriageRequest(id: string): Promise<void> {
  await api.post(`/triage/${segment(id)}/decline`);
}
