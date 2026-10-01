import type { ComponentProps } from "react";
import { File, Lock, ShieldCheck } from "lucide-react";

import { type Task, TaskLabelChip } from "@/entities/task";
import { UserAvatar } from "@/entities/user";
import { cn } from "@/shared/lib/utils";

import { type BoardDirectory, findById } from "../model/directory";

type TaskCardProps = ComponentProps<"div"> & {
  task: Task;
  /** Statuses of every task, to know which blockers are still open. */
  blockerStatuses: Record<string, Task["status"] | undefined>;
  directory: BoardDirectory;
  selected?: boolean;
  /** Rendered inside the drag overlay. */
  dragging?: boolean;
};

/** One line of context, by priority: open blocker → waiting for review → source document. */
function CardNote({ task, blockerStatuses, directory }: Pick<TaskCardProps, "task" | "blockerStatuses" | "directory">) {
  const openBlocker = task.blockedByIds.find((id) => blockerStatuses[id] !== "done");

  if (openBlocker && task.status !== "done") {
    // Blocked notes use a fixed lavender tone regardless of team, as in the design.
    return (
      <span className="flex items-center gap-1.5 rounded-lg bg-cs-soft/60 px-2 py-[5px] text-xs">
        <Lock className="size-[13px]" strokeWidth={1.8} />
        <span>Bloqueada por</span>
        <span className="font-mono text-[11px] font-medium text-cs-strong">{openBlocker}</span>
      </span>
    );
  }

  if (task.status === "in_review") {
    return (
      <span className="flex items-center gap-1.5 rounded-lg bg-subtle px-2 py-[5px] text-xs text-ink-muted">
        <ShieldCheck className="size-[13px]" strokeWidth={1.8} />
        Espera aprobación de líder
      </span>
    );
  }

  const source = findById(directory.documents, task.sourceDocumentId);
  if (source) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
        <File className="size-[13px]" strokeWidth={1.8} />
        <span className="truncate">Desde {source.title}</span>
      </span>
    );
  }

  return null;
}

export function TaskCard({
  task,
  blockerStatuses,
  directory,
  selected = false,
  dragging = false,
  className,
  ...props
}: TaskCardProps) {
  const assignee = findById(directory.users, task.assigneeId);
  const label = findById(directory.labels, task.labelId);

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-left shadow-card outline-none transition-[box-shadow,opacity] focus-visible:ring-3 focus-visible:ring-ring/50",
        task.status === "done" && !dragging && "opacity-60",
        selected && "border-ink ring-2 ring-ink",
        dragging && "rotate-2 shadow-float",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-ink-muted">{task.id}</span>
        {assignee && <UserAvatar user={assignee} size={22} ring className="ml-auto" />}
      </div>
      <span className="text-sm leading-[1.35] font-medium">{task.title}</span>
      <CardNote task={task} blockerStatuses={blockerStatuses} directory={directory} />
      {label && (
        <div className="flex items-center gap-1.5">
          <TaskLabelChip label={label} />
        </div>
      )}
    </div>
  );
}
