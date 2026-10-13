"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { motionTokens } from "@/shared/config";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/ui/eyebrow";

import { type CalendarEntry, groupByDay } from "../model/calendar-entries";
import { CycleMarker, MilestoneMarker } from "./calendar-markers";
import { EventItem } from "./event-item";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
/** Entries shown per day before "+N más". */
const MAX_PER_DAY = 3;

type MonthViewProps = {
  /** "2026-10" */
  month: string;
  weeks: string[][];
  /** "YYYY-MM-DD" */
  today: string;
  /** Already filtered by the visible teams. */
  entries: readonly CalendarEntry[];
};

/** Monday-first month grid. Changing month slides it in from the side of the arrow. */
export function MonthView({ month, weeks, today, entries }: MonthViewProps) {
  // Render-time tracking of the previous month: 0 on first render, so the page load doesn't animate.
  const [slide, setSlide] = useState({ month, direction: 0 });
  if (slide.month !== month) setSlide({ month, direction: month > slide.month ? 1 : -1 });

  const byDay = groupByDay(entries);

  return (
    <div className="overflow-hidden rounded-[18px] border border-line">
      <div className="grid grid-cols-7 bg-subtle">
        {WEEKDAYS.map((weekday) => (
          <Eyebrow key={weekday} className="px-2.5 py-2 text-[10px]">
            {weekday}
          </Eyebrow>
        ))}
      </div>

      <motion.div
        key={month}
        initial={slide.direction === 0 ? false : { opacity: 0, x: slide.direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
        className="grid grid-cols-7 gap-px border-t border-line bg-line"
      >
        {weeks.flat().map((day, index) => {
          const inMonth = day.startsWith(month);
          const isToday = day === today;
          const dayEntries = byDay.get(day) ?? [];
          const overflow = dayEntries.length - MAX_PER_DAY;

          return (
            <div
              key={day}
              className={cn(
                "relative flex min-h-32 min-w-0 flex-col gap-1 p-1.5",
                // Saturday and Sunday columns are slightly sunken.
                index % 7 >= 5 ? "bg-cream" : "bg-surface",
                !inMonth && "opacity-85",
              )}
            >
              <time
                dateTime={day}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "flex size-[26px] items-center justify-center rounded-full text-[13px] font-medium",
                  isToday ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-ink" : "text-ink-faint",
                )}
              >
                {Number(day.slice(8))}
              </time>

              {/* Filtering fades entries in and out; nothing animates on load. */}
              <AnimatePresence initial={false} mode="popLayout">
                {dayEntries.slice(0, MAX_PER_DAY).map((entry) => (
                  <motion.div
                    key={entry.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: motionTokens.duration.press, ease: motionTokens.ease.out }}
                    className="flex min-w-0 flex-col"
                  >
                    {entry.kind === "event" && <EventItem event={entry.event} />}
                    {entry.kind === "milestone" && <MilestoneMarker teamId={entry.teamId} name={entry.name} />}
                    {entry.kind === "cycle" && <CycleMarker label={entry.label} />}
                  </motion.div>
                ))}
              </AnimatePresence>
              {overflow > 0 && <span className="px-1.5 text-[11px] text-ink-muted">+{overflow} más</span>}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
