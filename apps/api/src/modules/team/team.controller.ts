import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { IsOptional, IsString, MaxLength } from "class-validator";

import { CurrentUser, Public, type SessionUser } from "@/auth/session";

import { TeamService } from "./team.service";

class UpdateTeamDto {
  /** `null` or empty clears it. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  weeklyNote?: string | null;
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
}
