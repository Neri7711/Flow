import { Injectable, NotFoundException } from "@nestjs/common";
import type { Cycle } from "@prisma/client";

import type { CycleDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class CycleService {
  constructor(private readonly prisma: PrismaService) {}

  /** The current (most recent) cycle for a team, or undefined. */
  async findActive(teamId: string): Promise<CycleDto | undefined> {
    const cycle = await this.prisma.cycle.findFirst({
      where: { teamId },
      orderBy: { number: "desc" },
    });
    return cycle ? toDto(cycle) : undefined;
  }

  async findOne(id: string): Promise<CycleDto> {
    const cycle = await this.prisma.cycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException(`Cycle "${id}" not found`);
    return toDto(cycle);
  }
}

function toDto(cycle: Cycle): CycleDto {
  return { id: cycle.id, teamId: cycle.teamId, number: cycle.number, startsAt: cycle.startsAt, endsAt: cycle.endsAt };
}
