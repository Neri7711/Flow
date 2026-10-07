import { Injectable } from "@nestjs/common";
import type { Activity } from "@prisma/client";

import type { ActivityDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Most recent activity for a team, newest first. */
  async findRecent(teamId: string, limit = 3): Promise<ActivityDto[]> {
    const items = await this.prisma.activity.findMany({
      where: { teamId },
      orderBy: [{ at: "desc" }, { position: "desc" }],
      take: limit,
    });
    return items.map(toDto);
  }
}

function toDto(item: Activity): ActivityDto {
  return { id: item.id, teamId: item.teamId, actorId: item.actorId, summary: item.summary, at: item.at.toISOString() };
}
