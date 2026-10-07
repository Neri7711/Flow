import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

import { AuthService } from "./auth.service";
import { Public } from "./session";

class LoginDto {
  /** Pasted addresses often carry spaces or capitals. */
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/auth/login -> { token, user }. The web app keeps the token in an httpOnly cookie. */
  @Public()
  @Post("login")
  @HttpCode(200)
  login(@Body() { email, password }: LoginDto) {
    return this.auth.login(email, password);
  }
}
