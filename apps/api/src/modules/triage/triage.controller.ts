import { Controller, Get, Query } from "@nestjs/common";

import { TeamQueryDto } from "@/shared/query.dto";

import { TriageService } from "./triage.service";

@Controller("triage")
export class TriageController {
  constructor(private readonly triage: TriageService) {}

  /** GET /api/triage?teamId=pl -> requests waiting for that team. */
  @Get()
  findForTeam(@Query() { teamId }: TeamQueryDto) {
    return this.triage.findForTeam(teamId);
  }
}
