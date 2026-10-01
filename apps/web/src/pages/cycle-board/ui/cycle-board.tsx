"use client";

import { type ReactNode, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChartGantt, Kanban, List, ListFilter, type LucideIcon, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { type TaskStatus, useTaskStore } from "@/entities/task";
import { UserAvatar } from "@/entities/user";
import { CreateTaskDialog } from "@/features/create-task";
import { useHotkeys } from "@/shared/lib/use-hotkeys";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Kbd } from "@/shared/ui/kbd";

import type { BoardDirectory } from "../model/directory";
import { FilterMenu } from "./filter-menu";
import { KanbanView } from "./kanban-view";
import { ListView } from "./list-view";
import { TaskDetailPanel } from "./task-detail-panel";

type View = "board" | "list" | "timeline";

const VIEWS: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "board", label: "Tablero", icon: Kanban },
  { id: "list", label: "Lista", icon: List },
  { id: "timeline", label: "Timeline", icon: ChartGantt },
];

type CycleBoardProps = {
  directory: BoardDirectory;
  header: ReactNode;
  /** Task open in the detail panel, mirrored in the `?task=` query param. */
  selectedId: string | null;
};

/** Reads the selected task from the URL. Needs a Suspense boundary (client-only search params). */
export function CycleBoardWithSelection(props: Omit<CycleBoardProps, "selectedId">) {
  const selectedId = useSearchParams()?.get("task") ?? null;
  return <CycleBoard {...props} selectedId={selectedId} />;
}

/** Interactive part of the cycle page: views, filters, selection, creation and detail panel. */
export function CycleBoard({ directory, header, selectedId }: CycleBoardProps) {
  const { team, cycle, currentUser } = directory;
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const [view, setView] = useState<View>("board");
  const [assigneeFilter, setAssigneeFilter] = useState<ReadonlySet<string>>(new Set());
  const [labelFilter, setLabelFilter] = useState<ReadonlySet<string>>(new Set());
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);

  const allTasks = useTaskStore((state) => state.tasks);
  const setStatus = useTaskStore((state) => state.setStatus);
  const teamTasks = useTaskStore(
    useShallow((state) =>
      Object.values(state.tasks).filter((task) => task.teamId === team.id && (!cycle || task.cycleId === cycle.id)),
    ),
  );

  const visibleTasks = teamTasks.filter(
    (task) =>
      (assigneeFilter.size === 0 || assigneeFilter.has(task.assigneeId ?? "")) &&
      (labelFilter.size === 0 || labelFilter.has(task.labelId ?? "")),
  );
  const blockerStatuses = Object.fromEntries(Object.values(allTasks).map((task) => [task.id, task.status]));
  const selectedTask = selectedId ? allTasks[selectedId] : undefined;

  const select = (taskId: string | null) =>
    router.replace(taskId ? `${pathname}?task=${taskId}` : pathname, { scroll: false });

  // "C" (create task) is a global shortcut owned by the command palette.
  useHotkeys({ escape: () => selectedId && select(null) });

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-[18px] overflow-y-auto px-7 pt-[22px] pb-24">
        {header}

        <div className="flex flex-wrap items-center gap-2.5">
          <div role="tablist" aria-label="Vista" className="flex gap-0.5 rounded-xl bg-sand p-[3px]">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "flex h-8 cursor-pointer items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium transition-colors",
                  view === id ? "bg-surface font-semibold shadow-[0_1px_2px_rgb(42_36_32/0.1)]" : "hover:bg-surface/50",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>

          <ListFilter aria-hidden="true" className="ml-1.5 size-4 text-ink-muted" strokeWidth={1.8} />
          <FilterMenu
            label="Responsable"
            options={directory.users.map((user) => ({
              id: user.id,
              label: user.name,
              icon: <UserAvatar user={user} size={20} />,
            }))}
            selected={assigneeFilter}
            onChange={setAssigneeFilter}
          />
          <FilterMenu
            label="Etiqueta"
            options={directory.labels.map((label) => ({ id: label.id, label: label.name }))}
            selected={labelFilter}
            onChange={setLabelFilter}
          />

          <Button className="ml-auto px-3.5 text-[13px]" onClick={() => setCreateStatus("todo")}>
            <Plus strokeWidth={1.8} />
            Nueva tarea
            <Kbd variant="inverse" size="sm">
              C
            </Kbd>
          </Button>
        </div>

        {view === "board" && (
          <KanbanView
            tasks={visibleTasks}
            blockerStatuses={blockerStatuses}
            directory={directory}
            selectedId={selectedId}
            onSelect={select}
            onMove={(taskId, status) => setStatus(taskId, status, currentUser.id)}
            onCreate={setCreateStatus}
          />
        )}
        {view === "list" && (
          <ListView tasks={visibleTasks} directory={directory} selectedId={selectedId} onSelect={select} />
        )}
        {view === "timeline" && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong py-16 text-center">
            <Eyebrow>Próximamente</Eyebrow>
            <p className="font-serif text-xl text-ink-muted italic">La vista Timeline todavía se está diseñando.</p>
          </div>
        )}
      </div>

      {selectedTask && <TaskDetailPanel task={selectedTask} directory={directory} onClose={() => select(null)} />}

      <CreateTaskDialog
        open={createStatus !== null}
        onOpenChange={(open) => !open && setCreateStatus(null)}
        team={team}
        defaultStatus={createStatus ?? "todo"}
        cycleId={cycle?.id}
        onCreated={select}
      />
    </div>
  );
}
