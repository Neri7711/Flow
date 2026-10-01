import type { Task, TaskLabel } from "../model/types";
import { TASK_LABELS, TASKS } from "./fixtures";

// Static data for now. Async on purpose: same signature the backend-backed version will have.

export async function getTasks(): Promise<readonly Task[]> {
  return TASKS;
}

export async function getTaskLabels(): Promise<readonly TaskLabel[]> {
  return TASK_LABELS;
}
