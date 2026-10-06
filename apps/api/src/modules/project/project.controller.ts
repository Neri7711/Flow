import { Controller, Get, Param, Query } from "@nestjs/common";

import { ProjectService } from "./project.service";

@Controller("projects")
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  /** GET /api/projects/active?teamId=pl -> the team's active project (or null). */
  @Get("active")
  async findActive(@Query("teamId") teamId: string) {
    return (await this.projects.findActive(teamId)) ?? null;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projects.findOne(id);
  }
}
