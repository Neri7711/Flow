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

/** Circumference of the r=8 ring (2πr), so a solid dash can interpolate from the dotted one. */
const RING = 50.27;

type TaskStatusIconProps = {
  status: TaskStatus;
  size?: number;
  className?: string;
};

/**
 * Status glyphs from the design: dotted, empty, half, dot, check.
 * All layers are always rendered and toggled with transitions, so a status change
 * morphs the icon (ring closes, half fills, dot grows, check draws) instead of swapping it.
 */
export function TaskStatusIcon({ status, size = 16, className }: TaskStatusIconProps) {
  const layer = "transition-[opacity,scale,stroke-dasharray,stroke-dashoffset] duration-(--motion-fast) ease-out";
  const centered = "origin-center [transform-box:fill-box]";

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
      className={cn("shrink-0 transition-colors duration-(--motion-fast)", STATUS_COLOR[status], className)}
    >
      {/* Ring: dotted for backlog, solid otherwise. */}
      <circle
        cx="12"
        cy="12"
        r="8"
        className={layer}
        style={{ strokeDasharray: status === "backlog" ? "3 3" : `${RING} 0` }}
      />
      {/* In progress: right half filled. */}
      <path
        d="M12 4a8 8 0 0 1 0 16z"
        fill="currentColor"
        stroke="none"
        className={cn(layer, status === "in_progress" ? "opacity-100" : "opacity-0")}
      />
      {/* In review: centered dot. */}
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="currentColor"
        stroke="none"
        className={cn(layer, centered, status === "in_review" ? "scale-100 opacity-100" : "scale-0 opacity-0")}
      />
      {/* Done: filled disc with a check that draws itself. */}
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="currentColor"
        stroke="none"
        className={cn(layer, centered, status === "done" ? "scale-100 opacity-100" : "scale-75 opacity-0")}
      />
      <path
        d="M8 12.5l2.7 2.7L16 9.8"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: status === "done" ? 0 : 1 }}
        className={cn(layer, "stroke-surface delay-75")}
      />
    </svg>
  );
}
