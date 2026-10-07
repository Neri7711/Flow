"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

import { type CalendarEvent, deleteEvent } from "@/entities/event";
import { formatTime, formatWeekdayDay } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Eyebrow } from "@/shared/ui/eyebrow";

const timeRange = (event: CalendarEvent) =>
  event.endsAt ? `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}` : "Todo el día";

/** Compact entry in a day cell; opens the event's details (and its delete action). */
export function EventItem({ event }: { event: CalendarEvent }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      setOpen(false);
      router.refresh();
    } catch {
      toast("No se pudo eliminar el evento.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        data-team={event.tone}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-md bg-team-soft px-1.5 py-1 text-left text-[12px] leading-tight text-team-ink outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-team" />
        {/* In narrow cells the title matters more; the time is in the details dialog. */}
        {event.endsAt && <span className="hidden shrink-0 font-mono text-[10px] xl:inline">{formatTime(event.startsAt)}</span>}
        <span className="truncate">{event.title}</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <Eyebrow>{formatWeekdayDay(event.startsAt)}</Eyebrow>
          <DialogTitle className="text-xl font-bold tracking-display">{event.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Clock className="size-3.5" strokeWidth={1.8} />
            {timeRange(event)}
          </DialogDescription>
        </DialogHeader>
        <Button variant="outline" size="md" disabled={deleting} onClick={remove} className="self-end">
          Eliminar evento
        </Button>
      </DialogContent>
    </Dialog>
  );
}
