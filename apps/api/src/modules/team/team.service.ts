import { Injectable, NotFoundException } from "@nestjs/common";
import type { Team } from "@prisma/client";

import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
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

  /** Leaders edit their space's weekly note; empty or `null` clears it. */
  async updateWeeklyNote(id: string, weeklyNote: string | null, leader: SessionUser): Promise<TeamDto> {
    await this.findOne(id);
    assertLeaderOf(leader, id);
    const note = weeklyNote?.trim() || null;
    return toDto(await this.prisma.team.update({ where: { id }, data: { weeklyNote: note } }));
  }
}

function toDto(team: Team): TeamDto {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    mascotAlt: team.mascotAlt,
    weeklyNote: team.weeklyNote,
  };
}
