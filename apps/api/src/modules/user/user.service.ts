import { Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@prisma/client";

import type { UserDto, UserRole } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

/** The signed-in user while auth is simulated (mirrors the frontend fixture). */
export const CURRENT_USER_ID = "u-moge";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return users.map(toDto);
  }

  async findCurrent(): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: CURRENT_USER_ID } });
    if (!user) throw new NotFoundException(`Current user "${CURRENT_USER_ID}" not found`);
    return toDto(user);
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return toDto(user);
  }
}

function toDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    shortName: user.shortName,
    initials: user.initials,
    role: user.role as UserRole,
    teamId: user.teamId,
    avatarTone: user.avatarTone,
  };
}
