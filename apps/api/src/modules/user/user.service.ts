import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Membership, User, UserRole } from "@prisma/client";

import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { UserDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";
import { avatarsDir } from "@/shared/uploads";

export type UserWithMemberships = User & { memberships: Membership[] };

const withMemberships = { memberships: { orderBy: { position: "asc" } } } as const;

/** Accepted profile photo formats, recognized by their first bytes (not by the client's claim). */
const IMAGE_SIGNATURES: { ext: string; matches: (bytes: Buffer) => boolean }[] = [
  { ext: "png", matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", matches: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
];
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type ProfilePatch = { name?: string; shortName?: string; area?: string | null };

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everyone; or, with `teamId`, that space's members — `role` is then their role in that space. */
  async findAll(teamId?: string): Promise<UserDto[]> {
    if (!teamId) {
      const users = await this.prisma.user.findMany({ orderBy: { position: "asc" }, include: withMemberships });
      return users.map((user) => toUserDto(user));
    }
    const memberships = await this.prisma.membership.findMany({
      where: { teamId },
      orderBy: { position: "asc" },
      include: { user: { include: withMemberships } },
    });
    return memberships.map((membership) => ({ ...toUserDto(membership.user), role: membership.role }));
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id }, include: withMemberships });
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return toUserDto(user);
  }

  /** The signed-in user edits their own name, nickname and area (onboarding · perfil). */
  async updateProfile(userId: string, patch: ProfilePatch): Promise<UserDto> {
    const name = patch.name?.trim();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name,
        initials: name ? initialsOf(name) : undefined,
        shortName: patch.shortName?.trim(),
        area: patch.area === undefined ? undefined : patch.area?.trim() || null,
      },
      include: withMemberships,
    });
    return toUserDto(user);
  }

  async setAvatar(userId: string, file: { buffer: Buffer; size: number } | undefined): Promise<UserDto> {
    if (!file) throw new BadRequestException("Envía la foto en el campo `file`");
    if (file.size > MAX_AVATAR_BYTES) throw new BadRequestException("La foto debe pesar menos de 2 MB");
    const format = IMAGE_SIGNATURES.find((signature) => signature.matches(file.buffer));
    if (!format) throw new BadRequestException("La foto debe ser PNG, JPG o WebP");

    const fileName = `${userId}-${randomBytes(6).toString("hex")}.${format.ext}`;
    await mkdir(avatarsDir(), { recursive: true });
    await writeFile(join(avatarsDir(), fileName), file.buffer);

    const previous = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarPath: true } });
    const user = await this.prisma.user.update({ where: { id: userId }, data: { avatarPath: fileName }, include: withMemberships });
    if (previous.avatarPath) await unlink(join(avatarsDir(), previous.avatarPath)).catch(() => undefined);
    return toUserDto(user);
  }

  async removeAvatar(userId: string): Promise<UserDto> {
    const previous = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarPath: true } });
    const user = await this.prisma.user.update({ where: { id: userId }, data: { avatarPath: null }, include: withMemberships });
    if (previous.avatarPath) await unlink(join(avatarsDir(), previous.avatarPath)).catch(() => undefined);
    return toUserDto(user);
  }

  /** So the onboarding isn't shown again. */
  async markOnboarded(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.update({ where: { id: userId }, data: { onboardedAt: now() }, include: withMemberships });
    return toUserDto(user);
  }

  /**
   * Leaders change someone's role in their space (never their own, so a space keeps its leader).
   * `teamId` defaults to the person's home space.
   */
  async changeRole(id: string, role: UserRole, actor: SessionUser, teamId?: string): Promise<UserDto> {
    const target = await this.prisma.user.findUnique({ where: { id }, select: { teamId: true } });
    if (!target) throw new NotFoundException(`User "${id}" not found`);
    const spaceId = teamId ?? target.teamId;
    assertLeaderOf(actor, spaceId);
    if (id === actor.id) throw new BadRequestException("No puedes cambiar tu propio rol");

    const membership = await this.prisma.membership.findUnique({ where: { userId_teamId: { userId: id, teamId: spaceId } } });
    if (!membership) throw new NotFoundException("Esa persona no pertenece a este espacio");

    await this.prisma.$transaction([
      this.prisma.membership.update({ where: { userId_teamId: { userId: id, teamId: spaceId } }, data: { role } }),
      // The home space's role is mirrored on the user (the web's current contract).
      ...(spaceId === target.teamId ? [this.prisma.user.update({ where: { id }, data: { role } })] : []),
    ]);
    const updated = await this.prisma.user.findUniqueOrThrow({ where: { id }, include: withMemberships });
    return { ...toUserDto(updated), role };
  }
}

/** "Ana López" -> "AL", "Moge" -> "MO". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

export function toUserDto(user: UserWithMemberships): UserDto {
  return {
    id: user.id,
    name: user.name,
    shortName: user.shortName,
    initials: user.initials,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    avatarTone: user.avatarTone,
    memberships: user.memberships.map((membership) => ({
      teamId: membership.teamId,
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString(),
    })),
    area: user.area,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    avatarUrl: user.avatarPath ? `/api/uploads/avatars/${user.avatarPath}` : null,
    onboardedAt: user.onboardedAt?.toISOString() ?? null,
  };
}
