import type { TeamId } from "@/entities/team/@x/task";

/** Fixed workflow, identical for every team (not customizable). */
export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";

export type TaskPriority = "low" | "medium" | "high";

export type TaskLabel = {
  id: string;
  name: string;
  /** Team palette the chip borrows; `null` renders the neutral tone. */
  tone: TeamId | null;
};

export type Task = {
  /** Team-scoped identifier: `${abbreviation}-${number}` (PL-42). */
  id: string;
  teamId: TeamId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assigneeId: string | null;
  labelId: string | null;
  dueDate?: string;
  cycleId?: string;
  projectId?: string;
  milestoneId?: string;
  /** Ids of tasks (any team) that block this one. "Blocks" is derived from the inverse. */
  blockedByIds: string[];
  /** Document the task was created from (checkbox → task bridge). */
  sourceDocumentId?: string;
  /** Backlinks: documents whose content mentions this task's identifier. */
  mentionedInDocumentIds?: string[];
};

export type TaskEvent =
  | { id: string; taskId: string; kind: "status"; actorId: string; status: TaskStatus; at: string }
  | { id: string; taskId: string; kind: "comment"; actorId: string; body: string; at: string };

/** Editable fields: omit to keep, `null` to clear. `blockedByIds` replaces the whole list. */
export type TaskPatch = {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: TaskPriority | null;
  labelId?: string | null;
  /** Calendar day "YYYY-MM-DD". */
  dueDate?: string | null;
  blockedByIds?: string[];
};

export type NewTask = {
  teamId: TeamId;
  /** Team abbreviation used to build the identifier (PL → PL-57). */
  abbreviation: string;
  title: string;
  status: TaskStatus;
  assigneeId?: string | null;
  cycleId?: string;
  sourceDocumentId?: string;
};
