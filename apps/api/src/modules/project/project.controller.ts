import { Controller, Get, Param, Query } from "@nestjs/common";

import { TeamQueryDto } from "@/shared/query.dto";

import { ProjectService } from "./project.service";

@Controller("projects")
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  /** GET /api/projects/active?teamId=pl -> the team's active project (or null). */
  @Get("active")
  findActive(@Query() { teamId }: TeamQueryDto) {
    return this.projects.findActive(teamId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projects.findOne(id);
  }
}
