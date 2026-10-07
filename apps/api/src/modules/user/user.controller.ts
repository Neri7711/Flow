import { Controller, Get, Param } from "@nestjs/common";

import { CurrentUser, type SessionUser } from "@/auth/session";

import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  /** The signed-in user. */
  @Get("me")
  findCurrent(@CurrentUser() user: SessionUser) {
    return this.users.findOne(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }
}
