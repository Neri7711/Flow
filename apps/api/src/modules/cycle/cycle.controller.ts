import { Controller, Get, Param, Query } from "@nestjs/common";

import { TeamQueryDto } from "@/shared/query.dto";

import { CycleService } from "./cycle.service";

@Controller("cycles")
export class CycleController {
  constructor(private readonly cycles: CycleService) {}

  /** GET /api/cycles/active?teamId=pl -> the team's current cycle (or null). */
  @Get("active")
  findActive(@Query() { teamId }: TeamQueryDto) {
    return this.cycles.findActive(teamId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.cycles.findOne(id);
  }
}
