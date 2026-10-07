import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { TriageRequest, UserRole } from "@prisma/client";

import { assertLeaderOf, roleIn } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { TaskDto, TriageRequestDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import { createTask } from "../task/task.service";
import type { AcceptTriageDto, CreateTriageDto } from "./dto";

const ALREADY_DECIDED = "Esta solicitud ya se resolvió";

export type AcceptResult = { request: TriageRequestDto; task?: TaskDto; membership?: { userId: string; teamId: string; role: UserRole } };

@Injectable()
export class TriageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Requests (work and join) still waiting for this team's decision, oldest first. */
  async findForTeam(teamId: string): Promise<TriageRequestDto[]> {
    const requests = await this.prisma.triageRequest.findMany({
      where: { toTeamId: teamId, status: "pending" },
      orderBy: { createdAt: "asc" },
    });
    return requests.map(toDto);
  }

  async create(input: CreateTriageDto, user: SessionUser): Promise<TriageRequestDto> {
    return input.kind === "join" ? this.createJoinRequest(input, user) : this.createWorkRequest(input, user);
  }

  /** Asks another team for something; it shows up in their inbox. */
  private async createWorkRequest(input: CreateTriageDto, user: SessionUser): Promise<TriageRequestDto> {
    if (!input.title) throw new BadRequestException("title is required");
    if (input.toTeamId === user.teamId) throw new BadRequestException("Para tu propio equipo crea la tarea directamente");
    if (input.linkedTaskId && !(await this.prisma.task.count({ where: { id: input.linkedTaskId } }))) {
      throw new BadRequestException(`Task "${input.linkedTaskId}" does not exist`);
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.triageRequest.create({
        data: {
          kind: "work",
          fromTeamId: user.teamId,
          toTeamId: input.toTeamId,
          title: input.title,
          description: input.description?.trim() || null,
          dueDate: input.dueDate ?? null,
          linkedTaskId: input.linkedTaskId ?? null,
          requesterId: user.id,
          createdAt: now(),
        },
      }),
      recordActivity(this.prisma, { teamId: input.toTeamId, actorId: user.id, summary: `envió la solicitud “${input.title}”` }),
    ]);
    return toDto(request);
  }

  /** "Diego quiere unirse a Play": waits for a leader of that space. */
  private async createJoinRequest(input: CreateTriageDto, user: SessionUser): Promise<TriageRequestDto> {
    const team = await this.prisma.team.findUnique({ where: { id: input.toTeamId }, select: { name: true } });
    if (!team) throw new BadRequestException(`Team "${input.toTeamId}" does not exist`);
    if (roleIn(user, input.toTeamId)) throw new ConflictException(`Ya perteneces a ${team.name}`);
    const pending = await this.prisma.triageRequest.count({
      where: { kind: "join", toTeamId: input.toTeamId, requesterId: user.id, status: "pending" },
    });
    if (pending) throw new ConflictException(`Ya pediste unirte a ${team.name}; espera la respuesta`);

    const request = await this.prisma.triageRequest.create({
      data: {
        kind: "join",
        fromTeamId: user.teamId,
        toTeamId: input.toTeamId,
        title: input.title ?? `Quiere unirse a ${team.name}`,
        description: input.description?.trim() || null,
        requesterId: user.id,
        createdAt: now(),
      },
    });
    return toDto(request);
  }

  /**
   * Leaders of the receiving team: a work request becomes a task on their board (with its
   * details, optional assignee, and the requester's linked task blocked by it); a join request
   * adds the person to the space.
   */
  async accept(id: string, user: SessionUser, input: AcceptTriageDto = {}): Promise<AcceptResult> {
    const pending = await this.findPending(id, user);

    return this.prisma.$transaction(async (tx) => {
      // Claim it first: two leaders accepting at once can't both act on it.
      const claimed = await tx.triageRequest.updateMany({
        where: { id, status: "pending" },
        data: { status: "accepted", decidedAt: now(), decidedById: user.id },
      });
      if (claimed.count === 0) throw new ConflictException(ALREADY_DECIDED);

      if (pending.kind === "join") {
        if (!pending.requesterId) throw new BadRequestException("The request has no requester");
        const role = input.role ?? "member";
        await tx.membership.upsert({
          where: { userId_teamId: { userId: pending.requesterId, teamId: pending.toTeamId } },
          create: { userId: pending.requesterId, teamId: pending.toTeamId, role },
          update: {},
        });
        await recordActivity(tx, { teamId: pending.toTeamId, actorId: pending.requesterId, summary: "se unió al equipo" });
        const request = await tx.triageRequest.findUniqueOrThrow({ where: { id } });
        return { request: toDto(request), membership: { userId: pending.requesterId, teamId: pending.toTeamId, role } };
      }

      const task = await createTask(
        tx,
        {
          teamId: pending.toTeamId,
          title: pending.title,
          status: input.status ?? "todo",
          assigneeId: input.assigneeId,
          description: pending.description,
          dueDate: pending.dueDate,
        },
        user.id,
      );
      if (pending.linkedTaskId) {
        await tx.taskDependency.upsert({
          where: { taskId_blockerId: { taskId: pending.linkedTaskId, blockerId: task.id } },
          create: { taskId: pending.linkedTaskId, blockerId: task.id },
          update: {},
        });
      }
      const request = await tx.triageRequest.update({ where: { id }, data: { taskId: task.id } });
      return { request: toDto(request), task };
    });
  }

  async decline(id: string, user: SessionUser): Promise<TriageRequestDto> {
    await this.findPending(id, user);
    const claimed = await this.prisma.triageRequest.updateMany({
      where: { id, status: "pending" },
      data: { status: "declined", decidedAt: now(), decidedById: user.id },
    });
    if (claimed.count === 0) throw new ConflictException(ALREADY_DECIDED);
    return toDto(await this.prisma.triageRequest.findUniqueOrThrow({ where: { id } }));
  }

  /** The request, if it's still pending and `user` leads the team that receives it. */
  private async findPending(id: string, user: SessionUser): Promise<TriageRequest> {
    const request = await this.prisma.triageRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`Triage request "${id}" not found`);
    assertLeaderOf(user, request.toTeamId);
    if (request.status !== "pending") throw new ConflictException(ALREADY_DECIDED);
    return request;
  }
}

function toDto(request: TriageRequest): TriageRequestDto {
  const dto: TriageRequestDto = {
    id: request.id,
    kind: request.kind,
    fromTeamId: request.fromTeamId,
    toTeamId: request.toTeamId,
    title: request.title,
    requesterId: request.requesterId,
    createdAt: request.createdAt.toISOString(),
    status: request.status,
    taskId: request.taskId,
  };
  if (request.description) dto.description = request.description;
  if (request.dueDate) dto.dueDate = request.dueDate;
  if (request.linkedTaskId) dto.linkedTaskId = request.linkedTaskId;
  return dto;
}
