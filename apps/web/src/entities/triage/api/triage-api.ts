"use server";

import { api, query, segment } from "@/shared/api";

import type { TriageRequest } from "../model/types";

/** Task columns (mirror of the task entity's `TaskStatus`, which this slice can't import). */
type AcceptedTaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";

/** Requests waiting for this team's decision. */
export async function getTriageRequests(teamId: string): Promise<readonly TriageRequest[]> {
  return api.get<TriageRequest[]>(`/triage${query({ teamId })}`);
}

/** Asks another team for something; it lands in their inbox. */
export async function createTriageRequest(toTeamId: string, title: string): Promise<TriageRequest> {
  return api.post<TriageRequest>("/triage", { toTeamId, title });
}

/**
 * Leaders only: turns the request into a task on their board and returns its id.
 * `status` is the column it lands in; the API defaults to "Por hacer".
 */
export async function acceptTriageRequest(id: string, status?: AcceptedTaskStatus): Promise<string> {
  const { task } = await api.post<{ task: { id: string } }>(`/triage/${segment(id)}/accept`, { status });
  return task.id;
}

export async function declineTriageRequest(id: string): Promise<void> {
  await api.post(`/triage/${segment(id)}/decline`);
}
