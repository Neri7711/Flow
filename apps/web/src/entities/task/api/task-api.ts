"use server";

import { api, segment } from "@/shared/api";

import type { NewTask, Task, TaskEvent, TaskLabel, TaskStatus } from "../model/types";

export async function getTasks(): Promise<readonly Task[]> {
  return api.get<Task[]>("/tasks");
}

export async function getTaskLabels(): Promise<readonly TaskLabel[]> {
  return api.get<TaskLabel[]>("/task-labels");
}

export async function getTask(id: string): Promise<Task | undefined> {
  return api.find<Task>(`/tasks/${segment(id)}`);
}

export async function getTaskEvents(taskId: string): Promise<readonly TaskEvent[]> {
  return api.get<TaskEvent[]>(`/tasks/${segment(taskId)}/events`);
}

/** The API assigns the next per-team identifier (PL-57) and returns the created task. */
export async function createTask({ teamId, title, status, assigneeId, cycleId, sourceDocumentId }: NewTask): Promise<Task> {
  return api.post<Task>("/tasks", { teamId, title, status, assigneeId: assigneeId ?? undefined, cycleId, sourceDocumentId });
}

/** The API records the change in the task's activity as the signed-in user. */
export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return api.patch<Task>(`/tasks/${segment(id)}/status`, { status });
}

export async function addTaskComment(taskId: string, body: string): Promise<TaskEvent> {
  return api.post<TaskEvent>(`/tasks/${segment(taskId)}/comments`, { body });
}
