import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "@/prisma/prisma.service";

import { type AuthenticatedRequest, IS_PUBLIC } from "./session";

/**
 * Global guard: every route needs a valid `Authorization: Bearer <token>` unless marked
 * `@Public()`. The user is re-read on each request so role changes and removals apply at once.
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
      select: { id: true, teamId: true, role: true, passwordHash: true },
    });
    if (!user?.passwordHash) throw new UnauthorizedException("La cuenta ya no está activa");

    request.user = { id: user.id, teamId: user.teamId, role: user.role };
    return true;
  }
}
