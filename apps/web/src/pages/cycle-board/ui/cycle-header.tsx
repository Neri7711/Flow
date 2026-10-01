"use client";

import { useShallow } from "zustand/react/shallow";

import type { Cycle } from "@/entities/cycle";
import type { Project } from "@/entities/project";
import { useTaskStore } from "@/entities/task";
import { daysUntil, formatDayMonth } from "@/shared/lib/format-date";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { MonoTag } from "@/shared/ui/mono-tag";

import { MilestoneTrack } from "./milestone-track";

type CycleHeaderProps = {
  cycle: Cycle;
  project?: Project;
};

export function CycleHeader({ cycle, project }: CycleHeaderProps) {
  const statuses = useTaskStore(
    useShallow((state) =>
      Object.values(state.tasks)
        .filter((task) => task.cycleId === cycle.id)
        .map((task) => task.status),
    ),
  );
  const done = statuses.filter((status) => status === "done").length;
  const progress = statuses.length ? Math.round((done / statuses.length) * 100) : 0;
  const daysLeft = Math.max(0, daysUntil(cycle.endsAt));

  return (
    <div className="flex flex-wrap items-end gap-5">
      <div className="flex min-w-[260px] grow flex-col gap-2.5">
        <MonoTag className="px-[9px] py-1 text-team-strong">Ciclo {cycle.number} · Activo</MonoTag>
        <div className="flex flex-wrap items-baseline gap-3.5">
          <h1 className="text-[32px] font-bold tracking-display">
            {formatDayMonth(cycle.startsAt)} – {formatDayMonth(cycle.endsAt)}
          </h1>
          <span className="font-serif text-xl text-ink-muted italic">
            {daysLeft === 1 ? "queda 1 día" : `quedan ${daysLeft} días`}
          </span>
        </div>
        <div className="flex max-w-[420px] items-center gap-3">
          <div
            role="progressbar"
            aria-label="Progreso del ciclo"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 grow overflow-hidden rounded-full bg-subtle"
          >
            <div className="h-full rounded-full bg-team transition-[width] duration-(--motion-base)" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[11px] text-ink-muted uppercase">
            <AnimatedNumber value={done} /> / <AnimatedNumber value={statuses.length} /> tareas
          </span>
        </div>
      </div>

      {project && <MilestoneTrack project={project} />}
    </div>
  );
}
