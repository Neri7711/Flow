"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { Team, TeamId } from "@/entities/team";
import { motionTokens } from "@/shared/config";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

import type { CalendarEntry } from "../model/calendar-entries";
import { MonthView } from "./month-view";
import { NewEventButton } from "./new-event-button";
import { TeamFilter } from "./team-filter";
import { UpcomingPanel } from "./upcoming-panel";

type View = "month" | "week";

const VIEWS: { id: View; label: string }[] = [
  { id: "month", label: "Mes" },
  { id: "week", label: "Semana" },
];

const navButton =
  "flex cursor-pointer items-center justify-center rounded-[10px] border border-line bg-surface text-ink transition-colors duration-(--motion-press) outline-none hover:bg-surface-sunken focus-visible:ring-3 focus-visible:ring-ring/50";

type CalendarBoardProps = {
  /** The space the calendar is opened from (new events, milestones and cycle). */
  team: Team;
  teams: readonly Team[];
  /** "Octubre 2026" */
  title: string;
  /** "2026-10" */
  month: string;
  weeks: string[][];
  /** "YYYY-MM-DD" */
  today: string;
  entries: readonly CalendarEntry[];
  /** Events and milestones from today on, chronological. */
  upcoming: readonly CalendarEntry[];
  previousHref: string;
  nextHref: string;
  todayHref: string;
  newEventDay: string;
};

/** Interactive part of the calendar: month navigation, view switch, team filter, grid and side panel. */
export function CalendarBoard({
  team,
  teams,
  title,
  month,
  weeks,
  today,
  entries,
  upcoming,
  previousHref,
  nextHref,
  todayHref,
  newEventDay,
}: CalendarBoardProps) {
  const [view, setView] = useState<View>("month");
  // Teams switched off in "Mostrar"; empty means every team is shown.
  const [hidden, setHidden] = useState<ReadonlySet<TeamId>>(new Set());
  const isShown = (entry: CalendarEntry) => !hidden.has(entry.teamId);

  const toggleTeam = (teamId: TeamId) =>
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(teamId)) next.add(teamId);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1">
      <main className="flex min-w-0 flex-1 flex-col gap-[18px] px-7 pt-[22px] pb-8">
        <header className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[30px] font-bold tracking-display">{title}</h1>
            <span className="font-serif text-[19px] text-ink-muted italic">cuatro equipos, un calendario</span>
          </div>

          <nav aria-label="Cambiar de mes" className="ml-2 flex items-center gap-1">
            <Link href={previousHref} aria-label="Mes anterior" className={cn(navButton, "size-8")}>
              <ChevronLeft className="size-4" strokeWidth={1.8} />
            </Link>
            <Link href={nextHref} aria-label="Mes siguiente" className={cn(navButton, "size-8")}>
              <ChevronRight className="size-4" strokeWidth={1.8} />
            </Link>
            <Link href={todayHref} className={cn(navButton, "h-8 px-3 text-[13px] font-medium")}>
              Hoy
            </Link>
          </nav>

          <div role="tablist" aria-label="Vista" className="ml-auto flex gap-0.5 rounded-xl bg-sand p-[3px]">
            {VIEWS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "relative h-[30px] cursor-pointer rounded-[9px] px-3 text-[13px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  view === id ? "font-semibold" : "hover:bg-surface/50",
                )}
              >
                {view === id && (
                  <motion.span
                    layoutId="calendar-view-indicator"
                    transition={motionTokens.spring}
                    className="absolute inset-0 rounded-[9px] bg-surface shadow-[0_1px_2px_rgb(42_36_32/0.1)]"
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          <NewEventButton teamId={team.id} defaultDay={newEventDay} />
        </header>

        <TeamFilter teams={teams} hidden={hidden} onToggle={toggleTeam} />

        {/* initial={false}: no entrance on page load, only when switching views. */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.press, ease: motionTokens.ease.out }}
            className="flex flex-col"
          >
            {view === "month" ? (
              <MonthView month={month} weeks={weeks} today={today} entries={entries.filter(isShown)} />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-line-strong py-16 text-center">
                <Eyebrow>Próximamente</Eyebrow>
                <p className="font-serif text-xl text-ink-muted italic">La vista Semana todavía se está diseñando.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <UpcomingPanel team={team} teams={teams} upcoming={upcoming.filter(isShown)} />
    </div>
  );
}
