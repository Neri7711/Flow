import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { TriageRequest } from "@prisma/client";

import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { TaskDto, TaskStatus, TriageRequestDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import { createTask } from "../task/task.service";
import type { CreateTriageDto } from "./dto";

const ALREADY_DECIDED = "Esta solicitud ya se resolvió";

@Injectable()
export class TriageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Requests still waiting for this team's decision, oldest first. */
  async findForTeam(teamId: string): Promise<TriageRequestDto[]> {
    const requests = await this.prisma.triageRequest.findMany({
      where: { toTeamId: teamId, status: "pending" },
      orderBy: { createdAt: "asc" },
    });
    return requests.map(toDto);
  }

  /** Asks another team for something; it shows up in their inbox. */
  async create({ toTeamId, title }: CreateTriageDto, user: SessionUser): Promise<TriageRequestDto> {
    if (toTeamId === user.teamId) {
      throw new BadRequestException("Para tu propio equipo crea la tarea directamente");
    }
    const [request] = await this.prisma.$transaction([
      this.prisma.triageRequest.create({
        data: { fromTeamId: user.teamId, toTeamId, title, requesterId: user.id, createdAt: now() },
      }),
      recordActivity(this.prisma, { teamId: toTeamId, actorId: user.id, summary: `envió la solicitud “${title}”` }),
    ]);
    return toDto(request);
  }

  /** The receiving team's leader turns the request into a task on their board. */
  async accept(
    id: string,
    user: SessionUser,
    status: TaskStatus = "todo",
  ): Promise<{ request: TriageRequestDto; task: TaskDto }> {
    const pending = await this.findPending(id, user);

    return this.prisma.$transaction(async (tx) => {
      // Claim it first: two leaders accepting at once can't both create the task.
      const claimed = await tx.triageRequest.updateMany({
        where: { id, status: "pending" },
        data: { status: "accepted", decidedAt: now(), decidedById: user.id },
      });
      if (claimed.count === 0) throw new ConflictException(ALREADY_DECIDED);

      const task = await createTask(tx, { teamId: pending.toTeamId, title: pending.title, status }, user.id);
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
  return {
    id: request.id,
    fromTeamId: request.fromTeamId,
    toTeamId: request.toTeamId,
    title: request.title,
    requesterId: request.requesterId,
    createdAt: request.createdAt.toISOString(),
    status: request.status,
    taskId: request.taskId,
  };
}
