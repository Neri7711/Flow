"use client";

import { Fragment } from "react";

import { useTaskStore } from "../model/task-store";
import { TaskIdPill } from "./task-id-pill";

/** Two-letter team code + number, e.g. "PL-47". */
const TASK_REFERENCE = /\b([A-Z]{2}-\d+)\b/g;

/** Plain text where identifiers of existing tasks render as pills. */
export function TaskMentionText({ text }: { text: string }) {
  const tasks = useTaskStore((state) => state.tasks);

  return text.split(TASK_REFERENCE).map((part, index) => {
    // `split` with a capture group puts matches at odd indexes.
    const task = index % 2 === 1 ? tasks[part] : undefined;
    return task ? <TaskIdPill key={index} task={task} /> : <Fragment key={index}>{part}</Fragment>;
  });
}
