import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Team, UserRole } from "@prisma/client";

import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { TeamDto, UserDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

import { recordActivity } from "../activity/activity.recorder";
import { toUserDto } from "../user/user.service";

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

  /** Returns the person with `role` set to their role in this space. */
  async addMember(teamId: string, userId: string, role: UserRole, leader: SessionUser): Promise<UserDto> {
    await this.findOne(teamId);
    assertLeaderOf(leader, teamId);
    if (!(await this.prisma.user.count({ where: { id: userId } }))) throw new BadRequestException(`User "${userId}" does not exist`);
    if (await this.prisma.membership.count({ where: { userId, teamId } })) throw new ConflictException("Ya pertenece a este espacio");

    await this.prisma.$transaction([
      this.prisma.membership.create({ data: { userId, teamId, role } }),
      recordActivity(this.prisma, { teamId, actorId: userId, summary: "se unió al equipo" }),
    ]);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { memberships: { orderBy: { position: "asc" } } } });
    return { ...toUserDto(user), role };
  }

  async removeMember(teamId: string, userId: string, leader: SessionUser): Promise<{ userId: string; teamId: string }> {
    assertLeaderOf(leader, teamId);
    if (userId === leader.id) throw new BadRequestException("No puedes quitarte a ti mismo");
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    if (!user) throw new NotFoundException(`User "${userId}" not found`);
    if (user.teamId === teamId) throw new BadRequestException("Es su espacio principal: no se puede quitar de aquí");

    const removed = await this.prisma.membership.deleteMany({ where: { userId, teamId } });
    if (removed.count === 0) throw new NotFoundException("Esa persona no pertenece a este espacio");
    return { userId, teamId };
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
