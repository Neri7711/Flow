import { Controller, Get, Param } from "@nestjs/common";

import { Public } from "@/auth/session";

import { TeamService } from "./team.service";

/** Public: the sign-in screen shows the teams before anyone is logged in. */
@Public()
@Controller("teams")
export class TeamController {
  constructor(private readonly teams: TeamService) {}

  @Get()
  findAll() {
    return this.teams.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.teams.findOne(id);
  }
}
