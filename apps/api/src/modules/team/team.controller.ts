import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

import { CurrentUser, Public, type SessionUser } from "@/auth/session";
import type { UserRole } from "@/contracts";

import { TeamService } from "./team.service";

class UpdateTeamDto {
  /** `null` or empty clears it. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  weeklyNote?: string | null;
}

class AddMemberDto {
  /** Someone who already has an account (new people: invitations). */
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsIn(["leader", "member", "guest"])
  role!: UserRole;
}

@Controller("teams")
export class TeamController {
  constructor(private readonly teams: TeamService) {}

  /** Public: the sign-in screen shows the teams before anyone is logged in. */
  @Public()
  @Get()
  findAll() {
    return this.teams.findAll();
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.teams.findOne(id);
  }

  /** Leaders of the team only. */
  @Patch(":id")
  update(@Param("id") id: string, @Body() { weeklyNote }: UpdateTeamDto, @CurrentUser() user: SessionUser) {
    return this.teams.updateWeeklyNote(id, weeklyNote ?? null, user);
  }

  /** Leaders: add an existing person to the space (e.g. a mentor as guest). */
  @Post(":id/members")
  @HttpCode(200)
  addMember(@Param("id") id: string, @Body() { userId, role }: AddMemberDto, @CurrentUser() user: SessionUser) {
    return this.teams.addMember(id, userId, role, user);
  }

  /** Leaders: remove someone from the space (not themselves, not from their home space). */
  @Delete(":id/members/:userId")
  removeMember(@Param("id") id: string, @Param("userId") userId: string, @CurrentUser() user: SessionUser) {
    return this.teams.removeMember(id, userId, user);
  }
}
