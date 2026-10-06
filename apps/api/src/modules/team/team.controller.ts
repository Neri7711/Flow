import { Controller, Get, Param } from "@nestjs/common";

import { TeamService } from "./team.service";

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
