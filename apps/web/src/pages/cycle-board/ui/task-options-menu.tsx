"use client";

import type { ReactNode } from "react";
import { Ban, CalendarDays, ChartNoAxesColumnIncreasing, Ellipsis, Tag, Trash2, UserRound } from "lucide-react";

import { type Task, type TaskPatch, type TaskPriority, useTaskStore } from "@/entities/task";
import { UserAvatar } from "@/entities/user";
import { now } from "@/shared/config";
import { dayKey, zonedIso } from "@/shared/lib/format-date";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { BoardDirectory } from "../model/directory";

/** Same surface as the status menu. */
const MENU = "w-48 rounded-[14px] border border-line p-1.5 shadow-float ring-0";
const ITEM = "gap-2 rounded-[10px] text-sm";
/** Radio values can't be null. */
const NONE = "none";

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low", label: "Baja" },
];

/** Calendar day `days` after today, in the app's time zone. */
function dayFromToday(days: number): string {
  const today = dayKey(now());
  return dayKey(new Date(Date.parse(zonedIso(today, "12:00")) + days * 24 * 60 * 60 * 1000));
}

type TaskOptionsMenuProps = {
  task: Task;
  directory: BoardDirectory;
  /** Closes the detail panel (after deleting the task). */
  onDeleted: () => void;
};

/** The panel's "Más opciones": edit the task's fields, or delete it. */
export function TaskOptionsMenu({ task, directory, onDeleted }: TaskOptionsMenuProps) {
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const allTasks = useTaskStore((state) => state.tasks);

  const update = (patch: TaskPatch) => void updateTask(task.id, patch);
  const dueOptions = [
    { value: dayFromToday(0), label: "Hoy" },
    { value: dayFromToday(1), label: "Mañana" },
    { value: dayFromToday(7), label: "En una semana" },
  ];
  const candidates = Object.values(allTasks).filter((candidate) => candidate.id !== task.id);

  const toggleBlocker = (blockerId: string, checked: boolean) => {
    const next = checked ? [...task.blockedByIds, blockerId] : task.blockedByIds.filter((id) => id !== blockerId);
    update({ blockedByIds: next });
  };

  const remove = async () => {
    if (!window.confirm(`¿Eliminar ${task.id} “${task.title}”? Se pierde su historial. No se puede deshacer.`)) return;
    if (await deleteTask(task.id)) {
      onDeleted();
      toast(<>Se eliminó <b>{task.id}</b>.</>);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Más opciones">
          <Ellipsis strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={MENU}>
        <Submenu icon={<UserRound className="size-3.5" strokeWidth={1.8} />} label="Responsable">
          <DropdownMenuRadioGroup value={task.assigneeId ?? NONE} onValueChange={(value) => update({ assigneeId: value === NONE ? null : value })}>
            <DropdownMenuRadioItem value={NONE} className={ITEM}>
              Sin asignar
            </DropdownMenuRadioItem>
            {directory.users.map((user) => (
              <DropdownMenuRadioItem key={user.id} value={user.id} className={ITEM}>
                <UserAvatar user={user} size={18} />
                <span className="truncate">{user.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </Submenu>

        <Submenu icon={<ChartNoAxesColumnIncreasing className="size-3.5" strokeWidth={1.8} />} label="Prioridad">
          <DropdownMenuRadioGroup
            value={task.priority ?? NONE}
            onValueChange={(value) => update({ priority: value === NONE ? null : (value as TaskPriority) })}
          >
            {PRIORITIES.map((priority) => (
              <DropdownMenuRadioItem key={priority.value} value={priority.value} className={ITEM}>
                {priority.label}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuRadioItem value={NONE} className={ITEM}>
              Sin prioridad
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </Submenu>

        <Submenu icon={<Tag className="size-3.5" strokeWidth={1.8} />} label="Etiqueta">
          <DropdownMenuRadioGroup value={task.labelId ?? NONE} onValueChange={(value) => update({ labelId: value === NONE ? null : value })}>
            {directory.labels.map((label) => (
              <DropdownMenuRadioItem key={label.id} value={label.id} className={ITEM}>
                <span
                  aria-hidden="true"
                  data-team={label.tone ?? undefined}
                  className={label.tone ? "size-2 rounded-full bg-team" : "size-2 rounded-full bg-ink-faint"}
                />
                {label.name}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuRadioItem value={NONE} className={ITEM}>
              Sin etiqueta
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </Submenu>

        <Submenu icon={<CalendarDays className="size-3.5" strokeWidth={1.8} />} label="Fecha límite">
          <DropdownMenuRadioGroup value={task.dueDate ?? NONE} onValueChange={(value) => update({ dueDate: value === NONE ? null : value })}>
            {dueOptions.map((option) => (
              <DropdownMenuRadioItem key={option.label} value={option.value} className={ITEM}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuRadioItem value={NONE} className={ITEM}>
              Sin fecha
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </Submenu>

        <Submenu icon={<Ban className="size-3.5" strokeWidth={1.8} />} label="Bloqueada por" wide>
          {candidates.map((candidate) => (
            <DropdownMenuCheckboxItem
              key={candidate.id}
              checked={task.blockedByIds.includes(candidate.id)}
              onCheckedChange={(checked) => toggleBlocker(candidate.id, checked === true)}
              // Keep the menu open to pick several.
              onSelect={(event) => event.preventDefault()}
              className={ITEM}
            >
              <span data-team={candidate.teamId} className="shrink-0 font-mono text-[11px] text-team-strong">
                {candidate.id}
              </span>
              <span className="truncate">{candidate.title}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </Submenu>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={remove} className={ITEM}>
          <Trash2 className="size-3.5" strokeWidth={1.8} />
          Eliminar tarea
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Submenu({ icon, label, wide = false, children }: { icon: ReactNode; label: string; wide?: boolean; children: ReactNode }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={ITEM}>
        {icon}
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={wide ? `${MENU} max-h-72 w-64 overflow-y-auto` : MENU}>{children}</DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
