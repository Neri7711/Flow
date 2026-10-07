import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { User, UserRole } from "@prisma/client";

import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { UserDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everyone, or one team's members with `teamId`. */
  async findAll(teamId?: string): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ where: { teamId }, orderBy: { position: "asc" } });
    return users.map(toUserDto);
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return toUserDto(user);
  }

  /** Leaders promote or demote members of their own team (never themselves, so a team keeps its leader). */
  async changeRole(id: string, role: UserRole, actor: SessionUser): Promise<UserDto> {
    const target = await this.prisma.user.findUnique({ where: { id }, select: { teamId: true } });
    if (!target) throw new NotFoundException(`User "${id}" not found`);
    assertLeaderOf(actor, target.teamId);
    if (id === actor.id) throw new BadRequestException("No puedes cambiar tu propio rol");

    return toUserDto(await this.prisma.user.update({ where: { id }, data: { role } }));
  }
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    shortName: user.shortName,
    initials: user.initials,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    avatarTone: user.avatarTone,
  };
}
