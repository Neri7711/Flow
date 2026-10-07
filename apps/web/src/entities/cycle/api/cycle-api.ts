"use server";

import { api, query, segment } from "@/shared/api";

import type { Cycle } from "../model/types";

export async function getActiveCycle(teamId: string): Promise<Cycle | undefined> {
  return api.find<Cycle>(`/cycles/active${query({ teamId })}`);
}

export async function getCycle(id: string): Promise<Cycle | undefined> {
  return api.find<Cycle>(`/cycles/${segment(id)}`);
}
