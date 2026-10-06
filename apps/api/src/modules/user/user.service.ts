import { Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@prisma/client";

import type { UserDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

/** The signed-in user while auth is simulated (mirrors the frontend fixture). */
export const CURRENT_USER_ID = "u-moge";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { position: "asc" } });
    return users.map(toDto);
  }

  findCurrent(): Promise<UserDto> {
    return this.findOne(CURRENT_USER_ID);
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
    role: user.role,
    teamId: user.teamId,
    avatarTone: user.avatarTone,
  };
}
