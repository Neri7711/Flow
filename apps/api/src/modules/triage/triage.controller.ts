import { Controller, Get, Query } from "@nestjs/common";

import { TriageService } from "./triage.service";

@Controller("triage")
export class TriageController {
  constructor(private readonly triage: TriageService) {}

  /** GET /api/triage?teamId=pl -> requests waiting for that team. */
  @Get()
  findForTeam(@Query("teamId") teamId: string) {
    return this.triage.findForTeam(teamId);
  }
}
