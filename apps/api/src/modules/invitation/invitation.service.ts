import { createHash, randomBytes, randomUUID } from "node:crypto";

import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Invitation } from "@prisma/client";

import { AuthService, type LoginResult } from "@/auth/auth.service";
import { hashPassword } from "@/auth/password";
import { assertLeaderOf } from "@/auth/permissions";
import type { SessionUser } from "@/auth/session";
import type { InvitationDto, InvitationPreviewDto } from "@/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { now } from "@/shared/clock";

import { recordActivity } from "../activity/activity.recorder";
import { toUserDto } from "../user/user.service";
import type { AcceptInvitationDto, CreateInvitationDto } from "./dto";

/** How long an invitation link works. Real time (not the mock clock): it's a security limit. */
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Usable = not accepted and not expired. */
const usable = () => ({ acceptedAt: null, expiresAt: { gt: new Date() } });

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  /** Leaders invite people to their own team. The token goes back once, to build the link. */
  async create(input: CreateInvitationDto, leader: SessionUser): Promise<{ invitation: InvitationDto; token: string }> {
    assertLeaderOf(leader, leader.teamId);
    if (await this.prisma.user.count({ where: { email: input.email } })) {
      throw new ConflictException("Ya existe una cuenta con ese correo: agrégala desde Miembros");
    }

    const token = randomBytes(32).toString("base64url");
    const invitation = await this.prisma.$transaction(async (tx) => {
      // A new invitation replaces any pending one for the same person and team.
      await tx.invitation.deleteMany({ where: { email: input.email, teamId: leader.teamId, acceptedAt: null } });
      return tx.invitation.create({
        data: {
          tokenHash: hashToken(token),
          email: input.email,
          name: input.name.trim(),
          role: input.role,
          teamId: leader.teamId,
          invitedById: leader.id,
          createdAt: now(),
          expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        },
      });
    });
    return { invitation: toDto(invitation), token };
  }

  /** Pending invitations of a team (its leaders only). */
  async findPending(teamId: string, leader: SessionUser): Promise<InvitationDto[]> {
    assertLeaderOf(leader, teamId);
    const invitations = await this.prisma.invitation.findMany({
      where: { teamId, ...usable() },
      orderBy: { createdAt: "desc" },
    });
    return invitations.map(toDto);
  }

  async revoke(id: string, leader: SessionUser): Promise<{ id: string }> {
    const invitation = await this.prisma.invitation.findUnique({ where: { id }, select: { teamId: true } });
    if (!invitation) throw new NotFoundException(`Invitation "${id}" not found`);
    assertLeaderOf(leader, invitation.teamId);
    await this.prisma.invitation.delete({ where: { id } });
    return { id };
  }

  /** What the invitee sees before choosing a password. Unknown, used and expired links look the same. */
  async preview(token: string): Promise<InvitationPreviewDto> {
    const invitation = await this.findUsable(token);
    const [team, inviter] = await Promise.all([
      this.prisma.team.findUniqueOrThrow({ where: { id: invitation.teamId }, select: { name: true } }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: invitation.invitedById },
        select: { name: true, role: true, memberships: { where: { teamId: invitation.teamId }, select: { role: true } } },
      }),
    ]);
    return {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      teamId: invitation.teamId,
      teamName: team.name,
      // "Invitación de Fer Ruiz · líder de Play": their role in the space they invite to.
      invitedBy: { name: inviter.name, role: inviter.memberships[0]?.role ?? inviter.role },
    };
  }

  /** Creates the account, uses up the link and signs the new member in. */
  async accept({ token, password }: AcceptInvitationDto): Promise<LoginResult> {
    const invitation = await this.findUsable(token);
    if (await this.prisma.user.count({ where: { email: invitation.email } })) {
      throw new ConflictException("Ya existe una cuenta con ese correo");
    }
    const passwordHash = await hashPassword(password);

    const user = await this.prisma.$transaction(async (tx) => {
      // Use the link up first, so the same token can't create two accounts.
      const claimed = await tx.invitation.updateMany({ where: { id: invitation.id, ...usable() }, data: { acceptedAt: now() } });
      if (claimed.count === 0) throw invalidLink();

      const created = await tx.user.create({
        data: {
          id: `u-${randomUUID()}`,
          email: invitation.email,
          passwordHash,
          name: invitation.name,
          shortName: invitation.name.split(/\s+/)[0],
          initials: initialsOf(invitation.name),
          role: invitation.role,
          teamId: invitation.teamId,
          avatarTone: null,
          memberships: { create: { teamId: invitation.teamId, role: invitation.role } },
        },
        include: { memberships: true },
      });
      await recordActivity(tx, { teamId: invitation.teamId, actorId: created.id, summary: "se unió al equipo" });
      return created;
    });

    return { token: await this.auth.issueToken(user.id), user: toUserDto(user) };
  }

  private async findUsable(token: string): Promise<Invitation> {
    const invitation = await this.prisma.invitation.findFirst({ where: { tokenHash: hashToken(token), ...usable() } });
    if (!invitation) throw invalidLink();
    return invitation;
  }
}

function invalidLink(): NotFoundException {
  return new NotFoundException("La invitación no existe, ya se usó o expiró");
}

/** "Ana López" -> "AL", "Moge" -> "MO". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

function toDto(invitation: Invitation): InvitationDto {
  return {
    id: invitation.id,
    email: invitation.email,
    name: invitation.name,
    role: invitation.role,
    teamId: invitation.teamId,
    invitedById: invitation.invitedById,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
  };
}
