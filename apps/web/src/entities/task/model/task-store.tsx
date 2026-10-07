"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { now } from "@/shared/config";
import { toast } from "@/shared/lib/toast";

import * as taskApi from "../api/task-api";
import type { NewTask, Task, TaskEvent, TaskStatus } from "./types";

export type TaskState = {
  tasks: Record<string, Task>;
  /** Activity of the tasks whose detail was opened (loaded on demand). */
  events: readonly TaskEvent[];
  /** Pass `actorId` to record the change in the task's activity. */
  setStatus: (id: string, status: TaskStatus, actorId?: string) => Promise<void>;
  /** Checkbox semantics: done ↔ todo. */
  toggleDone: (id: string, actorId?: string) => Promise<void>;
  /** Creates the task in the API (which assigns the next per-team id) and returns that id. */
  createTask: (input: NewTask) => Promise<string>;
  addComment: (taskId: string, actorId: string, body: string) => Promise<void>;
  loadEvents: (taskId: string) => Promise<void>;
};

export type TaskStore = StoreApi<TaskState>;

let localSequence = 0;
const localId = () => `te-local-${++localSequence}`;

const byId = (tasks: readonly Task[]) => Object.fromEntries(tasks.map((task) => [task.id, task]));

/**
 * Client-side source of truth for tasks, so a change shows up everywhere at once
 * (home, board, detail panel, palette, doc pills). Changes apply optimistically and are
 * persisted through the API; a failed save rolls the change back.
 */
export function createTaskStore(initialTasks: readonly Task[]): TaskStore {
  return createStore<TaskState>()((set, get) => {
    const putTask = (task: Task) => set((state) => ({ tasks: { ...state.tasks, [task.id]: task } }));

    return {
      tasks: byId(initialTasks),
      events: [],

      setStatus: async (id, status, actorId) => {
        const previous = get().tasks[id];
        if (!previous || previous.status === status) return;

        const event: TaskEvent | null = actorId
          ? { id: localId(), taskId: id, kind: "status", actorId, status, at: now().toISOString() }
          : null;
        set((state) => ({
          tasks: { ...state.tasks, [id]: { ...previous, status } },
          events: event ? [...state.events, event] : state.events,
        }));

        try {
          putTask(await taskApi.updateTaskStatus(id, status, actorId));
        } catch {
          set((state) => ({
            tasks: { ...state.tasks, [id]: previous },
            events: state.events.filter((candidate) => candidate !== event),
          }));
          toast(`No se pudo guardar el estado de ${id}.`);
        }
      },

      toggleDone: async (id, actorId) => {
        const task = get().tasks[id];
        if (task) await get().setStatus(id, task.status === "done" ? "todo" : "done", actorId);
      },

      createTask: async (input) => {
        const task = await taskApi.createTask(input);
        putTask(task);
        return task.id;
      },

      addComment: async (taskId, actorId, body) => {
        const draft: TaskEvent = { id: localId(), taskId, kind: "comment", actorId, body, at: now().toISOString() };
        set((state) => ({ events: [...state.events, draft] }));

        try {
          const saved = await taskApi.addTaskComment(taskId, actorId, body);
          set((state) => ({ events: state.events.map((event) => (event === draft ? saved : event)) }));
        } catch {
          set((state) => ({ events: state.events.filter((event) => event !== draft) }));
          toast("No se pudo publicar el comentario.");
        }
      },

      loadEvents: async (taskId) => {
        try {
          const events = await taskApi.getTaskEvents(taskId);
          set((state) => ({ events: [...state.events.filter((event) => event.taskId !== taskId), ...events] }));
        } catch {
          // The panel keeps whatever it already shows; the next open retries.
        }
      },
    };
  });
}

const TaskStoreContext = createContext<TaskStore | null>(null);

/**
 * One store per mounted workspace (never module-level: on the server that would be shared
 * between requests). Seeded with the tasks the layout fetched; fresh server data replaces it.
 */
export function TaskStoreProvider({ tasks, children }: { tasks: readonly Task[]; children: ReactNode }) {
  const [store] = useState(() => createTaskStore(tasks));

  useEffect(() => {
    store.setState({ tasks: byId(tasks) });
  }, [store, tasks]);

  return <TaskStoreContext value={store}>{children}</TaskStoreContext>;
}

/** The store itself, for code outside React's render (subscriptions, editor rules). */
export function useTaskStoreApi(): TaskStore {
  const store = useContext(TaskStoreContext);
  if (!store) throw new Error("useTaskStore must be used inside <TaskStoreProvider>");
  return store;
}

export function useTaskStore<T>(selector: (state: TaskState) => T): T {
  return useStore(useTaskStoreApi(), selector);
}
