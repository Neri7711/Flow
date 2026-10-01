import { TASK_STATUS_LABEL, TASK_STATUSES, type Task, TaskLabelChip, TaskStatusIcon } from "@/entities/task";
import { UserAvatar } from "@/entities/user";
import { cn } from "@/shared/lib/utils";

import { type BoardDirectory, findById } from "../model/directory";

type ListViewProps = {
  tasks: readonly Task[];
  directory: BoardDirectory;
  selectedId: string | null;
  onSelect: (taskId: string) => void;
};

/** Dense Linear-style list grouped by status. */
export function ListView({ tasks, directory, selectedId, onSelect }: ListViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {TASK_STATUSES.map((status) => {
        const group = tasks.filter((task) => task.status === status);
        if (group.length === 0) return null;

        return (
          <section key={status} aria-label={TASK_STATUS_LABEL[status]}>
            <h3 className="flex items-center gap-2 border-b border-line px-2 pb-2 text-sm font-semibold">
              <TaskStatusIcon status={status} />
              {TASK_STATUS_LABEL[status]}
              <span className="font-mono text-[11px] font-normal text-ink-muted">{group.length}</span>
            </h3>
            <ul>
              {group.map((task) => {
                const label = findById(directory.labels, task.labelId);
                const assignee = findById(directory.users, task.assigneeId);

                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(task.id)}
                      className={cn(
                        "flex h-10 w-full cursor-pointer items-center gap-3 border-b border-subtle px-2 text-left text-sm transition-colors hover:bg-surface",
                        task.id === selectedId && "bg-surface",
                      )}
                    >
                      <TaskStatusIcon status={task.status} size={14} />
                      <span className="w-14 shrink-0 font-mono text-[11px] text-ink-muted">{task.id}</span>
                      <span className={cn("min-w-0 flex-1 truncate", task.status === "done" && "text-ink-muted")}>
                        {task.title}
                      </span>
                      {label && <TaskLabelChip label={label} />}
                      {assignee ? <UserAvatar user={assignee} size={22} ring /> : <span className="w-[22px]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
