import type { Project } from "@/entities/project";
import { now } from "@/shared/config";
import { formatDayMonth } from "@/shared/lib/format-date";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

/** Fraction of the first → last milestone span already elapsed (0–1). */
function elapsed(project: Project): number {
  const dates = project.milestones.map((milestone) => new Date(milestone.date).getTime());
  const start = Math.min(...dates);
  const end = Math.max(...dates);
  if (end === start) return 0;
  return Math.min(1, Math.max(0, (now().getTime() - start) / (end - start)));
}

export function MilestoneTrack({ project }: { project: Project }) {
  return (
    <div className="flex min-w-[300px] flex-col gap-3 rounded-2xl border border-line bg-surface px-[18px] py-3.5">
      <div className="flex items-center gap-2">
        <Eyebrow>Proyecto</Eyebrow>
        <span className="text-sm font-semibold">{project.name}</span>
      </div>

      <ol className="relative flex justify-between px-1.5">
        <span aria-hidden="true" className="absolute top-1.5 right-5 left-5 h-0.5 bg-line" />
        <span
          aria-hidden="true"
          className="absolute top-1.5 left-5 h-0.5 bg-team-strong"
          style={{ width: `calc((100% - 2.5rem) * ${elapsed(project)})` }}
        />
        {project.milestones.map((milestone) => {
          const reached = new Date(milestone.date) <= now();
          return (
            <li key={milestone.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <span
                className={cn("size-3.5 rounded-full border-2 border-team-strong", reached ? "bg-team" : "bg-surface")}
              />
              <span className="text-xs font-semibold">{milestone.name}</span>
              <span className="font-mono text-[10px] text-ink-muted uppercase">{formatDayMonth(milestone.date)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
