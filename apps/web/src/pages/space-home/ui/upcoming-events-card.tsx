import { Clock } from "lucide-react";

import type { CalendarEvent } from "@/entities/event";
import { formatDayOfMonth, formatMonthShort, formatTime } from "@/shared/lib/format-date";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";

export function UpcomingEventsCard({ events }: { events: readonly CalendarEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos eventos</CardTitle>
        {/* Calendar view is out of the current scope. */}
        <span className="text-[13px]">Ver calendario</span>
      </CardHeader>

      {events.length === 0 && <p className="border-t border-subtle py-3 text-sm text-ink-muted">Sin eventos próximos.</p>}

      {events.map((event) => (
        <div key={event.id} className="flex items-center gap-3.5 border-t border-subtle py-2.5">
          <div className="flex h-[52px] w-12 shrink-0 flex-col items-center justify-center rounded-[14px] border border-line bg-cream">
            <span className="font-mono text-[10px] text-ink-muted uppercase">{formatMonthShort(event.startsAt)}</span>
            <span className="text-xl leading-none font-bold">{formatDayOfMonth(event.startsAt)}</span>
          </div>
          <div className="flex flex-col gap-[3px]">
            <span className="text-sm font-medium">{event.title}</span>
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock className="size-3" strokeWidth={1.8} />
              {event.endsAt ? `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}` : "Todo el día"}
            </span>
          </div>
          <span aria-hidden="true" data-team={event.tone} className="ml-auto size-2 shrink-0 rounded-full bg-team" />
        </div>
      ))}
    </Card>
  );
}
