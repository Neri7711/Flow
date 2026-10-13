import { notFound } from "next/navigation";

import { getActiveCycle } from "@/entities/cycle";
import { getEvents, getUpcomingEvents } from "@/entities/event";
import { getActiveProject } from "@/entities/project";
import { getTeam, getTeams } from "@/entities/team";
import { getCurrentUser, getUsers } from "@/entities/user";
import { now, routes } from "@/shared/config";
import { dayKey, formatMonthYear, zonedIso } from "@/shared/lib/format-date";
import { AppTopbar } from "@/widgets/app-topbar";

import { cycleEntries, eventEntry, milestoneEntries } from "../model/calendar-entries";
import { buildMonthGrid, parseMonth } from "../model/month-grid";
import { CalendarBoard } from "./calendar-board";

/** Upcoming events fetched per team; the panel merges them and shows the first few. */
const UPCOMING_PER_TEAM = 5;

type CalendarPageProps = {
  teamId: string;
  /** "2026-10"; defaults to the current month. */
  month?: string;
};

export async function CalendarPage({ teamId, month }: CalendarPageProps) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const grid = buildMonthGrid(parseMonth(month, now()));
  const [user, users, teams, project, cycle] = await Promise.all([
    getCurrentUser(),
    getUsers(),
    getTeams(),
    getActiveProject(team.id),
    getActiveCycle(team.id),
  ]);
  // "Cuatro equipos, un calendario": every team's events, one request per team.
  const [monthEvents, upcomingEvents] = await Promise.all([
    Promise.all(teams.map((candidate) => getEvents(candidate.id, grid.from, grid.to))),
    Promise.all(teams.map((candidate) => getUpcomingEvents(candidate.id, UPCOMING_PER_TEAM))),
  ]);

  const today = dayKey(now());
  const milestones = milestoneEntries(project);
  const entries = [...monthEvents.flat().map(eventEntry), ...milestones, ...cycleEntries(cycle)];
  const upcoming = [...upcomingEvents.flat().map(eventEntry), ...milestones.filter((entry) => entry.day >= today)];
  const monthHref = (key: string) => `${routes.calendar(team.id)}?month=${key}`;

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: "Calendario" }]}
        presence={users.filter((candidate) => candidate.id !== user.id)}
      />

      <CalendarBoard
        team={team}
        teams={teams}
        // "octubre de 2026" → "Octubre 2026"
        title={formatMonthYear(zonedIso(`${grid.month}-01`, "12:00")).replace(" de ", " ")}
        month={grid.month}
        weeks={grid.weeks}
        today={today}
        entries={entries}
        // Chronological, regardless of kind.
        upcoming={[...upcoming].sort((a, b) => a.at.localeCompare(b.at))}
        previousHref={monthHref(grid.previous)}
        nextHref={monthHref(grid.next)}
        todayHref={routes.calendar(team.id)}
        newEventDay={today.startsWith(grid.month) ? today : `${grid.month}-01`}
      />
    </>
  );
}
