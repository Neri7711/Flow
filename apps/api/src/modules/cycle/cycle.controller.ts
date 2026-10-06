import { Controller, Get, Param, Query } from "@nestjs/common";

import { CycleService } from "./cycle.service";

@Controller("cycles")
export class CycleController {
  constructor(private readonly cycles: CycleService) {}

  /** GET /api/cycles/active?teamId=pl -> the team's current cycle (or null). */
  @Get("active")
  async findActive(@Query("teamId") teamId: string) {
    return (await this.cycles.findActive(teamId)) ?? null;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.cycles.findOne(id);
  }
}
