import { Injectable, NotFoundException } from "@nestjs/common";
import type { Team } from "@prisma/client";

import type { TeamDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TeamDto[]> {
    const teams = await this.prisma.team.findMany({ orderBy: { position: "asc" } });
    return teams.map(toDto);
  }

  async findOne(id: string): Promise<TeamDto> {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException(`Team "${id}" not found`);
    return toDto(team);
  }
}

function toDto(team: Team): TeamDto {
  return { id: team.id, name: team.name, abbreviation: team.abbreviation, mascotAlt: team.mascotAlt };
}
