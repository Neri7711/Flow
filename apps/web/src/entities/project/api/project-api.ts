"use server";

import { api, query, segment } from "@/shared/api";

import type { Project } from "../model/types";

export async function getActiveProject(teamId: string): Promise<Project | undefined> {
  return api.find<Project>(`/projects/active${query({ teamId })}`);
}

export async function getProject(id: string): Promise<Project | undefined> {
  return api.find<Project>(`/projects/${segment(id)}`);
}
