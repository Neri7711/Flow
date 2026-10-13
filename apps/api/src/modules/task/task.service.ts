import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type TaskEvent, type TaskLabel } from "@prisma/client";

import type { TaskDto, TaskEventDto, TaskLabelDto, TaskStatus } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import { mentionedUserIds, nameOf, notify } from "../notification/notification.recorder";

import type { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from "./dto";

/** Same wording as the web's status labels. */
const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Hecho",
};

const include = {
  blockedBy: { select: { blockerId: true } },
  mentions: { select: { documentId: true }, orderBy: { documentId: "asc" } },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof include }>;

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ teamId, cycleId, status }: TaskQueryDto): Promise<TaskDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: { teamId, cycleId, status },
      include,
      orderBy: { position: "asc" },
    });
    return tasks.map(toDto);
  }

  async findOne(id: string): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({ where: { id }, include });
    if (!task) throw new NotFoundException(`Task "${id}" not found`);
    return toDto(task);
  }

  async getLabels(): Promise<TaskLabelDto[]> {
    const labels = await this.prisma.taskLabel.findMany({ orderBy: { position: "asc" } });
    return labels.map(toLabelDto);
  }

  async getEvents(taskId: string): Promise<TaskEventDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { events: { orderBy: [{ at: "asc" }, { position: "asc" }] } },
    });
    if (!task) throw new NotFoundException(`Task "${taskId}" not found`);
    return task.events.map(toEventDto);
  }

  /** Creates a task with the next per-team identifier (PL-56 -> PL-57) and returns it. */
  create(input: CreateTaskDto, actorId: string): Promise<TaskDto> {
    return this.prisma.$transaction((tx) => createTask(tx, input, actorId));
  }

  /** Edits a task's fields; `blockedByIds` replaces its dependencies (no self-blocks, no cycles). */
  async update(id: string, input: UpdateTaskDto, actorId: string): Promise<TaskDto> {
    const previous = await this.prisma.task.findUnique({ where: { id }, select: { assigneeId: true } });
    if (!previous) throw new NotFoundException(`Task "${id}" not found`);
    const blockers = input.blockedByIds ? [...new Set(input.blockedByIds)] : undefined;
    if (blockers) await this.assertNoCycle(id, blockers);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          title: input.title?.trim(),
          // `undefined` keeps a column; `null` clears it.
          description: input.description === undefined ? undefined : input.description?.trim() || null,
          assigneeId: input.assigneeId,
          priority: input.priority,
          labelId: input.labelId,
          dueDate: input.dueDate,
          cycleId: input.cycleId,
        },
      });
      if (updated.assigneeId && updated.assigneeId !== previous.assigneeId) {
        await notifyAssignment(tx, id, updated.assigneeId, actorId);
      }
      if (blockers) {
        await tx.taskDependency.deleteMany({ where: { taskId: id } });
        if (blockers.length) await tx.taskDependency.createMany({ data: blockers.map((blockerId) => ({ taskId: id, blockerId })) });
      }
      return toDto(await tx.task.findUniqueOrThrow({ where: { id }, include }));
    });
  }

  async remove(id: string): Promise<{ id: string }> {
    // History, dependencies and backlinks cascade with the task.
    const deleted = await this.prisma.task.deleteMany({ where: { id } });
    if (deleted.count === 0) throw new NotFoundException(`Task "${id}" not found`);
    return { id };
  }

  /** A task can't wait on itself or on anything it (directly or indirectly) blocks. */
  private async assertNoCycle(id: string, blockers: string[]): Promise<void> {
    if (blockers.includes(id)) throw new BadRequestException("Una tarea no puede bloquearse a sí misma");
    const downstream = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE downstream AS (
        SELECT "taskId" AS id FROM "TaskDependency" WHERE "blockerId" = ${id}
        UNION
        SELECT d."taskId" FROM "TaskDependency" d JOIN downstream s ON d."blockerId" = s.id
      )
      SELECT id FROM downstream`;
    const blocked = new Set(downstream.map((row) => row.id));
    const loop = blockers.find((blocker) => blocked.has(blocker));
    if (loop) throw new BadRequestException(`${loop} ya depende de ${id}: se formaría un ciclo`);
  }

  /** Changes the status and records it in the task's activity as `actorId`. */
  async setStatus(id: string, status: TaskStatus, actorId: string): Promise<TaskDto> {
    const current = await this.getSummary(id);
    return current.status === status ? this.findOne(id) : this.applyStatus(id, current.teamId, status, actorId);
  }

  /** Checkbox semantics: done <-> todo. */
  async toggleDone(id: string, actorId: string): Promise<TaskDto> {
    const current = await this.getSummary(id);
    return this.applyStatus(id, current.teamId, current.status === "done" ? "todo" : "done", actorId);
  }

  /** Comment on a task: `@Name` mentions notify those people; otherwise the assignee hears about it. */
  async addComment(taskId: string, actorId: string, body: string): Promise<TaskEventDto> {
    const { teamId } = await this.getSummary(taskId);
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.taskEvent.create({ data: { taskId, kind: "comment", actorId, body, at: now() } });
      await recordActivity(tx, { teamId, actorId, summary: `comentó en ${taskId}` });

      const actor = await nameOf(tx, actorId);
      const mentioned = await mentionedUserIds(tx, body);
      await notify(tx, { recipients: mentioned, actorId, kind: "mention", title: `${actor} te mencionó en ${taskId}`, excerpt: body, taskId });
      const task = await tx.task.findUniqueOrThrow({ where: { id: taskId }, select: { assigneeId: true } });
      if (task.assigneeId && !mentioned.includes(task.assigneeId)) {
        await notify(tx, { recipients: [task.assigneeId], actorId, kind: "comment", title: `${actor} comentó en ${taskId}`, excerpt: body, taskId });
      }
      return toEventDto(event);
    });
  }

  private async getSummary(id: string): Promise<{ status: TaskStatus; teamId: string }> {
    const task = await this.prisma.task.findUnique({ where: { id }, select: { status: true, teamId: true } });
    if (!task) throw new NotFoundException(`Task "${id}" not found`);
    return task;
  }

  /**
   * Updates the status, logs it in the task's history and (when completed) in the team feed,
   * and notifies the assignee — plus, when it moves to review or done, whoever it was blocking.
   */
  private async applyStatus(id: string, teamId: string, status: TaskStatus, actorId: string): Promise<TaskDto> {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({ where: { id }, data: { status }, include });
      await tx.taskEvent.create({ data: { taskId: id, kind: "status", actorId, status, at: now() } });
      if (status === "done") await recordActivity(tx, { teamId, actorId, summary: `completó ${id}` });

      const actor = await nameOf(tx, actorId);
      await notify(tx, {
        recipients: [task.assigneeId],
        actorId,
        kind: "status",
        title: `${actor} movió ${id} a ${STATUS_LABEL[status]}`,
        taskId: id,
      });
      if (status === "in_review" || status === "done") {
        const blocked = await tx.task.findMany({
          where: { blockedBy: { some: { blockerId: id } }, assigneeId: { not: null } },
          select: { id: true, assigneeId: true },
        });
        for (const waiting of blocked) {
          await notify(tx, {
            recipients: [waiting.assigneeId],
            actorId,
            kind: "status",
            title: `${id}, que bloquea ${waiting.id}, pasó a ${STATUS_LABEL[status]}`,
            taskId: waiting.id,
          });
        }
      }
      return toDto(task);
    });
  }
}

export type NewTaskInput = Pick<CreateTaskDto, "teamId" | "title" | "status" | "assigneeId" | "cycleId" | "sourceDocumentId"> & {
  description?: string | null;
  dueDate?: string | null;
};

/** "Ana te asignó PL-42" to the new assignee (never to someone assigning themselves). */
async function notifyAssignment(tx: Prisma.TransactionClient, taskId: string, assigneeId: string, actorId: string): Promise<void> {
  const actor = await nameOf(tx, actorId);
  await notify(tx, { recipients: [assigneeId], actorId, kind: "assignment", title: `${actor} te asignó ${taskId}`, taskId });
}

/** Task creation inside the caller's transaction (triage acceptance reuses it). */
export async function createTask(tx: Prisma.TransactionClient, input: NewTaskInput, actorId: string): Promise<TaskDto> {
  // Atomic increment: the row lock serializes concurrent creates for the same team.
  const team = await tx.team
    .update({ where: { id: input.teamId }, data: { taskSeq: { increment: 1 } } })
    .catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new BadRequestException(`Team "${input.teamId}" does not exist`);
      }
      throw error;
    });

  const task = await tx.task.create({
    data: {
      id: `${team.abbreviation}-${team.taskSeq}`,
      teamId: team.id,
      title: input.title,
      description: input.description?.trim() || null,
      status: input.status,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ?? null,
      cycleId: input.cycleId,
      sourceDocumentId: input.sourceDocumentId,
    },
    include,
  });
  await recordActivity(tx, { teamId: team.id, actorId, summary: `creó ${task.id}` });
  if (task.assigneeId) await notifyAssignment(tx, task.id, task.assigneeId, actorId);
  return toDto(task);
}

function toDto(task: TaskWithRelations): TaskDto {
  const dto: TaskDto = {
    id: task.id,
    teamId: task.teamId,
    title: task.title,
    status: task.status,
    assigneeId: task.assigneeId,
    labelId: task.labelId,
    blockedByIds: task.blockedBy.map((d) => d.blockerId),
  };

  // Optional fields are omitted (not null) to match the frontend's `Task` type.
  if (task.description != null) dto.description = task.description;
  if (task.priority != null) dto.priority = task.priority;
  if (task.dueDate != null) dto.dueDate = task.dueDate;
  if (task.cycleId != null) dto.cycleId = task.cycleId;
  if (task.projectId != null) dto.projectId = task.projectId;
  if (task.milestoneId != null) dto.milestoneId = task.milestoneId;
  if (task.sourceDocumentId != null) dto.sourceDocumentId = task.sourceDocumentId;
  if (task.mentions.length > 0) dto.mentionedInDocumentIds = task.mentions.map((m) => m.documentId);

  return dto;
}

function toLabelDto(label: TaskLabel): TaskLabelDto {
  return { id: label.id, name: label.name, tone: label.tone };
}

function toEventDto(event: TaskEvent): TaskEventDto {
  const base = { id: event.id, taskId: event.taskId, actorId: event.actorId, at: event.at.toISOString() };
  return event.kind === "comment"
    ? { ...base, kind: "comment", body: event.body ?? "" }
    : { ...base, kind: "status", status: event.status ?? "todo" };
}
