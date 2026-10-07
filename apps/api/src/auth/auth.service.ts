import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type { UserDto } from "@/contracts";
import { toUserDto } from "@/modules/user/user.service";
import { PrismaService } from "@/prisma/prisma.service";

import { verifyPassword } from "./password";

export type LoginResult = { token: string; user: UserDto };

/** Failed sign-ins allowed per email before it's locked for the rest of the window. */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  /**
   * Failed attempts per email (in memory, per API instance). Counted by email rather than IP
   * because every request reaches the API from the web server.
   */
  private readonly failures = new Map<string, { count: number; since: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    this.assertNotLocked(email);

    const user = await this.prisma.user.findUnique({ where: { email } });
    // Same message whether the email or the password is wrong (no account enumeration).
    const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      this.recordFailure(email);
      throw new UnauthorizedException("Correo o contraseña incorrectos");
    }

    this.failures.delete(email);
    return { token: await this.issueToken(user.id), user: toUserDto(user) };
  }

  issueToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  private assertNotLocked(email: string): void {
    const record = this.failures.get(email);
    if (!record) return;
    if (Date.now() - record.since > WINDOW_MS) {
      this.failures.delete(email);
      return;
    }
    if (record.count >= MAX_FAILURES) {
      throw new HttpException("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.", HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordFailure(email: string): void {
    const record = this.failures.get(email);
    if (record) record.count += 1;
    else this.failures.set(email, { count: 1, since: Date.now() });

    // Keep the map small: drop expired windows once it grows.
    if (this.failures.size > 10_000) {
      const cutoff = Date.now() - WINDOW_MS;
      for (const [key, value] of this.failures) if (value.since < cutoff) this.failures.delete(key);
    }
  }
}
