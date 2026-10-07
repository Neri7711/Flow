"use server";

import { api, query } from "@/shared/api";

import type { CalendarEvent } from "../model/types";

export async function getUpcomingEvents(teamId: string, limit = 3): Promise<readonly CalendarEvent[]> {
  return api.get<CalendarEvent[]>(`/events/upcoming${query({ teamId, limit })}`);
}
