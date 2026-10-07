"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { now } from "@/shared/config";
import { toast } from "@/shared/lib/toast";

import * as taskApi from "../api/task-api";
import type { NewTask, Task, TaskEvent, TaskPatch, TaskStatus } from "./types";

export type TaskState = {
  tasks: Record<string, Task>;
  /** Activity of the tasks whose detail was opened (loaded on demand). */
  events: readonly TaskEvent[];
  /**
   * The API records every change as the signed-in user; `actorId` (that same user) only
   * lets the detail panel show the entry right away.
   */
  setStatus: (id: string, status: TaskStatus, actorId?: string) => Promise<void>;
  /** Checkbox semantics: done ↔ todo. */
  toggleDone: (id: string, actorId?: string) => Promise<void>;
  /** Creates the task in the API (which assigns the next per-team id) and returns that id. */
  createTask: (input: NewTask) => Promise<string>;
  /** Edits fields (title, assignee, priority, label, due date, dependencies…). */
  updateTask: (id: string, patch: TaskPatch) => Promise<void>;
  /** Returns whether it was deleted. */
  deleteTask: (id: string) => Promise<boolean>;
  addComment: (taskId: string, actorId: string, body: string) => Promise<void>;
  /** Refreshes a task (backlinks may have changed elsewhere) and loads its activity. */
  loadDetail: (taskId: string) => Promise<void>;
  /** Pulls everyone's latest changes (skipped while one of ours is still being saved). */
  sync: () => Promise<void>;
};

export type TaskStore = StoreApi<TaskState>;

/** How often an open workspace picks up other people's changes. */
const SYNC_INTERVAL_MS = 15_000;

let localSequence = 0;
const localId = () => `te-local-${++localSequence}`;

const byId = (tasks: readonly Task[]) => Object.fromEntries(tasks.map((task) => [task.id, task]));

/** The optimistic version of a task after a patch (`null` clears optional fields). */
function applyPatch(task: Task, patch: TaskPatch): Task {
  const next: Task = { ...task };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.assigneeId !== undefined) next.assigneeId = patch.assigneeId;
  if (patch.labelId !== undefined) next.labelId = patch.labelId;
  if (patch.blockedByIds !== undefined) next.blockedByIds = patch.blockedByIds;
  for (const key of ["description", "priority", "dueDate"] as const) {
    if (patch[key] === null) delete next[key];
    else if (patch[key] !== undefined) Object.assign(next, { [key]: patch[key] });
  }
  return next;
}

/**
 * Client-side source of truth for tasks, so a change shows up everywhere at once
 * (home, board, detail panel, palette, doc pills). Changes apply optimistically and are
 * persisted through the API; a failed save rolls the change back.
 */
export function createTaskStore(initialTasks: readonly Task[]): TaskStore {
  return createStore<TaskState>()((set, get) => {
    const putTask = (task: Task) => set((state) => ({ tasks: { ...state.tasks, [task.id]: task } }));

    /** Saves in flight: a background sync must not overwrite optimistic changes. */
    let saving = 0;
    const saveWith = async <T,>(work: () => Promise<T>): Promise<T> => {
      saving += 1;
      try {
        return await work();
      } finally {
        saving -= 1;
      }
    };

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
          putTask(await saveWith(() => taskApi.updateTaskStatus(id, status)));
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
        const task = await saveWith(() => taskApi.createTask(input));
        putTask(task);
        return task.id;
      },

      updateTask: async (id, patch) => {
        const previous = get().tasks[id];
        if (!previous) return;
        putTask(applyPatch(previous, patch));

        try {
          putTask(await saveWith(() => taskApi.updateTask(id, patch)));
        } catch {
          putTask(previous);
          toast(`No se pudo guardar el cambio en ${id}.`);
        }
      },

      deleteTask: async (id) => {
        const previous = get().tasks[id];
        if (!previous) return false;
        set((state) => {
          const tasks = { ...state.tasks };
          delete tasks[id];
          return { tasks };
        });

        try {
          await saveWith(() => taskApi.deleteTask(id));
          return true;
        } catch {
          putTask(previous);
          toast(`No se pudo eliminar ${id}.`);
          return false;
        }
      },

      addComment: async (taskId, actorId, body) => {
        const draft: TaskEvent = { id: localId(), taskId, kind: "comment", actorId, body, at: now().toISOString() };
        set((state) => ({ events: [...state.events, draft] }));

        try {
          const saved = await saveWith(() => taskApi.addTaskComment(taskId, body));
          set((state) => ({ events: state.events.map((event) => (event === draft ? saved : event)) }));
        } catch {
          set((state) => ({ events: state.events.filter((event) => event !== draft) }));
          toast("No se pudo publicar el comentario.");
        }
      },

      loadDetail: async (taskId) => {
        try {
          const [task, events] = await Promise.all([taskApi.getTask(taskId), taskApi.getTaskEvents(taskId)]);
          if (task) putTask(task);
          set((state) => ({ events: [...state.events.filter((event) => event.taskId !== taskId), ...events] }));
        } catch {
          // The panel keeps whatever it already shows; the next open retries.
        }
      },

      sync: async () => {
        if (saving > 0) return;
        try {
          const tasks = await taskApi.getTasks();
          if (saving === 0) set({ tasks: byId(tasks) });
        } catch {
          // Offline or session expired: the next tick (or navigation) tries again.
        }
      },
    };
  });
}

const TaskStoreContext = createContext<TaskStore | null>(null);

/**
 * One store per mounted workspace (never module-level: on the server that would be shared
 * between requests). Seeded with the tasks the layout fetched; fresh server data replaces it,
 * and while the tab is visible it picks up other people's changes every few seconds.
 */
export function TaskStoreProvider({ tasks, children }: { tasks: readonly Task[]; children: ReactNode }) {
  const [store] = useState(() => createTaskStore(tasks));

  useEffect(() => {
    store.setState({ tasks: byId(tasks) });
  }, [store, tasks]);

  useEffect(() => {
    const syncIfVisible = () => {
      if (document.visibilityState === "visible") void store.getState().sync();
    };
    const timer = setInterval(syncIfVisible, SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", syncIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", syncIfVisible);
    };
  }, [store]);

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
