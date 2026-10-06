import { Injectable } from "@nestjs/common";
import type { TriageRequest } from "@prisma/client";

import type { TriageRequestDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class TriageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Requests awaiting this team's triage, oldest first. */
  async findForTeam(teamId: string): Promise<TriageRequestDto[]> {
    const requests = await this.prisma.triageRequest.findMany({
      where: { toTeamId: teamId },
      orderBy: { createdAt: "asc" },
    });
    return requests.map(toDto);
  }
}

function toDto(request: TriageRequest): TriageRequestDto {
  return {
    id: request.id,
    fromTeamId: request.fromTeamId,
    toTeamId: request.toTeamId,
    title: request.title,
    requesterId: request.requesterId,
    createdAt: request.createdAt,
  };
}
