import { cn } from "@/shared/lib/utils";

import type { Task } from "../model/types";

/** Inline mono reference to a task in its team's colors ("PL-47"), used in comments and documents. */
export function TaskIdPill({ task, className }: { task: Pick<Task, "id" | "teamId">; className?: string }) {
  return (
    <span
      data-team={task.teamId}
      className={cn("rounded-[5px] bg-team-soft px-[5px] py-px font-mono text-xs text-team-strong", className)}
    >
      {task.id}
    </span>
  );
}
