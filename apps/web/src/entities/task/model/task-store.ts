"use client";

import { create } from "zustand";

import { now } from "@/shared/config";

import { TASK_EVENTS, TASKS } from "../api/fixtures";
import type { NewTask, Task, TaskEvent, TaskStatus } from "./types";

type TaskState = {
  tasks: Record<string, Task>;
  events: readonly TaskEvent[];
  /** Pass `actorId` to record the change in the task's activity. */
  setStatus: (id: string, status: TaskStatus, actorId?: string) => void;
  /** Checkbox semantics: done ↔ todo. */
  toggleDone: (id: string, actorId?: string) => void;
  /** Creates a task with the next per-team identifier and returns it. */
  createTask: (input: NewTask) => string;
  addComment: (taskId: string, actorId: string, body: string) => void;
};

let eventSequence = 0;
const nextEventId = () => `te-local-${++eventSequence}`;

/** Per-team counter: highest existing number for the prefix + 1 (PL-56 → PL-57). */
function nextIdentifier(tasks: Record<string, Task>, abbreviation: string): string {
  const prefix = `${abbreviation}-`;
  const highest = Object.keys(tasks)
    .filter((id) => id.startsWith(prefix))
    .reduce((max, id) => Math.max(max, Number(id.slice(prefix.length)) || 0), 0);
  return `${prefix}${highest + 1}`;
}

/**
 * Client-side source of truth for tasks while data is simulated, so a change shows up
 * everywhere at once (home, board, detail panel, palette, doc pills).
 * Seeded synchronously from fixtures so server and client render the same data;
 * with a backend, seed it from the fetched tasks instead.
 */
export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: Object.fromEntries(TASKS.map((task) => [task.id, task])),
  events: TASK_EVENTS,

  setStatus: (id, status, actorId) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task || task.status === status) return state;

      const event: TaskEvent | null = actorId
        ? { id: nextEventId(), taskId: id, kind: "status", actorId, status, at: now().toISOString() }
        : null;

      return {
        tasks: { ...state.tasks, [id]: { ...task, status } },
        events: event ? [...state.events, event] : state.events,
      };
    }),

  toggleDone: (id, actorId) => {
    const task = get().tasks[id];
    if (task) get().setStatus(id, task.status === "done" ? "todo" : "done", actorId);
  },

  createTask: ({ abbreviation, ...input }) => {
    const id = nextIdentifier(get().tasks, abbreviation);
    const task: Task = { ...input, id, assigneeId: input.assigneeId ?? null, labelId: null, blockedByIds: [] };
    set((state) => ({ tasks: { ...state.tasks, [id]: task } }));
    return id;
  },

  addComment: (taskId, actorId, body) =>
    set((state) => ({
      events: [...state.events, { id: nextEventId(), taskId, kind: "comment", actorId, body, at: now().toISOString() }],
    })),
}));
