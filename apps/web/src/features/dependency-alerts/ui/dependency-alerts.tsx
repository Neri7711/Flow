"use client";

import { useEffect } from "react";

import { type Task, type TaskStatus, useTaskStore } from "@/entities/task";
import { type Team, TeamAvatar } from "@/entities/team";
import { toast } from "@/shared/lib/toast";

/** Statuses that make a blocked task worth revisiting. */
const UNBLOCKING: Partial<Record<TaskStatus, string>> = {
  in_review: "pasó a revisión",
  done: "está hecha",
};

type DependencyAlertsProps = {
  /** Space being viewed: only its blocked tasks are announced. */
  teamId: string;
  teams: readonly Team[];
};

/** Teams whose pending dependencies were already announced this session. */
const announcedTeams = new Set<string>();

export function DependencyAlerts({ teamId, teams }: DependencyAlertsProps) {
  useEffect(() => {
    const announce = (blocker: Task, blocked: readonly Task[]) => {
      const phrase = UNBLOCKING[blocker.status];
      const team = teams.find((candidate) => candidate.id === blocker.teamId);
      if (!phrase || blocked.length === 0) return;

      const ids = blocked.map((task) => task.id).join(", ");
      toast(
        <>
          <b>
            {blocker.id} {phrase}.
          </b>{" "}
          {ids} podría{blocked.length > 1 ? "n" : ""} desbloquearse pronto.
        </>,
        { icon: team && <TeamAvatar team={team} size={40} decorative /> },
      );
    };

    const blockedBy = (tasks: Record<string, Task>, blockerId: string) =>
      Object.values(tasks).filter((task) => task.teamId === teamId && task.blockedByIds.includes(blockerId));

    // Dependencies already unblocking when the space opens (once per session).
    if (!announcedTeams.has(teamId)) {
      announcedTeams.add(teamId);
      const { tasks } = useTaskStore.getState();
      for (const blocker of Object.values(tasks)) {
        if (blocker.status === "in_review") announce(blocker, blockedBy(tasks, blocker.id));
      }
    }

    // Live changes made anywhere in the app.
    return useTaskStore.subscribe((state, previous) => {
      for (const task of Object.values(state.tasks)) {
        if (previous.tasks[task.id]?.status !== task.status) announce(task, blockedBy(state.tasks, task.id));
      }
    });
  }, [teamId, teams]);

  return null;
}
