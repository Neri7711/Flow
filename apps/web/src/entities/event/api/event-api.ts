"use server";

import { api, query, segment } from "@/shared/api";

import type { CalendarEvent, NewCalendarEvent } from "../model/types";

export async function getUpcomingEvents(teamId: string, limit = 3): Promise<readonly CalendarEvent[]> {
  return api.get<CalendarEvent[]>(`/events/upcoming${query({ teamId, limit })}`);
}

/** Events starting in [from, to) (ISO instants). */
export async function getEvents(teamId: string, from: string, to: string): Promise<readonly CalendarEvent[]> {
  return api.get<CalendarEvent[]>(`/events${query({ teamId, from, to })}`);
}

export async function createEvent(input: NewCalendarEvent): Promise<CalendarEvent> {
  return api.post<CalendarEvent>("/events", input);
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${segment(id)}`);
}
