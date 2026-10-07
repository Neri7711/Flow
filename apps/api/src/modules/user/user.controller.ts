import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { IsIn } from "class-validator";

import { CurrentUser, type SessionUser } from "@/auth/session";
import type { UserRole } from "@/contracts";
import { OptionalTeamQueryDto } from "@/shared/query.dto";

import { UserService } from "./user.service";

class ChangeRoleDto {
  @IsIn(["leader", "member"])
  role!: UserRole;
}

@Controller("users")
export class UserController {
  constructor(private readonly users: UserService) {}

  /** GET /api/users[?teamId=pl] */
  @Get()
  findAll(@Query() { teamId }: OptionalTeamQueryDto) {
    return this.users.findAll(teamId);
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

  /** Leaders only, for members of their own team. */
  @Patch(":id/role")
  changeRole(@Param("id") id: string, @Body() { role }: ChangeRoleDto, @CurrentUser() user: SessionUser) {
    return this.users.changeRole(id, role, user);
  }
}
