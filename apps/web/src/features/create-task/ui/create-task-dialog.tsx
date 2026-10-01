"use client";

import { type FormEvent, useState } from "react";

import { TASK_STATUS_LABEL, TASK_STATUSES, type TaskStatus, TaskStatusIcon, useTaskStore } from "@/entities/task";
import type { Team } from "@/entities/team";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Pick<Team, "id" | "name" | "abbreviation">;
  defaultStatus?: TaskStatus;
  defaultTitle?: string;
  cycleId?: string;
  onCreated?: (taskId: string) => void;
};

/** Minimal creation: only a title is needed (no mandatory fields, by product decision). */
export function CreateTaskDialog({ open, onOpenChange, ...props }: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Remounted on every open, so the form always starts from the given defaults. */}
        {open && <CreateTaskForm {...props} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

type CreateTaskFormProps = Omit<CreateTaskDialogProps, "open" | "onOpenChange"> & { onDone: () => void };

function CreateTaskForm({ team, defaultStatus = "todo", defaultTitle = "", cycleId, onCreated, onDone }: CreateTaskFormProps) {
  const createTask = useTaskStore((state) => state.createTask);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const id = createTask({ teamId: team.id, abbreviation: team.abbreviation, title: trimmed, status, cycleId });
    onCreated?.(id);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <Eyebrow>Nueva tarea · {team.name}</Eyebrow>
        <DialogTitle className="text-xl font-bold tracking-display">¿Qué hay que hacer?</DialogTitle>
        <DialogDescription className="sr-only">Escribe un título y elige el estado inicial.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-task-title">Título</Label>
        <Input
          id="new-task-title"
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ej. Sprites del jefe final"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Estado</legend>
        <div className="flex flex-wrap gap-1.5">
          {TASK_STATUSES.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                status === option ? "border-ink bg-surface font-medium" : "border-line text-ink-muted hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="status"
                value={option}
                checked={status === option}
                onChange={() => setStatus(option)}
                className="sr-only"
              />
              <TaskStatusIcon status={option} size={14} />
              {TASK_STATUS_LABEL[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="md" disabled={!title.trim()} className="self-end">
        Crear tarea
      </Button>
    </form>
  );
}
