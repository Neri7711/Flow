"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createEvent } from "@/entities/event";
import type { TeamId } from "@/entities/team";
import { zonedIso } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type NewEventButtonProps = {
  teamId: TeamId;
  /** "YYYY-MM-DD" the form starts on. */
  defaultDay: string;
};

export function NewEventButton({ teamId, defaultDay }: NewEventButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus strokeWidth={1.8} />
        Nuevo evento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Remounted on every open, so the form always starts clean. */}
          {open && <NewEventForm teamId={teamId} defaultDay={defaultDay} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NewEventForm({ teamId, defaultDay, onDone }: NewEventButtonProps & { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [saving, setSaving] = useState(false);

  const invalidSpan = !allDay && end <= start;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !day || invalidSpan || saving) return;

    setSaving(true);
    try {
      await createEvent({
        teamId,
        title: trimmed,
        startsAt: zonedIso(day, allDay ? "00:00" : start),
        endsAt: allDay ? null : zonedIso(day, end),
      });
      router.refresh();
      onDone();
    } catch {
      toast("No se pudo crear el evento.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <Eyebrow>Nuevo evento</Eyebrow>
        <DialogTitle className="text-xl font-bold tracking-display">¿Qué se viene?</DialogTitle>
        <DialogDescription className="sr-only">Título, día y horario del evento.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-title">Título</Label>
        <Input id="event-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Retro del ciclo" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event-day">Día</Label>
        <Input id="event-day" type="date" required value={day} onChange={(event) => setDay(event.target.value)} />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <Checkbox checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />
        Todo el día
      </label>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-start">Empieza</Label>
            <Input id="event-start" type="time" required value={start} onChange={(event) => setStart(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-end">Termina</Label>
            <Input
              id="event-end"
              type="time"
              required
              value={end}
              aria-invalid={invalidSpan}
              onChange={(event) => setEnd(event.target.value)}
            />
          </div>
        </div>
      )}
      {invalidSpan && <p className="-mt-2 text-sm text-ink-muted">Tiene que terminar después de empezar.</p>}

      <Button type="submit" size="md" disabled={!title.trim() || invalidSpan || saving} className="self-end">
        Crear evento
      </Button>
    </form>
  );
}
