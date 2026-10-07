import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { type CalendarEvent, getEvents } from "@/entities/event";
import { getTeam } from "@/entities/team";
import { getCurrentUser, getUsers } from "@/entities/user";
import { now, routes } from "@/shared/config";
import { dayKey, formatMonthYear, zonedIso } from "@/shared/lib/format-date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { AppTopbar } from "@/widgets/app-topbar";

import { buildMonthGrid, parseMonth } from "../model/month-grid";
import { EventItem } from "./event-item";
import { NewEventButton } from "./new-event-button";

const WEEKDAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
/** Events shown per day before "+N más". */
const MAX_PER_DAY = 3;

type CalendarPageProps = {
  teamId: string;
  /** "2026-10"; defaults to the current month. */
  month?: string;
};

export async function CalendarPage({ teamId, month }: CalendarPageProps) {
  const team = await getTeam(teamId);
  if (!team) notFound();

  const grid = buildMonthGrid(parseMonth(month, now()));
  const [user, users, events] = await Promise.all([getCurrentUser(), getUsers(), getEvents(team.id, grid.from, grid.to)]);

  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(event.startsAt);
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  }
  const today = dayKey(now());
  const title = formatMonthYear(zonedIso(`${grid.month}-01`, "12:00"));
  const monthHref = (key: string) => `${routes.calendar(team.id)}?month=${key}`;

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: team.name, href: routes.space(team.id) }, { label: "Calendario" }]}
        presence={users.filter((candidate) => candidate.id !== user.id)}
      />

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-12 pt-8 pb-14">
        <header className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Eyebrow>Calendario · {team.name}</Eyebrow>
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-display first-letter:uppercase">{title}</h1>
          </div>
          <nav aria-label="Cambiar de mes" className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" asChild>
              <Link href={monthHref(grid.previous)} aria-label="Mes anterior">
                <ChevronLeft strokeWidth={1.8} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={routes.calendar(team.id)}>Hoy</Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={monthHref(grid.next)} aria-label="Mes siguiente">
                <ChevronRight strokeWidth={1.8} />
              </Link>
            </Button>
            <NewEventButton teamId={team.id} defaultDay={today.startsWith(grid.month) ? today : `${grid.month}-01`} />
          </nav>
        </header>

        <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-raised">
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((weekday) => (
              <Eyebrow key={weekday} className="px-3 py-2.5 text-[10px]">
                {weekday}
              </Eyebrow>
            ))}
          </div>
          {grid.weeks.map((week) => (
            <div key={week[0]} className="grid grid-cols-7 border-b border-subtle last:border-b-0">
              {week.map((day) => {
                const dayEvents = byDay.get(day) ?? [];
                const inMonth = day.startsWith(grid.month);
                return (
                  <div
                    key={day}
                    className={cn("flex min-h-[112px] flex-col gap-1 border-r border-subtle p-2 last:border-r-0", !inMonth && "bg-cream/40")}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center self-start rounded-full text-[13px]",
                        !inMonth && "text-ink-faint",
                        day === today && "bg-primary font-semibold text-primary-foreground",
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>
                    {dayEvents.slice(0, MAX_PER_DAY).map((event) => (
                      <EventItem key={event.id} event={event} />
                    ))}
                    {dayEvents.length > MAX_PER_DAY && (
                      <span className="px-1.5 text-[11px] text-ink-muted">+{dayEvents.length - MAX_PER_DAY} más</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
