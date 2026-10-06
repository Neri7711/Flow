import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, Task, TaskEvent, TaskLabel } from "@prisma/client";

import type { TaskDto, TaskEventDto, TaskLabelDto, TaskPriority, TaskStatus } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import type { AddCommentDto, CreateTaskDto, SetStatusDto, TaskQueryDto } from "./dto";

const include = {
  blockedBy: { select: { blockerId: true } },
  mentions: { select: { documentId: true } },
} as const;

type TaskWithRelations = Task & {
  blockedBy: { blockerId: string }[];
  mentions: { documentId: string }[];
};

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TaskQueryDto): Promise<TaskDto[]> {
    const where: Prisma.TaskWhereInput = {};
    if (query.teamId) where.teamId = query.teamId;
    if (query.cycleId) where.cycleId = query.cycleId;
    if (query.status) where.status = query.status;

    const tasks = await this.prisma.task.findMany({ where, include, orderBy: { createdAt: "asc" } });
    return tasks.map(toDto);
  }

  async findOne(id: string): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({ where: { id }, include });
    if (!task) throw new NotFoundException(`Task "${id}" not found`);
    return toDto(task);
  }

  async getLabels(): Promise<TaskLabelDto[]> {
    const labels = await this.prisma.taskLabel.findMany();
    return labels.map(toLabelDto);
  }

  async getEvents(taskId: string): Promise<TaskEventDto[]> {
    await this.ensureExists(taskId);
    const events = await this.prisma.taskEvent.findMany({ where: { taskId }, orderBy: { at: "asc" } });
    return events.map(toEventDto);
  }

  /** Creates a task with the next per-team identifier and returns it. */
  async create(input: CreateTaskDto): Promise<TaskDto> {
    const id = await this.nextIdentifier(input.abbreviation);
    const task = await this.prisma.task.create({
      data: {
        id,
        teamId: input.teamId,
        title: input.title,
        status: input.status,
        assigneeId: input.assigneeId ?? null,
        labelId: null,
        cycleId: input.cycleId ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
      },
      include,
    });
    return toDto(task);
  }

  async setStatus(id: string, { status, actorId }: SetStatusDto): Promise<TaskDto> {
    const task = await this.ensureExists(id);
    if (task.status === status) return this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id }, data: { status } });
      if (actorId) {
        await tx.taskEvent.create({
          data: { taskId: id, kind: "status", actorId, status, at: now().toISOString() },
        });
      }
    });

    return this.findOne(id);
  }

  /** Checkbox semantics: done <-> todo. */
  async toggleDone(id: string, actorId?: string): Promise<TaskDto> {
    const task = await this.ensureExists(id);
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    return this.setStatus(id, { status: next, actorId });
  }

  async addComment(taskId: string, { actorId, body }: AddCommentDto): Promise<TaskEventDto> {
    await this.ensureExists(taskId);
    const event = await this.prisma.taskEvent.create({
      data: { taskId, kind: "comment", actorId, body, at: now().toISOString() },
    });
    return toEventDto(event);
  }

  private async ensureExists(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task "${id}" not found`);
    return task;
  }

  /** Per-team counter: highest existing number for the prefix + 1 (PL-56 -> PL-57). */
  private async nextIdentifier(abbreviation: string): Promise<string> {
    const prefix = `${abbreviation}-`;
    const existing = await this.prisma.task.findMany({
      where: { id: { startsWith: prefix } },
      select: { id: true },
    });
    const highest = existing.reduce((max, { id }) => {
      const n = Number(id.slice(prefix.length));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);
    return `${prefix}${highest + 1}`;
  }
}

function toDto(task: TaskWithRelations): TaskDto {
  const dto: TaskDto = {
    id: task.id,
    teamId: task.teamId,
    title: task.title,
    status: task.status as TaskStatus,
    assigneeId: task.assigneeId,
    labelId: task.labelId,
    blockedByIds: task.blockedBy.map((d) => d.blockerId),
  };

  if (task.description != null) dto.description = task.description;
  if (task.priority != null) dto.priority = task.priority as TaskPriority;
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
  if (event.kind === "comment") {
    return { id: event.id, taskId: event.taskId, kind: "comment", actorId: event.actorId, body: event.body ?? "", at: event.at };
  }
  return {
    id: event.id,
    taskId: event.taskId,
    kind: "status",
    actorId: event.actorId,
    status: (event.status ?? "todo") as TaskStatus,
    at: event.at,
  };
}
