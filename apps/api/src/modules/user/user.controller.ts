import { Controller, Get, Param } from "@nestjs/common";

import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get("me")
  findCurrent() {
    return this.users.findCurrent();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }
}
