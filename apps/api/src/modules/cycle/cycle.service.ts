import { Injectable, NotFoundException } from "@nestjs/common";
import type { Cycle } from "@prisma/client";

import type { CycleDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

@Injectable()
export class CycleService {
  constructor(private readonly prisma: PrismaService) {}

  /** The cycle running now; falls back to the team's latest one between cycles. */
  async findActive(teamId: string): Promise<CycleDto | null> {
    const reference = now();
    const cycle =
      (await this.prisma.cycle.findFirst({
        where: { teamId, startsAt: { lte: reference }, endsAt: { gte: reference } },
        orderBy: { number: "desc" },
      })) ?? (await this.prisma.cycle.findFirst({ where: { teamId }, orderBy: { number: "desc" } }));
    return cycle ? toDto(cycle) : null;
  }

  async findOne(id: string): Promise<CycleDto> {
    const cycle = await this.prisma.cycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException(`Cycle "${id}" not found`);
    return toDto(cycle);
  }
}

function toDto(cycle: Cycle): CycleDto {
  return {
    id: cycle.id,
    teamId: cycle.teamId,
    number: cycle.number,
    startsAt: cycle.startsAt.toISOString(),
    endsAt: cycle.endsAt.toISOString(),
  };
}
