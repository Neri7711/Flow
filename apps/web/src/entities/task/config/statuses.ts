import type { TaskStatus } from "../model/types";

/** Workflow order (board columns, pickers). */
export const TASK_STATUSES: readonly TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Hecho",
};
