import type { Team } from "@/entities/team";
import { formatDayOfMonth, formatMonthShort, formatTime } from "@/shared/lib/format-date";
import { Eyebrow } from "@/shared/ui/eyebrow";

import type { CalendarEntry } from "../model/calendar-entries";
import { MilestoneFlag } from "./calendar-markers";

/** Items listed in "Próximos". */
const UPCOMING_LIMIT = 5;

type UpcomingPanelProps = {
  /** The current space: tints the legend swatches. */
  team: Team;
  teams: readonly Team[];
  /** Chronological and already filtered by the visible teams. */
  upcoming: readonly CalendarEntry[];
};

function title(entry: CalendarEntry): string {
  if (entry.kind === "event") return entry.event.title;
  return entry.kind === "milestone" ? entry.name : entry.label;
}

function detail(entry: CalendarEntry): string {
  if (entry.kind === "milestone") return "Hito";
  if (entry.kind === "event") return entry.event.endsAt ? formatTime(entry.event.startsAt) : "Todo el día";
  return entry.label;
}

/** Side panel: what's coming across the visible teams, and how to read the grid. */
export function UpcomingPanel({ team, teams, upcoming }: UpcomingPanelProps) {
  const teamName = (teamId: string) => teams.find((candidate) => candidate.id === teamId)?.name ?? teamId;
  const items = upcoming.slice(0, UPCOMING_LIMIT);

  return (
    <aside aria-label="Próximos y leyenda" className="flex w-[300px] shrink-0 flex-col gap-5 border-l border-line bg-panel px-[22px] pt-[22px] pb-8">
      <section aria-labelledby="calendar-upcoming">
        <Eyebrow id="calendar-upcoming">Próximos</Eyebrow>
        {items.length === 0 ? (
          <p className="mt-1.5 border-t border-subtle py-2.5 text-sm text-ink-muted">Nada en el horizonte por ahora.</p>
        ) : (
          <ol className="mt-1.5">
            {items.map((entry) => (
              <li key={entry.key} className="flex items-center gap-3 border-t border-subtle py-2.5">
                <time dateTime={entry.day} className="flex w-10 shrink-0 flex-col items-center">
                  <span className="font-mono text-[10px] text-ink-muted uppercase">{formatMonthShort(entry.at)}</span>
                  <span className="text-lg leading-none font-bold">{formatDayOfMonth(entry.at)}</span>
                </time>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span data-team={entry.teamId} className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                    {entry.kind === "milestone" ? (
                      <MilestoneFlag className="size-3 shrink-0 text-team-strong" />
                    ) : (
                      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-team" />
                    )}
                    <span className="truncate">{title(entry)}</span>
                  </span>
                  <span className="text-xs text-ink-muted">
                    {teamName(entry.teamId)} · {detail(entry)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="calendar-legend" className="mt-auto flex flex-col gap-2.5 border-t border-line pt-4">
        <Eyebrow id="calendar-legend">Leyenda</Eyebrow>
        <span data-team={team.id} className="flex items-center gap-2.5 text-[13px]">
          <span aria-hidden="true" className="h-3 w-5 rounded-[3px] border-l-[3px] border-team bg-team-soft" />
          Evento del equipo
        </span>
        <span data-team={team.id} className="flex items-center gap-2.5 text-[13px]">
          <MilestoneFlag className="size-3.5 text-team-strong" />
          Hito de proyecto
        </span>
        <span className="flex items-center gap-2.5 text-[13px]">
          <span aria-hidden="true" className="h-3 w-[18px] rounded-[3px] border border-dashed border-ink" />
          Inicio o fin de ciclo
        </span>
      </section>
    </aside>
  );
}
