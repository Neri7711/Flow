import { cn } from "@/shared/lib/utils";

import { TASK_STATUS_LABEL } from "../config/statuses";
import type { TaskStatus } from "../model/types";

const STATUS_COLOR: Record<TaskStatus, string> = {
  backlog: "text-status-backlog",
  todo: "text-status-todo",
  in_progress: "text-status-in-progress",
  in_review: "text-status-in-review",
  done: "text-status-done",
};

type TaskStatusIconProps = {
  status: TaskStatus;
  size?: number;
  className?: string;
};

/** Status glyphs from the design: dotted, empty, half, dot, check. */
export function TaskStatusIcon({ status, size = 16, className }: TaskStatusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={TASK_STATUS_LABEL[status]}
      className={cn("shrink-0", STATUS_COLOR[status], className)}
    >
      {status === "backlog" && <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />}
      {status === "todo" && <circle cx="12" cy="12" r="8" />}
      {status === "in_progress" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
        </>
      )}
      {status === "in_review" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
        </>
      )}
      {status === "done" && (
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
          <path d="M8 12.5l2.7 2.7L16 9.8" className="stroke-surface" />
        </>
      )}
    </svg>
  );
}
