import { cn } from "@/shared/lib/utils";

import { TASK_STATUS_LABEL } from "../config/statuses";
import type { TaskStatus } from "../model/types";
import { TaskStatusIcon } from "./task-status-icon";

/** Soft background + darkened text, both derived from the status color. */
const BADGE_TONE: Record<TaskStatus, string> = {
  backlog: "[--status:var(--color-status-backlog)]",
  todo: "[--status:var(--color-status-todo)]",
  in_progress: "[--status:var(--color-status-in-progress)]",
  in_review: "[--status:var(--color-status-in-review)]",
  done: "[--status:var(--color-status-done)]",
};

type TaskStatusBadgeProps = {
  status: TaskStatus;
  className?: string;
};

/** Status pill used in detail views ("● En progreso"). */
export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[13px] font-medium",
        "bg-[color-mix(in_oklab,var(--status)_18%,var(--color-surface))] text-[color-mix(in_oklab,var(--status)_65%,var(--color-ink))]",
        BADGE_TONE[status],
        className,
      )}
    >
      <TaskStatusIcon status={status} size={14} />
      {TASK_STATUS_LABEL[status]}
    </span>
  );
}
