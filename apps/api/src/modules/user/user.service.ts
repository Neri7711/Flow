import { Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@prisma/client";

import type { UserDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({ orderBy: { position: "asc" } });
    return users.map(toUserDto);
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return toUserDto(user);
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
