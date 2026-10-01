"use client";

import { type ReactNode, useState } from "react";
import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { TASK_STATUS_LABEL, TASK_STATUSES, type Task, type TaskStatus, TaskStatusIcon } from "@/entities/task";
import { cn } from "@/shared/lib/utils";
import { AnimatedNumber } from "@/shared/ui/animated-number";

import type { BoardDirectory } from "../model/directory";
import { TaskCard } from "./task-card";

type KanbanViewProps = {
  tasks: readonly Task[];
  blockerStatuses: Record<string, TaskStatus | undefined>;
  directory: BoardDirectory;
  selectedId: string | null;
  onSelect: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  onCreate: (status: TaskStatus) => void;
};

const isStatus = (value: unknown): value is TaskStatus => TASK_STATUSES.includes(value as TaskStatus);

/** Spanish screen-reader feedback for keyboard/pointer dragging. */
const announcements: Announcements = {
  onDragStart: ({ active }) => `Tomaste ${active.id}.`,
  onDragOver: ({ active, over }) =>
    over && isStatus(over.id) ? `${active.id} está sobre ${TASK_STATUS_LABEL[over.id]}.` : `${active.id} fuera de columnas.`,
  onDragEnd: ({ active, over }) =>
    over && isStatus(over.id) ? `${active.id} se movió a ${TASK_STATUS_LABEL[over.id]}.` : `${active.id} volvió a su lugar.`,
  onDragCancel: ({ active }) => `Se canceló el movimiento de ${active.id}.`,
};

export function KanbanView({ tasks, blockerStatuses, directory, selectedId, onSelect, onMove, onCreate }: KanbanViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    // A small threshold keeps plain clicks opening the detail panel.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Space picks up / drops; Enter stays free to open the task.
    useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (over && isStatus(over.id)) onMove(String(active.id), over.id);
  };

  const dragging = tasks.find((task) => task.id === draggingId);

  return (
    <DndContext
      id="cycle-board"
      sensors={sensors}
      onDragStart={({ active }) => setDraggingId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "Pulsa espacio para tomar la tarea, flechas para moverla y espacio otra vez para soltarla. Enter abre el detalle.",
        },
      }}
    >
      {/* shrink-0: an overflow container would otherwise shrink to the leftover height and clip cards. */}
      <div className="flex shrink-0 gap-3.5 overflow-x-auto px-0.5 pt-0.5 pb-2">
        {TASK_STATUSES.map((status) => (
          <Column key={status} status={status} count={tasks.filter((task) => task.status === status).length} onCreate={onCreate}>
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <DraggableCard
                  key={task.id}
                  task={task}
                  blockerStatuses={blockerStatuses}
                  directory={directory}
                  selected={task.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
          </Column>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && <TaskCard task={dragging} blockerStatuses={blockerStatuses} directory={directory} dragging />}
      </DragOverlay>
    </DndContext>
  );
}

type ColumnProps = {
  status: TaskStatus;
  count: number;
  onCreate: (status: TaskStatus) => void;
  children: ReactNode;
};

function Column({ status, count, onCreate, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section aria-label={TASK_STATUS_LABEL[status]} className="flex w-[250px] shrink-0 flex-col gap-2.5">
      <div className="flex h-8 items-center gap-2 px-1">
        <TaskStatusIcon status={status} />
        <h3 className="text-sm font-semibold">{TASK_STATUS_LABEL[status]}</h3>
        <AnimatedNumber value={count} className="font-mono text-[11px] text-ink-muted" />
        <button
          type="button"
          onClick={() => onCreate(status)}
          aria-label={`Agregar tarea en ${TASK_STATUS_LABEL[status]}`}
          className="ml-auto flex cursor-pointer rounded-lg p-1 text-ink-muted hover:bg-subtle"
        >
          <Plus className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2.5 rounded-[16px] transition-colors",
          isOver && "bg-subtle/70 outline-2 outline-line-strong outline-dashed",
        )}
      >
        {children}
      </div>
    </section>
  );
}

type DraggableCardProps = {
  task: Task;
  blockerStatuses: Record<string, TaskStatus | undefined>;
  directory: BoardDirectory;
  selected: boolean;
  onSelect: (taskId: string) => void;
};

function DraggableCard({ task, onSelect, ...props }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      {...props}
      {...attributes}
      {...listeners}
      aria-roledescription="tarea arrastrable"
      onClick={() => onSelect(task.id)}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event);
        if (event.key === "Enter") onSelect(task.id);
      }}
      className={cn(isDragging && "opacity-30")}
    />
  );
}
