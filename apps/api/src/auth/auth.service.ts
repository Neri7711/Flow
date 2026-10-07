import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type { UserDto } from "@/contracts";
import { toUserDto } from "@/modules/user/user.service";
import { PrismaService } from "@/prisma/prisma.service";

import { verifyPassword } from "./password";

export type LoginResult = { token: string; user: UserDto };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Same message whether the email or the password is wrong (no account enumeration).
    const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) throw new UnauthorizedException("Correo o contraseña incorrectos");

    return { token: await this.issueToken(user.id), user: toUserDto(user) };
  }

  issueToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }
}
