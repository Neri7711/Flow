import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "@/prisma/prisma.service";

import { type AuthenticatedRequest, IS_PUBLIC } from "./session";

/** `lastActiveAt` is refreshed at most this often (it drives "última actividad" and presence). */
const ACTIVITY_RESOLUTION_MS = 60 * 1000;

/**
 * Global guard: every route needs a valid `Authorization: Bearer <token>` unless marked
 * `@Public()`. The user and their memberships are re-read on each request, so role
 * changes and removals apply at once.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException("Inicia sesión para continuar");

    let userId: string;
    try {
      userId = (await this.jwt.verifyAsync<{ sub: string }>(token)).sub;
    } catch {
      throw new UnauthorizedException("La sesión expiró; vuelve a iniciar sesión");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        teamId: true,
        role: true,
        passwordHash: true,
        lastActiveAt: true,
        memberships: { select: { teamId: true, role: true } },
      },
    });
    if (!user?.passwordHash) throw new UnauthorizedException("La cuenta ya no está activa");

    const now = new Date();
    if (!user.lastActiveAt || now.getTime() - user.lastActiveAt.getTime() > ACTIVITY_RESOLUTION_MS) {
      // Best effort: presence must never fail a request.
      this.prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: now } }).catch(() => undefined);
    }

    request.user = { id: user.id, teamId: user.teamId, role: user.role, memberships: user.memberships };
    return true;
  }
}
