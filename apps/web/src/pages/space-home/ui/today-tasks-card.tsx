"use client";

import { useShallow } from "zustand/react/shallow";

import { type TaskLabel, TaskLabelChip, useTaskStore } from "@/entities/task";
import { type User, UserAvatar } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Eyebrow } from "@/shared/ui/eyebrow";

type TodayTasksCardProps = {
  teamId: string;
  date: string;
  labels: readonly TaskLabel[];
  users: readonly User[];
};

/** Checking a task marks it done everywhere (shared task store). */
export function TodayTasksCard({ teamId, date, labels, users }: TodayTasksCardProps) {
  const tasks = useTaskStore(
    useShallow((state) =>
      Object.values(state.tasks).filter((task) => task.teamId === teamId && task.dueDate === date),
    ),
  );
  const toggleDone = useTaskStore((state) => state.toggleDone);
  const pending = tasks.filter((task) => task.status !== "done").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas de hoy</CardTitle>
        {tasks.length > 0 && (
          <Eyebrow>
            {pending} de {tasks.length}
          </Eyebrow>
        )}
      </CardHeader>

      {tasks.length === 0 && <p className="border-t border-subtle py-3 text-sm text-ink-muted">Nada para hoy.</p>}

      {tasks.map((task) => {
        const label = labels.find((candidate) => candidate.id === task.labelId);
        const assignee = users.find((candidate) => candidate.id === task.assigneeId);
        const isDone = task.status === "done";

        return (
          <label key={task.id} className="flex cursor-pointer items-center gap-3 border-t border-subtle py-3">
            <input
              type="checkbox"
              checked={isDone}
              onChange={() => toggleDone(task.id)}
              className="size-[18px] shrink-0 cursor-pointer accent-ink"
            />
            <span className={cn("grow text-sm", isDone && "text-ink-muted line-through")}>{task.title}</span>
            {label && <TaskLabelChip label={label} />}
            {assignee && <UserAvatar user={assignee} size={24} ring />}
          </label>
        );
      })}
    </Card>
  );
}
