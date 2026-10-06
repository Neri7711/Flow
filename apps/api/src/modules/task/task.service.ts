import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type TaskEvent, type TaskLabel } from "@prisma/client";

import type { TaskDto, TaskEventDto, TaskLabelDto, TaskStatus } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import type { AddCommentDto, CreateTaskDto, TaskQueryDto } from "./dto";

const include = {
  blockedBy: { select: { blockerId: true } },
  mentions: { select: { documentId: true } },
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
      select: { events: { orderBy: { at: "asc" } } },
    });
    if (!task) throw new NotFoundException(`Task "${taskId}" not found`);
    return task.events.map(toEventDto);
  }

  /** Creates a task with the next per-team identifier (PL-56 -> PL-57) and returns it. */
  async create(input: CreateTaskDto): Promise<TaskDto> {
    return this.prisma.$transaction(async (tx) => {
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
          status: input.status,
          assigneeId: input.assigneeId ?? null,
          cycleId: input.cycleId,
          sourceDocumentId: input.sourceDocumentId,
        },
        include,
      });
      return toDto(task);
    });
  }

  async setStatus(id: string, status: TaskStatus, actorId?: string): Promise<TaskDto> {
    const current = await this.getStatus(id);
    return current === status ? this.findOne(id) : this.applyStatus(id, status, actorId);
  }

  /** Checkbox semantics: done <-> todo. */
  async toggleDone(id: string, actorId?: string): Promise<TaskDto> {
    const current = await this.getStatus(id);
    return this.applyStatus(id, current === "done" ? "todo" : "done", actorId);
  }

  async addComment(taskId: string, { actorId, body }: AddCommentDto): Promise<TaskEventDto> {
    await this.getStatus(taskId);
    const event = await this.prisma.taskEvent.create({
      data: { taskId, kind: "comment", actorId, body, at: now() },
    });
    return toEventDto(event);
  }

  private async getStatus(id: string): Promise<TaskStatus> {
    const task = await this.prisma.task.findUnique({ where: { id }, select: { status: true } });
    if (!task) throw new NotFoundException(`Task "${id}" not found`);
    return task.status;
  }

  /** Updates the status and, when an actor is given, logs it in the task's activity. */
  private async applyStatus(id: string, status: TaskStatus, actorId?: string): Promise<TaskDto> {
    const update = this.prisma.task.update({ where: { id }, data: { status }, include });
    if (!actorId) return toDto(await update);

    const [task] = await this.prisma.$transaction([
      update,
      this.prisma.taskEvent.create({ data: { taskId: id, kind: "status", actorId, status, at: now() } }),
    ]);
    return toDto(task);
  }
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
